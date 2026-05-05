import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Résout l'URL de base de l'API selon la plateforme.
 * Sur web, on utilise un chemin relatif (proxy partagé).
 * Sur mobile natif, on passe par le domaine Replit.
 */
function getApiBase(): string {
  if (Platform.OS === "web") {
    return "/api";
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return domain ? `https://${domain}/api` : "/api";
}

/**
 * Upload un fichier media via l'API server (qui utilise la clé service_role).
 * Retourne l'URL publique Supabase si succès, null sinon.
 */
export async function uploadMedia(
  uri: string,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    /* Récupérer le blob depuis l'URI (blob:, data:, https:, file:) */
    let blob: Blob;
    if (Platform.OS === "web") {
      const res = await fetch(uri);
      if (!res.ok) {
        console.warn(`[Upload] Impossible de lire le fichier local (${res.status})`);
        return null;
      }
      blob = await res.blob();
    } else {
      /* Sur mobile natif, fetch() supporte les URI file:// et content:// */
      const res = await fetch(uri);
      blob = await res.blob();
    }

    /* Envoyer en multipart vers /api/upload */
    const formData = new FormData();
    const filename = path.split("/").pop() ?? "media.jpg";
    formData.append("file", blob, filename);
    formData.append("bucket", bucket);
    formData.append("path", path);

    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[Upload] Erreur serveur ${response.status}:`, body);
      return null;
    }

    const json = (await response.json()) as { url?: string; error?: string };
    if (json.error || !json.url) {
      console.warn("[Upload] Réponse serveur invalide:", json);
      return null;
    }

    return json.url;
  } catch (err) {
    console.warn("[Upload] Exception:", err);
    return null;
  }
}
