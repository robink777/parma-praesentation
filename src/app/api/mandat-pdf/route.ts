import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { MandatDokument } from "@/lib/pdf/MandatDokument";
import { Bewertung, Immobilie, Kunde, LeistungspaketId, MaklervertragDaten } from "@/types";

// @react-pdf/renderer nutzt Node-APIs (fs für das Logo, Buffer-Handling) — läuft daher nicht
// im Edge-Runtime, sondern explizit auf Node.js.
export const runtime = "nodejs";

interface MandatPdfRequestBody {
  kunde: Kunde;
  immobilie: Immobilie;
  bewertung: Bewertung;
  daten: MaklervertragDaten;
  gewaehltesPaket?: LeistungspaketId;
}

// Erzeugt bei Klick auf "Mandat erteilen" (siehe Maklervertrag.tsx) das vollständige PDF aus
// Leistungsversprechen (inkl. gewähltem Paket) und Maklervertrag (inkl. aller Kunden- und
// Objektdaten) — serverseitig gerendert, damit @react-pdf/renderer nicht ins Client-Bundle
// muss und das Logo direkt von der Festplatte gelesen werden kann.
export async function POST(request: NextRequest) {
  let body: MandatPdfRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Anfrage-Body" }, { status: 400 });
  }

  const { kunde, immobilie, bewertung, daten, gewaehltesPaket } = body;
  if (!kunde || !immobilie || !bewertung || !daten) {
    return NextResponse.json(
      { error: "kunde, immobilie, bewertung und daten sind erforderlich" },
      { status: 400 }
    );
  }

  try {
    const buffer = await renderToBuffer(
      MandatDokument({ kunde, immobilie, bewertung, daten, gewaehltesPaket })
    );

    const nachname = kunde.nachname?.replace(/[^a-zA-Z0-9äöüÄÖÜß-]+/g, "_") || "Kunde";
    const dateiname = `Mandat_${nachname}.pdf`;

    return new NextResponse(new Blob([new Uint8Array(buffer)], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${dateiname}"`,
      },
    });
  } catch (error) {
    console.error("PDF-Erstellung fehlgeschlagen:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler bei der PDF-Erstellung" },
      { status: 500 }
    );
  }
}
