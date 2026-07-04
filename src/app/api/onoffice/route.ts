import { NextRequest, NextResponse } from "next/server";
import { ladeImmobilien, ladeImmobilieById } from "@/lib/onoffice/estate";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import { MOCK_IMMOBILIE, MOCK_VERGLEICHSPOOL } from "@/lib/onoffice/mock";

// Solange ONOFFICE_MODE=mock (lokale Entwicklung ohne Live-Zugangsdaten, siehe onoffice/config.ts),
// liefert dieser Endpunkt die Demo-Objekte statt echter Live-Daten — damit die Objektauswahl-Seite
// (siehe ObjektAuswahl.tsx) auch ohne echten OnOffice-Zugang durchgängig testbar bleibt.
const MOCK_OBJEKTE = [MOCK_IMMOBILIE, ...MOCK_VERGLEICHSPOOL];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const suche = searchParams.get("suche");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (ONOFFICE_MODE !== "live") {
    if (id) {
      const treffer = MOCK_OBJEKTE.find((i) => i.id === id);
      return treffer
        ? NextResponse.json(treffer)
        : NextResponse.json({ error: "Immobilie nicht gefunden" }, { status: 404 });
    }

    const suchbegriff = suche?.toLowerCase().trim();
    const gefiltert = suchbegriff
      ? MOCK_OBJEKTE.filter((i) =>
          [i.bezeichnung, i.ort, i.plz].filter(Boolean).join(" ").toLowerCase().includes(suchbegriff)
        )
      : MOCK_OBJEKTE;

    return NextResponse.json(gefiltert.slice(0, limit));
  }

  if (!process.env.ONOFFICE_TOKEN || !process.env.ONOFFICE_SECRET) {
    return NextResponse.json(
      {
        error:
          "onOffice API-Zugangsdaten fehlen. Bitte ONOFFICE_TOKEN und ONOFFICE_SECRET in .env.local eintragen.",
      },
      { status: 500 }
    );
  }

  try {
    if (id) {
      const immobilie = await ladeImmobilieById(id);
      if (!immobilie) {
        return NextResponse.json(
          { error: "Immobilie nicht gefunden" },
          { status: 404 }
        );
      }
      return NextResponse.json(immobilie);
    }

    const filter: Record<string, unknown> = {
      vermarktungsart: [{ op: "=", val: "kauf" }],
    };

    if (suche) {
      filter.objekttitel = [{ op: "like", val: `%${suche}%` }];
    }

    const immobilien = await ladeImmobilien(limit, filter);
    return NextResponse.json(immobilien);
  } catch (error) {
    console.error("onOffice API Fehler:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler bei der onOffice-Abfrage",
      },
      { status: 500 }
    );
  }
}
