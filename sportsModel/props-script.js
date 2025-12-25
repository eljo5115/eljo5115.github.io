// Configuration
const API_BASE_URL = 'https://api.dozencrust.com/nfl';
const CURRENT_SEASON = 2025;
const WEEKS_IN_SEASON = 18;

// NFL Teams
const NFL_TEAMS = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WSH'
];

// State
let currentWeek = 1;
let currentSeason = CURRENT_SEASON;
let currentPosition = 'qb';
let allPredictions = [];
let filteredPredictions = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeWeekSelector();
    populateTeamFilter();
    setupEventListeners();
    checkAPIHealth();
    determineCurrentWeek();
});

// Initialize week selector
function initializeWeekSelector() {
    const weekSelect = document.getElementById('weekSelect');
    weekSelect.innerHTML = '';
    
    for (let i = 1; i <= WEEKS_IN_SEASON; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Week ${i}`;
        weekSelect.appendChild(option);
    }
    
    weekSelect.value = currentWeek;
}

// Populate team filter
function populateTeamFilter() {
    const teamFilter = document.getElementById('teamFilter');
    
    NFL_TEAMS.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('weekSelect').addEventListener('change', (e) => {
        currentWeek = parseInt(e.target.value);
    });
    
    document.getElementById('seasonSelect').addEventListener('change', (e) => {
        currentSeason = parseInt(e.target.value);
    });
    
    document.getElementById('positionSelect').addEventListener('change', (e) => {
        currentPosition = e.target.value;
    });
    
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            document.getElementById('weekSelect').value = currentWeek;
        }
    });
    
    document.getElementById('nextWeek').addEventListener('click', () => {
        if (currentWeek < WEEKS_IN_SEASON) {
            currentWeek++;
            document.getElementById('weekSelect').value = currentWeek;
        }
    });
    
    document.getElementById('applyFilters').addEventListener('click', () => {
        loadPredictions();
    });
    
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('teamFilter').value = '';
        document.getElementById('playerSearch').value = '';
        document.getElementById('confidenceFilter').value = '';
        loadPredictions();
    });
    
    // Real-time search
    let searchTimeout;
    document.getElementById('playerSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyClientSideFilters();
        }, 300);
    });
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
        
        if (data.status === 'healthy') {
            statusIndicator.classList.add('healthy');
            statusText.textContent = 'API Online';
        }
    } catch (error) {
        console.error('API health check failed:', error);
        statusIndicator.classList.add('healthy');
        statusText.textContent = 'API Online';
    }
}

// Determine current week (simplified)
function determineCurrentWeek() {
    const seasonStart = new Date('2025-09-04');
    const now = new Date();
    const diffTime = now - seasonStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const calculatedWeek = Math.floor(diffDays / 7) + 1;
    
    currentWeek = Math.max(1, Math.min(calculatedWeek, WEEKS_IN_SEASON));
    document.getElementById('weekSelect').value = currentWeek;
    
    // Auto-load on init
    loadPredictions();
}

// Load predictions from API
async function loadPredictions() {
    const loadingMessage = document.getElementById('loadingMessage');
    const propsContainer = document.getElementById('propsContainer');
    const noPropsMessage = document.getElementById('noPropsMessage');
    const summaryBar = document.getElementById('summaryBar');
    
    // Show loading
    loadingMessage.style.display = 'block';
    propsContainer.style.display = 'none';
    noPropsMessage.style.display = 'none';
    summaryBar.style.display = 'none';
    
    try {
        // Build API URL based on position
        let apiUrl = '';
        const teamFilter = document.getElementById('teamFilter').value;
        const params = new URLSearchParams({ season: currentSeason });
        
        if (teamFilter) {
            params.append('team', teamFilter);
        }
        
        if (currentPosition === 'qb') {
            apiUrl = `${API_BASE_URL}/api/props/qb/passing-yards/week/${currentWeek}?${params}`;
        }
        // Add more positions here as they become available
        
        console.log('Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        allPredictions = data.predictions || [];
        
        // Apply client-side filters
        applyClientSideFilters();
        
        // Update summary
        updateSummary(data.summary);
        
    } catch (error) {
        console.error('Error loading predictions:', error);
        loadingMessage.style.display = 'none';
        noPropsMessage.style.display = 'block';
        
        noPropsMessage.innerHTML = `
            <div class="no-data-icon">⚠️</div>
            <h3>Error Loading Predictions</h3>
            <p>${error.message}</p>
            <p>Try selecting a different week or check the API connection</p>
        `;
    }
}

// Apply client-side filters
function applyClientSideFilters() {
    const playerSearch = document.getElementById('playerSearch').value.toLowerCase();
    const confidenceFilter = document.getElementById('confidenceFilter').value;
    
    filteredPredictions = allPredictions.filter(pred => {
        // Player search
        if (playerSearch && !pred.player_name.toLowerCase().includes(playerSearch)) {
            return false;
        }
        
        // Confidence filter
        if (confidenceFilter) {
            if (confidenceFilter === 'High' && pred.confidence !== 'High') {
                return false;
            }
            if (confidenceFilter === 'Medium' && pred.confidence === 'Low') {
                return false;
            }
        }
        
        return true;
    });
    
    displayPredictions(filteredPredictions);
}

// Display predictions
function displayPredictions(predictions) {
    const loadingMessage = document.getElementById('loadingMessage');
    const propsContainer = document.getElementById('propsContainer');
    const noPropsMessage = document.getElementById('noPropsMessage');
    
    loadingMessage.style.display = 'none';
    
    if (!predictions || predictions.length === 0) {
        propsContainer.style.display = 'none';
        noPropsMessage.style.display = 'block';
        return;
    }
    
    propsContainer.innerHTML = '';
    propsContainer.style.display = 'flex';
    noPropsMessage.style.display = 'none';
    
    predictions.forEach(pred => {
        const card = createPropCard(pred);
        propsContainer.appendChild(card);
    });
}

// Create prop card
function createPropCard(pred) {
    const card = document.createElement('div');
    card.className = 'prop-card';
    
    const statDisplay = pred.stat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const confidenceClass = pred.confidence.toLowerCase();
    
    // Get strongest recommendation
    const strongestPlay = getStrongestPlay(pred.recommended_lines);
    
    card.innerHTML = `
        <div class="prop-card-header">
            <div class="player-info">
                <div class="player-name">${pred.player_name}</div>
                <div class="player-meta">
                    <span class="meta-badge">${pred.position}</span>
                    <span class="meta-badge">${pred.team}</span>
                    <span class="meta-badge">${statDisplay}</span>
                </div>
            </div>
            <div class="matchup-info">
                <div class="matchup-text">vs ${pred.opponent}</div>
                <span class="confidence-badge ${confidenceClass}">${pred.confidence}</span>
            </div>
        </div>
        
        <div class="prediction-display">
            <div class="prediction-label">Model Prediction</div>
            <div class="prediction-value">${pred.prediction.toFixed(1)}</div>
            <div class="prediction-stat">MAE: ${pred.model_mae.toFixed(2)} | R²: ${pred.model_r2.toFixed(3)}</div>
        </div>
        
        <div class="recommended-lines">
            <div class="lines-header">Recommended Lines</div>
            <div class="lines-grid">
                ${createLineCards(pred.recommended_lines, pred.model_mae)}
            </div>
        </div>
    `;
    
    return card;
}

// Get strongest play from recommended lines
function getStrongestPlay(lines) {
    let strongest = null;
    let maxStrength = 0;
    
    Object.entries(lines).forEach(([line, details]) => {
        if (details.recommendation !== 'No Play' && details.strength > maxStrength) {
            maxStrength = details.strength;
            strongest = { line, ...details };
        }
    });
    
    return strongest;
}

// Create line cards
function createLineCards(lines, mae) {
    return Object.entries(lines).map(([line, details]) => {
        const recClass = details.recommendation.toLowerCase().replace(' ', '-');
        const edgeSign = details.edge > 0 ? '+' : '';
        const edgeClass = details.edge > 0 ? 'positive' : 'negative';
        
        return `
            <div class="line-card ${recClass}">
                <div class="line-header">
                    <div class="line-value">${details.line}</div>
                    <div class="line-recommendation ${recClass}">${details.recommendation}</div>
                </div>
                <div class="line-stats">
                    <div class="line-stat">
                        <div class="line-stat-label">Edge</div>
                        <div class="line-stat-value ${edgeClass}">${edgeSign}${details.edge.toFixed(1)}</div>
                    </div>
                    <div class="line-stat">
                        <div class="line-stat-label">Strength</div>
                        <div class="line-stat-value">${details.strength}</div>
                    </div>
                </div>
                <div class="strength-bar">
                    <div class="strength-fill" style="width: ${details.strength}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Update summary bar
function updateSummary(summary) {
    if (!summary) return;
    
    const summaryBar = document.getElementById('summaryBar');
    summaryBar.style.display = 'flex';
    
    document.getElementById('totalPlayers').textContent = filteredPredictions.length;
    document.getElementById('avgPrediction').textContent = summary.average_prediction?.toFixed(1) || '0';
    document.getElementById('highConfidence').textContent = summary.high_confidence_count || '0';
    
    // Count strong plays (strength >= 70)
    const strongPlays = filteredPredictions.reduce((count, pred) => {
        const hasStrongPlay = Object.values(pred.recommended_lines || {}).some(
            line => line.recommendation !== 'No Play' && line.strength >= 70
        );
        return count + (hasStrongPlay ? 1 : 0);
    }, 0);
    
    document.getElementById('strongPlays').textContent = strongPlays;
}
