/**
 * Client Supabase isolé dans un try-catch.
 * Si @supabase/supabase-js plante à l'import ou à la création du client,
 * l'erreur est capturée ici — l'app continue avec isSupabaseConfigured=false
 * au lieu de crasher silencieusement et de bloquer le splash screen.
 */

// import type est erasé à la compilation — aucun coût runtime
import type { SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://mdcbhlwcpttapkicpeea.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_B6g1ZcnfKDiOXji0JW40PA_K48SP937";

let _client: SupabaseClient | null = null;

try {
  // require() au lieu de import statique : le module @supabase/supabase-js
  // n'est chargé qu'ICI et dans un try-catch. Si il plante (crypto, URL,
  // localStorage, etc.), l'erreur est capturée et l'app démarre quand même.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
} catch (err) {
  console.warn("[Supabase] Initialisation échouée:", err);
}

export const isSupabaseConfigured = _client !== null;

// Toujours vérifier isSupabaseConfigured avant d'utiliser supabase
export const supabase = _client as SupabaseClient;

/**
 * Upload un fichier media dans Supabase Storage.
 * Retourne l'URL publique si succès, null sinon.
 */
export async function uploadMedia(
  uri: string,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!_client) return null;
  try {
    const res = await fetch(uri);
    if (!res.ok) return null;
    const blob = await res.blob();
    const contentType =
      blob.type || (path.endsWith(".mp4") ? "video/mp4" : "image/jpeg");
    const filename = path.split("/").pop() ?? "media.jpg";
    const file =
      Platform.OS === "web"
        ? new File([blob], filename, { type: contentType })
        : blob;
    const { data, error } = await _client.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });
    if (error) {
      console.warn("[Upload] Erreur:", error.message);
      return null;
    }
    const { data: pub } = _client.storage.from(bucket).getPublicUrl(data.path);
    return pub.publicUrl ?? null;
  } catch (err) {
    console.warn("[Upload] Exception:", err);
    return null;
  }
}
