import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlertBadge } from "@/components/AlertBadge";
import colors from "@/constants/colors";
import { AgasaAlert, DANGER_COLORS, DangerLevel } from "@/constants/types";
import { useAlerts } from "@/context/AlertsContext";

const GABON_REGION: Region = {
  latitude: -0.8037,
  longitude: 11.6094,
  latitudeDelta: 7,
  longitudeDelta: 7,
};

/* Coordonnées approximatives par ville/zone pour afficher sur la carte */
const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  Libreville:    { latitude: 0.3901,  longitude: 9.4544 },
  "Port-Gentil": { latitude: -0.7193, longitude: 8.7815 },
  Franceville:   { latitude: -1.6333, longitude: 13.5833 },
  Mouila:        { latitude: -1.8652, longitude: 11.0669 },
  Oyem:          { latitude: 1.5996,  longitude: 11.5810 },
  Lambaréné:     { latitude: -0.7037, longitude: 10.2422 },
  Tchibanga:     { latitude: -2.8501, longitude: 10.9978 },
  Koula:         { latitude: -1.0000, longitude: 12.4833 },
};

function getCoords(alert: AgasaAlert) {
  if (alert.city && CITY_COORDS[alert.city]) return CITY_COORDS[alert.city];
  return { latitude: -0.8037, longitude: 11.6094 }; // Centre Gabon
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function MarkerPin({ level }: { level: DangerLevel }) {
  const color = DANGER_COLORS[level];
  return (
    <View style={[markerStyles.container, { borderColor: color, backgroundColor: color + "30" }]}>
      <View style={[markerStyles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const markerStyles = StyleSheet.create({
  container: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { alerts } = useAlerts();
  const [filterLevel, setFilterLevel] = useState<DangerLevel | "all">("all");
  const [selected, setSelected] = useState<AgasaAlert | null>(null);

  const filtered = alerts.filter(
    (a) => filterLevel === "all" || a.dangerLevel === filterLevel
  );

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={GABON_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {filtered.map((alert) => {
          const coords = getCoords(alert);
          return (
            <Marker
              key={alert.id}
              coordinate={coords}
              onPress={() => setSelected(alert)}
            >
              <MarkerPin level={alert.dangerLevel} />
            </Marker>
          );
        })}
      </MapView>

      {/* Filtres en haut */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Alertes officielles AGASA</Text>
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
                  {level === "all" ? "Toutes" : level === "high" ? "Danger" : level === "medium" ? "Moyen" : "Faible"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Légende */}
      <View style={[styles.legend, { bottom: insets.bottom + 16 }]}>
        {(["high", "medium", "low"] as DangerLevel[]).map((level) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: DANGER_COLORS[level] }]} />
            <Text style={styles.legendText}>
              {level === "high" ? "Danger" : level === "medium" ? "Moyen" : "Faible"}
            </Text>
          </View>
        ))}
        <Text style={styles.legendCount}>{filtered.length} alerte{filtered.length > 1 ? "s" : ""}</Text>
      </View>

      {/* Sheet détail alerte */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.overlay} onPress={() => setSelected(null)} />
          {selected && (
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetType}>{selected.title}</Text>
                  <Text style={styles.sheetZone}>
                    <Ionicons
                      name={selected.zone === "national" ? "earth" : "location"}
                      size={12}
                      color={DANGER_COLORS[selected.dangerLevel]}
                    />
                    {" "}{selected.zone === "national" ? "Alerte nationale" : `${selected.city || "Local"}`}
                  </Text>
                </View>
                <AlertBadge level={selected.dangerLevel} />
              </View>
              <Text style={styles.sheetMsg}>{selected.message}</Text>
              <View style={styles.sheetMeta}>
                <Ionicons name="time-outline" size={14} color={colors.light.mutedForeground} />
                <Text style={styles.sheetMetaText}>{timeAgo(selected.date)}</Text>
              </View>
              <Pressable style={styles.closeSheet} onPress={() => setSelected(null)}>
                <Text style={styles.closeSheetText}>Fermer</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 12 },
  filterCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16, padding: 10, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  filterLabel: { fontSize: 13, fontWeight: "700", color: "#1565C0", fontFamily: "Inter_700Bold" },
  filterRow: { flexDirection: "row", gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.light.secondary },
  filterChipActive: { backgroundColor: colors.light.primary },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  filterChipTextActive: { color: "#fff" },
  legend: {
    position: "absolute", left: 16,
    backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 12, padding: 10, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.light.foreground, fontFamily: "Inter_400Regular" },
  legendCount: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 2 },
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  overlay: { flex: 1 },
  sheet: {
    backgroundColor: colors.light.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.light.border, alignSelf: "center", marginBottom: 4 },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  sheetType: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.light.foreground, flexShrink: 1 },
  sheetZone: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  sheetMsg: { fontSize: 14, color: colors.light.foreground, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sheetMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  sheetMetaText: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  closeSheet: { backgroundColor: colors.light.secondary, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 4 },
  closeSheetText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
});
