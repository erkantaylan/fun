// ========== FIREBASE CONFIGURATION ==========
export const firebaseConfig = {
    apiKey: "AIzaSyDNyK1UYWIjGuBYDO7Fl-UnZD5Yq1FaqOA",
    authDomain: "erkantaylan-github-io.firebaseapp.com",
    databaseURL: "https://erkantaylan-github-io-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "erkantaylan-github-io",
    storageBucket: "erkantaylan-github-io.firebasestorage.app",
    messagingSenderId: "420640417772",
    appId: "1:420640417772:web:0126d1c4018600b78e42c9"
};

// ========== GAME CONSTANTS ==========
export const PLAY_COOLDOWN = 3000; // 3 seconds cooldown after playing

// ========== DIFFICULTY PRESETS ==========
export const DIFFICULTIES = {
    easy: { totalCards: 6, cardsPerPlayer: 3 },
    normal: { totalCards: 10, cardsPerPlayer: 5 },
    hard: { totalCards: 20, cardsPerPlayer: 5 },
    extreme: { totalCards: 50, cardsPerPlayer: 5 }
};

// ========== DEFAULT GAME SETTINGS ==========
export const DEFAULT_SETTINGS = {
    difficulty: 'normal',
    totalCards: 10,
    cardsPerPlayer: 5,
    mistakesAllowed: 0,  // 0 = infinite
    timerDuration: 15    // 0 = off
};
