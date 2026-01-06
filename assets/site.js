(function() {
    'use strict';

    const LANG_EN = 'en';
    const LANG_RU = 'ru';
    const STORAGE_KEY = 'preferred-language';
    const DEFAULT_LANG = LANG_EN;

    const contentEn = document.getElementById('content-en');
    const contentRu = document.getElementById('content-ru');
    const btnEn = document.getElementById('lang-en');
    const btnRu = document.getElementById('lang-ru');

    function setLanguage(lang) {
        // Update visibility
        if (lang === LANG_RU) {
            contentEn.classList.add('hidden');
            contentRu.classList.remove('hidden');
            btnEn.classList.remove('active');
            btnRu.classList.add('active');
        } else {
            contentEn.classList.remove('hidden');
            contentRu.classList.add('hidden');
            btnEn.classList.add('active');
            btnRu.classList.remove('active');
        }

        // Update document language
        document.documentElement.lang = lang;

        // Save preference
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            // Ignore localStorage errors
        }

        // Update URL hash
        if (window.location.hash !== '#' + lang) {
            window.history.replaceState(null, '', '#' + lang);
        }
    }

    function getInitialLanguage() {
        // 1. Check URL hash
        const hash = window.location.hash.slice(1).toLowerCase();
        if (hash === LANG_RU || hash === LANG_EN) {
            return hash;
        }

        // 2. Check localStorage
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === LANG_RU || stored === LANG_EN) {
                return stored;
            }
        } catch (e) {
            // Ignore localStorage errors
        }

        // 3. Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.toLowerCase().startsWith('ru')) {
            return LANG_RU;
        }

        // 4. Default
        return DEFAULT_LANG;
    }

    // Initialize language on page load
    const initialLang = getInitialLanguage();
    setLanguage(initialLang);

    // Handle language button clicks
    btnEn.addEventListener('click', function() {
        setLanguage(LANG_EN);
    });

    btnRu.addEventListener('click', function() {
        setLanguage(LANG_RU);
    });

    // Handle hash changes (back/forward navigation)
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.slice(1).toLowerCase();
        if (hash === LANG_RU || hash === LANG_EN) {
            setLanguage(hash);
        }
    });
})();

