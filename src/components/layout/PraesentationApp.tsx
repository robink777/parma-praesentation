"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Immobilie, LeistungspaketId, Praesentation } from "@/types";
import { Begruessung } from "@/components/sections/Begruessung";
import { Kontaktperson } from "@/components/sections/Kontaktperson";
import { Unternehmen } from "@/components/sections/Unternehmen";
import { Objektdaten } from "@/components/sections/Objektdaten";
import { DeepImmo } from "@/components/sections/DeepImmo";
import { Bewertung } from "@/components/sections/Bewertung";
import { Dokumente } from "@/components/sections/Dokumente";
import { Vergleichswert } from "@/components/sections/Vergleichswert";
import { Finanzierung } from "@/components/sections/Finanzierung";
import { Leistungsversprechen } from "@/components/sections/Leistungsversprechen";
import { Maklervertrag } from "@/components/sections/Maklervertrag";

export function PraesentationApp({ daten }: { daten: Praesentation }) {
  const [activeId, setActiveId] = useState("begruessung");
  const [gewaehltesPaket, setGewaehltesPaket] = useState<LeistungspaketId | undefined>();
  // Manuell ausgewählte Referenzobjekte im Vergleichswert-Reiter (siehe Vergleichswert.tsx) —
  // hier (statt lokal im Reiter selbst) gehalten, damit die Auswahl beim Wechsel zwischen
  // Reitern erhalten bleibt, analog zu gewaehltesPaket oben.
  const [referenzobjekte, setReferenzobjekte] = useState<(Immobilie | null)[]>([null, null, null]);
  const kundeName = [daten.kunde.vorname, daten.kunde.nachname].filter(Boolean).join(" ");

  function referenzobjektAendern(index: number, objekt: Immobilie | null) {
    setReferenzobjekte((prev) => prev.map((o, i) => (i === index ? objekt : o)));
  }

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
        {activeId === "deepimmo" && <DeepImmo immobilie={daten.immobilie} />}
        {activeId === "bewertung" && <Bewertung bewertung={daten.bewertung} />}
        {activeId === "dokumente" && <Dokumente dokumente={daten.dokumente} />}
        {activeId === "vergleich" && (
          <Vergleichswert referenzobjekte={referenzobjekte} onReferenzobjektAendern={referenzobjektAendern} />
        )}
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
