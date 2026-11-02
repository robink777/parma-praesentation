// Sichtbarer Hinweis, WANN zuletzt erfolgreich aktualisiert wurde — Nutzer-Vorgabe November 2026
// nach einer gemeldeten (tatsächlich nicht bestätigten, siehe useAutoRefresh.ts) Live-Daten-
// Verzögerung: "Das ist sehr wichtig dass die daten nahe zu live übertragen werden. Vielleicht
// brauchen wir noch ein optisches feedback wann aktuallisert wird". Ein kleiner Punkt (pulsiert
// während des Nachladens, sonst gedämpft) plus die Uhrzeit des letzten erfolgreichen Abrufs — so
// lässt sich live auf dem Bildschirm ablesen, ob der 60-Sekunden-Rhythmus (siehe
// ADMIN_REFRESH_INTERVAL_MS) tatsächlich läuft, statt nur zu vermuten.
export function AktualisierungsAnzeige({
  wirdAktualisiert,
  zuletztAktualisiert,
}: {
  wirdAktualisiert: boolean;
  zuletztAktualisiert: Date | null;
}) {
  const zeit = zuletztAktualisiert
    ? zuletztAktualisiert.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "–";

  return (
    <div
      className="flex items-center gap-[6px] font-mono text-[10px] text-anthrazit/40"
      title="Automatische Aktualisierung alle 60 Sekunden"
    >
      <span
        className={`h-[6px] w-[6px] shrink-0 rounded-full transition-colors ${
          wirdAktualisiert ? "animate-pulse bg-messing" : "bg-anthrazit/20"
        }`}
        aria-hidden="true"
      />
      {wirdAktualisiert ? "Aktualisiert …" : `Aktualisiert ${zeit}`}
    </div>
  );
}
