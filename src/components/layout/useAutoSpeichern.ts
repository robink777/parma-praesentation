"use client";

import { useEffect, useRef, useState } from "react";
import type { PraesentationConfig } from "@/lib/share";

export type SpeicherStatus =
  | { art: "leer" }
  | { art: "geladen" }
  | { art: "speichert" }
  | { art: "gespeichert"; zeit: Date }
  | { art: "fehler"; meldung: string };

// Wartezeit nach der letzten Änderung, bevor gespeichert wird — jede Speicherung sind mehrere
// onOffice-API-Aufrufe (Datei anlegen, alte Version löschen, siehe lib/onoffice/
// praesentationsdatei.ts), beim Tippen im Maklervertrag soll nicht bei jedem Zeichen gespeichert
// werden.
const SPEICHER_VERZOEGERUNG_MS = 1500;

async function sendeKonfiguration(config: PraesentationConfig, keepalive = false): Promise<void> {
  const res = await fetch("/api/praesentation-konfig", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
    keepalive,
  });
  if (!res.ok) {
    const fehler = await res.json().catch(() => null);
    throw new Error(fehler?.error || "Speichern in onOffice fehlgeschlagen");
  }
}

// Speichert die aktuelle Präsentations-Konfiguration automatisch nach jeder Änderung als Datei am
// Objekt in onOffice (siehe /api/praesentation-konfig). `aktiv` ist erst true, wenn der geladene
// Stand bzw. die automatische Vorauswahl angewendet wurde UND der Nutzer selbst etwas geändert hat
// (siehe PraesentationApp.tsx) — ohne echte Nutzeränderung wird nichts gespeichert, sonst würde
// jedes bloße Öffnen einer Präsentation eine Datei anlegen und dabei z.B. die aktuellen
// Kundendaten aus onOffice einfrieren. Änderungen, die schon während des (bei onOffice teils
// >10 Sekunden dauernden) Ladens passieren, werden so ebenfalls erfasst.
export function useAutoSpeichern(config: PraesentationConfig, aktiv: boolean) {
  const [status, setStatus] = useState<SpeicherStatus>({ art: "leer" });
  const letzterStand = useRef<string | null>(null);
  const ausstehend = useRef<{ config: PraesentationConfig; json: string } | null>(null);
  // Speicherungen laufen hintereinander, nicht parallel — zwei gleichzeitige "Neue Datei anlegen
  // + alte löschen"-Abläufe könnten sich sonst gegenseitig die frisch angelegte Datei wegräumen.
  const kette = useRef<Promise<void>>(Promise.resolve());

  const json = JSON.stringify(config);

  useEffect(() => {
    if (!aktiv) return;
    if (json === letzterStand.current) {
      ausstehend.current = null;
      return;
    }

    ausstehend.current = { config, json };
    const timer = setTimeout(() => {
      const zuSpeichern = ausstehend.current;
      if (!zuSpeichern) return;
      ausstehend.current = null;
      setStatus({ art: "speichert" });
      kette.current = kette.current.then(async () => {
        try {
          await sendeKonfiguration(zuSpeichern.config);
          letzterStand.current = zuSpeichern.json;
          setStatus({ art: "gespeichert", zeit: new Date() });
        } catch (error) {
          setStatus({
            art: "fehler",
            meldung: error instanceof Error ? error.message : "Speichern in onOffice fehlgeschlagen",
          });
        }
      });
    }, SPEICHER_VERZOEGERUNG_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, aktiv]);

  // Seite wird während der Wartezeit neu geladen/geschlossen (genau der Fall, der das Speichern
  // überhaupt nötig macht): die noch nicht gesendete letzte Änderung mit keepalive absetzen,
  // damit sie den Seitenwechsel überlebt.
  useEffect(() => {
    function beimVerlassen() {
      const zuSpeichern = ausstehend.current;
      if (!zuSpeichern) return;
      ausstehend.current = null;
      sendeKonfiguration(zuSpeichern.config, true).catch(() => undefined);
    }
    window.addEventListener("pagehide", beimVerlassen);
    return () => window.removeEventListener("pagehide", beimVerlassen);
  }, []);

  return { status, setStatus };
}
