"use client";

import { useEffect, useState } from "react";
import { ParmaLoader } from "@/components/ParmaLoader";

// Next.js zeigt diese Datei automatisch (App-Router-Konvention, React Suspense), solange die
// async Server Component in page.tsx (ladePraesentationsDaten, siehe lib/praesentation.ts) noch
// lädt — also bei jeder Präsentation neu, jedes Mal, da dort bewusst nie gecacht wird
// (cache: "no-store", siehe onoffice/client.ts). Es braucht dafür keinerlei Änderung an der
// Datenlade-Logik selbst.
//
// ladePraesentationsDaten lädt Kunde/Immobilie/Betreuer/Dokumente/Vergleichsobjekte-Basis in
// EINEM gemeinsamen Promise.all (siehe dort) — es gibt also kein echtes Fortschritts-Signal für
// einzelne Stationen. Stattdessen wird hier zeitgesteuert durch die drei vom Nutzer
// vorgegebenen Stationen geblättert (Ansprechpartner -> Objektunterlagen ->
// Vergleichsimmobilien) und die Schleife wiederholt, falls der echte Abruf länger dauert als
// ein Durchlauf — rein choreografisch, um die Ladezeit bildlich zu überbrücken (siehe
// ParmaLoader.tsx / design_handoff_ladescreen/README.md für die Animation selbst).
const STATIONEN = [
  "Ansprechpartner wird geladen",
  "Objektunterlagen werden geladen",
  "Vergleichsimmobilien werden geladen",
];

const INTERVALL_MS = 1900;

export default function Loading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % STATIONEN.length);
    }, INTERVALL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-reinweiss">
      <ParmaLoader label={STATIONEN[index]} />
    </div>
  );
}
