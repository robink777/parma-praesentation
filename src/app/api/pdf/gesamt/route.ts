import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { GesamtpraesentationDokument } from "@/lib/pdf/GesamtpraesentationDokument";
import { Betreuer, Bewertung, Immobilie, Kunde, LeistungspaketId, MaklervertragDaten } from "@/types";

// @react-pdf/renderer nutzt Node-APIs (fs für das Logo) — läuft daher nicht im Edge-Runtime.
export const runtime = "nodejs";

interface GesamtPdfRequestBody {
  kunde: Kunde;
  weitereEigentuemer?: Kunde[];
  immobilie: Immobilie;
  bewertung: Bewertung;
  betreuer?: Betreuer;
  daten: MaklervertragDaten;
  gewaehltesPaket?: LeistungspaketId;
  referenzobjekte?: Immobilie[];
}

// "Gesamtpräsentation als PDF" auf der Verabschiedungsseite (Chat-Vorgabe September 2026, siehe
// Verabschiedung.tsx) — erreichbar sowohl live (Session-Cookie) als auch über den geteilten
// Kunden-Link (d/sig-Query-Parameter, siehe middleware.ts).
export async function POST(request: NextRequest) {
  let body: GesamtPdfRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Anfrage-Body" }, { status: 400 });
  }

  const { kunde, weitereEigentuemer, immobilie, bewertung, betreuer, daten, gewaehltesPaket, referenzobjekte } = body;
  if (!kunde || !immobilie || !bewertung || !daten) {
    return NextResponse.json(
      { error: "kunde, immobilie, bewertung und daten sind erforderlich" },
      { status: 400 }
    );
  }

  try {
    const buffer = await renderToBuffer(
      GesamtpraesentationDokument({
        kunde,
        weitereEigentuemer: weitereEigentuemer ?? [],
        immobilie,
        bewertung,
        betreuer,
        daten,
        gewaehltesPaket,
        referenzobjekte: referenzobjekte ?? [],
      })
    );

    const nachname = kunde.nachname?.replace(/[^a-zA-Z0-9äöüÄÖÜß-]+/g, "_") || "Kunde";
    const dateiname = `Gesamtpraesentation_${nachname}.pdf`;

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
