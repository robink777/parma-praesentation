import { NextRequest, NextResponse } from "next/server";
import { ladeImmobilien, ladeImmobilieById } from "@/lib/onoffice/estate";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import { MOCK_IMMOBILIE, MOCK_VERGLEICHSPOOL } from "@/lib/onoffice/mock";
import { Immobilie } from "@/types";

// Solange ONOFFICE_MODE=mock (lokale Entwicklung ohne Live-Zugangsdaten, siehe onoffice/config.ts),
// liefert dieser Endpunkt die Demo-Objekte statt echter Live-Daten — damit die Objektauswahl-Seite
// (siehe ObjektAuswahl.tsx) auch ohne echten OnOffice-Zugang durchgängig testbar bleibt.
const MOCK_OBJEKTE = [MOCK_IMMOBILIE, ...MOCK_VERGLEICHSPOOL];

// Alle relevanten Freitext-Felder für die Objektsuche — insbesondere die ImmoNr
// (objektnr_extern, siehe mapping.ts), damit Berater/innen ein Objekt auch anhand der ihnen
// bekannten Objektnummer statt nur über Titel/Ort finden können. Gilt identisch für Live- und
// Mock-Daten, damit sich die Suche in beiden Modi gleich verhält.
function treffer(immobilie: Immobilie, suchbegriff: string): boolean {
  return [immobilie.bezeichnung, immobilie.ort, immobilie.plz, immobilie.immoNr]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(suchbegriff);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const suche = searchParams.get("suche");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (ONOFFICE_MODE !== "live") {
    if (id) {
      const objekt = MOCK_OBJEKTE.find((i) => i.id === id);
      return objekt
        ? NextResponse.json(objekt)
        : NextResponse.json({ error: "Immobilie nicht gefunden" }, { status: 404 });
    }

    const suchbegriff = suche?.toLowerCase().trim();
    const gefiltert = suchbegriff ? MOCK_OBJEKTE.filter((i) => treffer(i, suchbegriff)) : MOCK_OBJEKTE;

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

    // Bewusst der volle Bestand (hohes Listlimit) statt eines serverseitigen onOffice-Filters
    // auf "objekttitel": Die onOffice-Filter-Syntax kombiniert unterschiedliche Felder per UND,
    // eine ODER-Suche über Titel/Ort/PLZ/ImmoNr ist darüber nicht abbildbar. Stattdessen wird
    // hier — wie im Mock-Zweig oben — clientseitig über alle relevanten Felder gefiltert
    // (siehe treffer()), erst danach auf das angeforderte limit gekürzt.
    // 1500 statt vorher 500: Der Account hat aktuell 1023 Objekte mit vermarktungsart=kauf
    // (gegen den Live-Account geprüft) — mit 500 wäre rund die Hälfte des Bestands für die
    // Suche unsichtbar gewesen. 1500 lässt zusätzlich Luft für weiteres Wachstum.
    const RAW_LISTLIMIT = 1500;
    const immobilien = await ladeImmobilien(RAW_LISTLIMIT, {
      vermarktungsart: [{ op: "=", val: "kauf" }],
    });

    const suchbegriff = suche?.toLowerCase().trim();
    const gefiltert = suchbegriff ? immobilien.filter((i) => treffer(i, suchbegriff)) : immobilien;

    return NextResponse.json(gefiltert.slice(0, limit));
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
