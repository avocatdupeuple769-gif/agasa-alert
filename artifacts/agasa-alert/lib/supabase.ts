import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://mdcbhlwcpttapkicpeea.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_B6g1ZcnfKDiOXji0JW40PA_K48SP937";

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Upload un fichier media directement dans Supabase Storage.
 * Retourne l'URL publique si succès, null sinon.
 */
export async function uploadMedia(
  uri: string,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const res = await fetch(uri);
    if (!res.ok) {
      console.warn(`[Upload] Impossible de lire le fichier (${res.status})`);
      return null;
    }
    const blob = await res.blob();

    const contentType =
      blob.type || (path.endsWith(".mp4") ? "video/mp4" : "image/jpeg");
    const filename = path.split("/").pop() ?? "media.jpg";

    const file =
      Platform.OS === "web"
        ? new File([blob], filename, { type: contentType })
        : blob;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) {
      console.warn("[Upload] Erreur Supabase Storage:", error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    return publicData.publicUrl ?? null;
  } catch (err) {
    console.warn("[Upload] Exception:", err);
    return null;
  }
}
