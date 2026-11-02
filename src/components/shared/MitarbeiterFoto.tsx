"use client";

import { useState } from "react";
import Image from "next/image";
import { fotoProxyUrl, initialen } from "@/lib/mitarbeiterFotos";

// Mitarbeiter-Profilfoto mit Fallback auf den Initialen-Avatar — nicht nur, wenn gar keine
// fotoUrl bekannt ist (wie bisher), sondern AUCH, wenn das Foto zwar eine URL hat, der
// tatsächliche Bild-Abruf aber fehlschlägt.
//
// Nutzer-Meldung November 2026 (TV-Fernseher-Ansicht): "hier sind nur platzhalter ausgegeben
// außer bei Jacy" — nach einem ersten Fix (nur der onError-Fallback unten) meldete der Nutzer
// richtig zurück: "Die Bilder laden nach wie vor nicht". KORREKTUR nach genauerer Live-Diagnose
// (ein zunächst vermuteter Vercel-Bild-Optimierungs-Kontingent-Grund erwies sich als falsch): Die
// onOffice-Foto-URLs ("image.onoffice.de/blob.php?params=...") funktionieren zuverlässig bei
// einem Server-zu-Server-Abruf (live hundertfach bestätigt, auch nach mehreren Minuten
// Verzögerung), liefern aber "402 Payment Required", sobald der BROWSER dieselbe URL direkt
// lädt — live reproduziert: exakt dieselbe URL, die im Server-Fetch Sekunden zuvor 200 lieferte,
// scheiterte im Browser mit 402 (die Antwort trägt einen "SERVER_USED"-Sticky-Session-Cookie,
// vermutlich landet der Browser-Request auf einem anderen onOffice-Blob-Server-Knoten als der
// Server-Request). Technisch nicht auf unserer Seite behebbar — stattdessen lädt jetzt UNSER
// Server das Foto (siehe app/api/mitarbeiterfoto/route.ts, fotoProxyUrl in
// lib/mitarbeiterFotos.ts) und reicht die Bytes durch, der Browser spricht dadurch nie mehr
// direkt mit onOffice. `unoptimized`, weil Vercels Bild-Optimierer auf diesem bereits von uns
// durchgereichten Bild keinen Mehrwert bietet. Der onError-Fallback bleibt zusätzlich bestehen —
// als Netz für den Fall, dass der onOffice-Bildserver selbst einmal kurz nicht erreichbar ist.
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
      src={fotoProxyUrl(fotoUrl)}
      alt={name}
      fill
      unoptimized
      className="object-cover"
      sizes={groesseText}
      onError={() => setFehlgeschlagen(true)}
    />
  );
}
