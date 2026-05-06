import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

import { DangerLevel, GeoLocation, Report, Reporter, ReportStatus, ReportType } from "@/constants/types";
import { uploadMedia } from "@/lib/supabase";

const STORAGE_KEY = "agasa_reports";
const POLL_INTERVAL_MS = 15_000;
const EXPIRY_MS = 3 * 30 * 24 * 60 * 60 * 1000;

function isNotExpired(report: Report): boolean {
  return Date.now() - new Date(report.date).getTime() < EXPIRY_MS;
}

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return domain ? `https://${domain}/api` : "/api";
}

function rowToReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    type: row.type as ReportType,
    description: (row.description as string) || "",
    photos: (row.photos as string[]) || [],
    videos: (row.videos as string[]) || [],
    location: row.location as GeoLocation,
    date: row.date as string,
    status: row.status as ReportStatus,
    dangerLevel: row.danger_level as DangerLevel,
    isSynced: true,
    reporter: (row.reporter as Reporter) ?? undefined,
    priceAmount: (row.price_amount as number) ?? undefined,
  };
}

interface ReportsContextValue {
  reports: Report[];
  addReport: (data: Omit<Report, "id" | "date" | "status" | "isSynced">) => Promise<string>;
  updateReportStatus: (id: string, status: ReportStatus) => void;
  getReportById: (id: string) => Report | undefined;
  refresh: () => Promise<void>;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  /* ── Charger depuis AsyncStorage au démarrage ── */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Report[] = JSON.parse(stored);
          const valid = parsed.filter(
            (r) => isNotExpired(r) && !r.id.match(/^r00\d$/)
          );
          if (valid.length !== parsed.length) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
          }
          valid.forEach((r) => knownIdsRef.current.add(r.id));
          setReports(valid);
        }
      } catch {}
    })();
  }, []);

  /* ── Fetch depuis l'API server (clé service_role côté serveur → bypass RLS) ── */
  const fetchFromApi = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch(`${getApiBase()}/reports`, {
        headers: { "Accept": "application/json" },
      });
      if (!res.ok) {
        console.warn("[Reports] Erreur API", res.status);
        return;
      }
      const data = (await res.json()) as Record<string, unknown>[];
      const serverReports = data
        .map(rowToReport)
        .filter(isNotExpired);

      setReports((prev) => {
        const localOnly = prev.filter((r) => !r.isSynced);
        const serverIds = new Set(serverReports.map((r) => r.id));
        const merged = [
          ...serverReports,
          ...localOnly.filter((r) => !serverIds.has(r.id)),
        ];
        merged.forEach((r) => knownIdsRef.current.add(r.id));
        return merged;
      });
    } catch (err) {
      console.warn("[Reports] Exception fetchFromApi:", err);
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

  const persist = useCallback(async (updated: Report[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated.filter(isNotExpired))
      );
    } catch {}
  }, []);

  const addReport = useCallback(
    async (data: Omit<Report, "id" | "date" | "status" | "isSynced">) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
      knownIdsRef.current.add(id);

      /* Upload photos */
      let uploadedPhotos = data.photos;
      if (data.photos.length > 0) {
        const urls = await Promise.all(
          data.photos.map((uri, i) =>
            uploadMedia(uri, "reports-media", `${id}_photo_${i}.jpg`)
          )
        );
        uploadedPhotos = urls.map((url, i) => url ?? data.photos[i]);
      }

      /* Upload vidéos */
      let uploadedVideos: string[] = [];
      if (data.videos && data.videos.length > 0) {
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
        isSynced: false,
      };

      setReports((prev) => {
        const updated = [newReport, ...prev];
        persist(updated);
        return updated;
      });

      try {
        const res = await fetch(`${getApiBase()}/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          }),
        });
        if (res.ok) {
          setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, isSynced: true } : r))
          );
        } else {
          console.warn("[Reports] Erreur POST /api/reports", res.status);
        }
      } catch (err) {
        console.warn("[Reports] Exception POST:", err);
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
      fetch(`${getApiBase()}/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch((err) => console.warn("[Reports] Exception PATCH:", err));
    },
    [persist]
  );

  const getReportById = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports]
  );

  return (
    <ReportsContext.Provider
      value={{
        reports: reports.filter(isNotExpired),
        addReport,
        updateReportStatus,
        getReportById,
        refresh: fetchFromApi,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be used within ReportsProvider");
  return ctx;
}
