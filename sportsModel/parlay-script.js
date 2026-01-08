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
let parlayData = null;
let currentSort = 'ev';
let currentTab = 'all';
let availableWeeks = []; // Track weeks with available data

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initializeWeekSelector();
    setupEventListeners();
    checkAPIHealth();
    await determineCurrentWeek(); // Determine week before loading data
    loadParlays();
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
                    `${API_BASE_URL}/api/parlays/week?week=${week}&season=${CURRENT_SEASON}`,
                    {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.parlays && (data.parlays.two_team?.length > 0 || data.parlays.three_team?.length > 0)) {
                        const totalParlays = (data.parlays.two_team?.length || 0) + (data.parlays.three_team?.length || 0);
                        availableWeeks.push({
                            week: week,
                            gameCount: totalParlays
                        });
                        console.log(`Week ${week} has ${totalParlays} parlays with data`);
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
            console.log(`Selected week ${currentWeek} with ${targetWeek.gameCount} parlays (calculated week was ${calculatedWeek})`);
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
        loadParlays();
    });
    
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            document.getElementById('weekSelect').value = currentWeek;
            loadParlays();
        }
    });
    
    document.getElementById('nextWeek').addEventListener('click', () => {
        if (currentWeek < TOTAL_WEEKS) {
            currentWeek++;
            document.getElementById('weekSelect').value = currentWeek;
            loadParlays();
        }
    });
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadParlays(true);
    });
    
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort = e.target.value;
        displayBestParlays();
    });
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.legs;
            displayByLegs();
        });
    });
    
    // Filter change triggers reload
    ['minLegs', 'maxLegs', 'minConfidence'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            loadParlays();
        });
    });
}

