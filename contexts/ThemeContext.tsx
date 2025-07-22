import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, AppTheme } from '@/styles/themes';
import { logError } from '@/utils/errorHandler';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  themeType: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = '@pantrypal_theme';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeType, setThemeType] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeType(savedTheme);
      }
    } catch (error) {
      logError(error, 'Loading theme preference');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = themeType === 'light' ? 'dark' : 'light';
      setThemeType(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      logError(error, 'Saving theme preference');
    }
  };

  const theme = themeType === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ 
      theme,
      themeType,
      toggleTheme, 
      isDark: themeType === 'dark',
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}