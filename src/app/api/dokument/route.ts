import { NextRequest, NextResponse } from "next/server";
import { ladeDokumentInhalt } from "@/lib/onoffice/estate";

// onOffice liefert bei Einzelabruf einer Datei (siehe ladeDokumentInhalt in estate.ts) kein
// eigenes Mimetype-Feld mit — der Content-Type muss daher hier anhand der Dateiendung
// hergeleitet werden. Liste beschränkt auf die in der Praxis am Objekt vorkommenden
// Dokumenttypen (Live-Recherche Juli 2026, Objekt 2415/"JH1180"); unbekannte Endungen fallen
// auf "application/octet-stream" zurück (Browser bietet dann einen Download statt Inline-
// Anzeige an, was als Fallback unkritisch ist).
const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
};

function mimeTypeFuerDateiname(dateiname: string): string {
  const endung = dateiname.split(".").pop()?.toLowerCase();
  return (endung && MIME_TYPES[endung]) || "application/octet-stream";
}

// Proxy-Route für "interne" OnOffice-Objektdokumente (Mietverträge, Altlastenauskunft, etc.),
// für die onOffice — anders als bei Fotos/Titelbild/Lageplan ("category": "external") — NIE
// eine direkte imageUrl liefert (siehe ausführlichen Kommentar bei RawFileRecord in
// mapping.ts). Ruft den Dateiinhalt serverseitig mit den API-Zugangsdaten ab (die niemals im
// Client landen dürfen) und reicht ihn unverändert mit passendem Content-Type durch.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estateId = searchParams.get("estateId");
  const fileId = searchParams.get("fileId");

  if (!estateId || !fileId) {
    return NextResponse.json(
      { error: "estateId und fileId sind erforderlich" },
      { status: 400 }
    );
  }

  try {
    const dokument = await ladeDokumentInhalt(estateId, fileId);
    if (!dokument) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(dokument.content), {
      headers: {
        "Content-Type": mimeTypeFuerDateiname(dokument.dateiname),
        "Content-Disposition": `inline; filename="${encodeURIComponent(dokument.dateiname)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Fehler beim Laden des Dokumentinhalts:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unbekannter Fehler beim Dokumentabruf",
      },
      { status: 500 }
    );
  }
}
