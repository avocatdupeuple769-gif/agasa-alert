import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AdminProvider } from "@/context/AdminContext";
import { AlertsProvider } from "@/context/AlertsContext";
import { ReportsProvider } from "@/context/ReportsContext";

/* ─── Empêcher le masquage automatique du splash ──────────────────────────── */
if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch(() => {});

  /* Délai de secours au niveau module (s'exécute même si React crashe) */
  setTimeout(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, 3000);
}

const queryClient = new QueryClient();

/* ─── Affiche l'erreur sur l'écran au lieu de crasher silencieusement ─────── */
interface ErrorBoundaryState {
  error: Error | null;
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Erreur de démarrage</Text>
          <Text style={styles.errorMsg}>{this.state.error.message}</Text>
          <Text style={styles.errorStack}>{this.state.error.stack?.substring(0, 500)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  /* Cacher le splash dès que les polices sont prêtes */
  useEffect(() => {
    if (Platform.OS !== "web" && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AdminProvider>
            <AlertsProvider>
              <ReportsProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  </Stack>
                </GestureHandlerRootView>
              </ReportsProvider>
            </AlertsProvider>
          </AdminProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 15,
    color: "#333",
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 11,
    color: "#666",
    fontFamily: "monospace",
  },
});
