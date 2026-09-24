import { NextRequest, NextResponse } from "next/server";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import {
  ladePraesentationsKonfiguration,
  speicherePraesentationsKonfiguration,
} from "@/lib/onoffice/praesentationsdatei";
import { istPraesentationConfig } from "@/lib/share";

export const runtime = "nodejs";

// Lädt/speichert die Präsentations-Konfiguration (Vergleichsobjekte, Navigation, Paket,
// Vertragsdaten) als interne Datei am Objekt in onOffice — siehe lib/onoffice/
// praesentationsdatei.ts. Im Mock-Modus gibt es kein onOffice-Objekt, an das eine Datei gehängt
// werden könnte: "verfuegbar: false" sagt dem Client, dass er gar nicht erst speichern soll.
export async function GET(request: NextRequest) {
  const estateId = new URL(request.url).searchParams.get("estateId");
  if (!estateId) return NextResponse.json({ error: "estateId fehlt" }, { status: 400 });

  if (ONOFFICE_MODE !== "live") return NextResponse.json({ verfuegbar: false, config: null });

  try {
    const config = await ladePraesentationsKonfiguration(estateId);
    return NextResponse.json({ verfuegbar: true, config });
  } catch (error) {
    console.error("Präsentations-Konfiguration laden fehlgeschlagen:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Konfiguration konnte nicht geladen werden" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || !istPraesentationConfig(body.config)) {
    return NextResponse.json({ error: "Ungültige Präsentations-Konfiguration" }, { status: 400 });
  }
  if (ONOFFICE_MODE !== "live") return NextResponse.json({ verfuegbar: false });

  try {
    await speicherePraesentationsKonfiguration(body.config.estateId, body.config);
    return NextResponse.json({ verfuegbar: true, gespeichertAm: new Date().toISOString() });
  } catch (error) {
    console.error("Präsentations-Konfiguration speichern fehlgeschlagen:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Konfiguration konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }
}
