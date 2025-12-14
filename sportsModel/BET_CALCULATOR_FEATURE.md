# Bet Sizing Calculator Page - Summary

## New Feature Added (December 14, 2025)

### Overview
Created a comprehensive **Bet Sizing Calculator** page that allows users to input their bankroll and see exact dollar amounts to bet on each +EV opportunity for the entire NFL week.

## Files Created

### 1. `/sportsModel/bet-calculator.html`
Main HTML page with:
- Bankroll input section
- Kelly method selector (Full/Half/Quarter Kelly)
- Week selector
- Betting slip display
- Export options
- Instructions section

### 2. `/sportsModel/bet-calculator-style.css`
Complete styling for:
- Bankroll card with input fields
- Bet slip items with prominent bet amounts
- Summary statistics
- Export section
- Instruction cards
- Responsive design

### 3. `/sportsModel/bet-calculator-script.js`
Full JavaScript functionality:
- API integration for +EV bets
- Kelly Criterion calculations
- Bankroll management
- Export to CSV
- Print functionality
- Copy to clipboard

## Key Features

### 💰 Bankroll Management
- **Input Your Bankroll**: Enter total betting bankroll
- **Choose Kelly Method**:
  - **Half Kelly** (Recommended) - Safer, reduces variance
  - **Full Kelly** (Aggressive) - Maximum growth potential
  - **Quarter Kelly** (Conservative) - Most conservative approach
- **Real-time Summary**: Shows total to wager, number of bets, expected return

### 📊 Bet Slip Display
Each bet shows:
- **Matchup**: Away Team @ Home Team
- **Pick**: Specific bet recommendation
- **Bet Amount**: Exact dollar amount to wager (in large green display)
- **Percentage**: Percentage of bankroll
- **Expected Value**: +EV percentage
- **Confidence**: Win probability
- **Expected Return**: Projected profit from the bet

### 🎯 Smart Week Selection
- Automatically detects current NFL week
- Shows upcoming games by default
- Easy navigation between weeks

### 📤 Export Options
1. **CSV Export**: Download betting slip as spreadsheet
2. **Print Slip**: Print-friendly format
3. **Copy to Clipboard**: Quick copy for messaging apps

### 📚 User Instructions
Built-in guide explaining:
1. How to enter bankroll
2. Choosing Kelly method
3. Reviewing bets
4. Exporting data

## Example Usage

### Input:
```
Bankroll: $1,000
Method: Half Kelly
Week: 15
```

### Output Display:
```
═══════════════════════════════════════════════
SUMMARY
Total Bankroll: $1,000
Total to Wager: $47.50
Number of Bets: 5
Expected Return: $8.25
═══════════════════════════════════════════════

BET 1: Chiefs @ Bills
Pick: Chiefs +3.5
Bet Amount: $12.50 (1.25% of bankroll)
EV: +15.2% | Confidence: 65%
Expected Return: $1.90

BET 2: Eagles @ Cowboys
Pick: Under 48.5
Bet Amount: $10.00 (1.00% of bankroll)
EV: +12.8% | Confidence: 62%
Expected Return: $1.28

[... etc for all bets]
```

## Navigation Integration

Updated all navigation menus to include the new page:
- ✅ index.html
- ✅ ev-bets.html
- ✅ parlays.html
- ✅ bet-calculator.html (new)

## Technical Details

### Kelly Criterion Implementation
```javascript
// Base Kelly Criterion
kellyPct = (EV / 100) * (WinProb / 100)

// Applied multipliers
- Full Kelly: kellyPct × 1.0
- Half Kelly: kellyPct × 0.5
- Quarter Kelly: kellyPct × 0.25

// Calculate bet amount
betAmount = bankroll × (kellyPct / 100)
```

### API Integration
- Uses same API endpoint as +EV Bets page
- Fetches all positive EV bets for selected week
- Sorts by highest EV first
- Real-time calculations

### Data Flow
1. User inputs bankroll
2. Page loads +EV bets from API
3. JavaScript calculates bet amounts based on Kelly method
4. Displays all bets with dollar amounts
5. User can export/print/copy results

## Benefits

### For Users:
- ✅ **No Manual Calculations**: Automatic bet sizing
- ✅ **Complete Week View**: See all bets at once
- ✅ **Bankroll Management**: Built-in Kelly Criterion
- ✅ **Easy Export**: Take betting slip to sportsbook
- ✅ **Risk Control**: Choose conservative/aggressive approach

### For the Platform:
- ✅ **Professional Tool**: Serious bettor feature
- ✅ **User Engagement**: Practical utility
- ✅ **Education**: Teaches proper bankroll management
- ✅ **Differentiation**: Unique from other betting sites

## Responsive Design
- Mobile-friendly layout
- Touch-friendly controls
- Adapts to all screen sizes
- Print-optimized styles

## Future Enhancements (Potential)
- Save bankroll preferences
- Track betting history
- ROI calculator
- Multi-week planning
- Bankroll growth projection
- Risk assessment graphs

## Access
Navigate to: `sportsModel/bet-calculator.html`

Or click "Bet Calculator" in the navigation menu on any page!
