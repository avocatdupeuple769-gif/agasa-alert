/**
 * Layout racine Expo Router.
 *
 * NOTE : SplashScreen.preventAutoHideAsync() ET le timeout de secours sont
 * désormais dans index.js (qui s'exécute AVANT ce fichier et ses imports).
 * On se contente ici de cacher le splash quand les polices sont chargées.
 */
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

const queryClient = new QueryClient();

/* ─── ErrorBoundary : affiche les erreurs de rendu visiblement ────────────── */
interface EBState {
  error: Error | null;
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  EBState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Erreur de démarrage</Text>
          <Text style={styles.errorMsg}>{this.state.error.message}</Text>
          <Text style={styles.errorStack}>
            {this.state.error.stack?.substring(0, 600)}
          </Text>
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

  /* Cacher le splash dès que les polices sont prêtes (chemin rapide) */
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
    padding: 24,
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
    color: "#888",
    fontFamily: "monospace",
  },
});
