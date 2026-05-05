import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlertBadge } from "@/components/AlertBadge";
import colors from "@/constants/colors";
import { DANGER_COLORS, REPORT_TYPE_INFO, STATUS_INFO } from "@/constants/types";
import { useReports } from "@/context/ReportsContext";

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getReportById, updateReportStatus } = useReports();
  const report = getReportById(id);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [brokenPhotos, setBrokenPhotos] = useState<Set<string>>(new Set());
  const markBroken = useCallback((uri: string) => {
    setBrokenPhotos((prev) => new Set(prev).add(uri));
  }, []);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  if (!report) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.notFound}>Signalement introuvable</Text>
      </View>
    );
  }

  const typeInfo = REPORT_TYPE_INFO[report.type];
  const statusInfo = STATUS_INFO[report.status];
  const photos = report.photos ?? [];
  const videos = report.videos ?? [];
  const hasMedia = photos.length > 0 || videos.length > 0;

  return (
    <View style={styles.root}>
      <ScrollView
        style={[styles.container, { paddingTop: topPad }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Barre navigation ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.light.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Détail du signalement</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Type + badge ── */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.typeLabel}>{typeInfo.label}</Text>
            <AlertBadge level={report.dangerLevel} />
          </View>
          <Text style={styles.refText}>Réf : #{report.id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* ── GALERIE PHOTOS & VIDÉOS ── */}
        {hasMedia && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="images-outline" size={16} color={colors.light.primary} />
              <Text style={[styles.cardTitle, { color: colors.light.primary }]}>
                Médias joints ({photos.length + videos.length})
              </Text>
            </View>

            {/* Photo principale grande */}
            {photos.length > 0 && (
              brokenPhotos.has(photos[0]) ? (
                <View style={styles.photoBroken}>
                  <Ionicons name="image-outline" size={32} color={colors.light.mutedForeground} />
                  <Text style={styles.photoBrokenText}>Photo non disponible</Text>
                  <Text style={styles.photoBrokenHint}>Le fichier a été supprimé ou n'est plus accessible</Text>
                </View>
              ) : (
                <Pressable onPress={() => setLightboxUri(photos[0])} style={styles.mainPhotoWrap}>
                  <Image
                    source={{ uri: photos[0] }}
                    style={styles.mainPhoto}
                    resizeMode="cover"
                    onError={() => markBroken(photos[0])}
                  />
                  <View style={styles.zoomHint}>
                    <Ionicons name="expand-outline" size={14} color="#fff" />
                    <Text style={styles.zoomText}>Appuyer pour agrandir</Text>
                  </View>
                </Pressable>
              )
            )}

            {/* Grille des autres photos */}
            {photos.length > 1 && (
              <View style={styles.photoGrid}>
                {photos.slice(1).map((uri, i) => (
                  <Pressable key={i} onPress={() => !brokenPhotos.has(uri) && setLightboxUri(uri)} style={styles.gridThumbWrap}>
                    {brokenPhotos.has(uri) ? (
                      <View style={[styles.gridThumb, styles.gridThumbBroken]}>
                        <Ionicons name="image-outline" size={20} color={colors.light.mutedForeground} />
                      </View>
                    ) : (
                      <Image
                        source={{ uri }}
                        style={styles.gridThumb}
                        resizeMode="cover"
                        onError={() => markBroken(uri)}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Vidéos */}
            {videos.length > 0 && (
              <View style={styles.videoSection}>
                <Text style={styles.videoSectionTitle}>
                  Vidéos ({videos.length})
                </Text>
                {videos.map((_, i) => (
                  <View key={i} style={styles.videoRow}>
                    <View style={styles.videoIconWrap}>
                      <Ionicons name="play-circle" size={32} color="#fff" />
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoName}>Vidéo {i + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Signalant ── */}
        {report.reporter && (
          <View style={[styles.card, styles.reporterCard]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person" size={16} color={colors.light.primary} />
              <Text style={[styles.cardTitle, { color: colors.light.primary }]}>
                Informations du signalant
              </Text>
              <View style={styles.confidentialBadge}>
                <Ionicons name="lock-closed" size={10} color="#fff" />
                <Text style={styles.confidentialText}>Confidentiel</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={15} color={colors.light.mutedForeground} />
              <Text style={styles.metaText}>{report.reporter.prenom} {report.reporter.nom}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="home-outline" size={15} color={colors.light.mutedForeground} />
              <Text style={styles.metaText}>Quartier : {report.reporter.quartier}</Text>
            </View>
          </View>
        )}

        {/* ── Localisation ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localisation</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={16} color={colors.light.primary} />
            <Text style={styles.metaText}>
              {report.location.city || "N/A"}
              {report.location.province ? `, ${report.location.province}` : ""}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="map-outline" size={16} color={colors.light.mutedForeground} />
            <Text style={styles.metaText}>
              {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}
            </Text>
          </View>
          {report.location.address && (
            <View style={styles.metaRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.light.mutedForeground} />
              <Text style={styles.metaText}>{report.location.address}</Text>
            </View>
          )}
        </View>

        {/* ── Description ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.description}>
            {report.description || "Aucune description fournie."}
          </Text>
        </View>

        {/* ── Infos ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.light.mutedForeground} />
            <Text style={styles.metaText}>
              {new Date(report.date).toLocaleDateString("fr-FR", {
                year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="alert-circle-outline" size={16} color={DANGER_COLORS[report.dangerLevel]} />
            <Text style={[styles.metaText, { color: DANGER_COLORS[report.dangerLevel] }]}>
              Niveau de danger :{" "}
              {report.dangerLevel === "high" ? "Élevé" : report.dangerLevel === "medium" ? "Moyen" : "Faible"}
            </Text>
          </View>
        </View>

        {/* ── Statut actuel ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statut actuel</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Changer le statut :</Text>
          <View style={styles.actionBtns}>
            {(["pending", "in_progress", "resolved"] as const).map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.actionBtn,
                  report.status === s && { backgroundColor: STATUS_INFO[s].color + "15" },
                  { borderColor: STATUS_INFO[s].color },
                ]}
                onPress={() => updateReportStatus(report.id, s)}
              >
                <Ionicons
                  name={s === "pending" ? "time-outline" : s === "in_progress" ? "refresh-outline" : "checkmark-circle-outline"}
                  size={14}
                  color={report.status === s ? STATUS_INFO[s].color : colors.light.mutedForeground}
                />
                <Text style={[styles.actionText, report.status === s && { color: STATUS_INFO[s].color }]}>
                  {STATUS_INFO[s].label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Lightbox plein écran (View absolue, pas de Modal/portail) ── */}
      {lightboxUri && (
        <Pressable style={styles.lightboxBg} onPress={() => setLightboxUri(null)}>
          <Image source={{ uri: lightboxUri }} style={styles.lightboxImage} resizeMode="contain" />
          <Pressable style={styles.lightboxClose} onPress={() => setLightboxUri(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.light.background },
  content: { paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", paddingBottom: 4 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  section: { gap: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeLabel: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.light.foreground, flex: 1 },
  refText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },

  card: { backgroundColor: colors.light.card, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.light.border },
  reporterCard: { borderColor: colors.light.primary + "40", backgroundColor: colors.light.primary + "06" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground, flex: 1 },
  confidentialBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.light.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  confidentialText: { fontSize: 9, color: "#fff", fontFamily: "Inter_600SemiBold" },

  mainPhotoWrap: { position: "relative", borderRadius: 10, overflow: "hidden" },
  mainPhoto: { width: "100%", height: 220, borderRadius: 10 },
  zoomHint: { position: "absolute", bottom: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  zoomText: { fontSize: 11, color: "#fff", fontFamily: "Inter_400Regular" },
  photoBroken: { height: 140, borderRadius: 10, borderWidth: 1.5, borderColor: colors.light.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.light.secondary },
  photoBrokenText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  photoBrokenHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground, textAlign: "center", paddingHorizontal: 16 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  gridThumbWrap: { width: "31.5%", aspectRatio: 1, borderRadius: 8, overflow: "hidden" },
  gridThumb: { width: "100%", height: "100%" },
  gridThumbBroken: { backgroundColor: colors.light.secondary, alignItems: "center", justifyContent: "center" },

  videoSection: { gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.light.border },
  videoSectionTitle: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  videoRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1C1C1E", borderRadius: 10, padding: 10 },
  videoIconWrap: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  videoInfo: { flex: 1 },
  videoName: { fontSize: 13, fontWeight: "600", color: "#fff", fontFamily: "Inter_600SemiBold" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 14, color: colors.light.foreground, fontFamily: "Inter_400Regular", flex: 1 },
  description: { fontSize: 14, color: colors.light.foreground, fontFamily: "Inter_400Regular", lineHeight: 20 },
  statusBadge: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  actionsSection: { gap: 10, paddingBottom: 8 },
  actionsTitle: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  actionBtns: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.light.border, backgroundColor: colors.light.card, gap: 4 },
  actionText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  notFound: { fontSize: 16, textAlign: "center", marginTop: 100, color: colors.light.mutedForeground },

  lightboxBg: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center", justifyContent: "center",
    zIndex: 999,
  },
  lightboxImage: { width: "100%", height: "85%" },
  lightboxClose: {
    position: "absolute", top: 50, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
});
