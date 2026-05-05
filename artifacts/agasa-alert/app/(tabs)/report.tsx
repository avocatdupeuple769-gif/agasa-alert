import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import colors from "@/constants/colors";
import {
  DangerLevel,
  GABON_PROVINCES,
  GabonProvince,
  GeoLocation,
  Reporter,
  ReportType,
  REPORT_TYPE_INFO,
} from "@/constants/types";
import { useReports } from "@/context/ReportsContext";

const STEPS = ["Identité", "Photo", "Localisation", "Type", "Description"];

function TypeIcon({
  icon,
  iconFamily,
  color,
  size = 22,
}: {
  icon: string;
  iconFamily: string;
  color: string;
  size?: number;
}) {
  if (iconFamily === "Ionicons") {
    return <Ionicons name={icon as any} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
}

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { addReport } = useReports();
  const [step, setStep] = useState(0);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [quartier, setQuartier] = useState("");

  const [photos, setPhotos] = useState<string[]>([]);

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [manualCity, setManualCity] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<GabonProvince | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const [selectedType, setSelectedType] = useState<ReportType | null>(null);

  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const safeHaptic = async (fn: () => Promise<void>) => {
    try { await fn(); } catch {}
  };

  const pickImage = async (fromCamera: boolean) => {
    try {
      const fn = fromCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await fn({
        mediaTypes: ["images"] as any,
        quality: 0.6,
        allowsMultipleSelection: !fromCamera,
        selectionLimit: 3 - photos.length,
      });
      if (!result.canceled) {
        const uris = result.assets.map((a) => a.uri).slice(0, 3 - photos.length);
        setPhotos((prev) => [...prev, ...uris].slice(0, 3));
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'accéder à la galerie ou la caméra.");
    }
  };

  const getLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const detectedProvince = geo?.region as GabonProvince | undefined;
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        city: geo?.city || geo?.subregion || undefined,
        province: detectedProvince || selectedProvince || undefined,
        address: geo?.street || undefined,
      });
      if (
        detectedProvince &&
        GABON_PROVINCES.includes(detectedProvince as GabonProvince)
      ) {
        setSelectedProvince(detectedProvince as GabonProvince);
      }
    } catch {
      Alert.alert(
        "Erreur GPS",
        "Impossible d'obtenir votre position. Sélectionnez votre province manuellement."
      );
    }
    setLocLoading(false);
  };

  const handleSend = async () => {
    if (!selectedType) return;
    setSending(true);
    try {
      await safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      const loc: GeoLocation = location || {
        latitude: 0.4162,
        longitude: 9.4673,
        city: manualCity || "Gabon",
        province: selectedProvince || undefined,
      };
      if (selectedProvince && !loc.province) {
        loc.province = selectedProvince;
      }
      const dangerMap: Record<ReportType, DangerLevel> = {
        perime: "high",
        interdit: "high",
        hygiene: "medium",
        lieu_sale: "low",
        prix_abusif: "medium",
        falsifie: "high",
        intoxication: "high",
      };
      const reporter: Reporter | undefined =
        nom.trim() || prenom.trim() || quartier.trim()
          ? { nom: nom.trim(), prenom: prenom.trim(), quartier: quartier.trim() }
          : undefined;

      const id = await addReport({
        type: selectedType,
        description,
        photos,
        location: loc,
        dangerLevel: dangerMap[selectedType],
        reporter,
      });
      setReportId(id);
      setSuccess(true);
    } catch (err) {
      Alert.alert(
        "Erreur d'envoi",
        "Votre signalement n'a pas pu être envoyé. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setStep(0);
    setNom("");
    setPrenom("");
    setQuartier("");
    setPhotos([]);
    setLocation(null);
    setManualCity("");
    setSelectedProvince(null);
    setSelectedType(null);
    setDescription("");
    setSuccess(false);
    setReportId(null);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {success && (
        <View style={styles.successOverlay}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={88} color={colors.light.success} />
          </View>
          <Text style={styles.successTitle}>Signalement envoyé !</Text>
          <Text style={styles.successSubtitle}>
            Votre signalement a été transmis à l'AGASA. Nos agents vont l'examiner.
          </Text>
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>Référence de votre signalement</Text>
            <Text style={styles.idValue}>#{reportId?.slice(-8).toUpperCase()}</Text>
          </View>
          <Text style={styles.offlineNote}>
            Conservez cette référence. Votre anonymat est protégé.
          </Text>
          <Pressable style={styles.newBtn} onPress={reset}>
            <Text style={styles.newBtnText}>Nouveau signalement</Text>
          </Pressable>
          <Pressable
            style={styles.homeBtn}
            onPress={() => {
              reset();
              router.back();
            }}
          >
            <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      )}
      {!success && (
      <>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step === 0) router.back();
            else setStep((s) => s - 1);
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.light.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Signalement</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* STEP BAR */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={11} color="#fff" />
              ) : (
                <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>
      <Text style={styles.stepLabelText}>
        Étape {step + 1}/{STEPS.length} — {STEPS[step]}
      </Text>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 0 : IDENTITÉ ── */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Votre identité</Text>
            <Text style={styles.stepDesc}>
              Ces informations permettent à l'AGASA de vous contacter si nécessaire.
              Elles restent confidentielles.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Prénom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Jean-Pierre"
                placeholderTextColor={colors.light.mutedForeground}
                value={prenom}
                onChangeText={setPrenom}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Ondo Mba"
                placeholderTextColor={colors.light.mutedForeground}
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Quartier de résidence *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Akanda, Louis, Glass..."
                placeholderTextColor={colors.light.mutedForeground}
                value={quartier}
                onChangeText={setQuartier}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.confidentialBanner}>
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={colors.light.primary}
              />
              <Text style={styles.confidentialText}>
                Vos données personnelles sont protégées et ne seront pas divulguées publiquement.
              </Text>
            </View>

            <Pressable
              style={[
                styles.nextBtn,
                (!prenom.trim() || !nom.trim() || !quartier.trim()) && styles.nextBtnDisabled,
              ]}
              onPress={() => setStep(1)}
              disabled={!prenom.trim() || !nom.trim() || !quartier.trim()}
            >
              <Text style={styles.nextBtnText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* ── STEP 1 : PHOTO ── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Photos du problème</Text>
            <Text style={styles.stepDesc}>
              Ajoutez 1 à 3 photos du problème constaté (facultatif mais recommandé)
            </Text>
            <View style={styles.photoGrid}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photo} />
                  <Pressable
                    style={styles.removePhoto}
                    onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.light.destructive}
                    />
                  </Pressable>
                </View>
              ))}
              {photos.length < 3 && (
                <View style={styles.photoActions}>
                  <Pressable style={styles.photoBtn} onPress={() => pickImage(true)}>
                    <Ionicons name="camera" size={28} color={colors.light.primary} />
                    <Text style={styles.photoBtnLabel}>Caméra</Text>
                  </Pressable>
                  <Pressable style={styles.photoBtn} onPress={() => pickImage(false)}>
                    <Ionicons name="images" size={28} color={colors.light.primary} />
                    <Text style={styles.photoBtnLabel}>Galerie</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <Pressable style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextBtnText}>
                {photos.length === 0 ? "Passer cette étape" : "Continuer"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* ── STEP 2 : LOCALISATION ── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Localisation</Text>
            <Text style={styles.stepDesc}>
              Où se trouve le problème ? Sélectionnez votre province.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Province *</Text>
              <View style={styles.provinceGrid}>
                {GABON_PROVINCES.map((p) => (
                  <Pressable
                    key={p}
                    style={[
                      styles.provinceChip,
                      selectedProvince === p && styles.provinceChipActive,
                    ]}
                    onPress={() => {
                      setSelectedProvince(p);
                      safeHaptic(() => Haptics.selectionAsync());
                    }}
                  >
                    <Text
                      style={[
                        styles.provinceChipText,
                        selectedProvince === p && styles.provinceChipTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {location ? (
              <View style={styles.locationCard}>
                <Ionicons name="location" size={22} color={colors.light.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationCity}>
                    {location.city || "Position GPS détectée"}
                  </Text>
                  {location.province && (
                    <Text style={styles.locationProv}>{location.province}</Text>
                  )}
                  <Text style={styles.locationCoords}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>
                <Pressable onPress={() => setLocation(null)}>
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={colors.light.mutedForeground}
                  />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.gpsBtn} onPress={getLocation} disabled={locLoading}>
                {locLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="locate" size={22} color="#fff" />
                )}
                <Text style={styles.gpsBtnText}>
                  {locLoading ? "Détection en cours..." : "Détecter ma position GPS"}
                </Text>
              </Pressable>
            )}

            <Text style={styles.orLabel}>— ou précisez votre ville/quartier —</Text>
            <TextInput
              style={styles.input}
              placeholder="Ville ou quartier du problème"
              placeholderTextColor={colors.light.mutedForeground}
              value={manualCity}
              onChangeText={setManualCity}
            />

            <Pressable
              style={[
                styles.nextBtn,
                !selectedProvince && !location && !manualCity && styles.nextBtnDisabled,
              ]}
              onPress={() => setStep(3)}
              disabled={!selectedProvince && !location && !manualCity}
            >
              <Text style={styles.nextBtnText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* ── STEP 3 : TYPE ── */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Type de problème</Text>
            <Text style={styles.stepDesc}>Sélectionnez la catégorie du problème</Text>
            <View style={styles.typeGrid}>
              {(
                Object.entries(REPORT_TYPE_INFO) as [
                  ReportType,
                  (typeof REPORT_TYPE_INFO)[ReportType],
                ][]
              ).map(([key, info]) => (
                <Pressable
                  key={key}
                  style={[styles.typeCard, selectedType === key && styles.typeCardSelected]}
                  onPress={() => {
                    setSelectedType(key);
                    safeHaptic(() => Haptics.selectionAsync());
                  }}
                >
                  <TypeIcon
                    icon={info.icon}
                    iconFamily={info.iconFamily}
                    color={selectedType === key ? "#fff" : colors.light.primary}
                    size={26}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      selectedType === key && styles.typeLabelSelected,
                    ]}
                  >
                    {info.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.nextBtn, !selectedType && styles.nextBtnDisabled]}
              onPress={() => setStep(4)}
              disabled={!selectedType}
            >
              <Text style={styles.nextBtnText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* ── STEP 4 : DESCRIPTION ── */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Description</Text>
            <Text style={styles.stepDesc}>
              Décrivez brièvement le problème (facultatif mais recommandé)
            </Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              <View style={styles.summaryRow}>
                <Ionicons name="person-outline" size={14} color={colors.light.mutedForeground} />
                <Text style={styles.summaryText}>
                  {prenom} {nom} · {quartier}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="location-outline" size={14} color={colors.light.mutedForeground} />
                <Text style={styles.summaryText}>
                  {selectedProvince || location?.province || manualCity || "Gabon"}
                  {location?.city ? ` · ${location.city}` : ""}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.light.mutedForeground} />
                <Text style={styles.summaryText}>
                  {selectedType ? REPORT_TYPE_INFO[selectedType].label : "—"}
                </Text>
              </View>
              {photos.length > 0 && (
                <View style={styles.summaryRow}>
                  <Ionicons name="camera-outline" size={14} color={colors.light.mutedForeground} />
                  <Text style={styles.summaryText}>{photos.length} photo(s) jointe(s)</Text>
                </View>
              )}
            </View>

            <TextInput
              style={styles.textarea}
              placeholder='Ex: "Poisson avarié vendu au marché de Mont-Bouët depuis ce matin"'
              placeholderTextColor={colors.light.mutedForeground}
              multiline
              maxLength={300}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/300</Text>
            <Pressable
              style={[styles.sendBtn, sending && styles.nextBtnDisabled]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.nextBtnText}>Envoyer le signalement</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  stepBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: colors.light.primary },
  stepLine: { width: 28, height: 2, backgroundColor: colors.light.border },
  stepLineActive: { backgroundColor: colors.light.primary },
  stepNum: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
  },
  stepNumActive: { color: "#fff" },
  stepLabelText: {
    textAlign: "center",
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  stepContent: { gap: 16 },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
    backgroundColor: colors.light.card,
  },
  confidentialBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.light.primary + "10",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.light.primary + "30",
  },
  confidentialText: {
    flex: 1,
    fontSize: 12,
    color: colors.light.primary,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  nextBtn: {
    backgroundColor: colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  photoGrid: { gap: 10 },
  photoWrap: { position: "relative" },
  photo: { width: "100%", height: 180, borderRadius: 12 },
  removePhoto: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 11,
  },
  photoActions: {
    flexDirection: "row",
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    borderRadius: 12,
    borderStyle: "dashed",
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.light.card,
  },
  photoBtnLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.primary,
  },
  provinceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  provinceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    backgroundColor: colors.light.card,
  },
  provinceChipActive: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primary,
  },
  provinceChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  provinceChipTextActive: { color: "#fff" },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.light.primary + "10",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.light.primary + "30",
  },
  locationCity: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  locationProv: {
    fontSize: 13,
    color: colors.light.primary,
    fontFamily: "Inter_500Medium",
  },
  locationCoords: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  gpsBtn: {
    backgroundColor: colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  gpsBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  orLabel: {
    textAlign: "center",
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%",
    borderWidth: 1.5,
    borderColor: colors.light.border,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.light.card,
  },
  typeCardSelected: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primary,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
    textAlign: "center",
  },
  typeLabelSelected: { color: "#fff" },
  summaryCard: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginBottom: 2,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryText: {
    fontSize: 13,
    color: colors.light.foreground,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
    backgroundColor: colors.light.card,
    minHeight: 100,
  },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
    zIndex: 10,
  },
  successIcon: { marginBottom: 8 },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  idBox: {
    backgroundColor: colors.light.primary + "10",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.light.primary + "30",
    width: "100%",
  },
  idLabel: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  idValue: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
    letterSpacing: 2,
  },
  offlineNote: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  newBtn: {
    backgroundColor: colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  newBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  homeBtn: {
    borderWidth: 1.5,
    borderColor: colors.light.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  homeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
});
