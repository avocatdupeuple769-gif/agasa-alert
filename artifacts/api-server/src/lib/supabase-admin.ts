import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const supabaseUrl = process.env["EXPO_PUBLIC_SUPABASE_URL"] ?? "";
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

export const isSupabaseAdminConfigured = !!(supabaseUrl && serviceRoleKey);

/**
 * Client Supabase avec la clé service_role.
 * Contourne toutes les politiques RLS — utiliser uniquement côté serveur.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * S'assure que le bucket existe et est public.
 * Crée le bucket si absent.
 */
export async function ensureBucket(bucket: string): Promise<void> {
  if (!isSupabaseAdminConfigured) return;
  try {
    const { data: existing } = await supabaseAdmin.storage.getBucket(bucket);
    if (!existing) {
      const { error } = await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800, // 50 MB
      });
      if (error) {
        logger.warn({ bucket, err: error.message }, "Impossible de créer le bucket");
      } else {
        logger.info({ bucket }, "Bucket Supabase créé");
      }
    }
  } catch (err) {
    logger.warn({ bucket, err }, "Erreur lors de la vérification du bucket");
  }
}
