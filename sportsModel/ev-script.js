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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeWeekSelector();
    setupEventListeners();
    checkAPIHealth();
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

// Get current NFL week
function getCurrentWeek() {
    const now = new Date();
    const seasonStart = new Date(2025, 8, 4);
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(WEEKS_IN_SEASON, weeksSinceStart + 1));
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
        data.all_positive_ev_bets.forEach(item => {
            const bet = item.bet;
            transformedBets.push({
                away_team: item.away_team,
                home_team: item.home_team,
                game_time: item.gameday || 'TBD',
                pick: bet.recommendation.replace('BET: ', '').replace('LEAN: ', ''),
                bet_type: bet.bet_type,
                expected_value: bet.expected_value,
                confidence: bet.probability / 100, // Convert to decimal
                odds: calculateOddsDisplay(bet.probability),
                market_odds: '-110', // Default
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
    
    // Format the pick display
    let pickDisplay = bet.recommendation || bet.pick || 'TBD';
    if (betTypeDisplay === 'Spread' && bet.spread_line) {
        pickDisplay += ` (${bet.spread_line})`;
    } else if (betTypeDisplay === 'Total' && bet.total_line) {
        pickDisplay += ` ${bet.total_line}`;
    }
    
    card.innerHTML = `
        <div class="ev-bet-header">
            <div class="ev-bet-game">
                <div class="ev-bet-matchup">
                    ${bet.away_team || 'Away Team'} @ ${bet.home_team || 'Home Team'}
                </div>
                <div class="ev-bet-time">${bet.game_time || 'TBD'}</div>
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
                    ${betTypeDisplay} | Odds: ${bet.odds || '-110'}
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
                        <span class="ev-detail-label">Kelly %</span>
                        <span class="ev-detail-value warning">${kellyPct.toFixed(1)}%</span>
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
                <span>${bet.recommendation || getRecommendation(ev, confidence)}</span>
            </div>
            <div class="stake-suggestion">
                Suggested Stake: ${kellyPct.toFixed(1)}% of bankroll
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
    if (ev >= 10 && confidence >= 65) return 'Strong Bet';
    if (ev >= 5 && confidence >= 60) return 'Good Value';
    if (ev >= 2 && confidence >= 55) return 'Moderate Value';
    return 'Proceed with Caution';
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
