# Player Props Page - Multi-Position Update

**Date**: December 24, 2025

## Overview
Expanded the player props page to support multiple positions and bet types beyond just QB passing yards. The UI now supports:
- ✅ QB Passing Yards
- ✅ RB Rushing Yards
- ✅ RB Receiving Yards
- ✅ WR Receiving Yards
- ✅ Anytime TD Scorer

## Changes Made

### 1. HTML Updates (`props.html`)

#### Updated Position Selector
**Before:**
```html
<select id="positionSelect" class="filter-select">
    <option value="qb">QB - Passing Yards</option>
    <!-- Future options commented out -->
</select>
```

**After:**
```html
<select id="positionSelect" class="filter-select">
    <option value="qb-passing">QB - Passing Yards</option>
    <option value="rb-rushing">RB - Rushing Yards</option>
    <option value="rb-receiving">RB - Receiving Yards</option>
    <option value="wr-receiving">WR - Receiving Yards</option>
    <option value="anytime-td">Anytime TD Scorer</option>
</select>
```

**What Changed:**
- Removed comments, activated all position options
- Updated QB value to `qb-passing` for consistency
- Added 4 new position/stat type combinations

### 2. JavaScript Updates (`props-script.js`)

#### A. Updated State Variable
```javascript
// Before
let currentPosition = 'qb';

// After
let currentPosition = 'qb-passing';
```

#### B. Added Stat Display Helper Function
**New function to handle different stat types:**
```javascript
function getStatDisplayInfo(stat) {
    const statMap = {
        'passing_yards': { label: 'Passing Yards', unit: 'yards' },
        'rushing_yards': { label: 'Rushing Yards', unit: 'yards' },
        'receiving_yards': { label: 'Receiving Yards', unit: 'yards' },
        'anytime_td': { label: 'TD Probability', unit: '%' }
    };
    
    return statMap[stat] || { label: stat.replace('_', ' '), unit: '' };
}
```

**Purpose:**
- Provides human-readable labels for each stat type
- Defines appropriate units (yards vs percentage)
- Fallback for any future stat types

#### C. Updated `loadPredictions()` Function
**Added API endpoint routing:**
```javascript
// Map position to API endpoint
switch(currentPosition) {
    case 'qb-passing':
        apiUrl = `${API_BASE_URL}/api/props/qb/passing-yards/week/${currentWeek}?${params}`;
        break;
    case 'rb-rushing':
        apiUrl = `${API_BASE_URL}/api/props/rb/rushing-yards/week/${currentWeek}?${params}`;
        break;
    case 'rb-receiving':
        apiUrl = `${API_BASE_URL}/api/props/rb/receiving-yards/week/${currentWeek}?${params}`;
        break;
    case 'wr-receiving':
        apiUrl = `${API_BASE_URL}/api/props/wr/receiving-yards/week/${currentWeek}?${params}`;
        break;
    case 'anytime-td':
        apiUrl = `${API_BASE_URL}/api/props/anytime-td/week/${currentWeek}?${params}`;
        break;
    default:
        throw new Error('Invalid position selected');
}
```

**What Changed:**
- Replaced single if-statement with switch case
- Maps each position value to correct API endpoint
- Maintains query parameters (season, team filters)
- Throws error for invalid selections

#### D. Enhanced `createPropCard()` Function
**Key Changes:**

1. **Dynamic Stat Labeling:**
```javascript
const statInfo = getStatDisplayInfo(pred.stat);
// Now displays "Rushing Yards", "Receiving Yards", etc.
```

2. **Smart Prediction Display:**
```javascript
let predictionDisplay;
if (pred.stat === 'anytime_td') {
    // For TD probability, show as percentage
    predictionDisplay = `${(pred.prediction * 100).toFixed(1)}%`;
} else {
    // For yards, show with 1 decimal
    predictionDisplay = `${pred.prediction.toFixed(1)} ${statInfo.unit}`;
}
```

**Examples:**
- QB Passing: "276.3 yards"
- RB Rushing: "89.5 yards"
- TD Probability: "45.2%"

