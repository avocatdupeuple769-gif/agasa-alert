import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { DangerLevel, Report, ReportStatus, ReportType } from "@/constants/types";
import { isSupabaseConfigured, supabase, uploadMedia } from "@/lib/supabase";

const STORAGE_KEY = "agasa_reports";

interface ReportsContextValue {
  reports: Report[];
  addReport: (data: Omit<Report, "id" | "date" | "status" | "isSynced">) => Promise<string>;
  updateReportStatus: (id: string, status: ReportStatus) => void;
  getReportById: (id: string) => Report | undefined;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

const MOCK_REPORTS: Report[] = [
  {
    id: "r001",
    type: "perime",
    description: "Poisson avarié vendu au marché de Mont-Bouët",
    photos: [],
    location: { latitude: 0.3924, longitude: 9.4536, city: "Libreville", province: "Estuaire" },
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "in_progress",
    dangerLevel: "high",
    isSynced: true,
  },
  {
    id: "r002",
    type: "hygiene",
    description: "Restaurant sans conditions sanitaires minimales",
    photos: [],
    location: { latitude: 0.4061, longitude: 9.4405, city: "Libreville", province: "Estuaire" },
    date: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: "pending",
    dangerLevel: "medium",
    isSynced: true,
  },
  {
    id: "r003",
    type: "prix_abusif",
    description: "Huile de palme vendue 3x le prix officiel",
    photos: [],
    location: { latitude: -0.7167, longitude: 8.7833, city: "Port-Gentil", province: "Ogooué-Maritime" },
    date: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: "pending",
    dangerLevel: "medium",
    isSynced: true,
  },
  {
    id: "r004",
    type: "falsifie",
    description: "Médicaments contrefaits vendus dans un kiosque",
    photos: [],
    location: { latitude: 0.3703, longitude: 9.4588, city: "Libreville", province: "Estuaire" },
    date: new Date(Date.now() - 12 * 3600000).toISOString(),
    status: "resolved",
    dangerLevel: "high",
    isSynced: true,
  },
  {
    id: "r005",
    type: "intoxication",
    description: "Plusieurs personnes intoxiquées après avoir mangé au restaurant",
    photos: [],
    location: { latitude: -1.6333, longitude: 13.5833, city: "Franceville", province: "Haut-Ogooué" },
    date: new Date(Date.now() - 3 * 3600000).toISOString(),
    status: "in_progress",
    dangerLevel: "high",
    isSynced: true,
  },
  {
    id: "r006",
    type: "lieu_sale",
    description: "Marché avec déchets non collectés depuis plusieurs jours",
    photos: [],
    location: { latitude: 0.4200, longitude: 9.4300, city: "Libreville", province: "Estuaire" },
    date: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: "pending",
    dangerLevel: "low",
    isSynced: true,
  },
];

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

  /* ── Charger depuis AsyncStorage ── */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Report[] = JSON.parse(stored);
          setReports((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newOnes = parsed.filter((r) => !existingIds.has(r.id));
            return [...prev, ...newOnes];
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
          .from("reports")
          .select("*")
          .order("date", { ascending: false })
          .limit(100);

        if (data && data.length > 0) {
          const serverReports: Report[] = data.map((row) => ({
            id: row.id,
            type: row.type as ReportType,
            description: row.description || "",
            photos: row.photos || [],
            videos: row.videos || [],
            location: row.location,
            date: row.date,
            status: row.status as ReportStatus,
            dangerLevel: row.danger_level as DangerLevel,
            isSynced: true,
            reporter: row.reporter ?? undefined,
            priceAmount: row.price_amount ?? undefined,
          }));
          setReports((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newOnes = serverReports.filter((r) => !existingIds.has(r.id));
            return [...newOnes, ...prev];
          });
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback(async (updated: Report[]) => {
    try {
      const userReports = updated.filter((r) => !r.id.startsWith("r00"));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userReports));
    } catch {}
  }, []);

  const addReport = useCallback(
    async (data: Omit<Report, "id" | "date" | "status" | "isSynced">) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);

      /* ── Upload photos vers Supabase Storage ── */
      let uploadedPhotos = data.photos;
      if (isSupabaseConfigured && data.photos.length > 0) {
        const urls = await Promise.all(
          data.photos.map((uri, i) =>
            uploadMedia(uri, "reports-media", `${id}_photo_${i}.jpg`)
          )
        );
        // Si l'upload réussit → URL Supabase publique permanente
        // Si l'upload échoue → garder l'URI locale (visible dans la session en cours)
        uploadedPhotos = urls.map((url, i) => url ?? data.photos[i]);
      }

      /* ── Upload vidéos vers Supabase Storage ── */
      let uploadedVideos: string[] = [];
      if (isSupabaseConfigured && data.videos && data.videos.length > 0) {
        const urls = await Promise.all(
          data.videos.map((uri, i) =>
            uploadMedia(uri, "reports-media", `${id}_video_${i}.mp4`)
          )
        );
        uploadedVideos = urls.map((url, i) => url ?? (data.videos ?? [])[i]);
      }

      const newReport: Report = {
        ...data,
        photos: uploadedPhotos,
        videos: uploadedVideos,
        id,
        date: new Date().toISOString(),
        status: "pending",
        isSynced: isSupabaseConfigured,
      };

      setReports((prev) => {
        const updated = [newReport, ...prev];
        persist(updated);
        return updated;
      });

      /* ── Sauvegarder dans Supabase ── */
      if (isSupabaseConfigured) {
        try {
          await supabase.from("reports").insert({
            id,
            type: data.type,
            description: data.description,
            photos: uploadedPhotos,
            videos: uploadedVideos,
            location: data.location,
            status: "pending",
            danger_level: data.dangerLevel,
            reporter: data.reporter ?? null,
            price_amount: data.priceAmount ?? null,
            is_synced: true,
            date: newReport.date,
          });
        } catch {}
      }

      return id;
    },
    [persist]
  );

  const updateReportStatus = useCallback(
    (id: string, status: ReportStatus) => {
      setReports((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, status } : r));
        persist(updated);
        return updated;
      });
      if (isSupabaseConfigured) {
        supabase.from("reports").update({ status }).eq("id", id).then(() => {});
      }
    },
    [persist]
  );

  const getReportById = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports]
  );

  return (
    <ReportsContext.Provider value={{ reports, addReport, updateReportStatus, getReportById }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be used within ReportsProvider");
  return ctx;
}
