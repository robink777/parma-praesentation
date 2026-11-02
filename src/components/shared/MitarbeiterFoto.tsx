"use client";

import { useState } from "react";
import Image from "next/image";
import { initialen } from "@/lib/mitarbeiterFotos";

// Mitarbeiter-Profilfoto mit Fallback auf den Initialen-Avatar — nicht nur, wenn gar keine
// fotoUrl bekannt ist (wie bisher), sondern AUCH, wenn das Foto zwar eine URL hat, der
// tatsächliche Bild-Abruf aber fehlschlägt.
//
// Nutzer-Meldung November 2026 (TV-Fernseher-Ansicht): "hier sind nur platzhalter ausgegeben
// außer bei Jacy" — nach einem ersten Fix (nur der onError-Fallback unten, der einen leeren
// Kreis durch die Initialen ersetzt) meldete der Nutzer richtig zurück: "Die Bilder laden nach
// wie vor nicht". Live-Diagnose auf der PRODUKTIONS-Domain zeigte den eigentlichen Grund: Next.js'
// eingebauter Bild-Optimierer (/_next/image, läuft bei Vercel als eigener, abrechenbarer Dienst)
// lieferte für JEDE einzelne onOffice-Foto-URL (außer Jacquelines) den Status "402 Payment
// Required" — Vercels monatliches Kontingent für Bild-Optimierungen war erschöpft. Grund: Die
// Foto-URLs aus ladeUserFotosByEmails (onoffice/estate.ts, "photosAsLinks: true") sind signierte
// EINMAL-Links, die sich bei JEDEM Seitenaufruf ändern (siehe deren params-Parameter) — jeder
// Mitarbeiter auf JEDEM Seitenaufruf zählte dadurch als ein NEUES, erstmals zu optimierendes Bild
// gegen das Kontingent, statt aus dem Cache bedient zu werden. Nur Jacquelines Foto liegt (anders
// als bei allen anderen) unter einer stabilen, unveränderlichen URL (crm-beta.onoffice.de/.../
// Userphoto_39.jpg) — DAS ist der eigentliche Grund, warum ausgerechnet ihres lud, nicht ihr
// Platz 1 in der Rangliste. Lösung: `unoptimized` unten — umgeht Vercels Bild-Optimierer
// komplett, der Fernseher/das Smartphone lädt die onOffice-URL direkt. Für kleine, bereits
// komprimierte 30-40px-Avatare ohne spürbaren Nachteil, und verbraucht nie wieder dieses
// Kontingent. Der onError-Fallback (siehe unten) bleibt zusätzlich bestehen — als Netz für den
// Fall, dass der onOffice-Bildserver selbst einmal kurz nicht erreichbar ist.
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
      unoptimized
      className="object-cover"
      sizes={groesseText}
      onError={() => setFehlgeschlagen(true)}
    />
  );
}
