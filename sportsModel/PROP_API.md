# Player Props API - Quick Start Guide

## Overview
The Player Props API provides machine learning predictions for player statistics with searchable endpoints, confidence scores, and recommended betting lines.

## Current Status
✅ **QB Passing Yards Model** - Live and available
🚧 **RB/WR/TE Models** - Coming soon

## Available Endpoints

### 1. QB Passing Yards - Weekly Predictions
Get all QB predictions for a specific week with optional filters.

```bash
# Get all QBs for week 1, 2024
curl "http://localhost:8000/api/props/qb/passing-yards/week/1?season=2024"

# Filter by team (Kansas City Chiefs)
curl "http://localhost:8000/api/props/qb/passing-yards/week/1?season=2024&team=KC"

# Search for player by name (partial match, case-insensitive)
curl "http://localhost:8000/api/props/qb/passing-yards/week/1?season=2024&player_name=mahomes"
```

**Response Structure:**
```json
{
  "position": "QB",
  "stat": "passing_yards",
  "week": 1,
  "season": 2024,
  "predictions": [
    {
      "player_id": "00-0033873",
      "player_name": "Patrick Mahomes",
      "position": "QB",
      "team": "KC",
      "opponent": "BAL",
      "week": 1,
      "season": 2024,
      "stat": "passing_yards",
      "prediction": 276.3,
      "confidence": "High",
      "model_mae": 3.58,
      "model_r2": 0.9883,
      "recommended_lines": {
        "251.5": {
          "line": 251.5,
          "recommendation": "Over",
          "edge": 24.8,
          "strength": 100
        },
        "276.5": {
          "line": 276.5,
          "recommendation": "No Play",
          "edge": -0.2,
          "strength": 0
        },
        "301.5": {
          "line": 301.5,
          "recommendation": "Under",
          "edge": -25.2,
          "strength": 100
        }
      }
    }
  ],
  "summary": {
    "total_players": 32,
    "valid_predictions": 32,
    "average_prediction": 242.5,
    "highest_prediction": 312.7,
    "lowest_prediction": 189.2,
    "high_confidence_count": 28,
    "filters_applied": {
      "team": null,
      "player_name": null
    }
  }
}
```

### 2. QB Passing Yards - Player Search
Get prediction for a specific player.

```bash
# Search by full name
curl "http://localhost:8000/api/props/qb/passing-yards/player?player_name=Patrick%20Mahomes&week=1&season=2024"

# Search by partial name
curl "http://localhost:8000/api/props/qb/passing-yards/player?player_name=allen&week=1&season=2024"
```

**Response:** Single prediction object (same format as above)

### 3. QB Passing Yards - Team QBs
Get all QBs for a specific team.

```bash
# Get Kansas City Chiefs QBs
curl "http://localhost:8000/api/props/qb/passing-yards/team/KC?week=1&season=2024"

# Get Buffalo Bills QBs
curl "http://localhost:8000/api/props/qb/passing-yards/team/BUF?week=1&season=2024"
```

**Response:**
```json
{
  "team": "KC",
  "week": 1,
  "season": 2024,
  "qb_count": 1,
  "predictions": [
    { /* prediction object */ }
  ]
}
```

## Understanding the Response

### Prediction Fields
- **prediction**: Predicted passing yards (float)
- **confidence**: Model confidence level
  - **High**: MAE < 10 AND R² > 0.95
  - **Medium**: MAE < 20 AND R² > 0.85
  - **Low**: Otherwise
- **model_mae**: Model's Mean Absolute Error (lower is better)
- **model_r2**: R² score (higher is better, 1.0 = perfect)

### Recommended Lines
Each prop line includes:
- **line**: The prop line value
- **recommendation**:
  - **Over**: Prediction is significantly above line (edge > MAE)
  - **Under**: Prediction is significantly below line (edge < -MAE)
  - **No Play**: Too close to call (|edge| ≤ MAE)
- **edge**: Predicted value minus line
  - Positive = over edge
  - Negative = under edge
- **strength**: Confidence strength (0-100)
  - Calculated as: (edge / MAE) * 50, capped at 100
  - Higher = stronger edge

### Example Interpretation
```json
{
  "prediction": 287.5,
  "recommended_lines": {
    "262.5": {
      "recommendation": "Over",
      "edge": 25.0,
      "strength": 100
    }
  }
}
```

