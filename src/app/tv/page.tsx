import { TvSlideshow } from "@/components/tv/TvSlideshow";
import { ladeAdminDashboardDaten } from "@/lib/onoffice/adminDashboard";

// Kein Caching — jeder Aufruf (bzw. jeder minütliche Refresh, siehe TvSlideshow.tsx) soll die
// aktuellen Live-Daten zeigen, kein gecachter Snapshot (analog zu app/geteilt/page.tsx, Chat-
// Vorgabe Oktober 2026: "alles ... muss immer repräsentativ sein ... die richtigen Daten").
export const dynamic = "force-dynamic";

// Büro-TV-Vorführung (Chat-Vorgabe Oktober 2026: "ich hätte gerne einen Link generieren ... den
// ich dann auf den Fernsehern in den einzelnen Büros öffne", Klarstellung direkt danach: "der
// Link soll einfach einzugeben sein und nicht passwort geschützt ... an die Mitarbeiter
// weitergegeben werden können ... anders als im Admin-Bereich sollen ja alle die Zahlen sehen
// können"). Deshalb BEWUSST ganz ohne Signatur/Token (anders als app/geteilt/page.tsx) — einfach
// /tv, von middleware.ts von der regulären APP_PASSWORD-Prüfung ausgenommen. Zeigt dieselben
// Live-Daten wie der Admin-Bereich (ladeAdminDashboardDaten, siehe onoffice/adminDashboard.ts),
// nur eben ohne jede Zugriffssperre.
export default async function TvPage() {
  const daten = await ladeAdminDashboardDaten();
  return <TvSlideshow {...daten} />;
}
