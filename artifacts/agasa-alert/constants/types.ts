export type ReportType =
  | "perime"
  | "interdit"
  | "hygiene"
  | "lieu_sale"
  | "prix_abusif"
  | "falsifie"
  | "intoxication";

export type DangerLevel = "high" | "medium" | "low";
export type ReportStatus = "pending" | "in_progress" | "resolved";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
  address?: string;
}

export interface Reporter {
  nom: string;
  prenom: string;
  quartier: string;
}

export interface Report {
  id: string;
  type: ReportType;
  description: string;
  photos: string[];
  videos?: string[];
  location: GeoLocation;
  date: string;
  status: ReportStatus;
  dangerLevel: DangerLevel;
  isSynced: boolean;
  priceAmount?: number;
  reporter?: Reporter;
}

export interface AgasaAlert {
  id: string;
  title: string;
  message: string;
  dangerLevel: DangerLevel;
  zone: "national" | "local";
  city?: string;
  imageUrl?: string;
  date: string;
  isRead: boolean;
}

export const GABON_PROVINCES = [
  "Estuaire",
  "Haut-Ogooué",
  "Moyen-Ogooué",
  "Ngounié",
  "Nyanga",
  "Ogooué-Ivindo",
  "Ogooué-Lolo",
  "Ogooué-Maritime",
  "Woleu-Ntem",
] as const;

export type GabonProvince = (typeof GABON_PROVINCES)[number];

export const REPORT_TYPE_INFO: Record<
  ReportType,
  { label: string; icon: string; iconFamily: string }
> = {
  perime:       { label: "Produit périmé",          icon: "food-off",       iconFamily: "MaterialCommunityIcons" },
  interdit:     { label: "Produit interdit",         icon: "ban",            iconFamily: "Ionicons" },
  hygiene:      { label: "Mauvaise hygiène",         icon: "hand-wash",      iconFamily: "MaterialCommunityIcons" },
  lieu_sale:    { label: "Lieu insalubre",           icon: "store-remove",   iconFamily: "MaterialCommunityIcons" },
  prix_abusif:  { label: "Prix abusif",              icon: "cash-remove",    iconFamily: "MaterialCommunityIcons" },
  falsifie:     { label: "Produit falsifié",         icon: "flask-remove",   iconFamily: "MaterialCommunityIcons" },
  intoxication: { label: "Intoxication alimentaire", icon: "food-variant-off", iconFamily: "MaterialCommunityIcons" },
};

export const DANGER_COLORS: Record<DangerLevel, string> = {
  high:   "#DC2626",
  medium: "#D97706",
  low:    "#16A34A",
};

export const STATUS_INFO: Record<ReportStatus, { label: string; color: string }> = {
  pending:     { label: "En attente", color: "#D97706" },
  in_progress: { label: "En cours",   color: "#1565C0" },
  resolved:    { label: "Traité",     color: "#16A34A" },
};
