import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useAdmin } from "@/context/AdminContext";

export default function AdminLoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) {
      router.replace("/(tabs)/admin/dashboard");
    } else {
      Alert.alert("Accès refusé", "Email ou mot de passe incorrect.");
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <LinearGradient colors={["#1B7A1B", "#2D9E2D"]} style={styles.logoBox}>
        <Image
          source={require("@/assets/images/agasa-logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.shieldIcon}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </View>
      </LinearGradient>

      <Text style={styles.title}>Administration AGASA</Text>
      <Text style={styles.subtitle}>
        Accès réservé aux agents autorisés de l'AGASA
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.light.mutedForeground} />
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor={colors.light.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mot de passe</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.light.mutedForeground} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.light.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowPassword((s) => !s)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.light.mutedForeground}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.loginBtnText}>Se connecter</Text>
            </>
          )}
        </Pressable>

        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.light.mutedForeground} />
          <Text style={styles.hintText}>
            Accès sécurisé — identifiants fournis par l'AGASA
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.light.background },
  container: { paddingHorizontal: 24, gap: 16 },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    position: "relative",
  },
  logo: { width: 72, height: 72, borderRadius: 16 },
  shieldIcon: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: colors.light.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  form: { gap: 16, marginTop: 8 },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.light.border,
    paddingHorizontal: 14,
    gap: 10,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.light.foreground,
    fontFamily: "Inter_400Regular",
  },
  loginBtn: {
    backgroundColor: colors.light.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
});
