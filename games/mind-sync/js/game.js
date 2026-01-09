import { gameSettings } from './state.js';

/**
 * Generate a random 6-character room code
 * @returns {string} Room code (uppercase letters/numbers)
 */
export function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Shuffle deck and deal cards to players
 * @param {object} settings - Game settings with totalCards and cardsPerPlayer
 * @returns {object} Object with player1, player2, and allCards arrays
 */
export function shuffleAndDeal(settings = gameSettings) {
    const totalCards = settings.totalCards || 10;
    const cardsPerPlayer = settings.cardsPerPlayer || 5;
    const totalNeeded = cardsPerPlayer * 2;

    // Create full deck from 1 to totalCards
    const fullDeck = [];
    for (let i = 1; i <= totalCards; i++) {
        fullDeck.push(i);
    }

    // Fisher-Yates shuffle full deck
    for (let i = fullDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
    }

    // Take only the cards we need (for harder difficulties with larger ranges)
    const gameDeck = fullDeck.slice(0, totalNeeded);

    // Shuffle again for distribution
    for (let i = gameDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameDeck[i], gameDeck[j]] = [gameDeck[j], gameDeck[i]];
    }

    // Distribute cards to players (take separate slices before any sorting)
    const player1Cards = gameDeck.slice(0, cardsPerPlayer);
    const player2Cards = gameDeck.slice(cardsPerPlayer, totalNeeded);

    // Sort each player's hand
    player1Cards.sort((a, b) => a - b);
    player2Cards.sort((a, b) => a - b);

    // Create sorted list of all cards for game tracking
    const allCards = [...gameDeck].sort((a, b) => a - b);

    return {
        player1: player1Cards,
        player2: player2Cards,
        allCards: allCards
    };
}

/**
 * Find the next expected card from allCards (next unplayed card in sorted order)
 * @param {number[]} allCards - All cards in the game (sorted)
 * @param {number[]} playedCards - Cards that have been played
 * @returns {number|null} Next expected card, or null if all played
 */
export function findNextExpected(allCards, playedCards) {
    for (const card of allCards) {
        if (!playedCards.includes(card)) {
            return card;
        }
    }
    return null;
}

/**
 * Validate if a card play is valid
 * A play is valid if the OTHER player has no unplayed cards smaller than the played card
 * 
 * @param {number} cardValue - The card being played
 * @param {number} playerId - The player making the move (1 or 2)
 * @param {object} roomData - Current room data from Firebase
 * @returns {object} { isValid: boolean, smallerCards: number[] }
 */
export function validateCardPlay(cardValue, playerId, roomData) {
    const currentPlayedCards = roomData.playedCards || [];

    // Get the OTHER player's unplayed cards
    const otherPlayerId = playerId === 1 ? 2 : 1;
    const otherPlayerData = roomData[`player${otherPlayerId}`];
    const otherPlayerCards = otherPlayerData?.cards || [];
    const otherPlayerUnplayedCards = otherPlayerCards.filter(c => !currentPlayedCards.includes(c));

    // Check if other player has any card SMALLER than the one being played
    const smallerCards = otherPlayerUnplayedCards.filter(c => c < cardValue);
    const isValid = smallerCards.length === 0;

    console.log('=== VALIDATION DEBUG ===');
    console.log('Card being played:', cardValue);
    console.log('My player ID:', playerId);
    console.log('Other player ID:', otherPlayerId);
    console.log('Other player data from Firebase:', otherPlayerData);
    console.log('Other player cards:', otherPlayerCards);
    console.log('Already played cards:', currentPlayedCards);
    console.log('Other player unplayed cards:', otherPlayerUnplayedCards);
    console.log('Smaller cards (should trigger mistake if not empty):', smallerCards);
    console.log('IS VALID:', isValid);
    console.log('========================');

    return { isValid, smallerCards };
}
