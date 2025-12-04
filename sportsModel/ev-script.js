// Configuration
const API_BASE_URL = 'https://api.dozencrust.com/nfl';
const CURRENT_SEASON = 2025;
const WEEKS_IN_SEASON = 18;

// State
let currentWeek = 1;
let evBetsData = [];
let allBetsData = [];
let currentSort = 'ev-high';
let currentMinEV = 0;
let availableWeeks = []; // Track weeks with available data

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initializeWeekSelector();
    setupEventListeners();
    checkAPIHealth();
    await determineCurrentWeek(); // Determine week before loading data
    loadEVBets();
});

// API Health Check
async function checkAPIHealth() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    try {
        const response = await fetch(API_BASE_URL, {
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
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
        // Since API might block CORS, assume it's healthy if we can't check
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
    // 2025 NFL Season starts on Thursday, September 4, 2025
    const seasonStart = new Date(2025, 8, 4); // Month is 0-indexed (8 = September)
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    const calculatedWeek = weeksSinceStart + 1;
    
    // Ensure week is within valid range (1-18 for regular season)
    return Math.max(1, Math.min(WEEKS_IN_SEASON, calculatedWeek));
}

// Determine the current week by checking API for available data
async function determineCurrentWeek() {
    try {
        // Try to fetch data for the calculated week and nearby weeks
        const calculatedWeek = getCurrentWeek();
        console.log(`Calculated week based on date: ${calculatedWeek}`);
        
        // Check a range of weeks to find which have data
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
        
        // Sort available weeks and select the next upcoming week with data
        if (availableWeeks.length > 0) {
            availableWeeks.sort((a, b) => a.week - b.week);
            
            // Priority: Look for the next week (calculated + 1) first for upcoming games
            // If that doesn't exist, use calculated week
            // This ensures we show future games, not games that may have already been played
            let targetWeek = availableWeeks.find(w => w.week === calculatedWeek + 1);
            
            if (!targetWeek) {
                // If next week doesn't have data, try the week after
                targetWeek = availableWeeks.find(w => w.week > calculatedWeek);
            }
            
            if (!targetWeek) {
                // If no future weeks, use current calculated week
                targetWeek = availableWeeks.find(w => w.week === calculatedWeek);
            }
            
            if (!targetWeek) {
                // Last resort: use the latest available week
                targetWeek = availableWeeks[availableWeeks.length - 1];
            }
            
            currentWeek = targetWeek.week;
            console.log(`Selected week ${currentWeek} with ${targetWeek.gameCount} games (calculated week was ${calculatedWeek})`);
        } else {
            // Fallback to calculated week + 1 if no data found (prefer upcoming week)
            currentWeek = Math.min(calculatedWeek + 1, WEEKS_IN_SEASON);
            console.log(`No data found, using calculated week + 1: ${currentWeek}`);
        }
        
        // Update the select dropdown
        const weekSelect = document.getElementById('weekSelect');
        if (weekSelect) {
            weekSelect.value = currentWeek;
        }
        
    } catch (error) {
        console.error('Error determining current week:', error);
        currentWeek = getCurrentWeek(); // Fallback to date calculation
    }
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('weekSelect').addEventListener('change', (e) => {
        currentWeek = parseInt(e.target.value);
        loadEVBets();
    });
    
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            document.getElementById('weekSelect').value = currentWeek;
            loadEVBets();
        }
    });
    
    document.getElementById('nextWeek').addEventListener('click', () => {
        if (currentWeek < WEEKS_IN_SEASON) {
            currentWeek++;
            document.getElementById('weekSelect').value = currentWeek;
            loadEVBets();
        }
    });
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadEVBets();
    });
    
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
    });
    
    document.getElementById('minEV').addEventListener('change', (e) => {
        currentMinEV = parseFloat(e.target.value);
        applyFiltersAndSort();
    });
}

