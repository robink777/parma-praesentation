import type { SpeicherStatus } from "./useAutoSpeichern";

// Kleiner Statushinweis zum automatischen Speichern der Präsentations-Konfiguration in onOffice
// (siehe useAutoSpeichern.ts) — im Vorbereitungsmodus in der Fußzeile, in der laufenden
// Präsentation als dezente Einblendung unten rechts.
export function SpeicherHinweis({ status, className = "" }: { status: SpeicherStatus; className?: string }) {
  if (status.art === "leer") return null;

  const text =
    status.art === "geladen"
      ? "Gespeicherter Stand aus onOffice geladen"
      : status.art === "speichert"
        ? "Speichert in onOffice …"
        : status.art === "gespeichert"
          ? `In onOffice gespeichert · ${status.zeit.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
          : `Speichern fehlgeschlagen: ${status.meldung}`;

  return (
    <p
      role="status"
      className={`text-small ${status.art === "fehler" ? "text-anthrazit" : "text-anthrazit/60"} ${className}`}
    >
      {text}
    </p>
  );
}
