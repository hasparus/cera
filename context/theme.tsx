import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useReducer, useMemo, useCallback } from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";
import { Colors } from "@/constants/colors";

type ThemeMode = "light" | "dark" | "auto";
type AppSettings = {
  showDetailedConflicts: boolean;
};

type ThemeState = {
  themeMode: ThemeMode;
  isLoaded: boolean;
  appSettings: AppSettings;
};

type ThemeAction =
  | {
      type: "loaded";
      themeMode: ThemeMode | null;
      appSettings: Partial<AppSettings> | null;
    }
  | { type: "setThemeMode"; themeMode: ThemeMode }
  | { type: "updateAppSettings"; updates: Partial<AppSettings> };

const initialThemeState: ThemeState = {
  themeMode: "auto",
  isLoaded: false,
  appSettings: { showDetailedConflicts: true },
};

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case "loaded":
      return {
        themeMode: action.themeMode ?? state.themeMode,
        isLoaded: true,
        appSettings: { ...state.appSettings, ...action.appSettings },
      };
    case "setThemeMode":
      return { ...state, themeMode: action.themeMode };
    case "updateAppSettings":
      return {
        ...state,
        appSettings: { ...state.appSettings, ...action.updates },
      };
  }
}

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useNativeColorScheme();
  const [{ themeMode, isLoaded, appSettings }, dispatch] = useReducer(
    themeReducer,
    initialThemeState,
  );

  useEffect(() => {
    const load = async () => {
      let themeMode: ThemeMode | null = null;
      let appSettings: Partial<AppSettings> | null = null;
      try {
        const [storedTheme, storedSettings] = await Promise.all([
          AsyncStorage.getItem("themeMode"),
          AsyncStorage.getItem("appSettings"),
        ]);
        if (
          storedTheme &&
          (storedTheme === "light" ||
            storedTheme === "dark" ||
            storedTheme === "auto")
        ) {
          themeMode = storedTheme;
        }
        if (storedSettings) {
          try {
            appSettings = JSON.parse(storedSettings) as Partial<AppSettings>;
          } catch (e) {
            console.log("[Theme] failed to parse appSettings", e);
          }
        }
      } catch (e) {
        console.error("[Theme] failed to load stored settings", e);
      } finally {
        dispatch({ type: "loaded", themeMode, appSettings });
      }
    };
    void load();
  }, []);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    dispatch({ type: "setThemeMode", themeMode: mode });
    await AsyncStorage.setItem("themeMode", mode);
  }, []);

  const setAppSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      dispatch({ type: "updateAppSettings", updates });
      await AsyncStorage.setItem(
        "appSettings",
        JSON.stringify({ ...appSettings, ...updates }),
      );
    },
    [appSettings],
  );

  const activeColorScheme = useMemo(() => {
    if (themeMode === "auto") {
      return systemColorScheme ?? "light";
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const colors = Colors[activeColorScheme];

  return useMemo(
    () => ({
      themeMode,
      setTheme,
      colors,
      colorScheme: activeColorScheme,
      isLoaded,
      showDetailedConflicts: appSettings.showDetailedConflicts,
      setAppSettings,
    }),
    [
      themeMode,
      setTheme,
      colors,
      activeColorScheme,
      isLoaded,
      appSettings.showDetailedConflicts,
      setAppSettings,
    ],
  );
});