3. **Updated Meta Badges:**
```javascript
<span class="meta-badge">${statInfo.label}</span>
// Displays "Passing Yards", "Rushing Yards", etc.
```

#### E. Updated `createLineCards()` Function
**Added stat type parameter:**
```javascript
function createLineCards(lines, mae, stat = 'passing_yards') {
    // ... existing code
    
    // Format line value based on stat type
    let lineDisplay;
    if (stat === 'anytime_td') {
        lineDisplay = details.line;  // Shows TD odds/probability
    } else {
        lineDisplay = details.line;  // Shows yardage line
    }
    // ...
}
```

**Purpose:**
- Allows different formatting for TD props vs yards props
- Extensible for future stat types
- Currently shows lines as-is but ready for custom formatting

#### F. Enhanced `updateSummary()` Function
**Smart Average Display:**
```javascript
// Format average prediction based on stat type
let avgDisplay;
if (summary.average_prediction !== undefined && summary.average_prediction !== null) {
    // Check if we're dealing with TD probability (values between 0-1)
    if (filteredPredictions.length > 0 && filteredPredictions[0].stat === 'anytime_td') {
        avgDisplay = `${(summary.average_prediction * 100).toFixed(1)}%`;
    } else {
        avgDisplay = summary.average_prediction.toFixed(1);
    }
} else {
    avgDisplay = '0';
}
```

**Examples:**
- QB Passing Average: "242.5"
- TD Probability Average: "32.7%"

## API Endpoint Structure

### Expected API Endpoints

```bash
# QB Passing Yards
GET /api/props/qb/passing-yards/week/{week}?season={season}&team={team}

# RB Rushing Yards
GET /api/props/rb/rushing-yards/week/{week}?season={season}&team={team}

# RB Receiving Yards
GET /api/props/rb/receiving-yards/week/{week}?season={season}&team={team}

# WR Receiving Yards
GET /api/props/wr/receiving-yards/week/{week}?season={season}&team={team}

# Anytime TD Scorer
GET /api/props/anytime-td/week/{week}?season={season}&team={team}
```

### Response Format
All endpoints expected to return:
```json
{
  "position": "RB",
  "stat": "rushing_yards",
  "week": 1,
  "season": 2025,
  "predictions": [
    {
      "player_id": "...",
      "player_name": "Christian McCaffrey",
      "position": "RB",
      "team": "SF",
      "opponent": "NYJ",
      "week": 1,
      "season": 2025,
      "stat": "rushing_yards",
      "prediction": 98.5,
      "confidence": "High",
      "model_mae": 12.3,
      "model_r2": 0.8956,
      "recommended_lines": {
        "79.5": {
          "line": 79.5,
          "recommendation": "Over",
          "edge": 19.0,
          "strength": 85
        }
      }
    }
  ],
  "summary": {
    "total_players": 40,
    "valid_predictions": 40,
    "average_prediction": 65.2,
    "high_confidence_count": 22
  }
}
```

## User Experience

### Position Selection Flow
1. User opens Player Props page
2. Selects position from dropdown (default: QB Passing Yards)
3. Optionally filters by week, season, team
4. Clicks "Apply Filters"
5. Page loads predictions for selected position/stat

### Visual Differences by Stat Type

#### Yards Props (QB/RB/WR)
```
Model Prediction
276.3 yards
MAE: 3.58 | R²: 0.988
```

#### TD Props
```
Model Prediction
45.2%
MAE: 0.08 | R²: 0.912
```

### Card Display Examples

**QB Passing Yards:**
- Meta badges: QB | KC | Passing Yards
- Prediction: 276.3 yards

**RB Rushing Yards:**
- Meta badges: RB | SF | Rushing Yards
- Prediction: 98.5 yards

**RB Receiving Yards:**
- Meta badges: RB | SF | Receiving Yards
- Prediction: 34.2 yards

**WR Receiving Yards:**
- Meta badges: WR | MIA | Receiving Yards
- Prediction: 87.6 yards

**Anytime TD:**
- Meta badges: RB | PHI | TD Probability
- Prediction: 52.3%

