import { NextRequest, NextResponse } from "next/server";
import { ladeImmobilien, ladeImmobilieById, ladeTitelbilder } from "@/lib/onoffice/estate";
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
//
// "strasse" war hier ursprünglich nicht enthalten — dadurch fand die Suche ein Objekt nicht,
// wenn jemand ausschließlich den Straßennamen eintippte (z.B. "Rölsdorfer Feld" statt eines
// Teils des Objekttitels/Orts/PLZ/ImmoNr), obwohl der Straßenname im Datensatz vorhanden ist
// (siehe Immobilie.strasse, aus dem OnOffice-Feld "strasse", mapping.ts). Ergänzt, damit die
// Suche auch reine Adress-/Straßeneingaben findet.
function treffer(immobilie: Immobilie, suchbegriff: string): boolean {
  return [immobilie.bezeichnung, immobilie.ort, immobilie.plz, immobilie.strasse, immobilie.immoNr]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(suchbegriff);
}

// Reichert eine (bereits auf das angeforderte limit gekürzte) Trefferliste um Titelbilder an —
// ladeImmobilien()/mapEstateRecord() laden bildUrl bewusst NICHT mit (Bilder sind ein eigener
// Resourcetype, siehe ladeTitelbilder in estate.ts), da das für den vollen Roh-Bestand (bis zu
// 1500 Objekte, siehe RAW_LISTLIMIT unten) unnötig viele API-Aufrufe verursachen würde. Erst NACH
// dem Kürzen auf das tatsächlich zurückgegebene limit anzureichern hält den Zusatzaufwand auf
// einen einzigen Batch-Request über höchstens `limit` Objekte beschränkt — u.a. für die
// Referenzobjekt-Suche im Vergleichswert-Reiter, deren Kacheln sonst nur den Bild-Platzhalter
// zeigten (siehe PropertyImage-Fallback).
async function mitTitelbildern(immobilien: Immobilie[]): Promise<Immobilie[]> {
  if (immobilien.length === 0) return immobilien;
  const bilder = await ladeTitelbilder(immobilien.map((i) => i.id));
  return immobilien.map((i) => (bilder[i.id] ? { ...i, bildUrl: bilder[i.id] } : i));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const suche = searchParams.get("suche");
  const limit = parseInt(searchParams.get("limit") || "20");
  // Wird von der Objektauswahl-Suchleiste beim Klick ins (noch leere) Suchfeld gesetzt (siehe
  // ObjektAuswahl.tsx) — statt der vollen, alphabetisch sortierten Trefferliste sollen dann
  // gezielt nur die zuletzt angelegten Objekte erscheinen.
  const neueste = searchParams.get("neueste") === "1";
  // Wird von der Referenzobjekt-Suche im Vergleichswert-Reiter gesetzt (siehe Vergleichswert.tsx)
  // — dort sollen ausschließlich als Vergleichsobjekt taugliche Objekte auswählbar sein: bereits
  // verkaufte (echte Verkaufspreise) UND aktuell aktiv vermarktete (aktuelle Angebotspreise),
  // siehe Filter unten. Chat-Vorgabe September 2026: "auch die Immobilien ... die wir aktuell in
  // der Vermarktung haben, nicht nur die Verkauften" — vorher (bis dahin "nurVerkaufte") wurden
  // ausschließlich verkaufte Objekte angeboten.
  const nurVergleichsobjekte = searchParams.get("vergleichspool") === "1";

  if (ONOFFICE_MODE !== "live") {
    if (id) {
      const objekt = MOCK_OBJEKTE.find((i) => i.id === id);
      return objekt
        ? NextResponse.json(objekt)
        : NextResponse.json({ error: "Immobilie nicht gefunden" }, { status: 404 });
    }

    // Der Mock-Pool trägt keinen echten Verkaufs-/Vermarktungsstatus — im Demo-Modus dient
    // MOCK_VERGLEICHSPOOL (fiktive, aber plausible Referenzobjekte) unverändert auch als Ersatz
    // für den Vergleichspool (verkauft + aktiv vermarktet), damit die Referenzobjekt-Suche ohne
    // Live-Zugang durchgängig testbar bleibt.
    const pool = nurVergleichsobjekte ? MOCK_VERGLEICHSPOOL : MOCK_OBJEKTE;
    const suchbegriff = suche?.toLowerCase().trim();
    const gefiltert = suchbegriff ? pool.filter((i) => treffer(i, suchbegriff)) : pool;

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

    // Filter für die Referenzobjekt-Suche (nurVergleichsobjekte): status2 in [verkauft,
    // aktive_vermarktung] deckt beide als Vergleichsobjekt tauglichen Zustände ab — tatsächlich
    // verkauft (echter Verkaufspreis) ODER aktuell aktiv vermarktet (aktueller Angebotspreis),
    // siehe permitted_values von status2 (Live-Feldkatalog geprüft, September 2026). Andere
    // status2-Werte (z.B. "in_akquise", "reserviert", "vorbereitung") bleiben bewusst außen vor
    // — dort ist noch kein belastbarer Markt-/Verkaufspreis vorhanden. Zusätzlich weiterhin
    // vermarktungsart=kauf, damit keine Vermietungsobjekte hineinrutschen.
    const filter = nurVergleichsobjekte
      ? {
          status2: [{ op: "in", val: ["verkauft", "aktive_vermarktung"] }],
          vermarktungsart: [{ op: "=", val: "kauf" }],
        }
      : { vermarktungsart: [{ op: "=", val: "kauf" }] };

    // Klick auf die leere Suchleiste: gezielter, kleiner Abruf der zuletzt angelegten Objekte.
    // Bewusst ein eigener, direkter Abruf mit dem gewünschten limit (statt wie unten erst den
    // vollen Bestand zu laden und zu kürzen) — ladeImmobilien() paginiert ohnehin nur, wenn
    // limit über ONOFFICE_MAX_LISTLIMIT liegt, für die hier üblichen 10 Treffer genügt ein
    // einzelner Request. Sortierung immer nach erstellt_am DESC (auch für den Vergleichspool):
    // verkauft_am wäre bei aktiv vermarkteten, noch nicht verkauften Objekten leer und würde die
    // Sortierung dieser Objekte untereinander unvorhersehbar machen.
    if (neueste) {
      const immobilien = await ladeImmobilien(limit, filter, { erstellt_am: "DESC" });
      return NextResponse.json(await mitTitelbildern(immobilien));
    }

    // Bewusst der volle Bestand (hohes Listlimit) statt eines serverseitigen onOffice-Filters
    // auf "objekttitel": Die onOffice-Filter-Syntax kombiniert unterschiedliche Felder per UND,
    // eine ODER-Suche über Titel/Ort/PLZ/ImmoNr ist darüber nicht abbildbar. Stattdessen wird
    // hier — wie im Mock-Zweig oben — clientseitig über alle relevanten Felder gefiltert
    // (siehe treffer()), erst danach auf das angeforderte limit gekürzt.
    // 1500 statt vorher 500: Der Account hat aktuell 1023 Objekte mit vermarktungsart=kauf
    // (gegen den Live-Account geprüft) — mit 500 wäre rund die Hälfte des Bestands für die
    // Suche unsichtbar gewesen. 1500 lässt zusätzlich Luft für weiteres Wachstum. Für
    // nurVergleichsobjekte reichen die vollen 500 (ONOFFICE_MAX_LISTLIMIT) einer einzigen Seite:
    // 261 Objekte mit status2 in [verkauft, aktive_vermarktung] UND vermarktungsart=kauf (gegen
    // den Live-Account geprüft, September 2026).
    const RAW_LISTLIMIT = nurVergleichsobjekte ? 500 : 1500;
    const immobilien = await ladeImmobilien(RAW_LISTLIMIT, filter);

    const suchbegriff = suche?.toLowerCase().trim();
    const gefiltert = suchbegriff ? immobilien.filter((i) => treffer(i, suchbegriff)) : immobilien;

    return NextResponse.json(await mitTitelbildern(gefiltert.slice(0, limit)));
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
