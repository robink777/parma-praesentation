"use client";

import { useState } from "react";
import Image from "next/image";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { StatistikNav } from "./StatistikNav";
import { Uebersicht } from "./Uebersicht";
import { KarteBereich } from "./KarteBereich";
import { MitarbeiterBereich } from "./MitarbeiterBereich";
import { Leadquellen } from "./Leadquellen";
import { Kontrolle } from "./Kontrolle";
import { ADMIN_REFRESH_INTERVAL_MS, useAutoRefresh } from "@/lib/useAutoRefresh";
import {
  Betreuer,
  KontrollObjekt,
  LeadquellenKennzahlen,
  MitarbeiterKennzahlen,
  NeuzugaengeWoche,
  ObjektGesamtKennzahlen,
  ObjektkarteDaten,
} from "@/types";

// Wurzelkomponente des Admin-Dashboards (siehe app/admin/page.tsx) — bis Oktober 2026 kurzzeitig
// auf zwei getrennte, vollflächige Routen aufgeteilt (Karte/Statistik, siehe Git-Historie
// StatistikAnsicht.tsx + KartenAnsicht.tsx + HauptbereichSwitcher.tsx), direkt danach wieder zu
// EINER Seite zusammengeführt (Chat-Vorgabe: "Neben Übersicht hätte ich gerne den Navi Punkt
// Karte. Damit können wir uns den Bereich 'Karten/Statistik/Finanz' sparen") — Karte ist jetzt
// einfach einer von fünf gleichrangigen Punkten in StatistikNav (siehe adminNav.ts), kein eigener
// Hauptbereich-Umschalter mehr nötig.
export function AdminDashboard({
  kennzahlen,
  gesamtKennzahlen,
  kontrollObjekte,
  leadquellenKennzahlen,
  objektkarteDaten,
  neuzugaengeVerlauf,
  alleMitarbeiter,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  gesamtKennzahlen?: ObjektGesamtKennzahlen;
  kontrollObjekte?: KontrollObjekt[];
  leadquellenKennzahlen?: LeadquellenKennzahlen;
  objektkarteDaten?: ObjektkarteDaten;
  neuzugaengeVerlauf?: NeuzugaengeWoche[];
  alleMitarbeiter?: Betreuer[];
}) {
  const [abschnitt, setAbschnitt] = useState("uebersicht");
  const [gewaehltePlz, setGewaehltePlz] = useState<{ plz: string; ort: string } | null>(null);
  useAutoRefresh(ADMIN_REFRESH_INTERVAL_MS);

  // "Übersicht", "Karte" und "Mitarbeiter" sind die drei TV-Dashboard-Landing-Screens (Oktober
  // 2026 Chat-Vorgabe: "Ich will dass sie den ersten beiden Seiten gleicht ... auch in dem Navi
  // Punkt will ich nicht scrollen müssen") — alle drei bekommen eine FESTE Höhe ohne Scroll und
  // keinen eigenen Seitentitel, der nur Platz kostet. Leadquellen/Kontrolle sind der Natur ihrer
  // Daten nach unbegrenzt lang (Objektliste …) — dort bleibt normales Scrollen nötig und sinnvoll.
  const istVollflaechig =
    abschnitt === "uebersicht" || abschnitt === "karte" || abschnitt === "mitarbeiter";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stein">
      <header className="flex shrink-0 items-center gap-sm px-lg py-sm">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={104} height={26} priority />
        <div className="h-5 w-px bg-walnuss/15" />
        <p className="label">Admin-Bereich</p>
      </header>
      <StatistikNav navItems={ADMIN_NAV_ITEMS} activeId={abschnitt} onSelect={setAbschnitt} />
      <main
        className={`mx-auto min-h-0 w-full max-w-content flex-1 px-lg ${
          istVollflaechig ? "flex flex-col overflow-hidden py-sm" : "overflow-y-auto py-lg"
        }`}
      >
        {abschnitt === "uebersicht" && (
          <Uebersicht gesamt={gesamtKennzahlen} neuzugaengeVerlauf={neuzugaengeVerlauf} />
        )}
        {abschnitt === "karte" && (
          <KarteBereich
            daten={objektkarteDaten}
            gewaehltePlz={gewaehltePlz}
            onPlzKlick={(plz, ort) => setGewaehltePlz({ plz, ort })}
          />
        )}
        {abschnitt === "mitarbeiter" && (
          <MitarbeiterBereich kennzahlen={kennzahlen} alleMitarbeiter={alleMitarbeiter} />
        )}
        {!istVollflaechig && (
          <>
            <p className="label mb-xs">Admin-Bereich</p>
            <h1 className="mb-lg font-slab text-[40px] font-bold leading-[1.2] text-anthrazit md:text-[48px]">
              {ADMIN_NAV_ITEMS.find((item) => item.id === abschnitt)?.label}
            </h1>
            {abschnitt === "leadquellen" && <Leadquellen kennzahlen={leadquellenKennzahlen} />}
            {abschnitt === "kontrolle" && <Kontrolle objekte={kontrollObjekte} />}
          </>
        )}
      </main>
    </div>
  );
}
