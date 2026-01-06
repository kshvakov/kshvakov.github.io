(function() {
    'use strict';

    // Theme switching
    const THEME_STORAGE_KEY = 'preferred-theme';
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('.theme-icon');

        function setTheme(theme) {
            if (theme === 'dark') {
                document.body.classList.add('dark');
                document.body.classList.remove('light');
                if (themeIcon) themeIcon.textContent = '☾';
            } else {
                document.body.classList.remove('dark');
                document.body.classList.add('light');
                if (themeIcon) themeIcon.textContent = '☀';
            }

            try {
                localStorage.setItem(THEME_STORAGE_KEY, theme);
            } catch (e) {
                // Ignore localStorage errors
            }
        }

        function getInitialTheme() {
            // 1. Check localStorage
            try {
                const stored = localStorage.getItem(THEME_STORAGE_KEY);
                if (stored === 'dark' || stored === 'light') {
                    return stored;
                }
            } catch (e) {
                // Ignore localStorage errors
            }

            // 2. Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }

            // 3. Default to light
            return 'light';
        }

        // Initialize theme on page load
        const initialTheme = getInitialTheme();
        setTheme(initialTheme);

        // Handle theme toggle click
        themeToggle.addEventListener('click', function() {
            const hasDark = document.body.classList.contains('dark');
            const hasLight = document.body.classList.contains('light');
            
            // If no explicit theme is set, determine from system preference
            if (!hasDark && !hasLight) {
                const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(systemPrefersDark ? 'light' : 'dark');
            } else {
                // Toggle between dark and light
                setTheme(hasDark ? 'light' : 'dark');
            }
        });

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            // Only auto-switch if user hasn't manually set a preference
            try {
                if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                    setTheme(e.matches ? 'dark' : 'light');
                }
            } catch (e) {
                // Ignore localStorage errors
            }
        });
    }
    }
})();

