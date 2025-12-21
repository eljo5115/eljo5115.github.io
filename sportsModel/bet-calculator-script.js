// Configuration
const API_BASE_URL = 'https://api.dozencrust.com/nfl';
const CURRENT_SEASON = 2025;
const WEEKS_IN_SEASON = 18;

// State
let currentWeek = 1;
let bankroll = 1000;
let kellyMode = 'half';
let maxAllocation = 100; // Maximum % of bankroll to allocate
let normalizeEnabled = true; // Normalization enabled by default
let allBets = [];
let availableWeeks = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initializeWeekSelector();
    initializeToggleState();
    setupEventListeners();
    checkAPIHealth();
    await determineCurrentWeek();
    loadBets();
});

// Initialize toggle state on page load
function initializeToggleState() {
    const normalizeToggle = document.getElementById('normalizeToggle');
    const toggleText = document.getElementById('normalizeText');
    const kellyWrapper = document.getElementById('kellyModeWrapper');
    const maxAllocationWrapper = document.getElementById('maxAllocationWrapper');
    
    console.log('Initializing toggle state:', {
        normalizeEnabled,
        normalizeToggle,
        toggleText,
        kellyWrapper,
        maxAllocationWrapper
    });
    
    if (!normalizeToggle || !toggleText || !kellyWrapper || !maxAllocationWrapper) {
        console.error('Toggle initialization failed - missing elements');
        return;
    }
    
    // Set initial state based on normalizeEnabled
    normalizeToggle.checked = normalizeEnabled;
    toggleText.textContent = normalizeEnabled ? 'ON' : 'OFF';
    
    // Show/hide inputs based on initial state
    if (normalizeEnabled) {
        kellyWrapper.style.display = 'none';
        maxAllocationWrapper.style.display = 'flex';
    } else {
        kellyWrapper.style.display = 'flex';
        maxAllocationWrapper.style.display = 'none';
    }
    
    console.log('Toggle state initialized successfully');
}

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
    
    // Normalization toggle handler
    document.getElementById('normalizeToggle').addEventListener('change', (e) => {
        normalizeEnabled = e.target.checked;
        
        console.log('Toggle changed:', normalizeEnabled);
        
        // Update toggle text display
        const toggleText = document.getElementById('normalizeText');
        if (toggleText) {
            toggleText.textContent = normalizeEnabled ? 'ON' : 'OFF';
        }
        
        // Show/hide Kelly mode and max allocation based on normalization state
        const kellyWrapper = document.getElementById('kellyModeWrapper');
        const maxAllocationWrapper = document.getElementById('maxAllocationWrapper');
        
        console.log('Elements found:', { kellyWrapper, maxAllocationWrapper });
        
        if (normalizeEnabled) {
            // When normalization is ON, hide Kelly mode (it doesn't matter)
            if (kellyWrapper) {
                kellyWrapper.style.display = 'none';
                console.log('Hiding Kelly mode');
            }
            if (maxAllocationWrapper) {
                maxAllocationWrapper.style.display = 'flex';
                console.log('Showing max allocation');
            }
        } else {
            // When normalization is OFF, show Kelly mode and hide max allocation
            if (kellyWrapper) {
                kellyWrapper.style.display = 'flex';
                console.log('Showing Kelly mode');
            }
            if (maxAllocationWrapper) {
                maxAllocationWrapper.style.display = 'none';
                console.log('Hiding max allocation');
            }
        }
        
        // Recalculate if we have bets
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
        
        // Apply kelly mode ONLY if normalization is OFF
        if (!normalizeEnabled) {
            if (kellyMode === 'half') {
                kellyPct = kellyPct / 2;
            } else if (kellyMode === 'quarter') {
                kellyPct = kellyPct / 4;
            }
        }
        
        return {
            ...bet,
            rawKelly: kellyPct
        };
    });
    
    // Step 2: Calculate total kelly percentage
    const totalKellyPct = rawKellyBets.reduce((sum, bet) => sum + bet.rawKelly, 0);
    
    console.log(`Total Kelly %: ${totalKellyPct.toFixed(2)}%`);
    
    // Step 3: Normalize ONLY if enabled AND total exceeds max allocation threshold
    const needsNormalization = normalizeEnabled && totalKellyPct > maxAllocation;
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
// Display bets grouped by game
function displayBets(bets) {
    const betSlipContainer = document.getElementById('betSlipContainer');
    betSlipContainer.innerHTML = '';
    
    // Group bets by game (using matchup as key)
    const gameGroups = {};
    bets.forEach(bet => {
        const matchup = `${bet.away_team} @ ${bet.home_team}`;
        if (!gameGroups[matchup]) {
            gameGroups[matchup] = {
                matchup: matchup,
                away_team: bet.away_team,
                home_team: bet.home_team,
                week: bet.week,
                game_time: bet.game_time,
                bets: []
            };
        }
        gameGroups[matchup].bets.push(bet);
    });
    
    // Create game cards
    Object.values(gameGroups).forEach((game, gameIndex) => {
        const gameCard = createGameCard(game, gameIndex + 1);
        betSlipContainer.appendChild(gameCard);
    });
    
    betSlipContainer.style.display = 'flex';
    document.getElementById('noBetsMessage').style.display = 'none';
}

// Create game card with grouped bets
function createGameCard(game, gameNumber) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    // Calculate total for this game
    const totalBetAmount = game.bets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const totalEV = game.bets.reduce((sum, bet) => sum + bet.expectedReturn, 0);
    
    card.innerHTML = `
        <div class="game-card-header">
            <div class="game-info">
                <div class="game-matchup">${gameNumber}. ${game.matchup}</div>
                <div class="game-time">Week ${game.week} • ${game.game_time}</div>
            </div>
            <div class="game-totals">
                <div class="game-total-amount">$${totalBetAmount.toFixed(2)}</div>
                <div class="game-total-label">Total Bet</div>
            </div>
        </div>
        <div class="game-bets-container">
            ${game.bets.map(bet => createBetRow(bet)).join('')}
        </div>
    `;
    
    return card;
}

