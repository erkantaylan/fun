import { PLAY_COOLDOWN } from './config.js';
import { gameState, gameSettings, updateGameState, clearTimer } from './state.js';
import { elements, showScreen } from './elements.js';
import { t } from './i18n.js';

// ========== RENDER PLAYER'S HAND ==========
export function renderHand() {
    elements.playerHand.innerHTML = '';

    gameState.myCards.forEach(cardValue => {
        if (!gameState.playedCards.includes(cardValue)) {
            const card = document.createElement('div');
            card.className = 'card' + (gameState.canPlay ? '' : ' cooldown');
            card.dataset.value = cardValue;
            card.innerHTML = `<span class="card-value">${cardValue}</span>`;

            // We'll attach the click handler in app.js after importing playCard
            card.dataset.cardValue = cardValue;
            elements.playerHand.appendChild(card);
        }
    });

    // Update player badge
    elements.playerBadge.textContent = `${t('Oyuncu', 'Player')} ${gameState.playerId}`;
    elements.playerBadge.className = `player-badge player-${gameState.playerId}`;
}

/**
 * Attach click handlers to cards
 * @param {function} playCardFn - The playCard function to call
 */
export function attachCardClickHandlers(playCardFn) {
    elements.playerHand.querySelectorAll('.card').forEach(card => {
        const cardValue = parseInt(card.dataset.cardValue);
        card.addEventListener('click', () => playCardFn(cardValue));
    });
}

// ========== UPDATE GAME UI ==========
export function updateGameUI(data) {
    const totalCards = data.allCards?.length || 10;

    // Update next expected card
    const allPlayed = (data.playedCards?.length || 0) >= totalCards;
    elements.nextCardNeeded.textContent = allPlayed ? '✓' : (data.nextExpected || '?');

    // Update cards played count
    const playedCount = data.playedCards?.length || 0;
    elements.cardsPlayedCount.textContent = playedCount;

    // Update the total in the display
    const cardsText = document.querySelector('.cards-played');
    if (cardsText) {
        cardsText.innerHTML = `<span id="cardsPlayedCount">${playedCount}</span>/${totalCards} <span data-tr="kart" data-en="cards">${t('kart', 'cards')}</span>`;
    }

    // Update pile display
    if (playedCount > 0) {
        const lastCard = data.playedCards[playedCount - 1];
        elements.pile.innerHTML = `<div class="pile-card">${lastCard}</div>`;
    }

    // Update last played info
    if (data.lastMove) {
        elements.lastPlayedInfo.classList.remove('hidden');
        elements.lastPlayerName.textContent = `${t('Oyuncu', 'Player')} ${data.lastMove.player}`;
        elements.lastCardValue.textContent = data.lastMove.card;
    }

    // Re-render hand (removes played cards)
    renderHand();
}

// ========== UPDATE MISTAKES DISPLAY ==========
export function updateMistakesDisplay(data) {
    const settings = gameState.settings || {};
    const mistakesAllowed = settings.mistakesAllowed || 0;
    const mistakesMade = data.mistakesMade || 0;

    if (mistakesAllowed === 0) {
        // Infinite mode
        elements.mistakesValue.textContent = '∞';
        elements.mistakesValue.className = 'mistakes-value';
    } else {
        const remaining = mistakesAllowed - mistakesMade;
        elements.mistakesValue.textContent = `${remaining}/${mistakesAllowed}`;

        // Color coding
        if (remaining === 0) {
            elements.mistakesValue.className = 'mistakes-value danger';
        } else if (remaining === 1) {
            elements.mistakesValue.className = 'mistakes-value warning';
        } else {
            elements.mistakesValue.className = 'mistakes-value';
        }
    }
}

// ========== SHOW RESULT ==========
export function showResult(data) {
    clearTimer();
    showScreen('result');

    const totalCards = data.allCards?.length || 10;

    if (data.status === 'won') {
        elements.resultIcon.textContent = '🏆';
        elements.resultTitle.textContent = t('Mükemmel Uyum!', 'Perfect Sync!');
        elements.resultMessage.textContent = t(
            `Tüm ${totalCards} kartı uyum içinde oynadınız!`,
            `You played all ${totalCards} cards in harmony!`
        );
        elements.statMistakeCard.textContent = '-';
        document.body.classList.add('victory');
    } else {
        elements.resultIcon.textContent = '💔';
        elements.resultTitle.textContent = t('Uyumsuzluk', 'Out of Sync');

        if (data.reason === 'timeout') {
            elements.resultMessage.textContent = t(
                'Süre doldu! Çok tereddüt ettiniz.',
                'Time ran out! You hesitated too long.'
            );
            elements.statMistakeCard.textContent = '⏰';
        } else {
            elements.resultMessage.textContent = t(
                `${data.mistakeCard} oynandı, ama partnerin ${data.expectedCard} kartı vardı!`,
                `Card ${data.mistakeCard} was played, but partner had ${data.expectedCard}!`
            );
            elements.statMistakeCard.textContent = `${data.mistakeCard} vs ${data.expectedCard}`;
        }
        document.body.classList.remove('victory');
    }

    elements.statCardsPlayed.textContent = data.playedCards?.length || 0;
}

// ========== TIMER ==========
let timerUpdateFn = null;

export function setTimerUpdateFn(fn) {
    timerUpdateFn = fn;
}

export function startTimer(startTime) {
    const timerDuration = gameState.settings?.timerDuration || 15;
    if (timerDuration <= 0) return;

    clearTimer();

    const circumference = 2 * Math.PI * 45;
    elements.timerProgress.style.strokeDasharray = circumference;

    gameState.timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, timerDuration - elapsed);

        elements.timerText.textContent = Math.ceil(remaining);

        // Update progress ring
        const progress = remaining / timerDuration;
        const offset = circumference * (1 - progress);
        elements.timerProgress.style.strokeDashoffset = offset;

        // Color change as time runs out
        if (remaining <= 5) {
            elements.timerProgress.classList.add('warning');
        } else {
            elements.timerProgress.classList.remove('warning');
        }

        // Time's up
        if (remaining <= 0) {
            clearTimer();
            if (timerUpdateFn) {
                timerUpdateFn();
            }
        }
    }, 100);

    updateGameState({ timerInterval: gameState.timerInterval });
}

// ========== RESET UI ==========
export function resetUI() {
    elements.lastPlayedInfo.classList.add('hidden');
    elements.pile.innerHTML = '<div class="pile-placeholder"><span>?</span></div>';
    document.body.classList.remove('victory');
}
