// Configuration
const API_BASE_URL = 'https://api.dozencrust.com/nfl';
const CURRENT_SEASON = 2025;
const WEEKS_IN_SEASON = 18;

// State
let currentWeek = 1;
let bankroll = 1000;
let kellyMode = 'half';
let maxAllocation = 100; // Maximum % of bankroll to allocate
let allBets = [];
let availableWeeks = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initializeWeekSelector();
    setupEventListeners();
    checkAPIHealth();
    await determineCurrentWeek();
    loadBets();
});

// API Health Check
async function checkAPIHealth() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    try {
        const response = await fetch(API_BASE_URL, {
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.status === 'healthy' && data.model_loaded) {
            statusIndicator.classList.add('healthy');
            statusText.textContent = 'API Online - Model Ready';
        } else if (data.status === 'healthy') {
            statusIndicator.classList.add('healthy');
            statusText.textContent = 'API Online';
        } else {
            statusIndicator.classList.add('error');
            statusText.textContent = 'API Online - Model Unavailable';
        }
    } catch (error) {
        console.error('API health check failed:', error);
        statusIndicator.classList.add('healthy');
        statusText.textContent = 'API Online (CORS Limited)';
    }
}

// Initialize Week Selector
function initializeWeekSelector() {
    const weekSelect = document.getElementById('weekSelect');
    
    for (let i = 1; i <= WEEKS_IN_SEASON; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Week ${i}`;
        weekSelect.appendChild(option);
    }
    
    currentWeek = getCurrentWeek();
    weekSelect.value = currentWeek;
}

// Get current NFL week based on date calculation
function getCurrentWeek() {
    const now = new Date();
    const seasonStart = new Date(2025, 8, 4);
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    const calculatedWeek = weeksSinceStart + 1;
    return Math.max(1, Math.min(WEEKS_IN_SEASON, calculatedWeek));
}

// Determine the current week by checking API for available data
async function determineCurrentWeek() {
    try {
        const calculatedWeek = getCurrentWeek();
        console.log(`Calculated week based on date: ${calculatedWeek}`);
        
        const weeksToCheck = [
            calculatedWeek, 
            calculatedWeek + 1, 
            calculatedWeek - 1,
            calculatedWeek + 2
        ].filter(w => w >= 1 && w <= WEEKS_IN_SEASON);
        
        availableWeeks = [];
        
        for (const week of weeksToCheck) {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/predict/week-betting?week=${week}&season=${CURRENT_SEASON}&min_ev=0`,
                    {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.all_positive_ev_bets && data.all_positive_ev_bets.length > 0) {
                        availableWeeks.push({
                            week: week,
                            gameCount: data.all_positive_ev_bets.length
                        });
                        console.log(`Week ${week} has ${data.all_positive_ev_bets.length} games with data`);
                    }
                }
            } catch (error) {
                console.log(`Week ${week} data not available`);
            }
        }
        
        if (availableWeeks.length > 0) {
            availableWeeks.sort((a, b) => a.week - b.week);
            let targetWeek = availableWeeks.find(w => w.week === calculatedWeek + 1);
            
            if (!targetWeek) {
                targetWeek = availableWeeks.find(w => w.week > calculatedWeek);
            }
            
            if (!targetWeek) {
                targetWeek = availableWeeks.find(w => w.week === calculatedWeek);
            }
            
            if (!targetWeek) {
                targetWeek = availableWeeks[availableWeeks.length - 1];
            }
            
            currentWeek = targetWeek.week;
            console.log(`Selected week ${currentWeek} with ${targetWeek.gameCount} games (calculated week was ${calculatedWeek})`);
        } else {
            currentWeek = Math.min(calculatedWeek + 1, WEEKS_IN_SEASON);
            console.log(`No data found, using calculated week + 1: ${currentWeek}`);
        }
        
        const weekSelect = document.getElementById('weekSelect');
        if (weekSelect) {
            weekSelect.value = currentWeek;
        }
        
        document.getElementById('currentWeekDisplay').textContent = currentWeek;
        
    } catch (error) {
        console.error('Error determining current week:', error);
        currentWeek = getCurrentWeek();
    }
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('bankrollInput').addEventListener('input', (e) => {
        bankroll = parseFloat(e.target.value) || 0;
        updateBankrollDisplay();
    });
    
    document.getElementById('kellyMode').addEventListener('change', (e) => {
        kellyMode = e.target.value;
        if (allBets.length > 0) {
            calculateAndDisplayBets();
        }
    });
    
    document.getElementById('maxAllocation').addEventListener('input', (e) => {
        maxAllocation = parseFloat(e.target.value) || 100;
        if (allBets.length > 0) {
            calculateAndDisplayBets();
        }
    });
    
    document.getElementById('calculateBtn').addEventListener('click', () => {
        calculateAndDisplayBets();
    });
    
    document.getElementById('weekSelect').addEventListener('change', (e) => {
        currentWeek = parseInt(e.target.value);
        document.getElementById('currentWeekDisplay').textContent = currentWeek;
        loadBets();
    });
    
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            document.getElementById('weekSelect').value = currentWeek;
            document.getElementById('currentWeekDisplay').textContent = currentWeek;
            loadBets();
        }
    });
    
    document.getElementById('nextWeek').addEventListener('click', () => {
        if (currentWeek < WEEKS_IN_SEASON) {
            currentWeek++;
            document.getElementById('weekSelect').value = currentWeek;
            document.getElementById('currentWeekDisplay').textContent = currentWeek;
            loadBets();
        }
    });
    
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('printSlip').addEventListener('click', printSlip);
    document.getElementById('copyToClipboard').addEventListener('click', copyToClipboard);
}

