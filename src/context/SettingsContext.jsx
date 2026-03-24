import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [appearance, setAppearance] = useState(() => localStorage.getItem('appearance') || 'system');
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accent') || 'blue');
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en-US');
    const [spokenLanguage, setSpokenLanguage] = useState(() => localStorage.getItem('spokenLanguage') || 'en-US');
    const [socraticMode, setSocraticMode] = useState(() => JSON.parse(localStorage.getItem('socraticMode') || 'false'));

    const isDark = appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const resolvedTheme = isDark ? 'dark' : 'light';

    useEffect(() => {
        localStorage.setItem('appearance', appearance);
        // Apply theme to document
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.add('light');
        }
    }, [appearance, isDark]);

    useEffect(() => {
        localStorage.setItem('accent', accentColor);
        const root = window.document.documentElement;
        const colorMap = {
            blue: { primary: '#60a5fa', secondary: 'rgba(59, 130, 246, 0.15)' },
            cyan: { primary: '#22d3ee', secondary: 'rgba(6, 182, 212, 0.15)' },
            rose: { primary: '#fb7185', secondary: 'rgba(244, 63, 94, 0.15)' },
            amber: { primary: '#fbbf24', secondary: 'rgba(245, 158, 11, 0.15)' },
            green: { primary: '#4ade80', secondary: 'rgba(34, 197, 94, 0.15)' },
            purple: { primary: '#c084fc', secondary: 'rgba(168, 85, 247, 0.15)' },
            orange: { primary: '#fb923c', secondary: 'rgba(249, 115, 22, 0.15)' },
            default: { primary: '#60a5fa', secondary: 'rgba(59, 130, 246, 0.15)' }
        };
        const colors = colorMap[accentColor] || colorMap.default;
        root.style.setProperty('--accent-primary', colors.primary);
        root.style.setProperty('--accent-secondary', colors.secondary);
    }, [accentColor]);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('spokenLanguage', spokenLanguage);
    }, [spokenLanguage]);

    useEffect(() => {
        localStorage.setItem('socraticMode', JSON.stringify(socraticMode));
    }, [socraticMode]);

    const value = {
        appearance,
        setAppearance,
        resolvedTheme,
        isDark,
        accentColor,
        setAccentColor,
        language,
        setLanguage,
        spokenLanguage,
        setSpokenLanguage,
        socraticMode,
        setSocraticMode
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
