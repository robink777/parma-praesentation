"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Für den Dauerbetrieb am Büro-/TV-Bildschirm (Oktober 2026 Chat-Vorgabe): Die Admin-Seiten
// laden Daten bisher nur bei echter Navigation (siehe onoffice/client.ts, cache: "no-store" ohne
// jeden Rhythmus) — auf einem dauerhaft offenen Bildschirm stehen die Zahlen sonst fest, bis
// jemand klickt. router.refresh() fordert die Server-Komponente der aktuellen Route erneut an und
// ersetzt nur deren Props, OHNE den Suspense-/loading.tsx-Fallback erneut zu zeigen (der greift
// nur bei einer echten Navigation auf das Segment, nicht beim Refresh einer bereits gemounteten
// Seite) — die bestehende Tab-/Scroll-Auswahl im Client-State bleibt dabei unberührt.
// Nutzer-Entscheidung Oktober 2026: alle 5 Minuten, als Kompromiss zwischen Aktualität und
// Anfragelast gegen die OnOffice-API im Dauerbetrieb.
export const ADMIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useAutoRefresh(intervalMs: number) {
  const router = useRouter();

  useEffect(() => {
    const intervall = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(intervall);
  }, [router, intervalMs]);
}
