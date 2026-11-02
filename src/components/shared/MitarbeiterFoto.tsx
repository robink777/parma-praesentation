"use client";

import { useState } from "react";
import Image from "next/image";
import { initialen } from "@/lib/mitarbeiterFotos";

// Mitarbeiter-Profilfoto mit Fallback auf den Initialen-Avatar — nicht nur, wenn gar keine
// fotoUrl bekannt ist (wie bisher), sondern AUCH, wenn das Foto zwar eine URL hat, der
// tatsächliche Bild-Abruf aber fehlschlägt.
//
// Nutzer-Meldung November 2026 (TV-Fernseher-Ansicht): "hier sind nur platzhalter ausgegeben
// außer bei Jacy". Ursache war Vercels Bild-Optimierung: Die signierten onOffice-Foto-URLs ändern
// sich bei jedem Abruf und verbrauchten so das Hobby-Kontingent, danach kam 402 (siehe
// next.config.ts). Die Bildoptimierung ist deshalb projektweit aus. Dieser Fallback greift, falls
// der onOffice-Bildserver selbst kurz nicht erreichbar ist.
//
// Diese Komponente ist bewusst eine eigene, kleine Client-Komponente (statt der Inline-Ternary
// in MitarbeiterLeaderboard.tsx/TvMobil.tsx) — `onError` auf next/image braucht lokalen
// Re-Render-State (useState), der nur in einer Client-Komponente möglich ist. Gemeinsam genutzt
// von TV (MitarbeiterLeaderboard.tsx) UND Smartphone-Ansicht (TvMobil.tsx), damit beide
// garantiert dasselbe robuste Verhalten zeigen statt es zweimal leicht abweichend nachzubauen.
export function MitarbeiterFoto({
  fotoUrl,
  name,
  groesseText,
  schriftKlasse = "text-[9px]",
}: {
  fotoUrl?: string;
  name: string;
  // sizes-Attribut für next/image (siehe MDN "sizes") — je Aufrufer unterschiedlich groß
  // (TV-Kachel 30px, Smartphone-Kachel 36px), deshalb als Prop statt hartkodiert.
  groesseText: string;
  schriftKlasse?: string;
}) {
  const [fehlgeschlagen, setFehlgeschlagen] = useState(false);

  if (!fotoUrl || fehlgeschlagen) {
    return (
      <div className={`flex h-full w-full items-center justify-center font-slab font-bold text-walnuss ${schriftKlasse}`}>
        {initialen(name)}
      </div>
    );
  }

  return (
    <Image
      src={fotoUrl}
      alt={name}
      fill
      className="object-cover"
      sizes={groesseText}
      onError={() => setFehlgeschlagen(true)}
    />
  );
}
