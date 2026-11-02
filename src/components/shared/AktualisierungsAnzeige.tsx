"use client";

import { useEffect, useState } from "react";

// Sichtbarer Hinweis, WANN zuletzt aktualisiert wurde und wann der nächste Abruf ansteht —
// Nutzer-Vorgabe November 2026: "Vielleicht brauchen wir noch ein optisches feedback wann
// aktuallisert wird", ergänzt um "einen counter ... wann die nächste bewertung ansteht". Ein
// kleiner Punkt (pulsiert während des Nachladens, sonst gedämpft), die Uhrzeit des letzten Abrufs
// und ein Countdown bis zum nächsten. Der Sekundentakt liegt bewusst hier statt im Hook, damit
// nur diese Anzeige und nicht die ganze Seite jede Sekunde neu rendert. `jetzt` startet als null,
// damit Server und Browser beim ersten Rendern denselben Text ausgeben.
export function AktualisierungsAnzeige({
  wirdAktualisiert,
  zuletztAktualisiert,
  naechsteAktualisierungUm,
}: {
  wirdAktualisiert: boolean;
  zuletztAktualisiert: Date | null;
  naechsteAktualisierungUm: number | null;
}) {
  const [jetzt, setJetzt] = useState<number | null>(null);

  useEffect(() => {
    setJetzt(Date.now());
    const takt = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(takt);
  }, []);

  const zeit = zuletztAktualisiert
    ? zuletztAktualisiert.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "–";
  const sekunden =
    jetzt !== null && naechsteAktualisierungUm !== null
      ? Math.max(0, Math.ceil((naechsteAktualisierungUm - jetzt) / 1000))
      : null;

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
      {!wirdAktualisiert && sekunden !== null && ` · nächste in ${sekunden} s`}
    </div>
  );
}
