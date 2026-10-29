import { TvMobil } from "@/components/tv/TvMobil";
import { ladeAdminDashboardDaten } from "@/lib/onoffice/adminDashboard";
import { ermittleSaison, ladeWettkampfRangliste } from "@/lib/onoffice/wettkampf";

// Kein Caching — siehe app/tv/page.tsx, derselbe Grund (immer die aktuellen Live-Daten, nie ein
// gecachter Snapshot).
export const dynamic = "force-dynamic";

// Smartphone-Ansicht der TV-Vorführung (siehe components/tv/TvMobil.tsx für die ausführliche
// Begründung der eigenen Route statt eines Responsive-Umbaus von app/tv/page.tsx). Lädt exakt
// dieselben Daten wie die TV-Seite (ladeAdminDashboardDaten + ladeWettkampfRangliste) — eine
// zweite, abweichende Datenquelle für dieselben Kennzahlen wäre eine Fehlerquelle, die niemand
// bräuchte.
export default async function TvMobilPage() {
  const [daten, rangliste] = await Promise.all([
    ladeAdminDashboardDaten(),
    ladeWettkampfRangliste().catch((error) => {
      console.error("Live-Abruf der Wettkampf-Rangliste fehlgeschlagen:", error);
      return [];
    }),
  ]);
  const saison = ermittleSaison();

  return <TvMobil {...daten} rangliste={rangliste} saisonBisIso={saison.bis.toISOString()} />;
}