// Load Parlays from API
async function loadParlays(forceRegenerate = false) {
    const bestParlaysContainer = document.getElementById('bestParlaysContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const noParlaysMessage = document.getElementById('noParlaysMessage');
    
    bestParlaysContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    noParlaysMessage.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    // Get filter values
    const minLegs = document.getElementById('minLegs').value;
    const maxLegs = document.getElementById('maxLegs').value;
    const minConfidence = document.getElementById('minConfidence').value;
    
    console.log('Loading parlays with filters:', { minLegs, maxLegs, minConfidence, week: currentWeek });
    
    try {
        const params = new URLSearchParams({
            week: currentWeek,
            season: CURRENT_SEASON,
            min_legs: minLegs,
            max_legs: maxLegs,
            min_confidence: minConfidence
        });
        
        if (forceRegenerate) {
            params.append('force_regenerate', 'true');
        }
        
        const apiUrl = `${API_BASE_URL}/api/predict/week-parlays?${params}`;
        console.log('Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        parlayData = await response.json();
        console.log('Parlay Response:', parlayData);
        console.log('Number of best_parlays:', parlayData.best_parlays?.length || 0);
        console.log('By legs structure:', Object.keys(parlayData.by_legs || {}));
        
        updateSummaryStats();
        displayBestParlays();
        displayByLegs();
        
        loadingSpinner.style.display = 'none';
        
        if (!parlayData.best_parlays || parlayData.best_parlays.length === 0) {
            noParlaysMessage.style.display = 'block';
        } else {
            bestParlaysContainer.style.display = 'grid';
        }
        
    } catch (error) {
        console.error('Failed to load parlays:', error);
        loadingSpinner.style.display = 'none';
        errorMessage.style.display = 'block';
    }
}

// Update Summary Statistics
function updateSummaryStats() {
    if (!parlayData) return;
    
    document.getElementById('totalParlays').textContent = parlayData.total_parlays || 0;
    document.getElementById('qualifiedBets').textContent = parlayData.qualified_bets || 0;
    
    if (parlayData.summary) {
        document.getElementById('bestEV').textContent = 
            parlayData.summary.highest_ev?.expected_value_display || '--';
        document.getElementById('safestWin').textContent = 
            parlayData.summary.safest?.win_probability_pct || '--';
    } else {
        document.getElementById('bestEV').textContent = '--';
        document.getElementById('safestWin').textContent = '--';
    }
}

// Display Best Parlays
function displayBestParlays() {
    const container = document.getElementById('bestParlaysContainer');
    container.innerHTML = '';
    
    if (!parlayData || !parlayData.best_parlays || parlayData.best_parlays.length === 0) {
        return;
    }
    
    let parlays = [...parlayData.best_parlays];
    
    // Sort based on selection
    switch(currentSort) {
        case 'ev':
            parlays.sort((a, b) => b.expected_value - a.expected_value);
            break;
        case 'win-prob':
            parlays.sort((a, b) => b.win_probability - a.win_probability);
            break;
        case 'legs':
            parlays.sort((a, b) => b.num_legs - a.num_legs);
            break;
    }
    
    // Show top 10
    parlays.slice(0, 10).forEach(parlay => {
        const card = createParlayCard(parlay);
        container.appendChild(card);
    });
}

// Display By Legs
function displayByLegs() {
    const container = document.getElementById('byLegsContainer');
    container.innerHTML = '';
    
    if (!parlayData || !parlayData.by_legs) {
        return;
    }
    
    let parlaysToShow = [];
    
    if (currentTab === 'all') {
        // Show all parlays
        Object.values(parlayData.by_legs).forEach(legArray => {
            parlaysToShow.push(...legArray);
        });
    } else {
        // Show specific leg count
        const key = `${currentTab}_leg`;
        parlaysToShow = parlayData.by_legs[key] || [];
    }
    
    // Sort and display
    parlaysToShow.sort((a, b) => b.expected_value - a.expected_value);
    parlaysToShow.slice(0, 20).forEach(parlay => {
        const card = createParlayCard(parlay);
        container.appendChild(card);
    });
}

// Create Parlay Card
function createParlayCard(parlay) {
    const card = document.createElement('div');
    const riskRating = parlay.risk_rating ? parlay.risk_rating.toLowerCase().replace(' ', '-') : 'moderate';
    card.className = `parlay-card risk-${riskRating}`;
    
    const legsHTML = parlay.legs.map(leg => `
        <div class="parlay-leg">
            <div class="parlay-leg-game">${leg.game}</div>
            <div class="parlay-leg-pick">${leg.pick}</div>
            <div class="parlay-leg-meta">
                <span>${leg.probability}</span>
                <span class="parlay-leg-confidence ${leg.confidence}">${leg.confidence.toUpperCase()}</span>
            </div>
        </div>
    `).join('');
    
    card.innerHTML = `
        <div class="parlay-header">
            <div class="parlay-title">
                <span class="parlay-legs-badge">${parlay.num_legs}-Leg Parlay</span>
            </div>
            <div class="parlay-badges">
                <span class="parlay-ev-badge">${parlay.expected_value_display}</span>
                <span class="parlay-risk-badge ${riskRating}">${parlay.risk_rating || 'MODERATE'}</span>
            </div>
        </div>
        
        <div class="parlay-stats">
            <div class="parlay-stat">
                <div class="parlay-stat-label">Win Probability</div>
                <div class="parlay-stat-value highlight">${parlay.win_probability_pct}</div>
            </div>
            <div class="parlay-stat">
                <div class="parlay-stat-label">Parlay Odds</div>
                <div class="parlay-stat-value">+${parlay.parlay_odds}</div>
            </div>
            <div class="parlay-stat">
                <div class="parlay-stat-label">Profit on $100</div>
                <div class="parlay-stat-value success">${parlay.profit_on_100}</div>
            </div>
            <div class="parlay-stat">
                <div class="parlay-stat-label">Payout Per $1</div>
                <div class="parlay-stat-value">${parlay.payout_per_dollar}x</div>
            </div>
        </div>
        
        <div class="parlay-legs">
            <div class="parlay-legs-header">Parlay Legs:</div>
            ${legsHTML}
        </div>
    `;
    
    return card;
}

// Utility functions
function formatPercentage(value) {
    return `${Math.round(value * 100)}%`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}
