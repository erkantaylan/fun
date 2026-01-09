import { firebaseConfig, PLAY_COOLDOWN } from './config.js';
import { gameState, gameSettings, updateGameState, clearTimer } from './state.js';
import { elements, showScreen } from './elements.js';
import { t } from './i18n.js';
import { shuffleAndDeal, findNextExpected, validateCardPlay } from './game.js';
import { renderHand, updateGameUI, updateMistakesDisplay, showResult, startTimer } from './ui.js';

// Firebase SDK imports (these need to be available globally)
let db, ref, set, get, onValue, push, update, remove, onDisconnect;

/**
 * Initialize Firebase with the provided SDK functions
 * @param {object} firebaseFunctions - Object containing Firebase functions
 */
export function initFirebase(firebaseFunctions) {
    db = firebaseFunctions.db;
    ref = firebaseFunctions.ref;
    set = firebaseFunctions.set;
    get = firebaseFunctions.get;
    onValue = firebaseFunctions.onValue;
    push = firebaseFunctions.push;
    update = firebaseFunctions.update;
    remove = firebaseFunctions.remove;
    onDisconnect = firebaseFunctions.onDisconnect;
}

/**
 * Cleanup old game rooms (older than 2 hours)
 * Called automatically when creating a new room
 */
async function cleanupOldRooms() {
    try {
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        const gamesRef = ref(db, 'games');
        const snapshot = await get(gamesRef);

        if (snapshot.exists()) {
            const games = snapshot.val();
            const deletePromises = [];

            for (const [code, game] of Object.entries(games)) {
                if (game.createdAt && game.createdAt < twoHoursAgo) {
                    console.log(`[Cleanup] Deleting old room: ${code}`);
                    deletePromises.push(remove(ref(db, `games/${code}`)));
                }
            }

            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log(`[Cleanup] Deleted ${deletePromises.length} old rooms`);
            }
        }
    } catch (error) {
        console.warn('[Cleanup] Error cleaning old rooms:', error);
        // Don't block room creation if cleanup fails
    }
}

/**
 * Create a new game room
 * @param {string} roomCode - The room code to use
 */
export async function createRoom(roomCode) {
    // Clean up old rooms first (runs in background-ish)
    await cleanupOldRooms();

    const cards = shuffleAndDeal();

    updateGameState({
        roomCode: roomCode,
        playerId: 1,
        isHost: true,
        myCards: cards.player1,
        gameRef: ref(db, `games/${roomCode}`),
        settings: { ...gameSettings },
        canPlay: true,
        lastPlayTime: 0
    });

    const roomData = {
        status: 'waiting',
        settings: {
            difficulty: gameSettings.difficulty,
            totalCards: gameSettings.totalCards,
            cardsPerPlayer: gameSettings.cardsPerPlayer,
            mistakesAllowed: gameSettings.mistakesAllowed,
            timerDuration: gameSettings.timerDuration
        },
        player1: {
            cards: cards.player1,
            connected: true
        },
        player2: {
            cards: cards.player2,
            connected: false
        },
        allCards: cards.allCards,
        playedCards: [],
        nextExpected: null,
        mistakesMade: 0,
        lastMove: null,
        lastPlayerId: null,
        timerStart: null,
        createdAt: Date.now()
    };

    await set(gameState.gameRef, roomData);

    // Set up disconnect handler
    const player1Ref = ref(db, `games/${roomCode}/player1/connected`);
    onDisconnect(player1Ref).set(false);

    return roomData;
}

/**
 * Join an existing game room
 * @param {string} roomCode - The room code to join
 * @returns {object|null} Room data if successful, null if failed
 */
