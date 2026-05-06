import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

import { AgasaAlert, DangerLevel } from "@/constants/types";
import { uploadMedia } from "@/lib/supabase";

const STORAGE_KEY = "agasa_official_alerts";
const POLL_INTERVAL_MS = 15_000;
const EXPIRY_MS = 3 * 30 * 24 * 60 * 60 * 1000;

function isNotExpired(alert: AgasaAlert): boolean {
  return Date.now() - new Date(alert.date).getTime() < EXPIRY_MS;
}

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return domain ? `https://${domain}/api` : "/api";
}

interface AlertsContextValue {
  alerts: AgasaAlert[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  addAlert: (data: Omit<AgasaAlert, "id" | "date" | "isRead">) => Promise<void>;
  refresh: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AgasaAlert[]>([]);
  const readIdsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  /* ── Charger depuis AsyncStorage au démarrage ── */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: AgasaAlert[] = JSON.parse(stored);
          const valid = parsed.filter(
            (a) => isNotExpired(a) && !a.id.match(/^a00\d$/)
          );
          if (valid.length !== parsed.length) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
          }
          valid.forEach((a) => {
            if (a.isRead) readIdsRef.current.add(a.id);
          });
          setAlerts(valid);
        }
      } catch {}
    })();
  }, []);

  /* ── Fetch depuis l'API server (clé service_role côté serveur → bypass RLS) ── */
  const fetchFromApi = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch(`${getApiBase()}/alerts`, {
        headers: { "Accept": "application/json" },
      });
      if (!res.ok) {
        console.warn("[Alerts] Erreur API", res.status);
        return;
      }
      const data = (await res.json()) as Record<string, unknown>[];
      const serverAlerts: AgasaAlert[] = data
        .map((row) => ({
          id: row.id as string,
          title: row.title as string,
          message: row.message as string,
          dangerLevel: row.danger_level as DangerLevel,
          zone: row.zone as "national" | "local",
          city: (row.city as string) ?? undefined,
          imageUrl: (row.image_url as string) ?? undefined,
          date: row.date as string,
          isRead: readIdsRef.current.has(row.id as string),
        }))
        .filter(isNotExpired);

      setAlerts((prev) => {
        return serverAlerts.map((sa) => {
          const existing = prev.find((a) => a.id === sa.id);
          return existing ? { ...sa, isRead: existing.isRead } : sa;
        });
      });
    } catch (err) {
      console.warn("[Alerts] Exception fetchFromApi:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  /* ── Chargement initial ── */
  useEffect(() => {
    fetchFromApi();
  }, [fetchFromApi]);

  /* ── Polling automatique toutes les 15 secondes ── */
  useEffect(() => {
    const timer = setInterval(fetchFromApi, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchFromApi]);

  /* ── Rechargement quand l'app revient au premier plan ── */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") fetchFromApi();
    });
    return () => sub.remove();
  }, [fetchFromApi]);

  const persist = useCallback(async (updated: AgasaAlert[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated.filter(isNotExpired))
      );
    } catch {}
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
      readIdsRef.current.add(id);
      setAlerts((prev) => {
        const updated = prev.map((a) => (a.id === id ? { ...a, isRead: true } : a));
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const addAlert = useCallback(
    async (data: Omit<AgasaAlert, "id" | "date" | "isRead">) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);

      /* Upload image si présente */
      let imageUrl = data.imageUrl;
      if (data.imageUrl && !data.imageUrl.startsWith("http")) {
        const uploaded = await uploadMedia(data.imageUrl, "alerts-media", `alerts/${id}.jpg`);
        if (uploaded) imageUrl = uploaded;
      }

      const newAlert: AgasaAlert = {
        ...data,
        imageUrl,
        id,
        date: new Date().toISOString(),
        isRead: false,
      };

      setAlerts((prev) => {
        const updated = [newAlert, ...prev];
        persist(updated);
        return updated;
      });

      try {
        const res = await fetch(`${getApiBase()}/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            title: data.title,
            message: data.message,
            danger_level: data.dangerLevel,
            zone: data.zone,
            city: data.city ?? null,
            image_url: imageUrl ?? null,
            date: newAlert.date,
          }),
        });
        if (!res.ok) {
          console.warn("[Alerts] Erreur POST /api/alerts", res.status);
        }
      } catch (err) {
        console.warn("[Alerts] Exception POST:", err);
      }
    },
    [persist]
  );

  const visibleAlerts = alerts.filter(isNotExpired);

  return (
    <AlertsContext.Provider
      value={{
        alerts: visibleAlerts,
        unreadCount: visibleAlerts.filter((a) => !a.isRead).length,
        markAsRead,
        addAlert,
        refresh: fetchFromApi,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertsProvider");
  return ctx;
}
