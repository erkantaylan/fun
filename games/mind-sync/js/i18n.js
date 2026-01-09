// ========== LANGUAGE SYSTEM ==========

let currentLang = 'tr'; // Turkish is default

/**
 * Set the active language and update all translatable elements
 * @param {string} lang - Language code ('tr' or 'en')
 */
export function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mindSyncLang', lang);

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update all translatable elements
    document.querySelectorAll('[data-tr][data-en]').forEach(el => {
        el.textContent = el.dataset[lang];
    });

    // Update placeholders
    document.querySelectorAll('[data-placeholder-tr][data-placeholder-en]').forEach(el => {
        el.placeholder = el.dataset[`placeholder${lang.charAt(0).toUpperCase() + lang.slice(1)}`];
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

/**
 * Get the current language
 * @returns {string} Current language code
 */
export function getCurrentLang() {
    return currentLang;
}

/**
 * Load saved language preference from localStorage
 */
export function loadSavedLanguage() {
    const savedLang = localStorage.getItem('mindSyncLang');
    if (savedLang) {
        setLanguage(savedLang);
    }
}

/**
 * Translation helper for dynamic content
 * @param {string} trText - Turkish text
 * @param {string} enText - English text
 * @returns {string} Text in current language
 */
export function t(trText, enText) {
    return currentLang === 'tr' ? trText : enText;
}

/**
 * Setup language switcher event handlers
 */
export function setupLanguageHandlers() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    loadSavedLanguage();
}
