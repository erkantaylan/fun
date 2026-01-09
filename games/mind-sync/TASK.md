# Mind Sync - 2 Player Cooperative Card Game

## 📋 Project Overview

A real-time 2-player **cooperative** card game inspired by "The Mind". Players must work together **without communication** to play all 10 cards in ascending order. The challenge is silent coordination!

---

## 🎯 Game Rules (As Understood)

### Setup
- **Players**: Exactly 2 players (cooperative, NOT competitive)
- **Cards**: 10 cards total (numbered 1-10)
- **Distribution**: 5 cards randomly dealt to each player
- **Platform**: Different browsers/tabs (not same screen)
- **Communication**: NOT ALLOWED - players must "feel" when to play

### Gameplay
1. Both players see ONLY their own 5 cards
2. A "pile" area in the center starts empty
3. Players must play cards in **ascending order** (1, 2, 3, 4... up to 10)
4. **NO TURNS** - either player can play anytime
5. **THE CATCH**: Players don't know each other's cards!
   - If you have card 3 but the other player has 2, you must WAIT
   - You need to "sense" if the other player has a lower card
6. A player with consecutive lowest cards (e.g., 1-2-3) can play them in sequence
7. **Timer**: Countdown starts after each move (inactivity timer)
   - Adds pressure to make a decision

### Mistake = Game Over
- If a player plays a card when the OTHER player has a lower card → **FAIL**
- Example: Current pile shows "4", you play "7", but opponent has "5" → **MISTAKE!**

### Win Condition
- **WIN**: Both players successfully play all 10 cards (1→10) without mistakes
- **LOSE**: A card is played out of order (someone had a lower card)

---

## 🏗️ Technical Requirements

### Hosting
- **Platform**: GitHub Pages (static hosting only)
- **No Backend**: Cannot run server-side code

### Real-Time Synchronization Challenge
Since GitHub Pages is static, we need a way to sync game state between two browsers.

---

## 🔧 Possible Solutions

### Option 1: Firebase Realtime Database ⭐ RECOMMENDED
**Pros:**
- Easy to implement
- Real-time sync built-in
- Free tier is generous
- Works perfectly with GitHub Pages

**Cons:**
- Requires Firebase account setup
- External dependency

**Implementation:**
```javascript
// Example structure
const gameRef = firebase.database().ref('games/' + gameId);
gameRef.on('value', (snapshot) => {
  updateGameState(snapshot.val());
});
```

### Option 2: WebRTC (Peer-to-Peer)
**Pros:**
- No external services needed after connection
- Direct browser-to-browser communication
- Free

**Cons:**
- Complex to implement
- Needs a signaling server for initial connection
- NAT traversal issues possible

**Implementation:**
- Use PeerJS library (simplifies WebRTC)
- One player creates room, shares code
- Other player joins with code

### Option 3: Shared URL + Polling (Hacky)
**Pros:**
- Works on pure static hosting
- No external services

**Cons:**
- Not real-time (polling delay)
- Terrible user experience
- Race conditions

**NOT RECOMMENDED**

### Option 4: BroadcastChannel API
**Pros:**
- Simple API
- No external services

**Cons:**
- Only works in SAME browser
- Doesn't meet the "different browsers" requirement

**NOT SUITABLE**

---

## 📊 Recommendation

**Use Firebase Realtime Database** because:
1. User mentioned they can arrange Firebase
2. Easiest to implement
3. True real-time sync
4. Perfect for this use case
5. Free tier handles this easily

---

## 📅 Development Schedule

### Phase 1: Setup & UI (Day 1)
- [ ] Create folder structure
- [ ] Design game UI (HTML/CSS)
- [ ] Card component styling
- [ ] Responsive layout for mobile

### Phase 2: Game Logic (Day 1-2)
- [ ] Card deck generation (1-10)
- [ ] Random shuffle algorithm
- [ ] Card distribution logic
- [ ] Valid move detection
- [ ] Timer implementation

### Phase 3: Firebase Integration (Day 2)
- [ ] Firebase project setup
- [ ] Game room creation
- [ ] Player joining mechanism
- [ ] Real-time state sync
- [ ] Move validation on sync

### Phase 4: Polish & Testing (Day 3)
- [ ] Win/lose detection
- [ ] Sound effects (optional)
- [ ] Animations
- [ ] Error handling
- [ ] Cross-browser testing

---

## 📁 File Structure

```
games/
└── mind-sync/
    ├── TASK.md           # This file
    ├── index.html        # Main game page
    ├── style.css         # Game styling
    ├── game.js           # Core game logic
    ├── firebase-config.js # Firebase configuration (user to fill)
    └── README.md         # How to play & setup instructions
```

---

## ⚙️ Firebase Setup Required

User needs to:
1. Create Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Set database rules to allow read/write (for testing):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Copy Firebase config to `firebase-config.js`

---

## 🎮 Game Flow

```
┌─────────────────────────────────────────────────────────┐
│                      START                               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Player 1: Creates Room → Gets Room Code (e.g., "ABC123")│
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Player 2: Enters Room Code → Joins Room                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  System: Shuffles cards, deals 5 to each player          │
│  Players can ONLY see their own cards!                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  GAME STARTS: Pile is empty, waiting for card "1"        │
│  Inactivity timer starts (pressure to decide)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  GAMEPLAY LOOP:                                          │
│  - Either player clicks a card to play it                │
│  - System checks: Is this the LOWEST unplayed card?      │
│    ├── YES → Card goes to pile, timer resets, continue   │
│    └── NO  → MISTAKE! Other player had lower card → LOSE │
│  - No communication allowed - pure intuition!            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  GAME ENDS:                                              │
│  🏆 WIN: All 10 cards played in order (1→10)             │
│  💀 LOSE: Wrong card played (someone had lower)          │
│  ⏰ TIMEOUT: Timer expires (optional - game over)        │
└─────────────────────────────────────────────────────────┘
```

---

## ❓ Questions for User

1. **Timer Duration**: How long should the inactivity timer be? (Suggested: 10-15 seconds)
2. **Firebase**: Should I proceed with Firebase implementation, or do you prefer WebRTC?
3. **Timer Consequence**: What happens when timer expires?
   - Option A: Game Over (lose)
   - Option B: Force the player with lowest visible card to play
4. **Card Design**: Any specific visual style preference? (Modern, Classic, Minimalist)
5. **Mobile Support**: Should this work on mobile browsers too?

---

## 🚀 Ready to Implement

Once Firebase config is provided, I can implement the full game. The game will:
- Generate a shareable room code
- Sync game state in real-time
- Each player sees ONLY their own cards
- Detect mistakes (playing when partner has lower card)
- Show timer and pile status
- Celebrate WIN or show FAIL state

---

*Created: 2026-01-09*
*Status: Planning*
