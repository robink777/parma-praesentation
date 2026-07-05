"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { LeistungspaketId, Praesentation } from "@/types";
import { Begruessung } from "@/components/sections/Begruessung";
import { Kontaktperson } from "@/components/sections/Kontaktperson";
import { Unternehmen } from "@/components/sections/Unternehmen";
import { Objektdaten } from "@/components/sections/Objektdaten";
import { Bewertung } from "@/components/sections/Bewertung";
import { Dokumente } from "@/components/sections/Dokumente";
import { Vergleichswert } from "@/components/sections/Vergleichswert";
import { Finanzierung } from "@/components/sections/Finanzierung";
import { Leistungsversprechen } from "@/components/sections/Leistungsversprechen";
import { Maklervertrag } from "@/components/sections/Maklervertrag";

export function PraesentationApp({ daten }: { daten: Praesentation }) {
  const [activeId, setActiveId] = useState("begruessung");
  const [gewaehltesPaket, setGewaehltesPaket] = useState<LeistungspaketId | undefined>();
  const kundeName = [daten.kunde.vorname, daten.kunde.nachname].filter(Boolean).join(" ");

  return (
    <div className="flex h-screen w-screen">
      <Sidebar activeId={activeId} onSelect={setActiveId} kundeName={kundeName} />
      <main className="flex-1 overflow-hidden bg-reinweiss">
        {activeId === "begruessung" && (
          <Begruessung kunde={daten.kunde} />
        )}
        {activeId === "kontaktperson" && (
          <Kontaktperson betreuer={daten.betreuer} weitereMitarbeiter={daten.weitereMitarbeiter} />
        )}
        {activeId === "unternehmen" && <Unternehmen />}
        {activeId === "objekt" && <Objektdaten immobilie={daten.immobilie} />}
        {activeId === "bewertung" && <Bewertung bewertung={daten.bewertung} />}
        {activeId === "dokumente" && <Dokumente dokumente={daten.dokumente} />}
        {activeId === "vergleich" && <Vergleichswert immobilie={daten.immobilie} />}
        {activeId === "finanzierung" && <Finanzierung immobilie={daten.immobilie} />}
        {activeId === "leistungsversprechen" && (
          <Leistungsversprechen gewaehltesPaket={gewaehltesPaket} onWaehlePaket={setGewaehltesPaket} />
        )}
        {activeId === "maklervertrag" && (
          <Maklervertrag
            kunde={daten.kunde}
            immobilie={daten.immobilie}
            bewertung={daten.bewertung}
            gewaehltesPaket={gewaehltesPaket}
          />
        )}
      </main>
    </div>
  );
}
