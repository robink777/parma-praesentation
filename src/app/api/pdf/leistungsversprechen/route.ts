import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { LeistungsversprechenDokument } from "@/lib/pdf/LeistungsversprechenDokument";
import { LeistungspaketId } from "@/types";

// @react-pdf/renderer nutzt Node-APIs (fs für das Logo) — läuft daher nicht im Edge-Runtime.
export const runtime = "nodejs";

const GUELTIGE_PAKETE: LeistungspaketId[] = ["basis", "komfort", "premium"];

// Eigenständiger Download "Leistungsversprechen" auf der Verabschiedungsseite (Chat-Vorgabe
// September 2026, siehe Verabschiedung.tsx) — GET statt POST, da der einzige variable Wert
// (gewähltesPaket) problemlos als Query-Parameter passt. Erreichbar sowohl live (Session-Cookie)
// als auch über den geteilten Kunden-Link (d/sig-Query-Parameter, siehe middleware.ts).
export async function GET(request: NextRequest) {
  const paketParam = request.nextUrl.searchParams.get("paket");
  const gewaehltesPaket = GUELTIGE_PAKETE.includes(paketParam as LeistungspaketId)
    ? (paketParam as LeistungspaketId)
    : undefined;

  try {
    const buffer = await renderToBuffer(LeistungsversprechenDokument({ gewaehltesPaket }));

    return new NextResponse(new Blob([new Uint8Array(buffer)], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Leistungsversprechen.pdf"`,
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
