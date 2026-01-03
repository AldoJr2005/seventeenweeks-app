import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "app_theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      if (Platform.OS === "web") {
        const stored = sessionStorage.getItem(THEME_KEY);
        if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
          setThemeModeState(stored as ThemeMode);
        }
      } else {
        const stored = await SecureStore.getItemAsync(THEME_KEY);
        if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
          setThemeModeState(stored as ThemeMode);
        }
      }
    } catch (error) {
      console.log("Failed to load theme preference");
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      if (Platform.OS === "web") {
        sessionStorage.setItem(THEME_KEY, mode);
      } else {
        await SecureStore.setItemAsync(THEME_KEY, mode);
      }
    } catch (error) {
      console.log("Failed to save theme preference");
    }
  };

  const effectiveTheme: "light" | "dark" = 
    themeMode === "system" 
      ? (systemScheme ?? "light") 
      : themeMode;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
}
