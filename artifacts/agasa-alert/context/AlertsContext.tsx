import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { AgasaAlert, DangerLevel } from "@/constants/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const STORAGE_KEY = "agasa_official_alerts";

interface AlertsContextValue {
  alerts: AgasaAlert[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  addAlert: (data: Omit<AgasaAlert, "id" | "date" | "isRead">) => Promise<void>;
}

const AlertsContext = createContext<AlertsContextValue | null>(null);

const MOCK_ALERTS: AgasaAlert[] = [
  {
    id: "a001",
    title: "ALERTE : Huile contaminée en circulation",
    message:
      "L'AGASA signale la présence d'huile de palme contaminée (lot #OP-2026-041) sur les marchés de Libreville. Ne consommez pas ce produit et signalez tout vendeur à l'AGASA immédiatement.",
    dangerLevel: "high",
    zone: "local",
    city: "Libreville",
    date: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
  },
  {
    id: "a002",
    title: "Produit interdit : Lait en poudre importé",
    message:
      "Suite à une inspection douanière, l'AGASA informe que certaines boîtes de lait en poudre de marque « NutriLac » (importation non conforme) ont été saisies. Vérifiez vos achats et signalez les vendeurs.",
    dangerLevel: "high",
    zone: "national",
    date: new Date(Date.now() - 86400000).toISOString(),
    isRead: false,
  },
  {
    id: "a003",
    title: "Alerte sanitaire : Marché de Mouila",
    message:
      "Des contrôles d'hygiène effectués au marché central de Mouila ont révélé des conditions sanitaires inacceptables dans plusieurs étals de viande. Des mesures correctives sont en cours.",
    dangerLevel: "medium",
    zone: "local",
    city: "Mouila",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    isRead: true,
  },
  {
    id: "a004",
    title: "Campagne de contrôle des prix",
    message:
      "L'AGASA lance une campagne nationale de contrôle des prix sur les denrées alimentaires de base. Signalez tout prix abusif via l'application. Ensemble, protégeons le pouvoir d'achat des Gabonais.",
    dangerLevel: "low",
    zone: "national",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    isRead: true,
  },
  {
    id: "a005",
    title: "Intoxication alimentaire : Mise en garde",
    message:
      "Plusieurs cas d'intoxication alimentaire ont été signalés dans la région de l'Ogooué-Maritime après consommation de poissons vendus sans réfrigération. Évitez d'acheter du poisson non réfrigéré.",
    dangerLevel: "high",
    zone: "local",
    city: "Port-Gentil",
    date: new Date(Date.now() - 4 * 3600000).toISOString(),
    isRead: false,
  },
];

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AgasaAlert[]>(MOCK_ALERTS);

  /* ── Charger depuis AsyncStorage ── */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: AgasaAlert[] = JSON.parse(stored);
          setAlerts((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newOnes = parsed.filter((a) => !existingIds.has(a.id));
            return [...newOnes, ...prev];
          });
        }
      } catch {}
    })();
  }, []);

  /* ── Charger depuis Supabase ── */
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("agasa_alerts")
          .select("*")
          .order("date", { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          const serverAlerts: AgasaAlert[] = data.map((row) => ({
            id: row.id,
            title: row.title,
            message: row.message,
            dangerLevel: row.danger_level as DangerLevel,
            zone: row.zone,
            city: row.city ?? undefined,
            imageUrl: row.image_url ?? undefined,
            date: row.date,
            isRead: false,
          }));
          setAlerts((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newOnes = serverAlerts.filter((a) => !existingIds.has(a.id));
            return [...newOnes, ...prev];
          });
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback(async (updated: AgasaAlert[]) => {
    try {
      const userAlerts = updated.filter((a) => !a.id.startsWith("a00"));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userAlerts));
    } catch {}
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
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
      const newAlert: AgasaAlert = {
        ...data,
        id,
        date: new Date().toISOString(),
        isRead: false,
      };
      setAlerts((prev) => {
        const updated = [newAlert, ...prev];
        persist(updated);
        return updated;
      });

      /* Sync Supabase */
      if (isSupabaseConfigured) {
        try {
          await supabase.from("agasa_alerts").insert({
            id,
            title: data.title,
            message: data.message,
            danger_level: data.dangerLevel,
            zone: data.zone,
            city: data.city ?? null,
            image_url: data.imageUrl ?? null,
            date: newAlert.date,
          });
        } catch {}
      }
    },
    [persist]
  );

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <AlertsContext.Provider value={{ alerts, unreadCount, markAsRead, addAlert }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertsProvider");
  return ctx;
}
