"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Uebersicht } from "@/components/admin/Uebersicht";
import { MitarbeiterLeaderboard } from "./MitarbeiterLeaderboard";
import { ADMIN_REFRESH_INTERVAL_MS, useAutoRefresh } from "@/lib/useAutoRefresh";
import { AdminDashboardDaten } from "@/lib/onoffice/adminDashboard";
import type { WettkampfEintrag } from "@/lib/onoffice/wettkampf";

// TV-Vorführung für die Büro-Fernseher (Oktober 2026 Chat-Vorgabe: "ich hätte gerne einen Link
// generieren ... den ich dann auf den Fernsehern in den einzelnen Büros öffne ... zur Motivation,
// Erziehung der Mitarbeiter ... ein kleines Spiel ... keine Navigation, 2-3 Templates, die wie
// eine Art Slideshow einfach durchlaufen ... nichts klickbar"). Läuft unter app/tv/page.tsx,
// bewusst OHNE jeden Login/Token (Klarstellung direkt danach: "der Link soll einfach einzugeben
// sein und nicht passwort geschützt ... alle die Zahlen sehen können") — einfach /tv.
//
// Zwei Folien aus exakt denselben Bausteinen wie der Admin-Bereich (Uebersicht.tsx,
// MitarbeiterLeaderboard.tsx) — "repräsentativ" heißt hier: dieselben Live-Daten, keine eigene,
// u.U. abweichende Darstellung (siehe ladeAdminDashboardDaten in onoffice/adminDashboard.ts, von
// app/tv/page.tsx genauso aufgerufen wie von app/admin/page.tsx). Automatischer Folienwechsel
// per Timer statt Klick (SLIDE_DAUER_MS), Datenaktualisierung alle 60 Sekunden über denselben
// useAutoRefresh-Hook wie der Admin-Bereich (ADMIN_REFRESH_INTERVAL_MS).
//
// Die Karte war ursprünglich eine dritte Folie, auf Nutzerwunsch Oktober 2026 ("blende mal bitte
// die Karte aus! Also nur 2 Slides") wieder entfernt — objektkarteDaten wird in
// AdminDashboardDaten trotzdem weiter mitgeladen (siehe adminDashboard.ts), da app/admin/page.tsx
// das für den Karte-Navi-Punkt dort weiterhin braucht.
//
// Taktgeschwindigkeit nach kurzem Zwischenstand (10_000ms, zu kurz) auf eine Minute je Folie
// gesetzt (Nutzer-Vorgabe: "mach bitte eine Minute pro Folie").
const SLIDE_DAUER_MS = 60_000;

type SlideId = "uebersicht" | "mitarbeiter";
const SLIDES: SlideId[] = ["uebersicht", "mitarbeiter"];

// Eine Momentaufnahme der sechs Kachel-Kennzahlen eines Mitarbeiters, für den Änderungs-Abgleich
// zwischen zwei Ladezyklen (siehe Effekt unten). Schlüssel müssen exakt den `feld`-Werten in
// MitarbeiterLeaderboard.tsx entsprechen.
interface Momentaufnahme {
  telefonateHeute: number | null;
  termineHeute: number | null;
  telefonateWoche: number | null;
  termineWoche: number | null;
  telefonateGesamt: number;
  termineGesamt: number;
}

