import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  isReady: boolean;
};

const THEME_STORAGE_KEY = "app-theme-mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(systemScheme === "dark" ? "dark" : "light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeMode(savedTheme);
      }

      setIsReady(true);
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [isReady, themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      toggleThemeMode: () => {
        setThemeMode((currentMode) => (currentMode === "dark" ? "light" : "dark"));
      },
      isReady,
    }),
    [isReady, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }

  return context;
}