## Technical Details

### Stat Type Detection
```javascript
// In createPropCard()
if (pred.stat === 'anytime_td') {
    // Handle TD-specific display
} else {
    // Handle yards-based display
}
```

### Error Handling
```javascript
// In loadPredictions() switch statement
default:
    throw new Error('Invalid position selected');
```

Ensures invalid positions don't silently fail.

### Backward Compatibility
- All existing QB passing yards functionality preserved
- API response format remains unchanged
- Summary calculations work for all stat types
- Line recommendations display uniformly

## Data Flow

```
User selects position
    ↓
currentPosition state updated
    ↓
User clicks "Apply Filters"
    ↓
loadPredictions() called
    ↓
Switch statement determines API endpoint
    ↓
Fetch predictions from API
    ↓
createPropCard() formats each prediction
    ↓
getStatDisplayInfo() provides stat-specific labels
    ↓
Prediction value formatted (yards vs %)
    ↓
Cards rendered to page
    ↓
updateSummary() formats aggregate stats
```

## Testing Checklist

- [x] QB Passing Yards endpoint mapping
- [x] RB Rushing Yards endpoint mapping
- [x] RB Receiving Yards endpoint mapping
- [x] WR Receiving Yards endpoint mapping
- [x] Anytime TD endpoint mapping
- [x] Stat label display for all types
- [x] Prediction value formatting (yards)
- [x] Prediction value formatting (TD %)
- [x] Summary average formatting (yards)
- [x] Summary average formatting (TD %)
- [x] Line cards display for all types
- [x] Meta badges show correct stat type
- [ ] API connectivity with real backend data
- [ ] Cross-position filtering works correctly

## Future Enhancements

### Potential Features:
- [ ] TE Receiving Yards
- [ ] Multi-TD scorer (2+ TDs)
- [ ] Receptions props
- [ ] Attempts/Completions props
- [ ] Combo props (Passing + Rushing yards)
- [ ] Game-specific props (First TD scorer)
- [ ] Defensive props (Tackles, Sacks, INTs)
- [ ] Kicker props (Field Goals, Extra Points)

### Code Improvements:
- [ ] Add position-specific icons/emojis
- [ ] Color-code cards by position (QB=blue, RB=green, WR=red)
- [ ] Add tooltips explaining MAE and R² for each stat type
- [ ] Position-specific filtering improvements
- [ ] Save last selected position in localStorage
- [ ] Add position comparison view (compare QB vs RB props)

## Files Modified

1. **props.html**
   - Updated position dropdown with 5 options
   - Changed from 1 active + 4 commented to 5 active options

2. **props-script.js**
   - Added `getStatDisplayInfo()` helper function
   - Updated `currentPosition` default value
   - Expanded `loadPredictions()` with switch statement
   - Enhanced `createPropCard()` with stat-aware display
   - Updated `createLineCards()` signature
   - Improved `updateSummary()` with percentage handling

**Total lines changed:** ~80 lines added/modified

## Usage Instructions

### For Users:
1. Select desired position from dropdown
2. Choose week and season
3. Optionally filter by team
4. Click "Apply Filters"
5. View predictions with recommended lines
6. All positions work the same way

### For Developers:
**Adding New Positions:**
1. Add option to `props.html` position dropdown
2. Add case to `loadPredictions()` switch statement
3. Add stat mapping to `getStatDisplayInfo()` if needed
4. No other changes required (dynamic display)

**API Endpoint Pattern:**
```
/api/props/{position}/{stat-type}/week/{week}?season={season}&team={team}
```

## Browser Compatibility

All changes use standard JavaScript:
- ✅ Switch statements (widely supported)
- ✅ Template literals (ES6)
- ✅ Arrow functions (ES6)
- ✅ Object destructuring (ES6)

Expected to work on:
- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)
- Mobile browsers

## Notes

- TD probability predictions expected as decimal (0.452 = 45.2%)
- Yards predictions expected as numbers (276.3)
- All stat types use same confidence calculation
- Line recommendations format consistent across types
- Summary bar adapts to stat type automatically
