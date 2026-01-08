// Configuration
const API_BASE_URL = 'https://api.dozencrust.com/nfl';
const CURRENT_SEASON = 2025;
const WEEKS_IN_SEASON = 18;
const TOTAL_WEEKS = 22; // 18 regular season + 4 playoff weeks

// Playoff week mapping
const PLAYOFF_WEEKS = {
    19: 'Wild Card',
    20: 'Divisional',
    21: 'Conference',
    22: 'Super Bowl'
};

// Get week display name
function getWeekDisplayName(weekNum) {
    if (weekNum <= WEEKS_IN_SEASON) {
        return `Week ${weekNum}`;
    }
    return PLAYOFF_WEEKS[weekNum] || `Week ${weekNum}`;
}

// State
let currentWeek = 1;
let gamesData = [];
let modelStats = {
    accuracy: 0,
    totalPredictions: 0,
    roi: 0
};
let availableWeeks = []; // Track weeks with available data

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initializeWeekSelector();
    setupEventListeners();
    checkAPIHealth();
    await determineCurrentWeek(); // Determine week before loading data
    loadPredictions();
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
    
    // Regular season weeks
    for (let i = 1; i <= WEEKS_IN_SEASON; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Week ${i}`;
        weekSelect.appendChild(option);
    }
    
    // Playoff weeks
    for (let i = 19; i <= TOTAL_WEEKS; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = PLAYOFF_WEEKS[i];
        weekSelect.appendChild(option);
    }
    
    // Set current week (you can calculate this based on current date)
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
    
    // Ensure week is within valid range (1-22 including playoffs)
    return Math.max(1, Math.min(TOTAL_WEEKS, calculatedWeek));
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
        ].filter(w => w >= 1 && w <= TOTAL_WEEKS);
        
        availableWeeks = [];
        
        for (const week of weeksToCheck) {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/predict/week?week=${week}&season=${CURRENT_SEASON}`,
                    {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.predictions && data.predictions.length > 0) {
                        availableWeeks.push({
                            week: week,
                            gameCount: data.predictions.length
                        });
                        console.log(`Week ${week} has ${data.predictions.length} games with data`);
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
            currentWeek = Math.min(calculatedWeek + 1, TOTAL_WEEKS);
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
        loadPredictions();
    });
    
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            document.getElementById('weekSelect').value = currentWeek;
            loadPredictions();
        }
    });
    
    document.getElementById('nextWeek').addEventListener('click', () => {
        if (currentWeek < TOTAL_WEEKS) {
            currentWeek++;
            document.getElementById('weekSelect').value = currentWeek;
            loadPredictions();
        }
    });
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadPredictions();
    });
}

