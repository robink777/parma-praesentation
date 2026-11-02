import { NextRequest, NextResponse } from "next/server";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import { ladeAktivitaetenFuerMitarbeiter, ladeNutzerNrFuerMitarbeiter } from "@/lib/onoffice/estate";
import { AktivitaetenZeitraum, ermittleAktivitaetenZeitraum } from "@/lib/onoffice/mitarbeiterstatistik";

// "Alle Aktivitäten" dauerte live bis zu 8 Sekunden, die Funktion soll dabei nicht abbrechen.
export const maxDuration = 60;

const ZEITRAEUME: AktivitaetenZeitraum[] = ["heute", "woche", "30t"];

// Liefert die Aktivitäten EINES Mitarbeiters für components/admin/AktivitaetenListe.tsx. Geschützt
// durch middleware.ts (istAdminApiPfad), die Zuordnung Name -> Nutzer-Nr bleibt serverseitig, siehe
// api/admin/mitarbeiter-objekte/route.ts. Telefonate kommen immer separat und vollständig, die
// Gesamtliste (`alle=1`) endet am Limit und würde die Kennzahlen sonst zu niedrig ausweisen.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const zeitraum = ZEITRAEUME.find((z) => z === searchParams.get("zeitraum"));
  const mitAllenArten = searchParams.get("alle") === "1";

  if (!name || !zeitraum) {
    return NextResponse.json({ error: "Parameter 'name' oder 'zeitraum' fehlt" }, { status: 400 });
  }

  if (ONOFFICE_MODE !== "live") {
    return NextResponse.json({ telefonate: [], alle: null, abgeschnitten: false });
  }

  const nutzerNr = ladeNutzerNrFuerMitarbeiter(name);
  if (!nutzerNr) {
    return NextResponse.json({ error: "Unbekannter Mitarbeiter" }, { status: 404 });
  }

  const { von, bis } = ermittleAktivitaetenZeitraum(zeitraum);

  try {
    const [telefonate, gesamt] = await Promise.all([
      ladeAktivitaetenFuerMitarbeiter(nutzerNr, von, bis, "Telefonat"),
      mitAllenArten ? ladeAktivitaetenFuerMitarbeiter(nutzerNr, von, bis) : null,
    ]);
    return NextResponse.json({
      telefonate: telefonate.aktivitaeten,
      alle: gesamt?.aktivitaeten ?? null,
      abgeschnitten: gesamt?.abgeschnitten ?? false,
    });
  } catch (error) {
    console.error("Aktivitäten konnten nicht geladen werden:", error);
    return NextResponse.json({ error: "Aktivitäten konnten nicht geladen werden" }, { status: 502 });
  }
}
