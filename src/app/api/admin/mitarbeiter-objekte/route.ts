import { NextRequest, NextResponse } from "next/server";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import {
  ladeNutzerNrFuerMitarbeiter,
  ladeAktiveObjekteFuerMitarbeiter,
  ladeObjekteInAufarbeitungFuerMitarbeiter,
  ladeAktiveVermietungenFuerMitarbeiter,
  ladeVermietungenInAufarbeitungFuerMitarbeiter,
  ladeVerkaufteObjekteFuerMitarbeiter,
  ladeTitelbilder,
} from "@/lib/onoffice/estate";
import { ermittleJahresDatumsfenster } from "@/lib/onoffice/mitarbeiterstatistik";
import { MitarbeiterObjekt } from "@/types";

// Liefert die Objektliste (aktive Vermarktung + Aufarbeitung + Vermietung) EINES Mitarbeiters,
// auf Abruf beim Aufklappen einer Zeile in Mitarbeiterstatistik.tsx — bewusst eine eigene Route
// statt Teil des initialen ladeMitarbeiterKennzahlen()-Ladens, um nicht bei jedem
// Admin-Seitenaufruf ~20 zusätzliche OnOffice-Abrufe für alle Mitarbeiter auf einmal auszulösen.
// Automatisch geschützt durch middleware.ts (istAdminApiPfad greift für alle Pfade unter
// /api/admin außer /api/admin-login).
//
// Die Zuordnung Name -> Nutzer-Nr (TeamMitglied.nutzerNr, siehe TEAM in data/unternehmen.ts,
// aufgelöst über ladeNutzerNrFuerMitarbeiter in onoffice/estate.ts) bleibt serverseitig; der
// Client kennt nur den Namen, analog zum bestehenden Muster bei kundenAktiv.
//
// "vermietung" (Juli 2026 Chat-Vorgabe: "Es gibt auch Vermietungsobjekte ... zeige sie aber Pro
// mitarbeiter trotzdem an als weiter dropdown funktion") fasst aktive UND in Aufarbeitung
// befindliche Vermietungsobjekte in EINER gemeinsamen Liste zusammen (anders als bei
// Kaufobjekten, die zwei getrennte Gruppen/Dropdowns bekommen) — der Nutzer bat um genau einen
// zusätzlichen Dropdown, nicht zwei.
//
// "verkauft" (Juli 2026 Chat-Vorgabe: "ich sehe immer noch keine Verkauften Objekte! Bitte auch
// noch ausführen") — die reine Zahl in der Tabelle (Spalte "Verkauft {Jahr}") reichte dem Nutzer
// nicht, die einzelnen verkauften Objekte des laufenden Kalenderjahres sollen wie bei
// Vermietung/Aufarbeitung/Aktive Vermarktung aufklappbar sein. Gleiches Jahresfenster wie die
// Kennzahlen-Spalte (siehe ermittleJahresDatumsfenster in mitarbeiterstatistik.ts), damit Zahl und
// Liste immer zueinander passen.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Parameter 'name' fehlt" }, { status: 400 });
  }

  if (ONOFFICE_MODE !== "live") {
    return NextResponse.json({ aktiv: [], aufarbeitung: [], vermietung: [], verkauft: [] });
  }

  const nutzerNr = ladeNutzerNrFuerMitarbeiter(name);
  if (!nutzerNr) {
    return NextResponse.json({ aktiv: [], aufarbeitung: [], vermietung: [], verkauft: [] });
  }

  const { vonJahr, bisJahr } = ermittleJahresDatumsfenster();

  try {
    const [aktiv, aufarbeitung, vermietungAktiv, vermietungAufarbeitung, verkauft] =
      await Promise.all([
        ladeAktiveObjekteFuerMitarbeiter(nutzerNr),
        ladeObjekteInAufarbeitungFuerMitarbeiter(nutzerNr),
        ladeAktiveVermietungenFuerMitarbeiter(nutzerNr),
        ladeVermietungenInAufarbeitungFuerMitarbeiter(nutzerNr),
        ladeVerkaufteObjekteFuerMitarbeiter(nutzerNr, vonJahr, bisJahr),
      ]);
    const vermietung = [...vermietungAktiv, ...vermietungAufarbeitung];

    // Titelbilder sind kein Datenfeld des Estate-Datensatzes, sondern ein eigener Resourcetype
    // (siehe ladeTitelbilder in estate.ts) — EIN Batch-Aufruf für alle Objekte aller Gruppen
    // zusammen, statt pro Objekt einzeln nachzuladen.
    const alleIds = [...aktiv, ...aufarbeitung, ...vermietung, ...verkauft].map(
      (objekt) => objekt.id
    );
    const titelbilder = await ladeTitelbilder(alleIds);

    function mitTitelbild(objekt: MitarbeiterObjekt): MitarbeiterObjekt {
      return { ...objekt, titelbildUrl: titelbilder[objekt.id] ?? null };
    }

    return NextResponse.json({
      aktiv: aktiv.map(mitTitelbild),
      aufarbeitung: aufarbeitung.map(mitTitelbild),
      vermietung: vermietung.map(mitTitelbild),
      verkauft: verkauft.map(mitTitelbild),
    });
  } catch (error) {
    console.error("Laden der Mitarbeiter-Objektliste fehlgeschlagen:", error);
    return NextResponse.json({ error: "Laden fehlgeschlagen" }, { status: 500 });
  }
}
