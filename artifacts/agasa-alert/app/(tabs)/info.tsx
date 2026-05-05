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

import colors from "@/constants/colors";

interface InfoItem {
  id: string;
  category: string;
  icon: string;
  title: string;
  content: string;
}

const INFO_ITEMS: InfoItem[] = [
  {
    id: "1",
    category: "Alimentation",
    icon: "restaurant-outline",
    title: "Comment détecter un produit périmé ?",
    content:
      "Vérifiez toujours la date de péremption sur l'emballage. Un produit périmé peut présenter une odeur inhabituelle, une coloration anormale, ou une texture différente. En cas de doute, ne consommez pas le produit et signalez-le à l'AGASA.",
  },
  {
    id: "2",
    category: "Hygiène",
    icon: "hand-right-outline",
    title: "Bonnes pratiques d'hygiène alimentaire",
    content:
      "Lavez-vous toujours les mains avant de manipuler des aliments. Les ustensiles de cuisine doivent être propres. Conservez les aliments à la bonne température : les produits frais doivent être réfrigérés en dessous de 4°C.",
  },
  {
    id: "3",
    category: "Prix",
    icon: "pricetag-outline",
    title: "Comment reconnaître un prix abusif ?",
    content:
      "L'AGASA fixe des prix de référence pour les denrées de base. Si un commerçant vous facture significativement plus que le prix officiel affiché, il s'agit d'un prix abusif. Documentez le prix avec une photo et signalez-le.",
  },
  {
    id: "4",
    category: "Alimentation",
    icon: "warning-outline",
    title: "Produits interdits à surveiller",
    content:
      "Certains produits sont interdits à la vente au Gabon car non conformes aux normes sanitaires. Méfiez-vous des produits sans étiquette en français, sans date de fabrication, ou avec des emballages endommagés.",
  },
  {
    id: "5",
    category: "Santé",
    icon: "medkit-outline",
    title: "Que faire en cas d'intoxication alimentaire ?",
    content:
      "En cas de symptômes (nausées, vomissements, diarrhées) après un repas, consultez immédiatement un médecin. Conservez le reste de l'aliment suspect pour analyse. Signalez l'intoxication à l'AGASA avec les détails du lieu et du produit.",
  },
  {
    id: "6",
    category: "Signalement",
    icon: "phone-portrait-outline",
    title: "Comment bien signaler avec AGASA Alert ?",
    content:
      "Pour un signalement efficace : prenez une photo claire du problème, activez le GPS pour localiser précisément, sélectionnez le type de problème correct, et ajoutez une description détaillée. Plus d'informations = intervention plus rapide.",
  },
  {
    id: "7",
    category: "Hygiène",
    icon: "business-outline",
    title: "Critères d'un établissement alimentaire propre",
    content:
      "Un restaurant ou marché propre doit avoir : sols et surfaces propres, personnel avec tenue hygiénique, produits stockés à l'abri des insectes, eau courante disponible, et absence d'odeurs nauséabondes.",
  },
  {
    id: "8",
    category: "Santé",
    icon: "fish-outline",
    title: "Sécurité des produits de la mer",
    content:
      "Le poisson et les fruits de mer se dégradent rapidement. Achetez uniquement des produits frais exposés sur glace ou réfrigérés. Un poisson frais a les yeux clairs et brillants, les branchies roses, et une odeur marine légère.",
  },
];

const CATEGORIES = ["Tous", "Alimentation", "Hygiène", "Santé", "Prix", "Signalement"];

export default function InfoScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [expanded, setExpanded] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered =
    selectedCategory === "Tous"
      ? INFO_ITEMS
      : INFO_ITEMS.filter((i) => i.category === selectedCategory);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#D4A52A", "#C49218"]} style={styles.header}>
        <Ionicons name="information-circle" size={32} color="#fff" />
        <View>
          <Text style={styles.headerTitle}>Informations & Conseils</Text>
          <Text style={styles.headerSubtitle}>Guide santé alimentaire</Text>
        </View>
      </LinearGradient>

      <View>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.catChip, selectedCategory === item && styles.catChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catText, selectedCategory === item && styles.catTextActive]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        renderItem={({ item, index }) => (
          <View>
            <Pressable
              style={styles.infoCard}
              onPress={() => setExpanded((prev) => (prev === item.id ? null : item.id))}
            >
              <View style={styles.infoHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon as any} size={22} color={colors.light.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catBadge}>{item.category}</Text>
                  <Text style={styles.infoTitle}>{item.title}</Text>
                </View>
                <Ionicons
                  name={expanded === item.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.light.mutedForeground}
                />
              </View>
              {expanded === item.id && (
                <Text style={styles.infoContent}>{item.content}</Text>
              )}
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: colors.light.secondary,
  },
  catChipActive: { backgroundColor: colors.light.accent },
  catText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  catTextActive: { color: "#fff" },
  list: { padding: 16, gap: 10 },
  infoCard: {
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.light.accent + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  catBadge: { fontSize: 10, color: colors.light.accent, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  infoTitle: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  infoContent: {
    fontSize: 13,
    color: colors.light.foreground,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    paddingTop: 4,
  },
});
