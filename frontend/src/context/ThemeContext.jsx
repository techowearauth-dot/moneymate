import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user_theme');
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === 'dark');
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = async () => {
        try {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            await AsyncStorage.setItem('user_theme', newMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
