import { Router, type IRouter } from "express";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabase-admin";

const router: IRouter = Router();

const THREE_MONTHS_AGO = () =>
  new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString();

/** GET /api/alerts — retourne toutes les alertes officielles (service_role, bypass RLS) */
router.get("/alerts", async (req, res) => {
  if (!isSupabaseAdminConfigured) {
    res.status(503).json({ error: "Supabase non configuré" });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from("agasa_alerts")
    .select("*")
    .gte("date", THREE_MONTHS_AGO())
    .order("date", { ascending: false })
    .limit(100);

  if (error) {
    req.log.warn({ err: error.message }, "Erreur GET /api/alerts");
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data ?? []);
});

/** POST /api/alerts — insère une alerte officielle (service_role, bypass RLS) */
router.post("/alerts", async (req, res) => {
  if (!isSupabaseAdminConfigured) {
    res.status(503).json({ error: "Supabase non configuré" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  if (!body.id || !body.title || !body.message) {
    res.status(400).json({ error: "Champs requis manquants : id, title, message" });
    return;
  }
  const { error } = await supabaseAdmin.from("agasa_alerts").insert(body);
  if (error) {
    req.log.warn({ err: error.message }, "Erreur POST /api/alerts");
    res.status(500).json({ error: error.message });
    return;
  }
  req.log.info({ id: body.id }, "Alerte officielle insérée");
  res.status(201).json({ ok: true });
});

/** DELETE /api/alerts/:id — supprime une alerte (service_role) */
router.delete("/alerts/:id", async (req, res) => {
  if (!isSupabaseAdminConfigured) {
    res.status(503).json({ error: "Supabase non configuré" });
    return;
  }
  const { id } = req.params as { id: string };
  const { error } = await supabaseAdmin.from("agasa_alerts").delete().eq("id", id);
  if (error) {
    req.log.warn({ id, err: error.message }, "Erreur DELETE /api/alerts/:id");
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

export default router;