// Create individual bet row within a game card
function createBetRow(bet) {
    const betTypeDisplay = bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1);
    const pickDisplay = formatPickDisplay(bet);
    
    return `
        <div class="bet-row">
            <div class="bet-row-pick">
                <div class="bet-type-badge">${betTypeDisplay}</div>
                <div class="bet-pick-text">${pickDisplay}</div>
            </div>
            <div class="bet-row-stats">
                <div class="bet-stat">
                    <span class="bet-stat-label">EV:</span>
                    <span class="bet-stat-value success">+${bet.expected_value.toFixed(1)}%</span>
                </div>
                <div class="bet-stat">
                    <span class="bet-stat-label">Win%:</span>
                    <span class="bet-stat-value">${(bet.confidence * 100).toFixed(0)}%</span>
                </div>
                <div class="bet-stat">
                    <span class="bet-stat-label">Kelly:</span>
                    <span class="bet-stat-value">${bet.adjustedKelly.toFixed(2)}%</span>
                </div>
            </div>
            <div class="bet-row-amount">
                <div class="bet-amount-value">$${bet.betAmount.toFixed(2)}</div>
                <div class="bet-expected-return">+$${bet.expectedReturn.toFixed(2)} EV</div>
            </div>
        </div>
    `;
}

// Create bet slip item (legacy - keeping for compatibility)
function createBetSlipItem(bet, number) {
    const card = document.createElement('div');
    card.className = 'bet-slip-item';
    
    const betTypeDisplay = bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1);
    
    // Format the pick to include spread for spread bets
    let pickDisplay = bet.pick;
    if (bet.bet_type === 'spread' && bet.spread_line && bet.spread_line !== 'N/A') {
        // Extract team name from pick (it might have BET: or LEAN: prefix removed already)
        const teamName = bet.pick.trim();
        pickDisplay = `${teamName} ${bet.spread_line}`;
    }
    
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
                <div class="bet-slip-pick">${pickDisplay}</div>
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
// Helper function to format pick display with spread
// Helper function to format pick display with spread
function formatPickDisplay(bet) {
    let pickDisplay = bet.pick;
    
    if (bet.bet_type === 'spread' && bet.spread_line && bet.spread_line !== 'N/A') {
        const teamName = bet.pick.trim();
        
        // Determine if this is the away team or home team
        const isAwayTeam = bet.away_team && teamName.toLowerCase().includes(bet.away_team.toLowerCase());
        
        // Parse the spread value (spread is from away team's perspective)
        let spreadNum = parseFloat(bet.spread_line);
        
        console.log('Spread Debug:', {
            matchup: `${bet.away_team} @ ${bet.home_team}`,
            teamName,
            away_team: bet.away_team,
            home_team: bet.home_team,
            spread_line: bet.spread_line,
            spreadNum,
            isAwayTeam,
            willReverse: !isAwayTeam
        });
        
        if (!isNaN(spreadNum)) {
            // If it's the home team, reverse the sign
            if (!isAwayTeam) {
                spreadNum = -spreadNum;
                console.log('Reversed to:', spreadNum);
            }
            
            // Format with proper sign
            const spreadDisplay = spreadNum > 0 ? `+${spreadNum}` : spreadNum.toString();
            pickDisplay = `${teamName} ${spreadDisplay}`;
            console.log('Final display:', pickDisplay);
        } else {
            pickDisplay = `${teamName} ${bet.spread_line}`;
        }
    } else if (bet.bet_type === 'total' && bet.total_line && bet.total_line !== 'N/A') {
        // For totals, show Over/Under with the line
        pickDisplay = `${bet.pick} ${bet.total_line}`;
    }
    
    return pickDisplay;
}

// Export to CSV
function exportToCSV() {
    const bets = allBets.map(bet => {
        let kellyPct = bet.kelly_percentage;
        if (!normalizeEnabled) {
            if (kellyMode === 'half') kellyPct /= 2;
            if (kellyMode === 'quarter') kellyPct /= 4;
        }
        const betAmount = (bankroll * kellyPct) / 100;
        
        return {
            Week: bet.week,
            Matchup: `${bet.away_team} @ ${bet.home_team}`,
            Pick: formatPickDisplay(bet),
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
        if (!normalizeEnabled) {
            if (kellyMode === 'half') kellyPct /= 2;
            if (kellyMode === 'quarter') kellyPct /= 4;
        }
        const betAmount = (bankroll * kellyPct) / 100;
        const pickDisplay = formatPickDisplay(bet);
        
        return `${i + 1}. ${bet.away_team} @ ${bet.home_team}\n   ${pickDisplay} - $${betAmount.toFixed(2)} (${kellyPct.toFixed(2)}%)\n   EV: +${bet.expected_value.toFixed(1)}% | Confidence: ${(bet.confidence * 100).toFixed(0)}%`;
    }).join('\n\n');
    
    const methodText = normalizeEnabled ? 'Normalized' : `${kellyMode.charAt(0).toUpperCase() + kellyMode.slice(1)} Kelly`;
    const text = `NFL Betting Slip - Week ${currentWeek}\nBankroll: $${bankroll.toLocaleString()}\nMethod: ${methodText}\n\n${bets}`;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Betting slip copied to clipboard!');
    });
}

// Generate mock data (fallback)
function generateMockData() {
    return [];
}
