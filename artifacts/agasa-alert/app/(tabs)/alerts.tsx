import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Image,
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

function AlertCard({
  alert,
  onPress,
  isExpanded,
}: {
  alert: AgasaAlert;
  onPress: () => void;
  isExpanded: boolean;
}) {
  const color = DANGER_COLORS[alert.dangerLevel];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, !alert.isRead && styles.cardUnread, isExpanded && styles.cardExpanded]}
    >
      {/* ── Image de couverture (visible si alerte étendue et imageUrl présente) ── */}
      {isExpanded && alert.imageUrl ? (
        <View style={styles.coverWrap}>
          <Image
            source={{ uri: alert.imageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.45)"]}
            style={styles.coverOverlay}
          />
          <View style={[styles.coverDangerBadge, { backgroundColor: color }]}>
            <AlertBadge level={alert.dangerLevel} size="sm" />
          </View>
        </View>
      ) : (
        <View style={[styles.colorBar, { backgroundColor: color }]} />
      )}

      {/* ── Contenu texte ── */}
      <View style={styles.cardContent}>
        {!isExpanded && (
          <View style={styles.cardHeader}>
            <AlertBadge level={alert.dangerLevel} size="sm" />
            {!alert.isRead && <View style={styles.unreadDot} />}
            {/* Indicateur photo */}
            {alert.imageUrl && (
              <View style={styles.photoBadge}>
                <Ionicons name="image-outline" size={12} color={colors.light.primary} />
              </View>
            )}
            <Text style={styles.cardTime}>{timeAgo(alert.date)}</Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.expandedHeader}>
            <View style={styles.expandedMeta}>
              <Ionicons
                name={alert.zone === "national" ? "earth" : "location"}
                size={13}
                color={color}
              />
              <Text style={[styles.expandedZone, { color }]}>
                {alert.zone === "national" ? "Alerte nationale" : `Alerte locale — ${alert.city || ""}`}
              </Text>
            </View>
            <Text style={styles.cardTime}>{timeAgo(alert.date)}</Text>
          </View>
        )}

        <Text
          style={[styles.cardTitle, isExpanded && styles.cardTitleExpanded]}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {alert.title}
        </Text>

        <Text
          style={[styles.cardMessage, isExpanded && styles.cardMessageExpanded]}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {alert.message}
        </Text>

        {!isExpanded && (
          <View style={styles.cardFooter}>
            <Ionicons
              name={alert.zone === "national" ? "earth" : "location"}
              size={12}
              color={colors.light.mutedForeground}
            />
            <Text style={styles.cardZone}>
              {alert.zone === "national" ? "National" : alert.city || "Local"}
            </Text>
            <Text style={styles.tapHint}>Appuyer pour lire</Text>
          </View>
        )}

        {isExpanded && (
          <Pressable onPress={onPress} style={styles.collapseBtn}>
            <Ionicons name="chevron-up" size={14} color={colors.light.mutedForeground} />
            <Text style={styles.collapseText}>Réduire</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { alerts, unreadCount, markAsRead } = useAlerts();
  const [filterLevel, setFilterLevel] = useState<DangerLevel | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered = alerts.filter(
    (a) => filterLevel === "all" || a.dangerLevel === filterLevel
  );

  const handlePress = (alert: AgasaAlert) => {
    if (!alert.isRead) markAsRead(alert.id);
    setExpandedId((prev) => (prev === alert.id ? null : alert.id));
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#1B7A1B", "#2D9E2D"]} style={styles.header}>
        <Text style={styles.headerTitle}>Alertes AGASA</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0
            ? `${unreadCount} nouvelle${unreadCount > 1 ? "s" : ""} alerte${unreadCount > 1 ? "s" : ""}`
            : "Tout lu"}
        </Text>
      </LinearGradient>

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
            <Text style={[styles.filterText, filterLevel === level && styles.filterTextActive]}>
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
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={() => handlePress(item)}
            isExpanded={expandedId === item.id}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={48} color={colors.light.border} />
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptyDesc}>Aucune alerte pour ce filtre</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { padding: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", marginTop: 2 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.light.secondary },
  filterChipActive: { backgroundColor: colors.light.primary },
  filterText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: "#fff" },
  list: { padding: 16, gap: 12 },

  /* Carte normale */
  card: {
    backgroundColor: colors.light.card,
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUnread: { borderColor: colors.light.primary + "40" },
  cardExpanded: { flexDirection: "column" },

  /* Barre couleur (état non étendu sans image) */
  colorBar: { width: 4 },

  /* Cover image */
  coverWrap: { width: "100%", height: 180, position: "relative" },
  coverImage: { width: "100%", height: "100%" },
  coverOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },
  coverDangerBadge: { position: "absolute", top: 12, left: 12, borderRadius: 8, padding: 4 },

  /* Contenu */
  cardContent: { flex: 1, padding: 14, gap: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.light.primary },
  photoBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.light.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTime: { flex: 1, textAlign: "right", fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  cardTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.light.foreground },
  cardTitleExpanded: { fontSize: 17, marginTop: 4 },
  cardMessage: { fontSize: 13, color: colors.light.foreground, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cardMessageExpanded: { fontSize: 14, lineHeight: 21, color: colors.light.foreground },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardZone: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  tapHint: { flex: 1, textAlign: "right", fontSize: 10, color: colors.light.mutedForeground + "80", fontFamily: "Inter_400Regular", fontStyle: "italic" },

  /* Étendu */
  expandedHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  expandedMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  expandedZone: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  collapseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.light.border },
  collapseText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  emptyDesc: { fontSize: 14, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
});
