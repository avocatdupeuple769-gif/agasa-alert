import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlertBadge } from "@/components/AlertBadge";
import { ReportCard } from "@/components/ReportCard";
import colors from "@/constants/colors";
import { AgasaAlert, DangerLevel, Report, ReportStatus, STATUS_INFO } from "@/constants/types";
import { useAlerts } from "@/context/AlertsContext";
import { useReports } from "@/context/ReportsContext";
import { isSupabaseConfigured, uploadMedia } from "@/lib/supabase";

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { reports, updateReportStatus } = useReports();
  const { addAlert } = useAlerts();

  const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">("all");
  const [showAlertModal, setShowAlertModal] = useState(false);

  /* Champs alerte */
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertLevel, setAlertLevel] = useState<DangerLevel>("medium");
  const [alertZone, setAlertZone] = useState<"national" | "local">("national");
  const [alertCity, setAlertCity] = useState("");
  const [alertImageUri, setAlertImageUri] = useState<string | null>(null);
  const [uploadingAlert, setUploadingAlert] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered = reports.filter((r) => filterStatus === "all" || r.status === filterStatus);
  const pendingCount   = reports.filter((r) => r.status === "pending").length;
  const inProgressCount= reports.filter((r) => r.status === "in_progress").length;
  const resolvedCount  = reports.filter((r) => r.status === "resolved").length;
  const criticalCount  = reports.filter((r) => r.dangerLevel === "high").length;

  const handleStatusChange = (report: Report, newStatus: ReportStatus) => {
    Alert.alert(
      "Changer le statut",
      `Marquer ce signalement comme "${STATUS_INFO[newStatus].label}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: () => updateReportStatus(report.id, newStatus) },
      ]
    );
  };

  /* ── Sélectionner une image pour l'alerte ── */
  const pickAlertImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAlertImageUri(result.assets[0].uri);
    }
  };

  /* ── Envoyer l'alerte (avec image) ── */
  const handleSendAlert = async () => {
    if (!alertTitle.trim() || !alertMessage.trim()) {
      Alert.alert("Erreur", "Veuillez remplir le titre et le message.");
      return;
    }
    setUploadingAlert(true);

    let imageUrl: string | undefined;
    if (alertImageUri && isSupabaseConfigured) {
      const path = `alerts/${Date.now()}.jpg`;
      imageUrl = (await uploadMedia(alertImageUri, "alerts-media", path)) ?? undefined;
    }

    await addAlert({
      title: alertTitle.trim(),
      message: alertMessage.trim(),
      dangerLevel: alertLevel,
      zone: alertZone,
      city: alertZone === "local" ? alertCity : undefined,
      imageUrl,
    });

    setAlertTitle("");
    setAlertMessage("");
    setAlertLevel("medium");
    setAlertZone("national");
    setAlertCity("");
    setAlertImageUri(null);
    setUploadingAlert(false);
    setShowAlertModal(false);
    Alert.alert("Succès", "L'alerte a été envoyée à tous les utilisateurs.");
  };

  const resetModal = () => {
    setAlertTitle("");
    setAlertMessage("");
    setAlertLevel("medium");
    setAlertZone("national");
    setAlertCity("");
    setAlertImageUri(null);
    setShowAlertModal(false);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* ── En-tête ── */}
      <LinearGradient colors={["#1B7A1B", "#0F5A0F"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Tableau de bord</Text>
            <Text style={styles.headerEmail}>Administration AGASA</Text>
          </View>
          <Pressable
            style={styles.logoutBtn}
            onPress={() => router.replace("/(tabs)/")}
          >
            <Ionicons name="close-outline" size={22} color="#fff" />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <StatCard label="Total"       value={reports.length}  color="#fff"     icon="list-outline" />
          <StatCard label="En attente"  value={pendingCount}    color="#FCD34D"  icon="time-outline" />
          <StatCard label="En cours"    value={inProgressCount} color="#60A5FA"  icon="refresh-outline" />
          <StatCard label="Traités"     value={resolvedCount}   color="#34D399"  icon="checkmark-circle-outline" />
          <StatCard label="Critiques"   value={criticalCount}   color="#F87171"  icon="warning-outline" />
        </ScrollView>
      </LinearGradient>

      {/* ── Filtres + bouton alerte ── */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["all", "pending", "in_progress", "resolved"] as const).map((s) => (
            <Pressable
              key={s}
              style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
                {s === "all" ? "Tous" : STATUS_INFO[s].label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.alertBtn} onPress={() => setShowAlertModal(true)}>
          <Ionicons name="megaphone" size={16} color="#fff" />
          <Text style={styles.alertBtnText}>Alerte</Text>
        </Pressable>
      </View>

      {/* ── Liste des signalements ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(tabs)/admin/${item.id}`)}>
            <View style={styles.reportWrap}>
              <ReportCard report={item} showStatus />
              <View style={styles.actionRow}>
                {(["pending", "in_progress", "resolved"] as ReportStatus[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.actionBtn,
                      item.status === s && { backgroundColor: STATUS_INFO[s].color },
                    ]}
                    onPress={() => handleStatusChange(item, s)}
                  >
                    <Text style={[styles.actionBtnText, item.status === s && styles.actionBtnTextActive]}>
                      {STATUS_INFO[s].label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={colors.light.border} />
            <Text style={styles.emptyText}>Aucun signalement</Text>
          </View>
        }
      />

      {/* ── Panneau : Envoyer une alerte officielle (View absolue, pas de portail Modal) ── */}
      {showAlertModal && (
        <View style={styles.modalContainer}>
          <Pressable style={styles.overlay} onPress={resetModal} />
          <ScrollView
            style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Envoyer une alerte officielle</Text>

          {/* Image de l'alerte */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Photo d'illustration (optionnel)</Text>
            {alertImageUri ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: alertImageUri }} style={styles.imagePreview} resizeMode="cover" />
                <Pressable style={styles.removeImageBtn} onPress={() => setAlertImageUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#DC2626" />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.imagePicker} onPress={pickAlertImage}>
                <Ionicons name="camera-outline" size={28} color={colors.light.primary} />
                <Text style={styles.imagePickerText}>Ajouter une photo à l'alerte</Text>
                <Text style={styles.imagePickerHint}>Formats : JPG, PNG · Ratio 16:9 recommandé</Text>
              </Pressable>
            )}
          </View>

          {/* Niveau de danger */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Niveau de danger</Text>
            <View style={styles.levelRow}>
              {(["low", "medium", "high"] as DangerLevel[]).map((l) => (
                <Pressable
                  key={l}
                  style={[
                    styles.levelBtn,
                    alertLevel === l && {
                      backgroundColor: l === "high" ? "#DC2626" : l === "medium" ? "#D97706" : "#16A34A",
                    },
                  ]}
                  onPress={() => setAlertLevel(l)}
                >
                  <Text style={[styles.levelText, alertLevel === l && { color: "#fff" }]}>
                    {l === "high" ? "Danger" : l === "medium" ? "Moyen" : "Faible"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Zone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Zone</Text>
            <View style={styles.levelRow}>
              {(["national", "local"] as const).map((z) => (
                <Pressable
                  key={z}
                  style={[styles.levelBtn, alertZone === z && styles.levelBtnActive]}
                  onPress={() => setAlertZone(z)}
                >
                  <Text style={[styles.levelText, alertZone === z && { color: "#fff" }]}>
                    {z === "national" ? "Nationale" : "Locale"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {alertZone === "local" && (
            <TextInput
              style={styles.input}
              placeholder="Ville concernée"
              placeholderTextColor={colors.light.mutedForeground}
              value={alertCity}
              onChangeText={setAlertCity}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Titre de l'alerte"
            placeholderTextColor={colors.light.mutedForeground}
            value={alertTitle}
            onChangeText={setAlertTitle}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Message de l'alerte..."
            placeholderTextColor={colors.light.mutedForeground}
            value={alertMessage}
            onChangeText={setAlertMessage}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.sendAlertBtn, uploadingAlert && { opacity: 0.6 }]}
            onPress={handleSendAlert}
            disabled={uploadingAlert}
          >
            {uploadingAlert ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="megaphone" size={18} color="#fff" />
                <Text style={styles.sendAlertText}>Envoyer l'alerte</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.light.background },
  header:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 16 },
  headerTop:       { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle:     { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  headerEmail:     { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  logoutBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  statsRow:        { flexDirection: "row", gap: 10 },
  statCard:        { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, alignItems: "center", gap: 4, minWidth: 80, borderTopWidth: 3 },
  statValue:       { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel:       { fontSize: 10, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", textAlign: "center" },
  toolbar:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterRow:       { flexDirection: "row", gap: 6 },
  filterChip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.light.secondary },
  filterChipActive:{ backgroundColor: colors.light.primary },
  filterText:      { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  filterTextActive:{ color: "#fff" },
  alertBtn:        { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.light.danger, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  alertBtnText:    { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  list:            { padding: 16, gap: 12 },
  reportWrap:      { gap: 8 },
  actionRow:       { flexDirection: "row", gap: 6 },
  actionBtn:       { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: "center", backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border },
  actionBtnText:   { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  actionBtnTextActive: { color: "#fff" },
  empty:           { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyText:       { fontSize: 16, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  overlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalContainer:  { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 100 },

  /* Modal */
  modalSheet: {
    backgroundColor: colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.light.border, alignSelf: "center", marginBottom: 12 },
  modalTitle:   { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 16 },
  inputGroup:   { gap: 8, marginBottom: 14 },
  inputLabel:   { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.foreground },

  /* Image picker */
  imagePicker: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.light.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.light.background,
  },
  imagePickerText: { fontSize: 14, color: colors.light.primary, fontFamily: "Inter_600SemiBold" },
  imagePickerHint: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  imagePreviewWrap: { position: "relative", borderRadius: 12, overflow: "hidden" },
  imagePreview:    { width: "100%", height: 160, borderRadius: 12 },
  removeImageBtn:  { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 12 },

  levelRow:     { flexDirection: "row", gap: 8 },
  levelBtn:     { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border },
  levelBtnActive: { backgroundColor: colors.light.primary },
  levelText:    { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  input: {
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.light.foreground,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  textarea:      { height: 100, textAlignVertical: "top" },
  sendAlertBtn:  { backgroundColor: colors.light.danger, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, marginBottom: 20 },
  sendAlertText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
