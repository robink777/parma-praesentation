import { NextRequest, NextResponse } from "next/server";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import {
  ladeNutzerNrFuerMitarbeiter,
  ladeAktiveObjekteFuerMitarbeiter,
  ladeObjekteInAufarbeitungFuerMitarbeiter,
  ladeTitelbilder,
} from "@/lib/onoffice/estate";
import { MitarbeiterObjekt } from "@/types";

// Liefert die Objektliste (aktive Vermarktung + Aufarbeitung) EINES Mitarbeiters, auf Abruf
// beim Aufklappen einer Zeile in Mitarbeiterstatistik.tsx — bewusst eine eigene Route statt Teil
// des initialen ladeMitarbeiterKennzahlen()-Ladens, um nicht bei jedem Admin-Seitenaufruf ~20
// zusätzliche OnOffice-Abrufe für alle Mitarbeiter auf einmal auszulösen. Automatisch geschützt
// durch middleware.ts (istAdminApiPfad greift für alle Pfade unter /api/admin außer
// /api/admin-login).
//
// Die Zuordnung Name -> Nutzer-Nr (MITARBEITER_NUTZER_NR in onoffice/estate.ts) bleibt
// serverseitig; der Client kennt nur den Namen, analog zum bestehenden Muster bei kundenAktiv.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Parameter 'name' fehlt" }, { status: 400 });
  }

  if (ONOFFICE_MODE !== "live") {
    return NextResponse.json({ aktiv: [], aufarbeitung: [] });
  }

  const nutzerNr = ladeNutzerNrFuerMitarbeiter(name);
  if (!nutzerNr) {
    return NextResponse.json({ aktiv: [], aufarbeitung: [] });
  }

  try {
    const [aktiv, aufarbeitung] = await Promise.all([
      ladeAktiveObjekteFuerMitarbeiter(nutzerNr),
      ladeObjekteInAufarbeitungFuerMitarbeiter(nutzerNr),
    ]);

    // Titelbilder sind kein Datenfeld des Estate-Datensatzes, sondern ein eigener Resourcetype
    // (siehe ladeTitelbilder in estate.ts) — EIN Batch-Aufruf für alle Objekte beider Gruppen
    // zusammen, statt pro Objekt einzeln nachzuladen.
    const alleIds = [...aktiv, ...aufarbeitung].map((objekt) => objekt.id);
    const titelbilder = await ladeTitelbilder(alleIds);

    function mitTitelbild(objekt: MitarbeiterObjekt): MitarbeiterObjekt {
      return { ...objekt, titelbildUrl: titelbilder[objekt.id] ?? null };
    }

    return NextResponse.json({
      aktiv: aktiv.map(mitTitelbild),
      aufarbeitung: aufarbeitung.map(mitTitelbild),
    });
  } catch (error) {
    console.error("Laden der Mitarbeiter-Objektliste fehlgeschlagen:", error);
    return NextResponse.json({ error: "Laden fehlgeschlagen" }, { status: 500 });
  }
}
