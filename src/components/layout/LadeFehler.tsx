// Fehlerseite, wenn ein Objekt im Live-Betrieb nicht aus onOffice geladen werden kann (Link mit
// unbekannter/nicht aufgelöster Objekt-Referenz, onOffice nicht erreichbar). Ersetzt den früheren
// stillen Rückfall auf Demo-Daten: Dort erschienen erfundene Eigentümer-/Objektdaten, ohne dass
// jemand bemerkte, dass die Präsentation gar nicht zum gewünschten Objekt gehörte.
export function LadeFehler({ referenz, kundenansicht = false }: { referenz?: string; kundenansicht?: boolean }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-sm bg-reinweiss px-xl text-center">
      <p className="label">Nicht verfügbar</p>
      <h1 className="text-[28px] font-slab font-bold text-anthrazit">Die Präsentation konnte nicht geladen werden</h1>
      <p className="max-w-[55ch] text-body text-anthrazit/70">
        {kundenansicht
          ? "Bitte versuchen Sie es in einem Moment erneut oder wenden Sie sich an Ihren Ansprechpartner bei Parma Immobilien."
          : "Das Objekt wurde in onOffice nicht gefunden oder onOffice ist gerade nicht erreichbar. Bitte den Link prüfen (z. B. ob im Präsentationslink noch der Platzhalter [uuid] steht) und die Seite neu laden."}
      </p>
      {!kundenansicht && referenz && (
        <p className="text-small text-anthrazit/50">
          Referenz: <span className="font-mono">{referenz}</span>
        </p>
      )}
    </div>
  );
}
