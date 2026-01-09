// ========== DOM ELEMENTS ==========
// Cached references to DOM elements for performance

export const elements = {
    // Lobby
    createRoomBtn: null,
    joinRoomBtn: null,
    roomCodeInput: null,
    roomInfo: null,
    roomCodeDisplay: null,
    roomSettingsText: null,
    mistakeOptions: null,
    timerOptions: null,

    // Game
    playerHand: null,
    pile: null,
    timerText: null,
    timerProgress: null,
    timerContainer: null,
    nextCardNeeded: null,
    cardsPlayedCount: null,
    playerBadge: null,
    partnerStatus: null,
    lastPlayedInfo: null,
    lastPlayerName: null,
    lastCardValue: null,
    mistakesDisplay: null,
    mistakesValue: null,

    // Result
    playAgainBtn: null,
    resultIcon: null,
    resultTitle: null,
    resultMessage: null,
    statCardsPlayed: null,
    statMistakeCard: null
};

// Screen references
export const screens = {
    lobby: null,
    game: null,
    result: null
};

/**
 * Initialize all DOM element references
 * Must be called after DOM is loaded
 */
export function initElements() {
    // Screens
    screens.lobby = document.getElementById('lobby');
    screens.game = document.getElementById('game');
    screens.result = document.getElementById('result');

    // Lobby
    elements.createRoomBtn = document.getElementById('createRoomBtn');
    elements.joinRoomBtn = document.getElementById('joinRoomBtn');
    elements.roomCodeInput = document.getElementById('roomCodeInput');
    elements.roomInfo = document.getElementById('roomInfo');
    elements.roomCodeDisplay = document.getElementById('roomCodeDisplay');
    elements.roomSettingsText = document.getElementById('roomSettingsText');
    elements.mistakeOptions = document.getElementById('mistakeOptions');
    elements.timerOptions = document.getElementById('timerOptions');

    // Game
    elements.playerHand = document.getElementById('playerHand');
    elements.pile = document.getElementById('pile');
    elements.timerText = document.getElementById('timerText');
    elements.timerProgress = document.getElementById('timerProgress');
    elements.timerContainer = document.getElementById('timerContainer');
    elements.nextCardNeeded = document.getElementById('nextCardNeeded');
    elements.cardsPlayedCount = document.getElementById('cardsPlayedCount');
    elements.playerBadge = document.getElementById('playerBadge');
    elements.partnerStatus = document.getElementById('partnerStatus');
    elements.lastPlayedInfo = document.getElementById('lastPlayedInfo');
    elements.lastPlayerName = document.getElementById('lastPlayerName');
    elements.lastCardValue = document.getElementById('lastCardValue');
    elements.mistakesDisplay = document.getElementById('mistakesDisplay');
    elements.mistakesValue = document.getElementById('mistakesValue');

    // Result
    elements.playAgainBtn = document.getElementById('playAgainBtn');
    elements.resultIcon = document.getElementById('resultIcon');
    elements.resultTitle = document.getElementById('resultTitle');
    elements.resultMessage = document.getElementById('resultMessage');
    elements.statCardsPlayed = document.getElementById('statCardsPlayed');
    elements.statMistakeCard = document.getElementById('statMistakeCard');
}

/**
 * Show a specific screen and hide others
 * @param {string} screenName - 'lobby', 'game', or 'result'
 */
export function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}
