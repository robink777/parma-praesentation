"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Uebersicht } from "@/components/admin/Uebersicht";
import { MitarbeiterLeaderboard } from "./MitarbeiterLeaderboard";
import { AdminDashboardDaten } from "@/lib/onoffice/adminDashboard";
import type { WettkampfEintrag } from "@/lib/onoffice/wettkampf";
import { automatischerAbrufSinnvoll } from "@/lib/useAutoRefresh";

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
// per Timer statt Klick (SLIDE_DAUER_MS), Datenaktualisierung im selben Takt, siehe unten.
//
// Die Karte war ursprünglich eine dritte Folie, auf Nutzerwunsch Oktober 2026 ("blende mal bitte
// die Karte aus! Also nur 2 Slides") wieder entfernt — objektkarteDaten wird in
// AdminDashboardDaten trotzdem weiter mitgeladen (siehe adminDashboard.ts), da app/admin/page.tsx
// das für den Karte-Navi-Punkt dort weiterhin braucht.
//
// Taktgeschwindigkeit nach kurzem Zwischenstand (10_000ms, zu kurz) auf eine Minute je Folie
// gesetzt (Nutzer-Vorgabe: "mach bitte eine Minute pro Folie").
const SLIDE_DAUER_MS = 60_000;

// Nutzer-Vorgabe November 2026: "die synchro immer dann zu machen wenn der Slide wechselt und die
// Grafische resonanz dann im grunde eine Slidedauer zu halten". Ein Abruf dauert mehrere Sekunden
// (rund 5 s, siehe useAutoRefresh.ts) — er startet deshalb um diesen Vorlauf VOR dem Folienwechsel,
// damit die neue Folie gleich mit frischen Zahlen beginnt. Trifft die Antwort einmal später ein,
// erscheinen ihre Werte einfach beim übernächsten Wechsel.
const SYNC_VORLAUF_MS = 12_000;

type SlideId = "uebersicht" | "mitarbeiter";
const SLIDES: SlideId[] = ["uebersicht", "mitarbeiter"];

type TvDaten = AdminDashboardDaten & { rangliste: WettkampfEintrag[]; saisonBisIso: string };

// Eine Momentaufnahme der sechs Kachel-Kennzahlen eines Mitarbeiters, für den Änderungs-Abgleich
// zwischen zwei Auftritten der Mitarbeiter-Folie (siehe unten). Schlüssel müssen exakt den
// `feld`-Werten in MitarbeiterLeaderboard.tsx entsprechen.
interface Momentaufnahme {
  telefonateHeute: number | null;
  termineHeute: number | null;
  telefonateWoche: number | null;
  termineWoche: number | null;
  telefonateGesamt: number;
  termineGesamt: number;
}

function momentaufnahmeVon(daten: TvDaten): Record<string, Momentaufnahme> {
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
  return aktuelle;
}

function ermittleAenderungen(
  vorherige: Record<string, Momentaufnahme>,
  aktuelle: Record<string, Momentaufnahme>
): Record<string, Set<string>> {
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
  return signale;
}

export function TvSlideshow(daten: TvDaten) {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  // Optisches Signal bei Datenänderung (Nutzer-Vorgabe Oktober 2026: "wenn ein Mitarbeiter aktiv
  // ist und eine Aktivität speichert, ein optisches Feedback ... Leuchten der Kachel ... Wert der
  // sich verändert hat pulsierend").
  //
  // KORREKTUR November 2026 (Nutzer-Meldung: "die Optische Resonanz ... wird nicht wirklich gut
  // sichtbar. Grund dafür ist das die Synchro stattfinden kann wenn die seite wechselt"). Abruf
  // und Folienwechsel liefen unabhängig voneinander, und jeder Abruf ersetzte die Markierung des
  // vorherigen — ein Signal aus der Übersichts-Folie war deshalb schon wieder weg, bevor die
  // Mitarbeiter-Folie es zeigen konnte. Jetzt gehören beide zusammen: Neue Server-Daten landen
  // zunächst nur in neuesteDatenRef, sichtbar werden sie ausschließlich beim Folienwechsel. Der
  // Abgleich läuft genau dann, wenn die Mitarbeiter-Folie erscheint, gegen den Stand ihres letzten
  // Auftritts — so geht keine Änderung verloren, und Leuchten und Pulsieren halten die ganze Folie.
  // Bewusst HIER berechnet statt in MitarbeiterLeaderboard.tsx: Diese Komponente bleibt beim
  // Folienwechsel durchgehend gemountet, die Mitarbeiter-Folie selbst nicht.
  const [angezeigt, setAngezeigt] = useState(daten);
  const [veraenderteFelder, setVeraenderteFelder] = useState<Record<string, Set<string>>>({});
  const neuesteDatenRef = useRef(daten);
  const zuletztGezeigtRef = useRef(momentaufnahmeVon(daten));

  useEffect(() => {
    neuesteDatenRef.current = daten;
  }, [daten]);

  useEffect(() => {
    // Nur bei sichtbarem Tab und zur Bürozeit (siehe useAutoRefresh.ts, Vercel-CPU-Limit 11/2026).
    const abruf = setTimeout(() => {
      if (automatischerAbrufSinnvoll()) router.refresh();
    }, SLIDE_DAUER_MS - SYNC_VORLAUF_MS);
    const wechsel = setTimeout(() => {
      const naechsterIndex = (index + 1) % SLIDES.length;
      const frisch = neuesteDatenRef.current;
      if (SLIDES[naechsterIndex] === "mitarbeiter") {
        const aktuelle = momentaufnahmeVon(frisch);
        setVeraenderteFelder(ermittleAenderungen(zuletztGezeigtRef.current, aktuelle));
        zuletztGezeigtRef.current = aktuelle;
      }
      setAngezeigt(frisch);
      setIndex(naechsterIndex);
    }, SLIDE_DAUER_MS);
    return () => {
      clearTimeout(abruf);
      clearTimeout(wechsel);
    };
  }, [index, router]);

  const slide = SLIDES[index];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-stein">
      <header className="flex shrink-0 items-center justify-between px-lg py-md">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={132} height={33} priority />
        {/* Fortschrittsanzeige, NICHT klickbar (Chat-Vorgabe: "da soll nichts klickbar sein") —
            ein Balken-Track pro Folie; der aktive schrumpft über SLIDE_DAUER_MS und zeigt so an,
            wann die nächste Folie kommt (Nutzer-Vorgabe: "ein Balken der kleiner wird und wenn er
            ganz klein ist wechselt die Seite ... kann auch dieses Element [die bisherigen Punkte]
            dafür nutzen"). Da die Daten mit dem Folienwechsel kommen, zeigt er zugleich die nächste
            Aktualisierung — eine eigene Anzeige ist hier nicht mehr nötig (Nutzer-Vorgabe November
            2026: "So kann auch die Aktualsierung verschwinden"). */}
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
          <Uebersicht gesamt={angezeigt.gesamtKennzahlen} neuzugaengeVerlauf={angezeigt.neuzugaengeVerlauf} />
        )}
        {slide === "mitarbeiter" && (
          <MitarbeiterLeaderboard
            kennzahlen={angezeigt.kennzahlen}
            rangliste={angezeigt.rangliste}
            alleMitarbeiter={angezeigt.alleMitarbeiter}
            saisonBisIso={angezeigt.saisonBisIso}
            veraenderteFelder={veraenderteFelder}
          />
        )}
      </main>
    </div>
  );
}
