import { Router, type IRouter } from "express";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabase-admin";

const router: IRouter = Router();

const THREE_MONTHS_AGO = () =>
  new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString();

/** GET /api/reports — retourne tous les signalements (service_role, bypass RLS) */
router.get("/reports", async (req, res) => {
  if (!isSupabaseAdminConfigured) {
    res.status(503).json({ error: "Supabase non configuré" });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .gte("date", THREE_MONTHS_AGO())
    .order("date", { ascending: false })
    .limit(200);

  if (error) {
    req.log.warn({ err: error.message }, "Erreur GET /api/reports");
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data ?? []);
});

/** POST /api/reports — insère un signalement (service_role, bypass RLS) */
router.post("/reports", async (req, res) => {
  if (!isSupabaseAdminConfigured) {
    res.status(503).json({ error: "Supabase non configuré" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  if (!body.id || !body.type) {
    res.status(400).json({ error: "Champs requis manquants : id, type" });
    return;
  }
  const { error } = await supabaseAdmin.from("reports").insert(body);
  if (error) {
    req.log.warn({ err: error.message }, "Erreur POST /api/reports");
    res.status(500).json({ error: error.message });
    return;
  }
  req.log.info({ id: body.id }, "Signalement inséré");
  res.status(201).json({ ok: true });
});

/** PATCH /api/reports/:id — met à jour le statut d'un signalement */
router.patch("/reports/:id", async (req, res) => {
  if (!isSupabaseAdminConfigured) {
    res.status(503).json({ error: "Supabase non configuré" });
    return;
  }
  const { id } = req.params as { id: string };
  const body = req.body as Record<string, unknown>;
  const { error } = await supabaseAdmin.from("reports").update(body).eq("id", id);
  if (error) {
    req.log.warn({ id, err: error.message }, "Erreur PATCH /api/reports/:id");
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

export default router;
