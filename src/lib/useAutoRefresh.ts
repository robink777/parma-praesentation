"use client";

import { useEffect, useState } from "react";
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

// KORREKTUR November 2026 (Nutzer-Meldung: "ich habe gerade bei kira einen testanruf gemacht.
// Dieser wieder nicht eingetragen auch nach der aktuallisereung von 1 minute ... Vielleicht
// brauchen wir noch ein optisches feedback wann aktuallisert wird"). Der fehlende Anruf lag am
// Zeitzonen-Fehler, siehe lib/zeitzone.ts. Die Anzeige bleibt trotzdem sinnvoll: Ohne sichtbaren
// Hinweis lässt sich ein ausbleibender Refresh nicht von normaler Wartezeit bis zum nächsten
// Zyklus unterscheiden.
//
// Gibt deshalb jetzt zusätzlich zurück, OB gerade aktualisiert wird und WANN der letzte
// erfolgreiche Abruf eintraf. `aenderungsSignal` ist ein beliebiger Wert aus den vom Server
// gelieferten Props (z.B. das gesamte Daten-Objekt) — React vergleicht ihn per Referenz, und ein
// frischer Server-Render liefert bei JEDEM Aufruf neue Objekt-Referenzen, auch wenn sich die
// Werte inhaltlich nicht geändert haben. Der Effekt unten reagiert deshalb zuverlässig auf JEDEN
// abgeschlossenen Refresh, nicht nur auf Refreshs mit tatsächlich geänderten Werten.
export function useAutoRefresh(
  intervalMs: number,
  aenderungsSignal: unknown
): {
  wirdAktualisiert: boolean;
  zuletztAktualisiert: Date | null;
  naechsteAktualisierungUm: number | null;
} {
  const router = useRouter();
  const [wirdAktualisiert, setWirdAktualisiert] = useState(false);
  const [zuletztAktualisiert, setZuletztAktualisiert] = useState<Date | null>(null);
  const [naechsteAktualisierungUm, setNaechsteAktualisierungUm] = useState<number | null>(null);

  useEffect(() => {
    setNaechsteAktualisierungUm(Date.now() + intervalMs);
    const intervall = setInterval(() => {
      setNaechsteAktualisierungUm(Date.now() + intervalMs);
      setWirdAktualisiert(true);
      router.refresh();
    }, intervalMs);
    return () => clearInterval(intervall);
  }, [router, intervalMs]);

  // Läuft bei JEDER Änderung von aenderungsSignal — das schließt den allerersten Render mit ein
  // (zuletztAktualisiert zeigt dadurch von Anfang an einen Zeitpunkt, statt zunächst leer zu
  // bleiben, bis der erste Refresh-Zyklus nach bis zu 60s eintrifft).
  useEffect(() => {
    setWirdAktualisiert(false);
    setZuletztAktualisiert(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aenderungsSignal]);

  return { wirdAktualisiert, zuletztAktualisiert, naechsteAktualisierungUm };
}
