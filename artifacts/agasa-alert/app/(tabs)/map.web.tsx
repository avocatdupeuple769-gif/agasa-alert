import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlertBadge } from "@/components/AlertBadge";
import colors from "@/constants/colors";
import { AgasaAlert, DANGER_COLORS, DangerLevel } from "@/constants/types";
import { useAlerts } from "@/context/AlertsContext";

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)} jours`;
}

function AlertRow({ alert }: { alert: AgasaAlert }) {
  const color = DANGER_COLORS[alert.dangerLevel];
  return (
    <View style={[styles.alertRow, { borderLeftColor: color }]}>
      <View style={styles.alertRowHeader}>
        <Ionicons
          name={alert.zone === "national" ? "earth" : "location"}
          size={14}
          color={color}
        />
        <Text style={[styles.alertZone, { color }]}>
          {alert.zone === "national" ? "Alerte nationale" : `${alert.city || "Local"}`}
        </Text>
        <AlertBadge level={alert.dangerLevel} size="sm" />
        <Text style={styles.alertTime}>{timeAgo(alert.date)}</Text>
      </View>
      <Text style={styles.alertTitle}>{alert.title}</Text>
      <Text style={styles.alertMsg} numberOfLines={2}>{alert.message}</Text>
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { alerts } = useAlerts();
  const [filterLevel, setFilterLevel] = useState<DangerLevel | "all">("all");

  const topPad = Math.max(insets.top, 67);

  const filtered = alerts.filter(
    (a) => filterLevel === "all" || a.dangerLevel === filterLevel
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#1565C0", "#1976D2"]} style={styles.header}>
        <Ionicons name="megaphone" size={26} color="#fff" />
        <View>
          <Text style={styles.headerTitle}>Alertes officielles AGASA</Text>
          <Text style={styles.headerSubtitle}>
            {filtered.length} alerte{filtered.length > 1 ? "s" : ""} en cours · Gabon
          </Text>
        </View>
      </LinearGradient>

      {/* Filtres niveau */}
      <View style={styles.filterRow}>
        {(["all", "high", "medium", "low"] as const).map((level) => (
          <Pressable
            key={level}
            style={[
              styles.filterChip,
              filterLevel === level && styles.filterChipActive,
              level !== "all" && filterLevel === level && { backgroundColor: DANGER_COLORS[level] },
            ]}
            onPress={() => setFilterLevel(level)}
          >
            <Text style={[styles.filterChipText, filterLevel === level && styles.filterChipTextActive]}>
              {level === "all" ? "Toutes" : level === "high" ? "Danger" : level === "medium" ? "Moyen" : "Faible"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <AlertRow alert={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={48} color={colors.light.border} />
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptyDesc}>Aucune alerte officielle pour ce filtre</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.light.secondary },
  filterChipActive: { backgroundColor: colors.light.primary },
  filterChipText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  filterChipTextActive: { color: "#fff" },
  list: { padding: 16, gap: 10 },
  alertRow: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertRowHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertZone: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", flex: 1 },
  alertTime: { fontSize: 10, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  alertTitle: { fontSize: 14, fontWeight: "700", color: colors.light.foreground, fontFamily: "Inter_700Bold" },
  alertMsg: { fontSize: 13, color: colors.light.foreground, fontFamily: "Inter_400Regular", lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  emptyDesc: { fontSize: 14, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
});
