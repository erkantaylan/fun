import { DEFAULT_SETTINGS } from './config.js';

// ========== GAME SETTINGS (Lobby selections) ==========
export let gameSettings = { ...DEFAULT_SETTINGS };

/**
 * Update a game setting
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 */
export function updateSetting(key, value) {
    gameSettings[key] = value;
}

/**
 * Reset settings to defaults
 */
export function resetSettings() {
    gameSettings = { ...DEFAULT_SETTINGS };
}

// ========== GAME STATE ==========
export let gameState = {
    roomCode: null,
    playerId: null,       // 1 or 2
    myCards: [],
    playedCards: [],
    nextExpected: 1,
    mistakesMade: 0,
    mistakesRemaining: 0,
    timerInterval: null,
    gameRef: null,
    isHost: false,
    settings: null,
    lastPlayTime: 0,
    canPlay: true
};

/**
 * Update game state properties
 * @param {object} updates - Properties to update
 */
export function updateGameState(updates) {
    Object.assign(gameState, updates);
}

/**
 * Reset game state for new game
 */
export function resetGameState() {
    gameState = {
        roomCode: null,
        playerId: null,
        myCards: [],
        playedCards: [],
        nextExpected: 1,
        mistakesMade: 0,
        mistakesRemaining: 0,
        timerInterval: null,
        gameRef: null,
        isHost: false,
        settings: null,
        lastPlayTime: 0,
        canPlay: true
    };
}

/**
 * Clear timer interval if running
 */
export function clearTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}
