"use client";

import { useEffect, useState } from "react";
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
const SLIDE_DAUER_MS = 20_000;

type SlideId = "uebersicht" | "mitarbeiter";
const SLIDES: SlideId[] = ["uebersicht", "mitarbeiter"];

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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-stein">
      <header className="flex shrink-0 items-center justify-between px-lg py-md">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={132} height={33} priority />
        {/* Reine Fortschrittsanzeige, NICHT klickbar (Chat-Vorgabe: "da soll nichts klickbar
            sein") — zeigt nur, welche der drei Folien gerade läuft. */}
        <div className="flex items-center gap-xs" aria-hidden="true">
          {SLIDES.map((s) => (
            <span
              key={s}
              className={`h-[8px] w-[8px] rounded-full transition-colors ${
                s === slide ? "bg-messing" : "bg-anthrazit/15"
              }`}
            />
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
          />
        )}
      </main>
    </div>
  );
}
