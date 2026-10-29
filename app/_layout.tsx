import { CosmeticsProvider } from "@/context/cosmetics";
import { IntlProvider, useIntl } from "@/context/intl";
import { RoutineProvider } from "@/context/routine";
import { ThemeProvider, useTheme } from "@/context/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useReducer } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { TamaguiProvider } from "tamagui";
import { StatusBar } from "expo-status-bar";
import { tamaguiConfig } from "../tamagui.config";

import "../tamagui-web.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNavigator() {
  const { colors, colorScheme } = useTheme();
  const { t } = useIntl();

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-product"
          options={{
            presentation: "modal",
            title: t("add.title"),
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            presentation: "modal",
            title: t("calendar.title"),
            headerShown: false,
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: t("common.oops") }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

function AppProviders() {
  const [errorKey, bumpErrorKey] = useReducer((key: number) => key + 1, 0);
  const { t, isLocaleReady } = useIntl();

  useEffect(() => {
    if (isLocaleReady) {
      void SplashScreen.hideAsync();
    }
  }, [isLocaleReady]);

  const handleErrorReset = () => {
    bumpErrorKey();
  };

  const errorLabels = useMemo(
    () => ({
      title: t("common.oops"),
      message: t("error.message"),
      unexpected: t("error.subtitle"),
      tryAgain: t("error.tryAgain"),
      restart: t("error.restart"),
    }),
    [t],
  );

  return (
    <ErrorBoundary
      key={errorKey}
      onReset={handleErrorReset}
      labels={errorLabels}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CosmeticsProvider>
            <RoutineProvider>
              <RootNavigator />
            </RoutineProvider>
          </CosmeticsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider
      config={tamaguiConfig}
      defaultTheme={colorScheme ?? "light"}
    >
      <IntlProvider>
        <AppProviders />
      </IntlProvider>
    </TamaguiProvider>
  );
}
