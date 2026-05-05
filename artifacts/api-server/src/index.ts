import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startSupabaseKeepAlive();
});

/* ── Ping Supabase toutes les 3 jours pour éviter la mise en veille ── */
function startSupabaseKeepAlive() {
  const supabaseUrl = process.env["EXPO_PUBLIC_SUPABASE_URL"];
  const supabaseKey = process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseKey) {
    logger.info("Supabase keep-alive désactivé (variables non configurées)");
    return;
  }

  const ping = async () => {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/agasa_alerts?select=id&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      logger.info({ status: res.status }, "Supabase keep-alive ping OK");
    } catch (err) {
      logger.warn({ err }, "Supabase keep-alive ping échoué");
    }
  };

  /* Premier ping au démarrage, puis toutes les 3 jours */
  ping();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  setInterval(ping, THREE_DAYS_MS);

  logger.info("Supabase keep-alive actif (ping toutes les 3 jours)");
}
