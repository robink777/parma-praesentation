"use client";

import { useState } from "react";
import Image from "next/image";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { HauptbereichSwitcher } from "./HauptbereichSwitcher";
import { StatistikNav } from "./StatistikNav";
import { Uebersicht } from "./Uebersicht";
import { MitarbeiterBereich } from "./MitarbeiterBereich";
import { Leadquellen } from "./Leadquellen";
import { Kontrolle } from "./Kontrolle";
import { PlzObjekte } from "./PlzObjekte";
import {
  KontrollObjekt,
  LeadquellenKennzahlen,
  MitarbeiterKennzahlen,
  NeuzugaengeWoche,
  ObjektGesamtKennzahlen,
  ObjektkarteDaten,
} from "@/types";

// Hauptbereich "Statistik" (siehe app/admin/statistik/page.tsx) — Wurzelkomponente, seit Oktober
// 2026 eine eigene, vollflächige Route statt des früheren rechten 1/3-Panels neben der Karte
// (siehe Git-Historie, vormals Mitarbeiterstatistik.tsx). Übernimmt dessen abschnitt-/
// gewaehltePlz-State, jetzt aus den Query-Parametern der Server-Seite initialisiert statt aus
// einem lokalen Klick-Handler — ein PLZ-Klick auf der (jetzt getrennten) Karten-Seite navigiert
// hierher mit ?tab=plz&plz=…&ort=… (siehe KartenAnsicht.tsx).
export function StatistikAnsicht({
  kennzahlen,
  gesamtKennzahlen,
  kontrollObjekte,
  leadquellenKennzahlen,
  objektkarteDaten,
  neuzugaengeVerlauf,
  initialAbschnitt,
  initialPlz,
  initialOrt,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  gesamtKennzahlen?: ObjektGesamtKennzahlen;
  kontrollObjekte?: KontrollObjekt[];
  leadquellenKennzahlen?: LeadquellenKennzahlen;
  objektkarteDaten?: ObjektkarteDaten;
  neuzugaengeVerlauf?: NeuzugaengeWoche[];
  initialAbschnitt?: string;
  initialPlz?: string;
  initialOrt?: string;
}) {
  const [abschnitt, setAbschnitt] = useState(initialAbschnitt ?? "uebersicht");
  const [gewaehltePlz, setGewaehltePlz] = useState<{ plz: string; ort: string } | null>(
    initialPlz ? { plz: initialPlz, ort: initialOrt ?? "" } : null
  );

  return (
    <div className="min-h-screen bg-stein">
      <header className="flex items-center justify-between gap-md px-lg py-sm">
        <div className="flex items-center gap-sm">
          <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={104} height={26} priority />
          <div className="h-5 w-px bg-walnuss/15" />
          <p className="label">Admin-Bereich · Statistik</p>
        </div>
        <HauptbereichSwitcher />
      </header>
      <StatistikNav navItems={ADMIN_NAV_ITEMS} activeId={abschnitt} onSelect={setAbschnitt} />
      <main className="mx-auto max-w-content px-lg py-lg">
        <p className="label mb-xs">Admin-Bereich</p>
        <h1 className="mb-lg font-slab text-[40px] font-bold leading-[1.2] text-anthrazit md:text-[48px]">
          {ADMIN_NAV_ITEMS.find((item) => item.id === abschnitt)?.label ?? "Übersicht"}
        </h1>
        {abschnitt === "uebersicht" && (
          <Uebersicht gesamt={gesamtKennzahlen} neuzugaengeVerlauf={neuzugaengeVerlauf} />
        )}
        {abschnitt === "mitarbeiter" && <MitarbeiterBereich kennzahlen={kennzahlen} />}
        {abschnitt === "leadquellen" && <Leadquellen kennzahlen={leadquellenKennzahlen} />}
        {abschnitt === "kontrolle" && <Kontrolle objekte={kontrollObjekte} />}
        {abschnitt === "plz" && (
          <PlzObjekte
            plz={gewaehltePlz?.plz ?? null}
            ort={gewaehltePlz?.ort ?? null}
            daten={objektkarteDaten}
          />
        )}
      </main>
    </div>
  );
}