**Translation**: The model predicts 287.5 yards. With a line at 262.5:
- Edge is +25 yards over the line
- This is 7x the model's MAE (3.58 yards)
- Strong **OVER** recommendation with 100 strength

## Python Usage Example

```python
import requests

# Get all QBs for a week
response = requests.get(
    "http://localhost:8000/api/props/qb/passing-yards/week/1",
    params={"season": 2024}
)
data = response.json()

# Find high-confidence predictions
for pred in data['predictions']:
    if pred['confidence'] == 'High':
        print(f"{pred['player_name']}: {pred['prediction']} yards")

# Find best betting opportunities
for pred in data['predictions']:
    for line_str, details in pred['recommended_lines'].items():
        # Look for strength >= 80 (strong edge)
        if details['strength'] >= 80:
            print(f"{pred['player_name']}: {details['recommendation']} {details['line']}")
            print(f"  Edge: {details['edge']} yards | Strength: {details['strength']}")

# Search for specific player
mahomes = requests.get(
    "http://localhost:8000/api/props/qb/passing-yards/player",
    params={"player_name": "mahomes", "week": 1, "season": 2024}
).json()

print(f"\n{mahomes['player_name']} vs {mahomes['opponent']}")
print(f"Prediction: {mahomes['prediction']} yards")
print(f"Confidence: {mahomes['confidence']}")
```

## JavaScript Usage Example

```javascript
// Fetch predictions for a week
async function getQBPredictions(week, season = 2024, team = null) {
  const params = new URLSearchParams({ season });
  if (team) params.append('team', team);
  
  const response = await fetch(
    `/api/props/qb/passing-yards/week/${week}?${params}`
  );
  return response.json();
}

// Search for a player
async function searchPlayer(playerName, week, season = 2024) {
  const params = new URLSearchParams({
    player_name: playerName,
    week,
    season
  });
  
  const response = await fetch(
    `/api/props/qb/passing-yards/player?${params}`
  );
  return response.json();
}

// Usage
const data = await getQBPredictions(1, 2024);
console.log(`Found ${data.summary.total_players} QBs`);

const mahomes = await searchPlayer('mahomes', 1, 2024);
console.log(`${mahomes.player_name}: ${mahomes.prediction} yards`);
```

## Model Features

The QB Passing Yards model v2 uses **116 features** across 3 categories:

### 1. Individual Player Features (49)
- Recent performance (L3, L5, L10 game averages)
- Season trends and consistency
- Passing yards, TDs, completions, attempts

### 2. Team Offensive Features (25) ⭐ NEW
- **Most Important**: `player_team_share` (47.7% importance)
  - Percentage of team's passing yards
  - Distinguishes starter vs backup QB
- Team passing yards per game
- Team offensive tendencies
- Captures offensive system effects

### 3. Defensive Matchup Features (42)
- Opponent's pass defense statistics
- Yards allowed vs QBs
- Recent defensive trends
- Sacks, TDs allowed

## Tips for Using the API

1. **Use Filters**: Narrow results by team or player name for faster responses
2. **Check Confidence**: Focus on High/Medium confidence predictions
3. **Look for Edge**: Seek predictions with strength >= 70 for betting
4. **Compare Lines**: Check multiple bookmaker lines against recommendations
5. **Consider Context**: Model doesn't account for weather, injuries, or last-minute changes

## Common Issues

### Empty Predictions
```json
{
  "predictions": [],
  "summary": { "total_players": 0 }
}
```
**Cause**: No data available for that week yet (future weeks)
**Solution**: Use historical weeks (2022-2024 seasons) for testing

### 404 Not Found
```json
{
  "detail": "No predictions found for player matching 'Smith' in week 1"
}
```
**Cause**: Player name not found or insufficient games played
**Solution**: Try partial name or check different weeks

### 500 Internal Server Error
**Cause**: Server-side error processing request
**Solution**: Check API logs or try a different week/season

## Support

For issues or questions:
1. Check API documentation: `/docs/PLAYER_PROPS_API.md`
2. View interactive API docs: `http://localhost:8000/docs`
3. Review model performance in: `notebooks/04_player_props_models.ipynb`

## Coming Soon

🚧 Additional player prop models:
- RB Rushing Yards
- RB Receiving Yards
- WR Receiving Yards
- TE Receiving Yards
- Anytime TD Scorer
- QB Passing TDs
