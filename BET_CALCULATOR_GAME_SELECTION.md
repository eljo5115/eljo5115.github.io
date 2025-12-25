# Bet Calculator - Game Selection Feature

**Date**: December 24, 2025

## Overview
Added manual game selection functionality to the bet calculator page. Users can now:
- Select/deselect individual games using checkboxes
- Select all games on a date with one click
- Deselect all games with one click
- Only calculate bets for selected games

## Changes Made

### 1. HTML Updates (`bet-calculator.html`)

#### Added Selection Controls
```html
<div class="bet-slip-header">
    <h2>📋 Your Betting Slip - Week <span id="currentWeekDisplay">--</span></h2>
    <div class="game-selection-controls">
        <button id="selectAllGames" class="btn btn-secondary btn-sm">✓ Select All</button>
        <button id="deselectAllGames" class="btn btn-secondary btn-sm">✗ Deselect All</button>
    </div>
</div>
```

**What Changed:**
- Wrapped the heading and added a new control bar
- Added "Select All" and "Deselect All" buttons

### 2. JavaScript Updates (`bet-calculator-script.js`)

#### A. Added State Tracking
```javascript
let selectedGames = new Set(); // Track which games are selected for betting
```

**Purpose:** Maintains which games are currently selected by the user.

#### B. Modified `createGameCard()` Function
**Key Changes:**
1. Added checkbox to each game card header
2. Auto-selects games by default (checked state)
3. Stores game matchup as unique identifier
4. Adds event listener for checkbox changes
5. Applies visual styling when deselected

```javascript
// Check if this game is selected (default to true for new games)
const isSelected = selectedGames.has(game.matchup);

// Checkbox HTML in card header
<input type="checkbox" 
       class="game-checkbox" 
       id="game-${gameNumber}" 
       data-game-id="${game.matchup}"
       ${isSelected ? 'checked' : ''}>

// Event listener for selection changes
checkbox.addEventListener('change', (e) => {
    const gameId = e.target.dataset.gameId;
    if (e.target.checked) {
        selectedGames.add(gameId);
        card.classList.remove('game-deselected');
    } else {
        selectedGames.delete(gameId);
        card.classList.add('game-deselected');
    }
    calculateAndDisplayBets();
});
```

#### C. Modified `displayBets()` Function
**Key Change:** Auto-select new games when loaded
```javascript
if (!gameGroups[matchup]) {
    gameGroups[matchup] = {
        matchup: matchup,
        // ... other properties
    };
    // Auto-select new games
    selectedGames.add(matchup);
}
```

#### D. Updated `calculateAndDisplayBets()` Function
**Major Changes:**
1. Filters bets to only include selected games
2. Shows "No Games Selected" message when nothing is selected
3. Updates summary to show $0 values when no games selected

```javascript
// Filter bets by selected games
const selectedBets = allBets.filter(bet => {
    const matchup = `${bet.away_team} @ ${bet.home_team}`;
    return selectedGames.has(matchup);
});

// If no games are selected, show a message
if (selectedBets.length === 0) {
    document.getElementById('betSlipContainer').innerHTML = `
        <div class="no-selection-message">
            <div class="no-selection-icon">⬜</div>
            <h3>No Games Selected</h3>
            <p>Select one or more games above to calculate bet amounts.</p>
        </div>
    `;
    // ... reset summary values
    return;
}
```

#### E. Added Button Event Listeners
```javascript
// Select All button
document.getElementById('selectAllGames').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.game-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        const gameId = checkbox.dataset.gameId;
        selectedGames.add(gameId);
        const gameCard = checkbox.closest('.game-card');
        if (gameCard) {
            gameCard.classList.remove('game-deselected');
        }
    });
    calculateAndDisplayBets();
});

// Deselect All button
document.getElementById('deselectAllGames').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.game-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        const gameId = checkbox.dataset.gameId;
        selectedGames.delete(gameId);
        const gameCard = checkbox.closest('.game-card');
        if (gameCard) {
            gameCard.classList.add('game-deselected');
        }
    });
    calculateAndDisplayBets();
});
```

### 3. CSS Updates (`bet-calculator-style.css`)

#### A. Header Layout
```css
.bet-slip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.game-selection-controls {
    display: flex;
    gap: 0.75rem;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}
```

#### B. Checkbox Styling
```css
.game-checkbox-container {
    display: flex;
    align-items: flex-start;
    padding-top: 0.25rem;
}

.game-checkbox {
    appearance: none;
    width: 22px;
    height: 22px;
    border: 2px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    cursor: pointer;
    transition: all 0.2s ease;
}

.game-checkbox:checked {
    background: var(--accent-color);
    border-color: var(--accent-color);
}

.game-checkbox:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 16px;
    font-weight: bold;
}
```

#### C. Deselected Game State
```css
.game-card.game-deselected {
    opacity: 0.5;
    background: var(--surface);
    border-color: #2a2a3a;
}

.game-card.game-deselected:hover {
    opacity: 0.7;
    border-color: var(--border);
}
```

