import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { AlertBadge } from "@/components/AlertBadge";
import colors from "@/constants/colors";
import { Report, REPORT_TYPE_INFO, STATUS_INFO } from "@/constants/types";

interface ReportCardProps {
  report: Report;
  showStatus?: boolean;
}

function TypeIcon({ type, size = 20 }: { type: Report["type"]; size?: number }) {
  const info = REPORT_TYPE_INFO[type];
  const color = colors.light.primary;
  if (info.iconFamily === "Ionicons") {
    return <Ionicons name={info.icon as any} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={info.icon as any} size={size} color={color} />;
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

export function ReportCard({ report, showStatus = false }: ReportCardProps) {
  const typeInfo = REPORT_TYPE_INFO[report.type];
  const statusInfo = STATUS_INFO[report.status];
  const allMedia = [...(report.photos ?? []), ...(report.videos ?? [])];
  const hasPhotos = (report.photos ?? []).length > 0;
  const hasVideos = (report.videos ?? []).length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <TypeIcon type={report.type} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.typeLabel}>{typeInfo.label}</Text>
          <Text style={styles.time}>{timeAgo(report.date)}</Text>
        </View>
        <AlertBadge level={report.dangerLevel} size="sm" />
      </View>

      {!!report.description && (
        <Text style={styles.description} numberOfLines={2}>
          {report.description}
        </Text>
      )}

      {/* ── Aperçu photos/vidéos ── */}
      {allMedia.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaRow}
        >
          {(report.photos ?? []).slice(0, 4).map((uri, i) => (
            <View key={`p-${i}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
            </View>
          ))}
          {(report.videos ?? []).slice(0, 2).map((_, i) => (
            <View key={`v-${i}`} style={[styles.thumbWrap, styles.videoThumb]}>
              <Ionicons name="play-circle" size={28} color="#fff" />
              <Text style={styles.videoLabel}>Vidéo</Text>
            </View>
          ))}
          {allMedia.length > 4 && (
            <View style={[styles.thumbWrap, styles.moreThumb]}>
              <Text style={styles.moreText}>+{allMedia.length - 4}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Ionicons name="location-outline" size={12} color={colors.light.mutedForeground} />
        <Text style={styles.location}>
          {report.location.city || "Gabon"}
          {report.location.province ? `, ${report.location.province}` : ""}
        </Text>
        {/* Indicateurs médias */}
        {hasPhotos && (
          <View style={styles.mediaBadge}>
            <Ionicons name="image-outline" size={11} color={colors.light.primary} />
            <Text style={styles.mediaBadgeText}>{report.photos.length}</Text>
          </View>
        )}
        {hasVideos && (
          <View style={[styles.mediaBadge, styles.videoBadge]}>
            <Ionicons name="videocam-outline" size={11} color="#7C3AED" />
            <Text style={[styles.mediaBadgeText, { color: "#7C3AED" }]}>{report.videos!.length}</Text>
          </View>
        )}
        {showStatus && (
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "20" }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        )}
        {!report.isSynced && (
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={12} color={colors.light.mutedForeground} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.light.secondary,
    alignItems: "center", justifyContent: "center",
  },
  meta: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: "600", color: colors.light.foreground, fontFamily: "Inter_600SemiBold" },
  time: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 1 },
  description: { fontSize: 13, color: colors.light.foreground, fontFamily: "Inter_400Regular", lineHeight: 18 },

  /* Media thumbnails */
  mediaRow: { flexDirection: "row", gap: 6, paddingVertical: 2 },
  thumbWrap: {
    width: 72, height: 72, borderRadius: 8, overflow: "hidden",
    backgroundColor: colors.light.secondary,
  },
  thumb: { width: "100%", height: "100%" },
  videoThumb: {
    backgroundColor: "#1C1C1E",
    alignItems: "center", justifyContent: "center", gap: 2,
  },
  videoLabel: { fontSize: 9, color: "#fff", fontFamily: "Inter_400Regular" },
  moreThumb: {
    backgroundColor: colors.light.border,
    alignItems: "center", justifyContent: "center",
  },
  moreText: { fontSize: 15, fontWeight: "700", color: colors.light.mutedForeground, fontFamily: "Inter_700Bold" },

  footer: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", flex: 1 },
  mediaBadge: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: colors.light.primary + "15",
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
  },
  videoBadge: { backgroundColor: "#7C3AED15" },
  mediaBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  statusText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
});
