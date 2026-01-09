# Mind Sync - Task List

## 🐛 Bugs

| ID | Status | Title | Priority |
|----|--------|-------|----------|
| BUG-001 | 🔴 Open | Card validation not working correctly | High |
| BUG-002 | 🟢 Fixed | Cooldown never unlocking after 3 seconds | High |
| BUG-003 | 🟢 Fixed | Duplicate cards dealt to both players | High |
| BUG-004 | 🟢 Fixed | Timer triggers after game ends | Medium |
| BUG-005 | 🟢 Fixed | Can play cards after game is over | Medium |

## 🔧 Refactoring Tasks

| ID | Status | Title | Priority |
|----|--------|-------|----------|
| REF-001 | 🟢 Done | Split monolithic HTML into separate files | High |
| REF-002 | 🟢 Done | Create proper module structure | High |
| REF-003 | 🟢 Done | Separate game logic from UI code | Medium |
| REF-004 | 🟢 Done | Create constants/config file | Low |

## ✨ Features

| ID | Status | Title | Priority |
|----|--------|-------|----------|
| FEAT-001 | 🟢 Done | Turkish language support (primary) | High |
| FEAT-002 | 🟢 Done | Language switcher (TR/EN) | High |
| FEAT-003 | 🟢 Done | Difficulty levels (Easy/Normal/Hard/Extreme) | High |
| FEAT-004 | 🟢 Done | 3-second cooldown after playing | Medium |
| FEAT-005 | 🟢 Done | Stay in same room on "Play Again" | Medium |
| FEAT-006 | 🟢 Done | Configurable mistakes and timer | High |

---

## Legend
- 🔴 Open - Not started
- 🟡 In Progress - Currently working on
- 🟢 Fixed/Done - Completed
- ⚪ Pending - Waiting to start

---

## File Structure (After Refactoring)

```
games/mind-sync/
├── index.html          # Main HTML structure only
├── style.css           # All styles
├── js/
│   ├── app.js          # Main app initialization
│   ├── config.js       # Firebase config, constants
│   ├── i18n.js         # Language/translation system
│   ├── game.js         # Core game logic
│   ├── ui.js           # UI updates and rendering
│   └── firebase.js     # Firebase operations
├── tasks.md            # This file (issue list)
├── tasks/              # Detailed task descriptions
│   ├── BUG-001.md
│   ├── REF-001.md
│   └── ...
└── TASK.md             # Original planning document
```
