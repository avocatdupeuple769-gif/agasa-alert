import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReportCard } from "@/components/ReportCard";
import colors from "@/constants/colors";
import { DANGER_COLORS, DangerLevel, ReportType } from "@/constants/types";
import { useReports } from "@/context/ReportsContext";

const FILTER_TYPES: { key: ReportType | "all"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "perime", label: "Périmé" },
  { key: "hygiene", label: "Hygiène" },
  { key: "prix_abusif", label: "Prix" },
  { key: "intoxication", label: "Intox." },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { reports } = useReports();
  const [filterType, setFilterType] = useState<ReportType | "all">("all");
  const [filterLevel, setFilterLevel] = useState<DangerLevel | "all">("all");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered = reports.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterLevel !== "all" && r.dangerLevel !== filterLevel) return false;
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#1565C0", "#1976D2"]} style={styles.header}>
        <Ionicons name="map" size={28} color="#fff" />
        <View>
          <Text style={styles.headerTitle}>Carte des alertes</Text>
          <Text style={styles.headerSubtitle}>
            {filtered.length} signalement{filtered.length > 1 ? "s" : ""} · Gabon
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_TYPES.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, filterType === f.key && styles.filterChipActive]}
              onPress={() => setFilterType(f.key)}
            >
              <Text style={[styles.filterChipText, filterType === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
                {level === "all" ? "Tous" : level === "high" ? "Danger" : level === "medium" ? "Moyen" : "Faible"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.legend}>
        {(["high", "medium", "low"] as DangerLevel[]).map((level) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: DANGER_COLORS[level] }]} />
            <Text style={styles.legendText}>
              {level === "high" ? "Danger élevé" : level === "medium" ? "Moyen" : "Faible"}
            </Text>
          </View>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        renderItem={({ item, index }) => (
          <View style={styles.reportItem}>
              <View style={styles.reportCoords}>
                <Ionicons name="location" size={14} color={colors.light.primary} />
                <Text style={styles.coordText}>
                  {item.location.latitude.toFixed(3)}, {item.location.longitude.toFixed(3)}
                </Text>
              </View>
              <ReportCard report={item} showStatus />
            </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={48} color={colors.light.border} />
            <Text style={styles.emptyTitle}>Aucun signalement</Text>
            <Text style={styles.emptyDesc}>Aucun signalement pour ce filtre</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  filtersWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  filterRow: { flexDirection: "row", gap: 6, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.light.secondary },
  filterChipActive: { backgroundColor: colors.light.primary },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  filterChipTextActive: { color: "#fff" },
  legend: { flexDirection: "row", gap: 16, paddingHorizontal: 16, paddingVertical: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.light.foreground, fontFamily: "Inter_400Regular" },
  list: { padding: 16, gap: 12 },
  reportItem: { gap: 6 },
  reportCoords: { flexDirection: "row", alignItems: "center", gap: 4 },
  coordText: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  emptyDesc: { fontSize: 14, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
});