#### D. No Selection Message
```css
.no-selection-message {
    text-align: center;
    padding: 4rem 2rem;
}

.no-selection-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}
```

#### E. Responsive Design
```css
@media (max-width: 768px) {
    .bet-slip-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .game-selection-controls {
        width: 100%;
        justify-content: space-between;
    }
    
    .btn-sm {
        flex: 1;
    }
}
```

## User Experience Flow

### Default Behavior
1. When games load, all are **automatically selected**
2. Bet calculations include all games
3. Summary shows total across all games

### Manual Selection
1. User clicks checkbox on any game card to **deselect**
2. Game card becomes semi-transparent (50% opacity)
3. Bet calculations update immediately
4. Summary updates to reflect only selected games

### Select/Deselect All
1. **Select All**: Checks all checkboxes, removes deselected styling, recalculates
2. **Deselect All**: Unchecks all checkboxes, shows "No Games Selected" message, resets summary

### No Selection State
When no games are selected:
- Displays empty state message with icon
- Summary shows $0 values
- Export buttons hidden
- Clear call-to-action to select games

## Visual Indicators

### Selected Game
- ✅ Checked checkbox (orange background with white checkmark)
- Full opacity
- Normal border color
- Clickable and interactive

### Deselected Game
- ⬜ Unchecked checkbox (empty with border)
- 50% opacity (dimmed)
- Darker border
- Still clickable to re-select

### Checkbox States
- **Hover**: Border changes to accent color
- **Focus**: Blue glow/outline for accessibility
- **Checked**: Orange background with white checkmark
- **Unchecked**: Dark background with border

## Technical Details

### Game Identification
- Uses matchup string as unique ID: `"AWAY @ HOME"` (e.g., "KC @ TEN")
- Stored in `selectedGames` Set for O(1) lookup
- Persists across re-calculations but not across page refreshes

### Performance Considerations
- Uses Set data structure for efficient lookups
- Event listeners added with `setTimeout(0)` to avoid blocking
- Checkbox changes trigger single recalculation
- No unnecessary re-renders

### Data Flow
```
User clicks checkbox
    ↓
Update selectedGames Set
    ↓
Apply/remove visual styling
    ↓
Call calculateAndDisplayBets()
    ↓
Filter allBets by selectedGames
    ↓
Calculate Kelly/normalization for selected bets only
    ↓
Update display and summary
```

## Edge Cases Handled

✅ **No games selected**: Shows helpful message, resets summary
✅ **All games deselected then re-selected**: Calculations correct
✅ **Week changes**: Selected games reset, new games auto-selected
✅ **Normalization with partial selection**: Only normalizes selected games
✅ **Mobile responsive**: Buttons stack vertically, take full width

## Future Enhancements

### Potential Features:
- [ ] Remember selections in localStorage (persist across refreshes)
- [ ] "Select by confidence" (auto-select high confidence bets)
- [ ] "Select by EV threshold" (select bets above X% EV)
- [ ] Keyboard shortcuts (Ctrl+A for select all, Ctrl+D for deselect)
- [ ] Visual indicator in summary showing X of Y games selected
- [ ] Undo/redo for selection changes
- [ ] Save selection presets

### Code Improvements:
- [ ] Extract selection logic into separate module
- [ ] Add unit tests for selection state management
- [ ] Optimize event listener attachment for large game lists
- [ ] Add transition animations for checkbox state changes

## Testing Checklist

- [x] Checkbox toggles selection state
- [x] Select All checks all checkboxes
- [x] Deselect All unchecks all checkboxes
- [x] Visual styling updates on selection change
- [x] Bet calculations filter by selected games
- [x] Summary updates correctly
- [x] No selection shows empty state
- [x] Responsive layout on mobile
- [x] Accessibility (keyboard navigation, focus states)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance with 15+ games

## Browser Compatibility

Expected to work on:
- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

Uses standard web APIs:
- `Set` data structure (ES6)
- `querySelectorAll` / `closest` (widely supported)
- CSS `appearance: none` for checkbox styling
- CSS custom checkmark with `::after` pseudo-element

## Files Modified

1. **bet-calculator.html** - Added selection controls header
2. **bet-calculator-script.js** - Added selection logic and filtering
3. **bet-calculator-style.css** - Added checkbox and selection styling

Total lines changed: ~150 lines added/modified

## Usage Instructions

### For Users:
1. Games are selected by default when loaded
2. Click the checkbox next to any game to deselect it
3. Use "Select All" to quickly select all games
4. Use "Deselect All" to start fresh with no selections
5. Only selected games will be included in bet calculations

### For Developers:
- Selection state is managed in `selectedGames` Set
- Game IDs use matchup format: `"AWAY @ HOME"`
- Checkbox changes trigger `calculateAndDisplayBets()`
- Visual state managed with `.game-deselected` class