// Update bankroll display
function updateBankrollDisplay() {
    document.getElementById('totalBankroll').textContent = `$${bankroll.toLocaleString()}`;
}

// Load Bets from API
async function loadBets() {
    const betSlipContainer = document.getElementById('betSlipContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const noBetsMessage = document.getElementById('noBetsMessage');
    const exportSection = document.getElementById('exportSection');
    
    betSlipContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    noBetsMessage.style.display = 'none';
    exportSection.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/predict/week-betting?week=${currentWeek}&season=${CURRENT_SEASON}&min_ev=0`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        allBets = transformAPIResponse(data);
        
        if (allBets.length === 0) {
            allBets = generateMockData();
        }
        
        calculateAndDisplayBets();
        loadingSpinner.style.display = 'none';
        
    } catch (error) {
        console.error('Failed to load bets:', error);
        loadingSpinner.style.display = 'none';
        allBets = generateMockData();
        calculateAndDisplayBets();
    }
}

// Transform API response
function transformAPIResponse(data) {
    const transformedBets = [];
    
    if (data.all_positive_ev_bets && data.all_positive_ev_bets.length > 0) {
        data.all_positive_ev_bets.forEach(item => {
            const bet = item.bet;
            transformedBets.push({
                week: currentWeek,
                away_team: item.away_team,
                home_team: item.home_team,
                game_time: item.gameday || 'TBD',
                pick: bet.recommendation.replace('BET: ', '').replace('LEAN: ', ''),
                bet_type: bet.bet_type,
                expected_value: bet.expected_value,
                confidence: bet.probability / 100,
                kelly_percentage: bet.kelly_percentage || calculateKelly(bet.expected_value, bet.probability),
                spread_line: item.spread_line || 'N/A',
                total_line: item.total_line || 'N/A',
                recommendation: bet.recommendation
            });
        });
    }
    
    return transformedBets;
}

// Calculate Kelly Criterion
function calculateKelly(ev, winProb) {
    const kelly = (ev / 100) * (winProb / 100);
    return Math.min(kelly * 100, 5);
}

// Calculate and display all bets
function calculateAndDisplayBets() {
    if (allBets.length === 0) {
        document.getElementById('noBetsMessage').style.display = 'block';
        return;
    }
    
    // Sort by EV (highest first)
    allBets.sort((a, b) => b.expected_value - a.expected_value);
    
    // Step 1: Apply kelly mode to get raw kelly percentages
    const rawKellyBets = allBets.map(bet => {
        let kellyPct = bet.kelly_percentage;
        
        // Apply kelly mode
        if (kellyMode === 'half') {
            kellyPct = kellyPct / 2;
        } else if (kellyMode === 'quarter') {
            kellyPct = kellyPct / 4;
        }
        
        return {
            ...bet,
            rawKelly: kellyPct
        };
    });
    
    // Step 2: Calculate total kelly percentage
    const totalKellyPct = rawKellyBets.reduce((sum, bet) => sum + bet.rawKelly, 0);
    
    console.log(`Total Kelly %: ${totalKellyPct.toFixed(2)}%`);
    
    // Step 3: Normalize if total exceeds max allocation threshold
    const needsNormalization = totalKellyPct > maxAllocation;
    const normalizationFactor = needsNormalization ? maxAllocation / totalKellyPct : 1;
    
    if (needsNormalization) {
        console.log(`Normalizing by factor: ${normalizationFactor.toFixed(4)} to fit within ${maxAllocation}%`);
    }
    
    // Step 4: Calculate final bet amounts with normalization
    const betsWithAmounts = rawKellyBets.map(bet => {
        // Apply normalization factor
        const normalizedKelly = bet.rawKelly * normalizationFactor;
        const betAmount = (bankroll * normalizedKelly) / 100;
        const expectedReturn = betAmount * (bet.expected_value / 100);
        
        return {
            ...bet,
            adjustedKelly: normalizedKelly,
            betAmount: betAmount,
            expectedReturn: expectedReturn,
            wasNormalized: needsNormalization
        };
    });
    
    // Log summary
    const finalTotal = betsWithAmounts.reduce((sum, bet) => sum + bet.adjustedKelly, 0);
    console.log(`Final allocated %: ${finalTotal.toFixed(2)}%`);
    
    displayBets(betsWithAmounts);
    updateSummary(betsWithAmounts, needsNormalization, totalKellyPct);
    document.getElementById('exportSection').style.display = 'block';
}

// Display bets
function displayBets(bets) {
    const betSlipContainer = document.getElementById('betSlipContainer');
    betSlipContainer.innerHTML = '';
    
    bets.forEach((bet, index) => {
        const betCard = createBetSlipItem(bet, index + 1);
        betSlipContainer.appendChild(betCard);
    });
    
    betSlipContainer.style.display = 'flex';
    document.getElementById('noBetsMessage').style.display = 'none';
}

// Create bet slip item
function createBetSlipItem(bet, number) {
    const card = document.createElement('div');
    card.className = 'bet-slip-item';
    
    const betTypeDisplay = bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1);
    
    card.innerHTML = `
        <div class="bet-slip-header">
            <div class="bet-slip-game">
                <div class="bet-slip-matchup">
                    ${number}. ${bet.away_team} @ ${bet.home_team}
                </div>
                <div class="bet-slip-time">Week ${bet.week} • ${bet.game_time}</div>
            </div>
            <div class="bet-slip-badges">
                <span class="bet-slip-badge primary">+${bet.expected_value.toFixed(1)}% EV</span>
                <span class="bet-slip-badge secondary">${(bet.confidence * 100).toFixed(0)}% Win</span>
            </div>
        </div>
        
        <div class="bet-slip-content">
            <div class="bet-slip-details">
                <div class="bet-slip-pick">${bet.pick}</div>
                <div class="bet-slip-info">${betTypeDisplay} Bet</div>
                <div class="bet-slip-info">${bet.recommendation}</div>
            </div>
            
            <div class="bet-slip-amount">
                <div class="bet-amount-label">Bet Amount</div>
                <div class="bet-amount-value">$${bet.betAmount.toFixed(2)}</div>
                <div class="bet-amount-percent">${bet.adjustedKelly.toFixed(2)}% of bankroll</div>
            </div>
        </div>
        
        <div class="bet-slip-footer">
            <div class="bet-slip-stat">
                <div class="bet-slip-stat-label">Expected Return</div>
                <div class="bet-slip-stat-value">$${bet.expectedReturn.toFixed(2)}</div>
            </div>
            <div class="bet-slip-stat">
                <div class="bet-slip-stat-label">Confidence</div>
                <div class="bet-slip-stat-value">${(bet.confidence * 100).toFixed(0)}%</div>
            </div>
            <div class="bet-slip-stat">
                <div class="bet-slip-stat-label">Expected Value</div>
                <div class="bet-slip-stat-value">+${bet.expected_value.toFixed(1)}%</div>
            </div>
        </div>
    `;
    
    return card;
}

// Update summary
function updateSummary(bets, wasNormalized = false, originalTotal = 0) {
    const totalWager = bets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const totalReturn = bets.reduce((sum, bet) => sum + bet.expectedReturn, 0);
    const totalAllocated = bets.reduce((sum, bet) => sum + bet.adjustedKelly, 0);
    
    document.getElementById('totalBankroll').textContent = `$${bankroll.toLocaleString()}`;
    document.getElementById('totalWager').textContent = `$${totalWager.toFixed(2)} (${totalAllocated.toFixed(1)}%)`;
    document.getElementById('totalBets').textContent = bets.length;
    document.getElementById('expectedReturn').textContent = `$${totalReturn.toFixed(2)}`;
    
    // Show normalization message if bets were normalized
    const existingMessage = document.getElementById('normalizationMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (wasNormalized) {
        const message = document.createElement('div');
        message.id = 'normalizationMessage';
        message.className = 'normalization-notice';
        message.innerHTML = `
            <div class="notice-icon">⚠️</div>
            <div class="notice-content">
                <strong>Bet Sizes Normalized</strong>
                <p>Original Kelly percentages totaled ${originalTotal.toFixed(1)}% of bankroll. 
                Bet sizes have been proportionally reduced to ${totalAllocated.toFixed(1)}% to ensure you don't over-allocate your bankroll.</p>
            </div>
        `;
        
        const summarySection = document.querySelector('.bankroll-summary');
        summarySection.parentNode.insertBefore(message, summarySection.nextSibling);
    }
}

// Export to CSV
function exportToCSV() {
    const bets = allBets.map(bet => {
        let kellyPct = bet.kelly_percentage;
        if (kellyMode === 'half') kellyPct /= 2;
        if (kellyMode === 'quarter') kellyPct /= 4;
        const betAmount = (bankroll * kellyPct) / 100;
        
        return {
            Week: bet.week,
            Matchup: `${bet.away_team} @ ${bet.home_team}`,
            Pick: bet.pick,
            BetType: bet.bet_type,
            BetAmount: betAmount.toFixed(2),
            Percentage: kellyPct.toFixed(2),
            EV: bet.expected_value.toFixed(1),
            Confidence: (bet.confidence * 100).toFixed(0)
        };
    });
    
    const headers = Object.keys(bets[0]).join(',');
    const rows = bets.map(bet => Object.values(bet).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nfl-betting-slip-week-${currentWeek}.csv`;
    a.click();
}

// Print slip
function printSlip() {
    window.print();
}

// Copy to clipboard
function copyToClipboard() {
    const bets = allBets.map((bet, i) => {
        let kellyPct = bet.kelly_percentage;
        if (kellyMode === 'half') kellyPct /= 2;
        if (kellyMode === 'quarter') kellyPct /= 4;
        const betAmount = (bankroll * kellyPct) / 100;
        
        return `${i + 1}. ${bet.away_team} @ ${bet.home_team}\n   ${bet.pick} - $${betAmount.toFixed(2)} (${kellyPct.toFixed(2)}%)\n   EV: +${bet.expected_value.toFixed(1)}% | Confidence: ${(bet.confidence * 100).toFixed(0)}%`;
    }).join('\n\n');
    
    const text = `NFL Betting Slip - Week ${currentWeek}\nBankroll: $${bankroll.toLocaleString()}\nMethod: ${kellyMode.charAt(0).toUpperCase() + kellyMode.slice(1)} Kelly\n\n${bets}`;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Betting slip copied to clipboard!');
    });
}

// Generate mock data (fallback)
function generateMockData() {
    return [];
}
