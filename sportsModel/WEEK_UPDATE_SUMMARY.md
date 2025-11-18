# Dynamic Week Selection Update - Summary

## Changes Made (November 18, 2025)

### Problem
The website was showing outdated weeks because it relied on a hardcoded season start date calculation that didn't account for which weeks actually have available data from the API.

### Solution
Implemented an intelligent week detection system that:
1. **Calculates the current week** based on the 2025 NFL season start (September 4, 2025)
2. **Queries the API** to check which weeks have actual game data available
3. **Automatically selects the most appropriate week** with available data
4. **Adds week information** to all bet data for better tracking

## Files Modified

### 1. `/sportsModel/ev-script.js`
- Added `availableWeeks` array to track weeks with data
- Made initialization async to allow API checks before loading
- Created `determineCurrentWeek()` function that:
  - Calculates expected week from current date
  - Checks weeks around that date for API data
  - Selects the first available week >= calculated week
  - Falls back to calculated week if no data found
- Added `week` field to transformed bet data
- Updated bet card display to show "Week X" alongside game time

### 2. `/sportsModel/script.js`
- Same improvements as ev-script.js
- Uses `/api/predict/week` endpoint to check for predictions

### 3. `/sportsModel/parlay-script.js`
- Same improvements as ev-script.js
- Uses `/api/parlays/week` endpoint to check for parlays

## How It Works

### Week Determination Logic
```javascript
1. Calculate week from date: (Nov 18, 2025 - Sept 4, 2025) / 7 days = Week 11
2. Check API for data in weeks: [11, 12, 10, 13]
3. Find weeks with data available
4. Select the earliest week >= calculated week
5. Display that week's predictions
```

### Data Enhancement
Each bet now includes:
```javascript
{
  week: 12,              // Current week number
  away_team: "Team A",
  home_team: "Team B",
  game_time: "Thu 8:15 PM",
  // ... other bet data
}
```

### Display Updates
Bet cards now show:
```
Away Team @ Home Team
Week 12 • Thu 8:15 PM
```

## Benefits

1. **Always Current**: Automatically shows the latest available week
2. **No Manual Updates**: No need to hardcode week numbers
3. **Data-Driven**: Uses actual API data to determine what to show
4. **Fallback Safe**: Still works even if API is unavailable
5. **Clear Display**: Users can see exactly which week they're viewing
6. **Future-Proof**: Works for the entire 2025 season (Weeks 1-18)

## Testing

To verify the changes:
1. Open any of the three pages (ev-bets.html, index.html, parlays.html)
2. Check browser console for week detection logs
3. Verify the week selector shows the correct week
4. Confirm bet cards display "Week X" in the time section

## Season Configuration

Current settings:
- **Season**: 2025
- **Season Start**: September 4, 2025
- **Weeks**: 1-18 (regular season)
- **API Base**: https://api.dozencrust.com/nfl

To update for next season, change:
```javascript
const CURRENT_SEASON = 2026;
// and update seasonStart in getCurrentWeek()
const seasonStart = new Date(2026, 8, 3); // 2026 season start date
```
