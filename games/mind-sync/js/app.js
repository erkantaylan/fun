import { firebaseConfig, PLAY_COOLDOWN } from './config.js';
import { gameState, gameSettings, updateGameState, updateSetting, clearTimer } from './state.js';
import { elements, screens, initElements, showScreen } from './elements.js';
import { t, setupLanguageHandlers } from './i18n.js';
import { generateRoomCode, shuffleAndDeal } from './game.js';
import {
    initFirebase,
    createRoom as fbCreateRoom,
    joinRoom as fbJoinRoom,
    listenToRoom,
    playCard as fbPlayCard,
    restartGame,
    getRoomData,
    ref, get, update
} from './firebase-ops.js';
import {
    renderHand,
    attachCardClickHandlers,
    updateGameUI,
    updateMistakesDisplay,
    showResult,
    startTimer,
    resetUI,
    setTimerUpdateFn
} from './ui.js';

// ========== INITIALIZE ==========
export async function init(firebaseFunctions) {
    // Initialize Firebase
    initFirebase(firebaseFunctions);

    // Initialize DOM elements
    initElements();

    // Setup language handlers
    setupLanguageHandlers();

    // Setup settings handlers
    setupSettingsHandlers();

    // Setup event listeners
    setupEventListeners();

    // Setup timer timeout handler
    setTimerUpdateFn(handleTimeout);

    console.log('[Mind Sync] Initialized');
}

// ========== SETTINGS HANDLERS ==========
function setupSettingsHandlers() {
    // Difficulty options
    const difficultyOptions = document.getElementById('difficultyOptions');
    difficultyOptions.querySelectorAll('.setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyOptions.querySelectorAll('.setting-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSetting('difficulty', btn.dataset.value);
            updateSetting('totalCards', parseInt(btn.dataset.cards));
            updateSetting('cardsPerPlayer', parseInt(btn.dataset.hand));
        });
    });

    // Mistake options
    elements.mistakeOptions.querySelectorAll('.setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.mistakeOptions.querySelectorAll('.setting-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSetting('mistakesAllowed', parseInt(btn.dataset.value));
        });
    });

    // Timer options
    elements.timerOptions.querySelectorAll('.setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.timerOptions.querySelectorAll('.setting-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSetting('timerDuration', parseInt(btn.dataset.value));
        });
    });
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    elements.createRoomBtn.addEventListener('click', handleCreateRoom);
    elements.joinRoomBtn.addEventListener('click', handleJoinRoom);
    elements.playAgainBtn.addEventListener('click', handlePlayAgain);

    // Allow Enter key to join room
    elements.roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleJoinRoom();
    });

    // Auto-uppercase room code input
    elements.roomCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

// ========== CREATE ROOM HANDLER ==========
async function handleCreateRoom() {
    try {
        const roomCode = generateRoomCode();
        await fbCreateRoom(roomCode);

        // Show room code and settings
        elements.roomCodeDisplay.textContent = roomCode;
        const difficultyNames = {
            easy: t('Kolay', 'Easy'),
            normal: t('Normal', 'Normal'),
            hard: t('Zor', 'Hard'),
            extreme: t('Ekstrem', 'Extreme')
        };
        const mistakesText = gameSettings.mistakesAllowed === 0
            ? t('∞ Sınırsız', '∞ Infinite')
            : gameSettings.mistakesAllowed;
        const timerText = gameSettings.timerDuration === 0
            ? t('Kapalı', 'Off')
            : `${gameSettings.timerDuration}s`;
        elements.roomSettingsText.textContent = `${difficultyNames[gameSettings.difficulty]} | ${t('Hata', 'Mistakes')}: ${mistakesText} | ${t('Süre', 'Timer')}: ${timerText}`;
        elements.roomInfo.classList.remove('hidden');
        elements.createRoomBtn.disabled = true;

        // Start listening for room updates
        listenToRoom(handleRoomUpdate);
    } catch (error) {
        console.error('Error creating room:', error);
        alert(t('Oda oluşturulamadı. Firebase ayarlarını kontrol edin.', 'Failed to create room. Check your Firebase config.'));
    }
}

