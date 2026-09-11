import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { MaklervertragWiderrufDokument } from "@/lib/pdf/MaklervertragWiderrufDokument";
import { Bewertung, Immobilie, Kunde, LeistungspaketId, MaklervertragDaten } from "@/types";

// @react-pdf/renderer nutzt Node-APIs (fs für das Logo, Buffer-Handling) — läuft daher nicht
// im Edge-Runtime, sondern explizit auf Node.js.
export const runtime = "nodejs";

// Erreichbar sowohl live (Session-Cookie, Vorschau/Download durch den Berater/die Beraterin)
// als auch über den geteilten Kunden-Link (d/sig-Query-Parameter statt Session) — beide Fälle
// werden bereits in middleware.ts unterschieden/geprüft; diese Route selbst kennt den
// Unterschied nicht und rendert einfach den übergebenen Body (Chat-Vorgabe September 2026:
// "Maklervertrag inkl. Widerruf" als eigener Download auf der Verabschiedungsseite, siehe
// Verabschiedung.tsx).
interface MaklervertragPdfRequestBody {
  kunde: Kunde;
  immobilie: Immobilie;
  bewertung: Bewertung;
  daten: MaklervertragDaten;
  gewaehltesPaket?: LeistungspaketId;
}

export async function POST(request: NextRequest) {
  let body: MaklervertragPdfRequestBody;
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
      MaklervertragWiderrufDokument({ kunde, immobilie, bewertung, daten, gewaehltesPaket })
    );

    const nachname = kunde.nachname?.replace(/[^a-zA-Z0-9äöüÄÖÜß-]+/g, "_") || "Kunde";
    const dateiname = `Maklervertrag_${nachname}.pdf`;

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