export function TvSlideshow(
  daten: AdminDashboardDaten & { rangliste: WettkampfEintrag[]; saisonBisIso: string }
) {
  const [index, setIndex] = useState(0);
  useAutoRefresh(ADMIN_REFRESH_INTERVAL_MS);

  useEffect(() => {
    const intervall = setInterval(() => {
      setIndex((bisher) => (bisher + 1) % SLIDES.length);
    }, SLIDE_DAUER_MS);
    return () => clearInterval(intervall);
  }, []);

  const slide = SLIDES[index];

  // Optisches Signal bei Datenänderung (Nutzer-Vorgabe Oktober 2026: "wenn ein Mitarbeiter aktiv
  // ist und eine Aktivität speichert, ein optisches Feedback ... Leuchten der Kachel ... Wert der
  // sich verändert hat pulsierend ... immer nur einen Ladezyklus bestehen"). Bewusst HIER in
  // TvSlideshow berechnet statt in MitarbeiterLeaderboard.tsx: Diese Komponente bleibt beim
  // Folienwechsel durchgehend gemountet, während die Mitarbeiter-Folie selbst bei jedem Wechsel
  // aus- und wieder eingehängt wird (siehe unten) — ein dort gehaltener Vergleichs-State würde den
  // Abgleich zwischen zwei Ladezyklen praktisch nie beide Male im gemounteten Zustand antreffen.
  // Vergleicht bei jedem Datenabruf (useAutoRefresh löst alle 60s ein router.refresh() aus) die
  // neuen gegen die zuletzt gesehenen Werte je Mitarbeiter; Treffer werden genau EINEN Zyklus lang
  // markiert, weil der nächste Abgleich die Markierung automatisch durch einen frischen (meist
  // leeren) Diff ersetzt — kein eigener Timer nötig.
  const vorherigeRef = useRef<Record<string, Momentaufnahme> | null>(null);
  const [veraenderteFelder, setVeraenderteFelder] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    const aktuelle: Record<string, Momentaufnahme> = {};
    for (const eintrag of daten.rangliste) {
      aktuelle[eintrag.name] = {
        telefonateHeute: daten.kennzahlen?.[eintrag.name]?.telefonateHeute ?? null,
        termineHeute: daten.kennzahlen?.[eintrag.name]?.termineHeute ?? null,
        telefonateWoche: daten.kennzahlen?.[eintrag.name]?.telefonateWoche ?? null,
        termineWoche: daten.kennzahlen?.[eintrag.name]?.termineWoche ?? null,
        telefonateGesamt: eintrag.telefonateGesamt,
        termineGesamt: eintrag.termineGesamt,
      };
    }

    const vorherige = vorherigeRef.current;
    vorherigeRef.current = aktuelle;
    if (!vorherige) return; // erster Ladevorgang: Startzustand, noch kein Vergleich möglich

    const signale: Record<string, Set<string>> = {};
    for (const [name, werte] of Object.entries(aktuelle)) {
      const alt = vorherige[name];
      if (!alt) continue; // neu zur Rangliste dazugekommen — nichts zum Vergleichen
      const felder = new Set<string>();
      (Object.keys(werte) as (keyof Momentaufnahme)[]).forEach((feld) => {
        if (werte[feld] !== alt[feld]) felder.add(feld);
      });
      if (felder.size > 0) signale[name] = felder;
    }
    setVeraenderteFelder(signale);
  }, [daten.rangliste, daten.kennzahlen]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-stein">
      <header className="flex shrink-0 items-center justify-between px-lg py-md">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={132} height={33} priority />
        {/* Fortschrittsanzeige, NICHT klickbar (Chat-Vorgabe: "da soll nichts klickbar sein") —
            ein Balken-Track pro Folie; der aktive schrumpft über SLIDE_DAUER_MS und zeigt so an,
            wann die nächste Folie kommt (Nutzer-Vorgabe: "ein Balken der kleiner wird und wenn er
            ganz klein ist wechselt die Seite ... kann auch dieses Element [die bisherigen Punkte]
            dafür nutzen"). */}
        <div className="flex items-center gap-xs" aria-hidden="true">
          {SLIDES.map((s) => (
            <div key={s} className="h-[4px] w-[34px] overflow-hidden rounded-full bg-anthrazit/10">
              {s === slide && (
                <div
                  className="tv-fortschritt-balken h-full origin-left rounded-full bg-messing"
                  style={{ animationDuration: `${SLIDE_DAUER_MS}ms` }}
                />
              )}
            </div>
          ))}
        </div>
      </header>
      <main className="min-h-0 flex-1 px-lg pb-lg">
        {slide === "uebersicht" && (
          <Uebersicht gesamt={daten.gesamtKennzahlen} neuzugaengeVerlauf={daten.neuzugaengeVerlauf} />
        )}
        {slide === "mitarbeiter" && (
          <MitarbeiterLeaderboard
            kennzahlen={daten.kennzahlen}
            rangliste={daten.rangliste}
            alleMitarbeiter={daten.alleMitarbeiter}
            saisonBisIso={daten.saisonBisIso}
            veraenderteFelder={veraenderteFelder}
          />
        )}
      </main>
    </div>
  );
}