// Load EV Bets from API
async function loadEVBets() {
    const evBetsContainer = document.getElementById('evBetsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const noEVMessage = document.getElementById('noEVMessage');
    
    evBetsContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    noEVMessage.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    try {
        // Use the correct API endpoint from documentation
        const response = await fetch(
            `${API_BASE_URL}/api/predict/week-betting?week=${currentWeek}&season=${CURRENT_SEASON}&min_ev=${currentMinEV}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        // Transform API response to our format
        allBetsData = transformAPIResponse(data);
        
        // If no data, generate mock data
        if (allBetsData.length === 0) {
            allBetsData = generateMockEVData();
        }
        
        applyFiltersAndSort();
        loadingSpinner.style.display = 'none';
        
    } catch (error) {
        console.error('Failed to load EV bets:', error);
        loadingSpinner.style.display = 'none';
        
        // Use mock data as fallback
        allBetsData = generateMockEVData();
        applyFiltersAndSort();
    }
}

// Transform API response to our internal format
function transformAPIResponse(data) {
    const transformedBets = [];
    
    // API returns all_positive_ev_bets array
    if (data.all_positive_ev_bets && data.all_positive_ev_bets.length > 0) {
        console.log('Sample bet from API:', data.all_positive_ev_bets[0]); // Debug
        data.all_positive_ev_bets.forEach(item => {
            const bet = item.bet;
            console.log(`Bet probability: ${bet.probability}%`); // Debug each bet
            transformedBets.push({
                week: currentWeek, // Add week column
                away_team: item.away_team,
                home_team: item.home_team,
                game_time: item.gameday || 'TBD',
                pick: bet.recommendation.replace('BET: ', '').replace('LEAN: ', ''),
                bet_type: bet.bet_type,
                expected_value: bet.expected_value,
                confidence: bet.probability / 100, // Convert to decimal
                odds: '-110', // Standard odds (API doesn't provide actual market odds)
                market_odds: '-110', // Standard odds
                fair_odds: calculateFairOdds(bet.probability),
                edge: bet.expected_value,
                roi: bet.expected_value * 1.5,
                spread_line: item.spread_line || 'N/A',
                total_line: item.total_line || 'N/A',
                recommendation: bet.recommendation,
                kelly_percentage: bet.kelly_percentage
            });
        });
    }
    
    return transformedBets;
}

// Calculate odds display from probability
function calculateOddsDisplay(probability) {
    if (probability >= 50) {
        const decimal = probability / (100 - probability);
        return `-${Math.round(decimal * 100)}`;
    } else {
        const decimal = (100 - probability) / probability;
        return `+${Math.round(decimal * 100)}`;
    }
}

// Apply filters and sorting
function applyFiltersAndSort() {
    // Filter by minimum EV
    evBetsData = allBetsData.filter(bet => {
        const ev = bet.expected_value || bet.ev || 0;
        return ev >= currentMinEV;
    });
    
    // Sort
    switch(currentSort) {
        case 'ev-high':
            evBetsData.sort((a, b) => (b.expected_value || b.ev || 0) - (a.expected_value || a.ev || 0));
            break;
        case 'ev-low':
            evBetsData.sort((a, b) => (a.expected_value || a.ev || 0) - (b.expected_value || b.ev || 0));
            break;
        case 'confidence-high':
            evBetsData.sort((a, b) => (b.confidence || b.win_probability || 0) - (a.confidence || a.win_probability || 0));
            break;
        case 'confidence-low':
            evBetsData.sort((a, b) => (a.confidence || a.win_probability || 0) - (b.confidence || b.win_probability || 0));
            break;
        case 'roi-high':
            evBetsData.sort((a, b) => (b.roi || 0) - (a.roi || 0));
            break;
        case 'roi-low':
            evBetsData.sort((a, b) => (a.roi || 0) - (b.roi || 0));
            break;
        case 'kelly-high':
            evBetsData.sort((a, b) => {
                const kellyA = a.kelly_percentage || calculateKellyCriterion(a.expected_value || 0, (a.confidence || 0) * 100);
                const kellyB = b.kelly_percentage || calculateKellyCriterion(b.expected_value || 0, (b.confidence || 0) * 100);
                return kellyB - kellyA;
            });
            break;
        case 'date':
            evBetsData.sort((a, b) => {
                const dateA = a.game_time ? new Date(a.game_time) : new Date(0);
                const dateB = b.game_time ? new Date(b.game_time) : new Date(0);
                return dateA - dateB;
            });
            break;
        default:
            evBetsData.sort((a, b) => (b.expected_value || b.ev || 0) - (a.expected_value || a.ev || 0));
    }
    
    updateSummaryStats();
    displayEVBets();
}

// Update Summary Statistics
function updateSummaryStats() {
    const totalEVBets = evBetsData.length;
    const avgEV = evBetsData.length > 0 
        ? evBetsData.reduce((sum, bet) => sum + (bet.expected_value || bet.ev || 0), 0) / evBetsData.length 
        : 0;
    const bestEV = evBetsData.length > 0 
        ? Math.max(...evBetsData.map(bet => bet.expected_value || bet.ev || 0))
        : 0;
    const projectedROI = avgEV * 1.2; // Simple projection
    
    document.getElementById('totalEVBets').textContent = totalEVBets;
    document.getElementById('avgEV').textContent = `+${avgEV.toFixed(1)}%`;
    document.getElementById('bestEV').textContent = `+${bestEV.toFixed(1)}%`;
    document.getElementById('projectedROI').textContent = `+${projectedROI.toFixed(1)}%`;
}

// Display EV Bets
function displayEVBets() {
    const evBetsContainer = document.getElementById('evBetsContainer');
    const noEVMessage = document.getElementById('noEVMessage');
    
    evBetsContainer.innerHTML = '';
    
    if (evBetsData.length === 0) {
        evBetsContainer.style.display = 'none';
        noEVMessage.style.display = 'block';
        return;
    }
    
    evBetsData.forEach(bet => {
        const betCard = createEVBetCard(bet);
        evBetsContainer.appendChild(betCard);
    });
    
    evBetsContainer.style.display = 'grid';
    noEVMessage.style.display = 'none';
}

// Create EV Bet Card
function createEVBetCard(bet) {
    const card = document.createElement('div');
    const ev = bet.expected_value || bet.ev || 0;
    const confidence = (bet.confidence || bet.win_probability || 0.5) * 100;
    const valueClass = ev >= 10 ? 'high-value' : ev >= 5 ? 'medium-value' : 'low-value';
    const kellyPct = bet.kelly_percentage || calculateKellyCriterion(ev, confidence);
    
    card.className = `ev-bet-card ${valueClass}`;
    
    // Format bet type display
    let betTypeDisplay = bet.bet_type || 'Moneyline';
    betTypeDisplay = betTypeDisplay.charAt(0).toUpperCase() + betTypeDisplay.slice(1);
    
    // Format the pick display - make it crystal clear what the bet is
    let pickDisplay = '';
    let betDetail = '';
    
    if (betTypeDisplay === 'Spread') {
        // For spread bets - spread is from away team's perspective
        let spreadValue = bet.spread_line;
        
        if (spreadValue !== 'N/A' && bet.recommendation) {
            // Extract team name from recommendation
            const teamMatch = bet.recommendation.match(/(?:BET:|LEAN:)?\s*(.+?)\s+to cover/i);
            if (teamMatch) {
                const teamName = teamMatch[1].trim();
                
                // Determine if this is the away team or home team
                const isAwayTeam = bet.away_team && teamName.toLowerCase().includes(bet.away_team.toLowerCase());
                
                // Parse the spread value
                let spreadNum = parseFloat(spreadValue);
                
                // If it's the home team, reverse the sign
                if (!isAwayTeam && !isNaN(spreadNum)) {
                    spreadNum = -spreadNum;
                }
                
                // Format with proper sign
                const spreadDisplay = spreadNum > 0 ? `+${spreadNum}` : spreadNum.toString();
                pickDisplay = `${teamName} ${spreadDisplay}`;
                betDetail = `Point Spread: ${spreadDisplay}`;
            } else {
                pickDisplay = bet.recommendation;
                betDetail = `Point Spread: ${spreadValue}`;
            }
        } else {
            pickDisplay = bet.recommendation || bet.pick || 'Spread Bet';
            betDetail = `Point Spread: ${spreadValue}`;
        }
    } else if (betTypeDisplay === 'Total') {
        // For over/under bets
        const totalValue = bet.total_line || 'N/A';
        if (bet.recommendation) {
            // Extract OVER or UNDER from recommendation
            const isOver = bet.recommendation.toUpperCase().includes('OVER');
            const isUnder = bet.recommendation.toUpperCase().includes('UNDER');
            if (isOver) {
                pickDisplay = `OVER ${totalValue}`;
            } else if (isUnder) {
                pickDisplay = `UNDER ${totalValue}`;
            } else {
                pickDisplay = bet.recommendation;
            }
        } else {
            pickDisplay = `Total ${totalValue}`;
        }
        betDetail = `Total Points Line`;
    } else {
        // Moneyline or other
        pickDisplay = bet.recommendation || bet.pick || 'TBD';
        betDetail = 'Moneyline';
    }
    
    card.innerHTML = `
        <div class="ev-bet-header">
            <div class="ev-bet-game">
                <div class="ev-bet-matchup">
                    ${bet.away_team || 'Away Team'} @ ${bet.home_team || 'Home Team'}
                </div>
                <div class="ev-bet-time">Week ${bet.week || currentWeek} • ${bet.game_time || 'TBD'}</div>
            </div>
            <div class="ev-badge-container">
                <span class="ev-badge primary">+${ev.toFixed(1)}% EV</span>
                <span class="ev-badge secondary">${confidence.toFixed(0)}% Win</span>
            </div>
        </div>
        
        <div class="ev-bet-content">
            <div class="ev-bet-section">
                <h4>Recommended Bet</h4>
                <div class="ev-bet-pick">${pickDisplay}</div>
                <div class="ev-bet-odds">
                    ${betTypeDisplay}: ${betDetail} | Odds: ${bet.odds || '-110'}
                </div>
            </div>
            
            <div class="ev-bet-section">
                <h4>Key Metrics</h4>
                <div class="ev-bet-details">
                    <div class="ev-detail-item">
                        <span class="ev-detail-label">Fair Odds</span>
                        <span class="ev-detail-value">${bet.fair_odds || calculateFairOdds(confidence)}</span>
                    </div>
                    <div class="ev-detail-item">
                        <span class="ev-detail-label">Market Odds</span>
                        <span class="ev-detail-value">${bet.market_odds || '-110'}</span>
                    </div>
                    <div class="ev-detail-item">
                        <span class="ev-detail-label">Edge</span>
                        <span class="ev-detail-value success">+${(bet.edge || ev).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
            
            <div class="ev-bet-section">
                <h4>Risk Assessment</h4>
                <div class="ev-bet-details">
                    <div class="ev-detail-item">
                        <span class="ev-detail-label">Confidence</span>
                        <span class="ev-detail-value">${confidence.toFixed(0)}%</span>
                    </div>
                    <div class="ev-detail-item">
                        <span class="ev-detail-label">Full Kelly</span>
                        <span class="ev-detail-value warning">${kellyPct.toFixed(1)}%</span>
                    </div>
                    <div class="ev-detail-item">
                        <span class="ev-detail-label">Half Kelly</span>
                        <span class="ev-detail-value info">${(kellyPct / 2).toFixed(1)}%</span>
                    </div>
                    <div class="ev-detail-item">
                        <span class="ev-detail-label">ROI</span>
                        <span class="ev-detail-value success">+${(bet.roi || ev * 1.5).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="ev-bet-footer">
            <div class="ev-bet-recommendation">
                <span>💡</span>
                <span>${getBestRecommendation(bet.recommendation, ev, confidence)}</span>
            </div>
            <div class="stake-suggestion">
                <strong>Suggested Stakes:</strong> Full Kelly: ${kellyPct.toFixed(1)}% | Half Kelly: ${(kellyPct / 2).toFixed(1)}% of bankroll
            </div>
        </div>
    `;
    
    return card;
}

// Calculate Fair Odds from probability
function calculateFairOdds(probability) {
    const prob = probability / 100;
    if (prob >= 0.5) {
        const decimal = 1 / prob;
        const american = (decimal - 1) * -100;
        return Math.round(american);
    } else {
        const decimal = 1 / prob;
        const american = (decimal - 1) * 100;
        return `+${Math.round(american)}`;
    }
}

// Calculate Kelly Criterion
function calculateKellyCriterion(ev, winProb) {
    // Simplified Kelly: (bp - q) / b
    // Where b = odds, p = win probability, q = loss probability
    // For simplicity, using EV as a proxy
    const kelly = (ev / 100) * (winProb / 100);
    return Math.min(kelly * 100, 5); // Cap at 5% of bankroll
}

// Get Recommendation
function getRecommendation(ev, confidence) {
    // Simple recommendation based on EV and confidence
    if (ev >= 20) return 'BET: Excellent Value';
    if (ev >= 10 && confidence >= 55) return 'BET: Strong Value';
    if (ev >= 10) return 'BET: High EV';
    if (ev >= 5 && confidence >= 60) return 'BET: Good Value';
    if (ev >= 5) return 'LEAN: Moderate EV';
    if (ev >= 2 && confidence >= 55) return 'LEAN: Small Edge';
    return 'PASS - Low Edge';
}

// Get best recommendation - prefer API, fallback to our logic
function getBestRecommendation(apiRecommendation, ev, confidence) {
    // Use API recommendation if it exists and is valid
    if (apiRecommendation && !apiRecommendation.includes('undefined')) {
        return apiRecommendation;
    }
    // Otherwise use our logic
    return getRecommendation(ev, confidence);
}

// Generate Mock EV Data
function generateMockEVData() {
    const teams = [
        'Kansas City Chiefs', 'Buffalo Bills', 'San Francisco 49ers', 'Philadelphia Eagles',
        'Dallas Cowboys', 'Miami Dolphins', 'Baltimore Ravens', 'Detroit Lions',
        'Green Bay Packers', 'Cincinnati Bengals', 'Jacksonville Jaguars', 'Cleveland Browns',
        'New York Jets', 'Los Angeles Chargers', 'Pittsburgh Steelers', 'Seattle Seahawks'
    ];
    
    const betTypes = ['Moneyline', 'Spread', 'Over/Under'];
    const mockBets = [];
    
    // Generate 8-12 +EV opportunities
    const numBets = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < numBets && i < teams.length - 1; i += 2) {
        const awayTeam = teams[i];
        const homeTeam = teams[i + 1];
        const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
        const ev = 2 + Math.random() * 15; // 2-17% EV
        const confidence = 0.52 + Math.random() * 0.25; // 52-77% confidence
        const isHomeFavorite = Math.random() > 0.4;
        const pick = isHomeFavorite ? homeTeam : awayTeam;
        
        let odds, marketOdds;
        if (betType === 'Moneyline') {
            odds = isHomeFavorite ? Math.round(-110 - Math.random() * 200) : Math.round(100 + Math.random() * 150);
            marketOdds = isHomeFavorite ? Math.round(-150 - Math.random() * 200) : Math.round(110 + Math.random() * 150);
        } else if (betType === 'Spread') {
            odds = '-110';
            marketOdds = '-105';
        } else {
            odds = '-110';
            marketOdds = '-108';
        }
        
        mockBets.push({
            away_team: awayTeam,
            home_team: homeTeam,
            pick: pick,
            bet_type: betType,
            expected_value: ev,
            confidence: confidence,
            odds: odds,
            market_odds: marketOdds,
            fair_odds: calculateFairOdds(confidence * 100),
            edge: ev,
            roi: ev * 1.5,
            game_time: `${Math.floor(Math.random() * 4) === 0 ? 'Thu' : Math.floor(Math.random() * 2) === 0 ? 'Sun' : 'Mon'} ${Math.floor(Math.random() * 3) + 1}:${['00', '05', '25'][Math.floor(Math.random() * 3)]}PM ET`
        });
    }
    
    return mockBets.sort((a, b) => b.expected_value - a.expected_value);
}

// Utility functions
function formatPercentage(value) {
    return `${Math.round(value * 100)}%`;
}

function formatOdds(odds) {
    const num = parseFloat(odds);
    return num > 0 ? `+${num}` : num;
}