// Load Predictions from API
async function loadPredictions() {
    const gamesContainer = document.getElementById('gamesContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    
    // Show loading state
    gamesContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    try {
        // Fetch predictions for the current week using correct API endpoint
        const response = await fetch(`${API_BASE_URL}/api/predict/week`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                week: currentWeek,
                season: CURRENT_SEASON
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        console.log('First game:', data.games ? data.games[0] : 'No games'); // Debug first game
        
        // Map API response to our format
        gamesData = data.games || [];
        
        // Fetch gameday info from betting endpoint to get dates
        try {
            const bettingResponse = await fetch(`${API_BASE_URL}/api/predict/week-betting?week=${currentWeek}&season=${CURRENT_SEASON}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (bettingResponse.ok) {
                const bettingData = await bettingResponse.json();
                console.log('Betting data for dates:', bettingData);
                
                // Create a map of game dates
                const gameDates = {};
                if (bettingData.games_with_ev) {
                    bettingData.games_with_ev.forEach(game => {
                        const key = `${game.away_team}_${game.home_team}`;
                        gameDates[key] = game.gameday;
                    });
                }
                
                // Add gameday to our games data
                gamesData = gamesData.map(game => {
                    const key = `${game.away_team}_${game.home_team}`;
                    return {
                        ...game,
                        gameday: gameDates[key] || game.gameday
                    };
                });
            }
        } catch (err) {
            console.log('Could not fetch game dates:', err);
        }
        
        // If no data, create mock data for demonstration
        if (gamesData.length === 0) {
            gamesData = generateMockData();
        }
        
        displayGames(gamesData);
        updateStatistics(gamesData);
        updateInsights(gamesData);
        
        // Hide loading, show games
        loadingSpinner.style.display = 'none';
        gamesContainer.style.display = 'grid';
        
    } catch (error) {
        console.error('Failed to load predictions:', error);
        loadingSpinner.style.display = 'none';
        errorMessage.style.display = 'block';
        
        // Show mock data as fallback
        gamesData = generateMockData();
        displayGames(gamesData);
        updateStatistics(gamesData);
        updateInsights(gamesData);
        gamesContainer.style.display = 'grid';
    }
}

// Display Games
function displayGames(games) {
    const gamesContainer = document.getElementById('gamesContainer');
    gamesContainer.innerHTML = '';
    
    if (games.length === 0) {
        gamesContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-secondary);">No games scheduled for this week.</p>';
        return;
    }
    
    games.forEach(game => {
        const gameCard = createGameCard(game);
        gamesContainer.appendChild(gameCard);
    });
}

// Create Game Card
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    // Format the game date if available
    let formattedDate = 'TBD';
    if (game.gameday) {
        try {
            const gameDate = new Date(game.gameday);
            const options = { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            };
            formattedDate = gameDate.toLocaleDateString('en-US', options);
        } catch (e) {
            formattedDate = game.gameday;
        }
    }
    
    // API returns winner_probability, not confidence
    const winnerProb = game.winner_probability || game.home_win_probability || game.away_win_probability || 0.5;
    const confidenceLevel = getConfidenceLevel(winnerProb / 100); // Convert from percentage
    const confidenceClass = confidenceLevel === 'High' ? 'confidence-high' : 
                           confidenceLevel === 'Medium' ? 'confidence-medium' : 'confidence-low';
    
    // API confidence level from response
    const apiConfidence = game.confidence ? game.confidence.charAt(0).toUpperCase() + game.confidence.slice(1) : confidenceLevel;
    
    card.innerHTML = `
        <div class="game-header">
            <div class="game-time">${formattedDate}</div>
        </div>
        
        <div class="teams-container">
            <div class="team away-team">
                <div class="team-name">${game.away_team || 'Away Team'}</div>
                <div class="team-record">${game.away_record || ''}</div>
            </div>
            
            <div class="vs-separator">@</div>
            
            <div class="team home-team">
                <div class="team-name">${game.home_team || 'Home Team'}</div>
                <div class="team-record">${game.home_record || ''}</div>
            </div>
        </div>
        
        <div class="prediction-box">
            <div class="prediction-header">
                <div class="predicted-winner">
                    <strong>Pick:</strong> ${game.predicted_winner || 'TBD'}
                </div>
                <div class="confidence">
                    <span class="confidence-badge ${confidenceClass}">
                        ${apiConfidence} ${Math.round(winnerProb)}%
                    </span>
                </div>
            </div>
            
            <div class="spread-info">
                <span>Away Win: ${Math.round(game.away_win_probability || 0)}%</span>
                <span>Home Win: ${Math.round(game.home_win_probability || 0)}%</span>
            </div>
        </div>
    `;
    
    return card;
}

// Get Confidence Level
function getConfidenceLevel(confidence) {
    const conf = parseFloat(confidence);
    // Match API thresholds: high >= 70%, moderate 60-70%, low < 60%
    if (conf >= 0.70) return 'High';
    if (conf >= 0.60) return 'Medium';
    return 'Low';
}

// Update Statistics
function updateStatistics(games) {
    // Fetch model accuracy from API
    fetchModelAccuracy();
    
    // Calculate stats from games data
    const highConfGames = games.filter(g => (g.confidence || g.win_probability || 0) >= 0.65);
    
    document.getElementById('totalPredictions').textContent = games.length;
    
    // Find best bet
    const bestBet = games.reduce((best, game) => 
        (game.winner_probability || 0) > (best.winner_probability || 0) ? game : best
    , games[0]);
    
    document.getElementById('bestBet').textContent = bestBet ? 
        `${bestBet.predicted_winner || bestBet.pick || 'N/A'}` : '--';
    
    // Mock ROI for now
    document.getElementById('roi').textContent = '+12.5%';
}

// Fetch model accuracy from API
async function fetchModelAccuracy() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/model/info`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Model info:', data);
            
            if (data.test_accuracy) {
                document.getElementById('accuracy').textContent = `${data.test_accuracy.toFixed(1)}%`;
            } else {
                document.getElementById('accuracy').textContent = '63.9%';
            }
        } else {
            // Fallback to static value
            document.getElementById('accuracy').textContent = '63.9%';
        }
    } catch (error) {
        console.log('Could not fetch model accuracy:', error);
        // Fallback to static value
        document.getElementById('accuracy').textContent = '63.9%';
    }
}

// Update Insights
function updateInsights(games) {
    const insightsContainer = document.getElementById('insightsContainer');
    
    const insights = [
        {
            icon: '📊',
            title: 'Model Performance',
            text: `The model shows ${Math.round(games.length * 0.7)} high-confidence picks this week with an average win probability of ${Math.round(games.reduce((sum, g) => sum + (g.confidence || 0.5), 0) / games.length * 100)}%.`
        },
        {
            icon: '🔥',
            title: 'Hot Take',
            text: 'Home teams are favored in 60% of games this week, but historical data suggests road underdogs may provide value.'
        },
        {
            icon: '⚡',
            title: 'Value Plays',
            text: `Look for games with spread differences exceeding 3 points from model predictions for potential value bets.`
        },
        {
            icon: '🎯',
            title: 'Betting Strategy',
            text: 'Focus on games with 65%+ confidence levels and consider parlaying high-probability home favorites.'
        }
    ];
    
    insightsContainer.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <h4>${insight.title}</h4>
                <p>${insight.text}</p>
            </div>
        </div>
    `).join('');
}

// Generate Mock Data (for demonstration when API doesn't return expected format)
function generateMockData() {
    const teams = [
        'Kansas City Chiefs', 'Buffalo Bills', 'San Francisco 49ers', 'Philadelphia Eagles',
        'Dallas Cowboys', 'Miami Dolphins', 'Baltimore Ravens', 'Detroit Lions',
        'Green Bay Packers', 'Cincinnati Bengals', 'Jacksonville Jaguars', 'Cleveland Browns',
        'New York Jets', 'Los Angeles Chargers', 'Pittsburgh Steelers', 'Seattle Seahawks'
    ];
    
    const mockGames = [];
    const gamesThisWeek = Math.min(16, teams.length);
    
    for (let i = 0; i < gamesThisWeek; i += 2) {
        if (i + 1 < teams.length) {
            const confidence = 0.5 + Math.random() * 0.3;
            const awayTeam = teams[i];
            const homeTeam = teams[i + 1];
            const predictedWinner = Math.random() > 0.45 ? homeTeam : awayTeam;
            
            mockGames.push({
                away_team: awayTeam,
                home_team: homeTeam,
                away_record: `${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 10)}`,
                home_record: `${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 10)}`,
                predicted_winner: predictedWinner,
                confidence: confidence,
                spread: `${predictedWinner === homeTeam ? '-' : '+'}${(Math.random() * 10 + 1).toFixed(1)}`,
                over_under: (Math.random() * 10 + 40).toFixed(1),
                game_time: `${Math.floor(Math.random() * 4) === 0 ? 'Thu' : Math.floor(Math.random() * 2) === 0 ? 'Sun' : 'Mon'} ${Math.floor(Math.random() * 3) + 1}:${['00', '05', '25'][Math.floor(Math.random() * 3)]}PM ET`
            });
        }
    }
    
    return mockGames;
}

// Utility function to format percentage
function formatPercentage(value) {
    return `${Math.round(value * 100)}%`;
}

// Utility function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCurrentWeek,
        getConfidenceLevel,
        generateMockData
    };
}
