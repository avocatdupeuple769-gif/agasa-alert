import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAlerts } from "@/context/AlertsContext";

const AGASA_PHONE = "+241 01 79 70 00";
const AGASA_PHONE_RAW = "+24101797000";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useAlerts();

  // ── Accès admin caché : 10 taps sur le logo ──
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Scroll entre pages ──
  const scrollRef = useRef<ScrollView>(null);

  // ── Animation 3D logo (rotation Y continue + pulse scale) ──
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Arrêter les animations quand l'écran n'est pas actif (évite les conflits DOM sur web)
  useFocusEffect(
    useCallback(() => {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        })
      );
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 1500, useNativeDriver: false }),
        ])
      );
      spin.start();
      pulse.start();
      return () => {
        spin.stop();
        pulse.stop();
        spinAnim.setValue(0);
        pulseAnim.setValue(1);
      };
    }, [spinAnim, pulseAnim])
  );

  const rotateY = spinAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ["0deg", "90deg", "180deg", "270deg", "360deg"],
  });

  const handleLogoTap = () => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 10) {
        if (tapTimer.current) clearTimeout(tapTimer.current);
        router.push("/(tabs)/admin/dashboard");
        return 0;
      }
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => setTapCount(0), 3000);
      return next;
    });
  };

  const goToOptions = () => {
    scrollRef.current?.scrollTo({ y: SCREEN_H, animated: true });
  };

  return (
    <ScrollView
      ref={scrollRef}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      decelerationRate="fast"
      bounces={false}
      style={{ flex: 1 }}
    >
      {/* ══════════════════════════════════════
          PAGE 1 — HERO AGASA
      ══════════════════════════════════════ */}
      <LinearGradient
        colors={["#0E4D0E", "#1B7A1B", "#2E9E2E"]}
        style={[styles.page, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Cercles décoratifs */}
        <View style={styles.decor1} />
        <View style={styles.decor2} />
        <View style={styles.decor3} />

        {/* Logo 3D animé */}
        <Pressable onPress={handleLogoTap} hitSlop={12}>
          <Animated.View
            style={[
              styles.logoWrap,
              {
                transform: [
                  { perspective: 900 },
                  { rotateY },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <Image
              source={require("@/assets/images/agasa-logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </Pressable>

        {/* Texte héro */}
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTitle}>AGASA Alert</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroTagline}>
            Agence Gabonaise de Sécurité Alimentaire
          </Text>
          <Text style={styles.heroMsg}>
            Bienvenue !{"\n"}Merci pour votre contribution au bien-être{"\n"}et à la sécurité du Gabon.
          </Text>
        </View>

        {/* Drapeau Gabon */}
        <View style={styles.flag}>
          <View style={[styles.flagBand, { backgroundColor: "#009E60" }]} />
          <View style={[styles.flagBand, { backgroundColor: "#FCD116" }]} />
          <View style={[styles.flagBand, { backgroundColor: "#009E60" }]} />
        </View>

        {/* Bouton vers options */}
        <Pressable onPress={goToOptions} style={styles.scrollHint}>
          <Text style={styles.scrollHintText}>Voir les options</Text>
          <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </LinearGradient>

      {/* ══════════════════════════════════════
          PAGE 2 — OPTIONS AUX COULEURS AGASA
      ══════════════════════════════════════ */}
      <View
        style={[
          styles.page,
          styles.optionsPage,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* En-tête */}
        <View style={styles.optionsHeader}>
          <Image
            source={require("@/assets/images/agasa-logo.jpg")}
            style={styles.optionsLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.optionsTitle}>Que souhaitez-vous faire ?</Text>
            <Text style={styles.optionsSubtitle}>Choisissez une action</Text>
          </View>
        </View>

        {/* Grille 2×2 */}
        <View style={styles.optionsGrid}>

          {/* ① Signalement — Rouge AGASA */}
          <Pressable
            style={({ pressed }) => [styles.optionCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push("/(tabs)/report")}
          >
            <LinearGradient
              colors={["#C41E1E", "#8B0000"]}
              style={styles.optionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.optionIconCircle}>
                <Ionicons name="warning" size={34} color="#fff" />
              </View>
              <Text style={styles.optionLabel}>Faire un{"\n"}signalement</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" style={styles.optionArrow} />
            </LinearGradient>
          </Pressable>

          {/* ② Alertes — Vert foncé AGASA */}
          <Pressable
            style={({ pressed }) => [styles.optionCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push("/(tabs)/alerts")}
          >
            <LinearGradient
              colors={["#155B15", "#0E4D0E"]}
              style={styles.optionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.optionIconCircle}>
                <Ionicons name="megaphone" size={34} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.optionLabel}>Alertes{"\n"}AGASA</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" style={styles.optionArrow} />
            </LinearGradient>
          </Pressable>

          {/* ③ Guides — Or AGASA */}
          <Pressable
            style={({ pressed }) => [styles.optionCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push("/(tabs)/info")}
          >
            <LinearGradient
              colors={["#C8920A", "#9A6E08"]}
              style={styles.optionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.optionIconCircle}>
                <Ionicons name="book-outline" size={34} color="#fff" />
              </View>
              <Text style={styles.optionLabel}>Guides &{"\n"}Conseils</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" style={styles.optionArrow} />
            </LinearGradient>
          </Pressable>

          {/* ④ Urgence — Vert clair AGASA */}
          <Pressable
            style={({ pressed }) => [styles.optionCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => Linking.openURL(`tel:${AGASA_PHONE_RAW}`)}
          >
            <LinearGradient
              colors={["#2E9E2E", "#1B7A1B"]}
              style={styles.optionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.optionIconCircle}>
                <Ionicons name="call" size={34} color="#fff" />
              </View>
              <Text style={styles.optionLabel}>Urgence{"\n"}{AGASA_PHONE}</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" style={styles.optionArrow} />
            </LinearGradient>
          </Pressable>

        </View>

        {/* Footer */}
        <Text style={styles.optionsFooter}>
          Les signalements sont traités confidentiellement par les agents AGASA.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  /* ── PAGE 1 HERO ── */
  decor1: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  decor2: {
    position: "absolute",
    bottom: 80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  decor3: {
    position: "absolute",
    top: "40%",
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(212,165,42,0.15)",
  },

  logoWrap: {
    position: "relative",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.92)",
  },

  heroTextBlock: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  heroDivider: {
    width: 50,
    height: 3,
    backgroundColor: "#D4A52A",
    borderRadius: 2,
    marginVertical: 4,
  },
  heroTagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  heroMsg: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
    marginTop: 8,
  },
  flag: {
    flexDirection: "row",
    width: 60,
    height: 12,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 28,
  },
  flagBand: { flex: 1 },
  scrollHint: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 28 : 20,
    alignItems: "center",
    gap: 4,
  },
  scrollHintText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },

  /* ── PAGE 2 OPTIONS ── */
  optionsPage: {
    backgroundColor: "#F2F7F2",
    justifyContent: "flex-start",
  },
  optionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
    width: "100%",
  },
  optionsLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#1B7A1B",
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0E4D0E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  optionsSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "center",
  },
  optionCard: {
    width: (SCREEN_W - 46) / 2,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  optionGradient: {
    padding: 22,
    paddingBottom: 20,
    minHeight: 150,
    justifyContent: "space-between",
  },
  optionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FCD116",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "#0E4D0E",
    fontFamily: "Inter_700Bold",
    fontWeight: "800",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
    marginTop: 10,
  },
  optionArrow: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  optionsFooter: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 24,
    lineHeight: 17,
  },
});
