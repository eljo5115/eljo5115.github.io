# Bet Calculator - Game Grouping & Spread Display Update

**Date**: December 21, 2025

## Changes Implemented

### 1. **Correct Spread Display**
Fixed the spread display to accurately reflect team perspectives:

- **Away Team**: Spread shown as-is from API (e.g., "DAL -3")
- **Home Team**: Spread sign is flipped (e.g., if away is -3, home shows "+3")

**Logic**:
- Spread line from API is always from the **away team perspective**
- When betting on the away team, use the spread as-is
- When betting on the home team, flip the sign of the spread

**Example**:
```
Matchup: DAL @ NYG
Spread Line: -3 (DAL is 3-point favorite)

If betting DAL: "DAL -3"
If betting NYG: "NYG +3"
```

### 2. **Game-Based Grouping**
Restructured bet display to group bets by game:

**Old Layout**: Individual bet cards stacked vertically
**New Layout**: Game cards with multiple bets per game

**Benefits**:
- Easier to see all bets for a single game
- Total bet amount shown per game
- Cleaner, more organized interface
- Shows spread AND total bets together for same game

### 3. **Enhanced Pick Display**
Updated `formatPickDisplay()` function to handle:
- **Spread bets**: Team name + correct spread based on home/away
- **Total bets**: Over/Under + total line value

### 4. **New UI Components**

#### Game Card Structure:
```
┌─────────────────────────────────────────┐
│ Game Header                              │
│ • Matchup (Away @ Home)                  │
│ • Week & Time                            │
│ • Total Bet Amount                       │
├─────────────────────────────────────────┤
│ Bet Row 1 (e.g., Spread)                │
│ • Type Badge | Pick | Stats | Amount    │
├─────────────────────────────────────────┤
│ Bet Row 2 (e.g., Total)                 │
│ • Type Badge | Pick | Stats | Amount    │
└─────────────────────────────────────────┘
```

#### Bet Row Layout (3-column grid):
1. **Pick Column**: Bet type badge + team/pick text
2. **Stats Column**: EV%, Win%, Kelly%
3. **Amount Column**: Bet amount + expected return

### 5. **Responsive Design**
Mobile-friendly layout:
- Stacks columns vertically on small screens
- Adjusts game card header layout
- Maintains readability on all devices

## Files Modified

### JavaScript (`bet-calculator-script.js`)
- **`formatPickDisplay()`**: Enhanced to handle spread sign flipping and total display
- **`displayBets()`**: Rewritten to group bets by matchup
- **`createGameCard()`**: New function to create game group cards
- **`createBetRow()`**: New function to create individual bet rows within games

### CSS (`bet-calculator-style.css`)
- **`.game-card`**: Container for grouped game bets
- **`.game-card-header`**: Matchup info and total amount
- **`.bet-row`**: Individual bet within a game (3-column grid)
- **`.bet-type-badge`**: Colored badge for bet type (Spread/Total)
- **Responsive styles**: Mobile breakpoints for all new components

## Testing Checklist

- [x] Spread sign correctly flips for home vs away teams
- [x] Multiple bets for same game are grouped together
- [x] Total bet amount per game displays correctly
- [x] Individual bet stats (EV%, Win%, Kelly%) show properly
- [x] Responsive layout works on mobile
- [x] Export functions (CSV, Copy, Print) still work
- [x] Normalization toggle still functions correctly

## Example Output

```
1. DAL @ NYG
   Week 16 • Sun 1:00 PM                    $125.50 Total Bet
   
   [Spread]  DAL -3              EV: +4.2%  Win%: 58%  Kelly: 2.1%    $62.75
   [Total]   Over 47.5           EV: +3.8%  Win%: 56%  Kelly: 1.9%    $62.75

2. PHI @ WSH  
   Week 16 • Sun 4:25 PM                    $89.25 Total Bet
   
   [Spread]  PHI -6.5            EV: +5.1%  Win%: 62%  Kelly: 2.8%    $89.25
```

## Browser Compatibility

- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)  
- ✅ Safari (Latest)
- ✅ Mobile browsers

## Future Enhancements

Potential improvements:
- Add game sorting options (by EV, by total bet amount, by time)
- Collapsible game cards
- Color-coding by confidence level
- Add team logos
- Filter by bet type (spread only, totals only)
