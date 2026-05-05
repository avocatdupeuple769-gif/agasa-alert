-- ============================================================
--  AGASA ALERT — Schéma Supabase
--  Copiez-collez ce script dans votre SQL Editor Supabase
-- ============================================================

-- 1. Table des signalements
CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  description   TEXT,
  photos        TEXT[]   DEFAULT '{}',
  videos        TEXT[]   DEFAULT '{}',
  location      JSONB    NOT NULL,
  date          TIMESTAMPTZ DEFAULT NOW(),
  status        TEXT     DEFAULT 'pending'
                CHECK (status IN ('pending','in_progress','resolved')),
  danger_level  TEXT     DEFAULT 'medium'
                CHECK (danger_level IN ('high','medium','low')),
  reporter      JSONB,
  price_amount  NUMERIC,
  is_synced     BOOLEAN  DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des alertes officielles AGASA
CREATE TABLE IF NOT EXISTS agasa_alerts (
  id            TEXT PRIMARY KEY,
  title         TEXT     NOT NULL,
  message       TEXT     NOT NULL,
  danger_level  TEXT     DEFAULT 'medium'
                CHECK (danger_level IN ('high','medium','low')),
  zone          TEXT     DEFAULT 'national'
                CHECK (zone IN ('national','local')),
  city          TEXT,
  image_url     TEXT,
  date          TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sécurité niveau ligne (Row Level Security)
ALTER TABLE reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agasa_alerts  ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut soumettre un signalement
CREATE POLICY "insert_reports"  ON reports FOR INSERT WITH CHECK (true);
-- Tout le monde peut lire les signalements (admin uniquement via app)
CREATE POLICY "read_reports"    ON reports FOR SELECT USING (true);
-- Mise à jour du statut par admin
CREATE POLICY "update_reports"  ON reports FOR UPDATE USING (true);
-- Lecture des alertes AGASA
CREATE POLICY "read_alerts"     ON agasa_alerts FOR SELECT USING (true);
-- Admin peut créer des alertes
CREATE POLICY "insert_alerts"   ON agasa_alerts FOR INSERT WITH CHECK (true);

-- 4. Buckets de stockage (Storage)
--    Exécutez aussi ces deux insertions :
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports-media', 'reports-media', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('alerts-media', 'alerts-media', true)
ON CONFLICT DO NOTHING;

-- Politique de stockage : lecture publique
CREATE POLICY "public_read_reports_media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports-media');

CREATE POLICY "public_insert_reports_media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reports-media');

CREATE POLICY "public_read_alerts_media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'alerts-media');

CREATE POLICY "public_insert_alerts_media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'alerts-media');
