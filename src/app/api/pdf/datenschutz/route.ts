import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DatenschutzDokument } from "@/lib/pdf/DatenschutzDokument";

// @react-pdf/renderer nutzt Node-APIs (fs für das Logo) — läuft daher nicht im Edge-Runtime.
export const runtime = "nodejs";

// Eigenständiger Download "Datenschutz" auf der Verabschiedungsseite (Chat-Vorgabe September
// 2026, siehe Verabschiedung.tsx) — GET ohne Parameter, der Inhalt ist vollständig statisch
// (siehe data/rechtstexte.ts). Erreichbar sowohl live (Session-Cookie) als auch über den
// geteilten Kunden-Link (d/sig-Query-Parameter, siehe middleware.ts).
export async function GET() {
  try {
    const buffer = await renderToBuffer(DatenschutzDokument());

    return new NextResponse(new Blob([new Uint8Array(buffer)], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Datenschutzerklaerung.pdf"`,
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
