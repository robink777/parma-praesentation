import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Erlaubte Quell-Hosts für den Proxy unten — ein striktes Allowlist statt einer offenen
// "beliebige URL durchreichen"-Logik, damit diese Route nicht zu einem offenen Proxy für fremde
// Inhalte wird (SSRF). Beide Formen, die in onOffice live beobachtet wurden, siehe
// onoffice/estate.ts: ladeUserFotosByEmails ("image.onoffice.de/blob.php", photosAsLinks: true)
// und der direkte Dateipfad für Jacqueline Henot ("crm-beta.onoffice.de/smart20/Dateien/...").
const ERLAUBTE_FOTO_HOSTS = ["image.onoffice.de", "crm-beta.onoffice.de"];

// Proxy für Mitarbeiter-Profilfotos aus onOffice — November 2026, nach einem Nutzer-Hinweis
// ("Die Bilder laden nach wie vor nicht auf meinem Fernseher") live diagnostiziert: Die
// signierten Foto-URLs aus onOffice ("image.onoffice.de/blob.php?params=...") funktionieren
// zuverlässig bei einem Server-zu-Server-Abruf (hundertfach live bestätigt, auch nach mehreren
// Minuten Verzögerung und mit verschiedenen Referer-Headern), liefern aber "402 Payment
// Required", sobald der BROWSER selbst dieselbe URL direkt lädt — reproduzierbar live bestätigt:
// exakt dieselbe URL, die im Server-Fetch 200 lieferte, scheiterte Sekunden später im Browser mit
// 402. Vermutlich ein lastverteilungsbedingter Eigenheit auf onOffice-Seite (die Antwort trägt
// ein "SERVER_USED"-Sticky-Session-Cookie, der Browser-Request landet dabei offenbar auf einem
// anderen Blob-Server-Knoten als der Server-Request). Technisch nicht auf unserer Seite lösbar —
// stattdessen lädt jetzt UNSER Server das Foto (zuverlässig, siehe oben) und reicht die Bytes an
// den Browser durch, der dadurch nie mehr selbst mit onOffice spricht. Genutzt von
// components/shared/MitarbeiterFoto.tsx (TV/Smartphone) sowie Kontaktperson.tsx/Unternehmen.tsx
// (Kundenpräsentation) und MitarbeiterBereich.tsx (Admin) — überall dort wird ein
// Mitarbeiter-/Betreuerfoto direkt vom Browser aus geladen.
//
// Bewusst von der App-weiten Session-Pflicht ausgenommen (siehe middleware.ts, analog zu /tv) —
// zeigt ausschließlich die ohnehin öffentlich sichtbaren Profilfotos der Mitarbeiter (dieselben,
// die auch auf der unauthentifizierten TV-Folie und der von Kunden ohne eigenen Login
// aufgerufenen /geteilt-Präsentation erscheinen), keine sensiblen Kunden-/Objektdaten — eine
// Session-Pflicht würde diese beiden öffentlichen Oberflächen nur unnötig blockieren.
export async function GET(request: NextRequest) {
  const quelle = request.nextUrl.searchParams.get("url");
  if (!quelle) {
    return NextResponse.json({ error: "url fehlt" }, { status: 400 });
  }

  let ziel: URL;
  try {
    ziel = new URL(quelle);
  } catch {
    return NextResponse.json({ error: "ungültige url" }, { status: 400 });
  }

  if (!ERLAUBTE_FOTO_HOSTS.includes(ziel.hostname)) {
    return NextResponse.json({ error: "host nicht erlaubt" }, { status: 400 });
  }

  const antwort = await fetch(ziel.toString(), { cache: "no-store" }).catch(() => null);
  if (!antwort || !antwort.ok) {
    return NextResponse.json({ error: "Foto konnte nicht geladen werden" }, { status: 502 });
  }

  const bytes = await antwort.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": antwort.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}
