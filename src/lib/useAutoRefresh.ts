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
// Nutzer-Entscheidung Oktober 2026: jede Minute, bewusst auf Kosten höherer Anfragelast gegen
// OnOffice (ein einzelner Refresh löst ~150-170 Einzelabfragen aus, siehe ladeMitarbeiterKennzahlen/
// ladeNeuzugaengeVerlauf in onoffice/mitarbeiterstatistik.ts — vorher 5 Minuten, exakt wegen dieser
// Last). Ausdrücklich NICHT in Stein gemeißelt: "halte im Kopf, dass wir das auch wieder
// zurückändern können, wenn es irgendwann zu einem Problem führt" — bei spürbaren
// OnOffice-Fehlern/Drosselung im Dauerbetrieb diesen Wert als Ersten Verdächtigen prüfen.
export const ADMIN_REFRESH_INTERVAL_MS = 60 * 1000;

export function useAutoRefresh(intervalMs: number) {
  const router = useRouter();

  useEffect(() => {
    const intervall = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(intervall);
  }, [router, intervalMs]);
}
