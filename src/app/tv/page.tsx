import { TvSlideshow } from "@/components/tv/TvSlideshow";
import { tvSignaturIstGueltig } from "@/lib/auth";
import { ladeAdminDashboardDaten } from "@/lib/onoffice/adminDashboard";

// Kein Caching — jeder Aufruf (bzw. jeder minütliche Refresh, siehe TvSlideshow.tsx) soll die
// aktuellen Live-Daten zeigen, kein gecachter Snapshot (analog zu app/geteilt/page.tsx, Chat-
// Vorgabe Oktober 2026: "alles ... muss immer repräsentativ sein ... die richtigen Daten").
export const dynamic = "force-dynamic";

// Büro-TV-Vorführung (Chat-Vorgabe Oktober 2026: "ich hätte gerne einen Link generieren ... den
// ich dann auf den Fernsehern in den einzelnen Büros öffne"). Durch eine eigene, nicht
// ablaufende Signatur geschützt statt des regulären App-/Admin-Logins (siehe middleware.ts: /tv
// ist von der APP_PASSWORD-Prüfung ausgenommen, lib/auth.ts tvSignaturIstGueltig prüft stattdessen
// den "sig"-Query-Parameter) — ein Fernseher im Büro kann kein Passwort eintippen, der Link muss
// einfach dauerhaft funktionieren. Bei ungültiger/fehlender Signatur ein freundlicher Hinweis
// statt der internen Login-Seite (gleiches Muster wie app/geteilt/page.tsx).
export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ sig?: string }>;
}) {
  const params = await searchParams;
  const zugriffErlaubt = await tvSignaturIstGueltig(params.sig ?? null);

  if (!zugriffErlaubt) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-sm bg-reinweiss px-xl text-center">
        <p className="label">Nicht verfügbar</p>
        <h1 className="text-[28px] font-slab font-bold text-anthrazit">Dieser Link ist ungültig</h1>
        <p className="max-w-[50ch] text-body text-anthrazit/70">
          Bitte den aktuellen TV-Link aus dem Admin-Bereich verwenden.
        </p>
      </div>
    );
  }

  const daten = await ladeAdminDashboardDaten();
  return <TvSlideshow {...daten} />;
}