export async function joinRoom(roomCode) {
    const gameRef = ref(db, `games/${roomCode}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
        return { error: 'not_found' };
    }

    const data = snapshot.val();
    if (data.status !== 'waiting') {
        return { error: 'in_progress' };
    }

    updateGameState({
        roomCode: roomCode,
        playerId: 2,
        gameRef: gameRef,
        myCards: data.player2.cards,
        settings: data.settings,
        canPlay: true,
        lastPlayTime: 0
    });

    // Mark player 2 as connected and start game
    const updateData = {
        'player2/connected': true,
        'status': 'playing',
        'nextExpected': data.allCards[0]
    };

    if (data.settings.timerDuration > 0) {
        updateData.timerStart = Date.now();
    }

    await update(gameRef, updateData);

    // Set up disconnect handler
    const player2Ref = ref(db, `games/${roomCode}/player2/connected`);
    onDisconnect(player2Ref).set(false);

    return { success: true, data };
}

/**
 * Listen to room updates
 * @param {function} onUpdate - Callback for room updates
 */
export function listenToRoom(onUpdate) {
    onValue(gameState.gameRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        onUpdate(data);
    });
}

/**
 * Play a card
 * @param {number} cardValue - The card value to play
 */
export async function playCard(cardValue) {
    // Check cooldown
    if (!gameState.canPlay) {
        return { error: 'cooldown' };
    }

    // Get room data for current game state
    const snapshot = await get(gameState.gameRef);
    if (!snapshot.exists()) return { error: 'no_room' };
    const roomData = snapshot.val();

    // Check if game is already over
    if (roomData.status === 'won' || roomData.status === 'lost') {
        return { error: 'game_over' };
    }

    const allCards = roomData.allCards || [];
    const totalCards = allCards.length;
    const currentPlayedCards = roomData.playedCards || [];
    const settings = gameState.settings || {};
    const mistakesAllowed = settings.mistakesAllowed || 0;
    const timerEnabled = settings.timerDuration > 0;

    // Validate the card play
    const { isValid, smallerCards } = validateCardPlay(cardValue, gameState.playerId, roomData);

    const playedCards = [...currentPlayedCards, cardValue];
    const nextExpected = findNextExpected(allCards, playedCards);

    const newData = {
        playedCards: playedCards,
        lastMove: {
            player: gameState.playerId,
            card: cardValue,
            wasValid: isValid,
            timestamp: Date.now()
        },
        lastPlayerId: gameState.playerId,
        nextExpected: nextExpected
    };

    if (timerEnabled) {
        newData.timerStart = Date.now();
    }

    if (isValid) {
        if (playedCards.length >= totalCards) {
            newData.status = 'won';
        }
    } else {
        // MISTAKE! Other player had a smaller card
        const smallestMissedCard = Math.min(...smallerCards);
        const newMistakeCount = (roomData.mistakesMade || 0) + 1;
        newData.mistakesMade = newMistakeCount;
        newData.lastMistake = {
            card: cardValue,
            missedCard: smallestMissedCard,
            player: gameState.playerId
        };

        if (mistakesAllowed === 0) {
            // Infinite mode
            if (playedCards.length >= totalCards) {
                newData.status = 'won';
            }
        } else if (newMistakeCount >= mistakesAllowed) {
            // Out of mistakes
            newData.status = 'lost';
            newData.mistakeCard = cardValue;
            newData.expectedCard = smallestMissedCard;
        } else {
            // Still have mistakes left
            if (playedCards.length >= totalCards) {
                newData.status = 'won';
            }
        }
    }

    // Set cooldown
    updateGameState({ canPlay: false, lastPlayTime: Date.now() });
    renderHand();

    await update(gameState.gameRef, newData);

    // Auto-unlock after cooldown
    setTimeout(() => {
        updateGameState({ canPlay: true });
        renderHand();
    }, PLAY_COOLDOWN);

    return { success: true, isValid };
}

/**
 * Restart the game in the same room
 */
export async function restartGame() {
    if (!gameState.gameRef) return;

    if (gameState.isHost) {
        const settings = gameState.settings;
        const cards = shuffleAndDeal(settings);

        const resetData = {
            status: 'playing',
            player1: {
                cards: cards.player1,
                connected: true
            },
            player2: {
                cards: cards.player2,
                connected: true
            },
            allCards: cards.allCards,
            playedCards: [],
            nextExpected: cards.allCards[0],
            mistakesMade: 0,
            lastMove: null,
            lastPlayerId: null,
            timerStart: settings.timerDuration > 0 ? Date.now() : null
        };

        updateGameState({
            myCards: cards.player1,
            playedCards: [],
            nextExpected: cards.allCards[0],
            mistakesMade: 0,
            canPlay: true,
            lastPlayTime: 0
        });

        clearTimer();
        await update(gameState.gameRef, resetData);
    } else {
        // Player 2 just resets local state
        updateGameState({
            playedCards: [],
            mistakesMade: 0,
            canPlay: true,
            lastPlayTime: 0
        });
        clearTimer();
    }
}

/**
 * Get current room data
 */
export async function getRoomData() {
    if (!gameState.gameRef) return null;
    const snapshot = await get(gameState.gameRef);
    return snapshot.exists() ? snapshot.val() : null;
}

export { ref, get, update };
