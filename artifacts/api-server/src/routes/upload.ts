import { Router, type IRouter } from "express";
import multer from "multer";
import { supabaseAdmin, ensureBucket, isSupabaseAdminConfigured } from "../lib/supabase-admin";

const router: IRouter = Router();

/* multer stocke en mémoire (max 50 MB) */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 52428800 },
});

/**
 * POST /api/upload
 * Body: multipart/form-data
 *   - file: le fichier à uploader
 *   - bucket: nom du bucket Supabase (ex: "reports-media")
 *   - path: chemin dans le bucket (ex: "abc123_photo_0.jpg")
 *
 * Retourne: { url: string } ou { error: string }
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!isSupabaseAdminConfigured) {
    res.status(503).json({ error: "Supabase non configuré sur le serveur" });
    return;
  }

  const file = req.file;
  const bucket = (req.body as { bucket?: string }).bucket;
  const path = (req.body as { path?: string }).path;

  if (!file) {
    res.status(400).json({ error: "Aucun fichier fourni" });
    return;
  }
  if (!bucket || !path) {
    res.status(400).json({ error: "Paramètres bucket et path requis" });
    return;
  }

  /* S'assure que le bucket existe */
  await ensureBucket(bucket);

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    req.log.warn({ bucket, path, err: error.message }, "Erreur upload Supabase");
    res.status(500).json({ error: error.message });
    return;
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  req.log.info({ bucket, path, url: data.publicUrl }, "Upload réussi");
  res.json({ url: data.publicUrl });
});

export default router;