// ========== JOIN ROOM HANDLER ==========
async function handleJoinRoom() {
    const roomCode = elements.roomCodeInput.value.toUpperCase().trim();

    if (roomCode.length !== 6) {
        alert(t('Lütfen 6 karakterli oda kodu girin', 'Please enter a 6-character room code'));
        return;
    }

    // Check if trying to join own room
    if (gameState.roomCode === roomCode) {
        alert(t('Kendi odana katılamazsın! Başka bir tarayıcı veya sekme kullan.',
            'You cannot join your own room! Use a different browser or tab.'));
        return;
    }

    try {
        const result = await fbJoinRoom(roomCode);

        if (result.error === 'not_found') {
            alert(t('Oda bulunamadı!', 'Room not found!'));
            return;
        }

        if (result.error === 'in_progress') {
            alert(t('Oyun zaten başlamış!', 'Game already in progress!'));
            return;
        }

        // Start listening for room updates
        listenToRoom(handleRoomUpdate);
    } catch (error) {
        console.error('Error joining room:', error);
        alert(t('Odaya katılma başarısız. Tekrar deneyin.', 'Failed to join room. Please try again.'));
    }
}

// ========== ROOM UPDATE HANDLER ==========
function handleRoomUpdate(data) {
    // Save settings from room data
    if (data.settings && !gameState.settings) {
        updateGameState({ settings: data.settings });
    }

    // Update game state
    updateGameState({
        playedCards: data.playedCards || [],
        nextExpected: data.nextExpected,
        mistakesMade: data.mistakesMade || 0
    });

    // Check cooldown
    if (data.lastPlayerId === gameState.playerId && data.lastMove?.timestamp) {
        const timeSincePlay = Date.now() - data.lastMove.timestamp;
        updateGameState({ canPlay: timeSincePlay >= PLAY_COOLDOWN });
    } else {
        updateGameState({ canPlay: true });
    }

    // Check if game started or restarted
    if (data.status === 'playing') {
        // Update cards from server (important for Player 2 on restart)
        if (gameState.playerId === 1) {
            updateGameState({ myCards: data.player1?.cards || gameState.myCards });
        } else {
            updateGameState({ myCards: data.player2?.cards || gameState.myCards });
        }

        showScreen('game');
        renderHand();
        attachCardClickHandlers(handlePlayCard);
        updateGameUI(data);

        // Show/hide timer based on settings
        const timerEnabled = gameState.settings?.timerDuration > 0;
        elements.timerContainer.style.display = timerEnabled ? 'block' : 'none';

        // Start timer if enabled and not already running
        if (timerEnabled && !gameState.timerInterval && data.timerStart) {
            startTimer(data.timerStart);
        }

        // Update mistakes display
        updateMistakesDisplay(data);
    }

    // Check for game over
    if (data.status === 'won' || data.status === 'lost') {
        showResult(data);
    }

    // Update partner status
    const partnerConnected = gameState.playerId === 1
        ? data.player2?.connected
        : data.player1?.connected;
    elements.partnerStatus.textContent = partnerConnected
        ? t('🟢 Bağlı', '🟢 Connected')
        : t('🔴 Bağlantı Kesildi', '🔴 Disconnected');
}

// ========== PLAY CARD HANDLER ==========
async function handlePlayCard(cardValue) {
    const result = await fbPlayCard(cardValue);

    if (result.error) {
        console.log('[Play Card Error]', result.error);
    }
}

// ========== PLAY AGAIN HANDLER ==========
async function handlePlayAgain() {
    if (!gameState.gameRef) {
        showScreen('lobby');
        return;
    }

    await restartGame();
    resetUI();
    showScreen('game');
}

// ========== TIMEOUT HANDLER ==========
async function handleTimeout() {
    // Only host triggers timeout, and only if game is still playing
    if (gameState.isHost && gameState.gameRef) {
        const data = await getRoomData();
        if (data && data.status === 'playing') {
            await update(gameState.gameRef, {
                status: 'lost',
                reason: 'timeout'
            });
        }
    }
}

// Export for external use
export { gameState, gameSettings };
