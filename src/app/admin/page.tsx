import { Mitarbeiterstatistik } from "@/components/admin/Mitarbeiterstatistik";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import {
  ladeMitarbeiterKennzahlen,
  ladeObjektGesamtKennzahlen,
} from "@/lib/onoffice/mitarbeiterstatistik";
import { ladeKontrollObjekte, ladeLeadquellenKennzahlen } from "@/lib/onoffice/estate";
import {
  KontrollObjekt,
  LeadquellenKennzahlen,
  MitarbeiterKennzahlen,
  ObjektGesamtKennzahlen,
} from "@/types";

// Admin-Bereich, zusätzlich zur App-weiten Anmeldung durch ein zweites, separates Passwort
// geschützt (siehe middleware.ts, lib/auth.ts, admin/login/page.tsx). Zeigt die
// Mitarbeiterstatistik: Grundlage für die logische Entscheidung, wer ein Objekt nach der Akquise
// (Bewertungspräsentation) übernimmt (siehe Chat-Vorgabe, fünf Kennzahlen).
//
// Die Kennzahlen werden "eins nach dem anderen" aus OnOffice ergänzt (siehe Chat-Vorgabe) — das
// vermeidet, mehrere neue OnOffice-Abrufe gleichzeitig einzuführen, bevor der erste einzeln
// geprüft und bestätigt ist. Aktuell live angebunden: Parameter 1 "Aktive Objekte" (siehe
// ladeMitarbeiterKennzahlen/zaehleAktiveObjekte in onoffice/estate.ts). Die übrigen vier
// Parameter zeigen weiterhin "–", bis sie in eigenen, folgenden Schritten ergänzt werden.
//
// Mock/Live-Verzweigung bewusst analog zu lib/praesentation.ts: Im Live-Modus wird der Abruf in
// try/catch abgesichert; schlägt er komplett fehl, zeigt die Tabelle für alle Mitarbeiter "–"
// statt eines Fehlers (kennzahlen bleibt dann undefined).
export default async function AdminPage() {
  let kennzahlen: Record<string, MitarbeiterKennzahlen> | undefined;
  let gesamtKennzahlen: ObjektGesamtKennzahlen | undefined;
  let kontrollObjekte: KontrollObjekt[] | undefined;
  let leadquellenKennzahlen: LeadquellenKennzahlen | undefined;

  if (ONOFFICE_MODE === "live") {
    // Alle vier Abrufe GLEICHZEITIG (Promise.all) statt nacheinander — sie sind unabhängig
    // voneinander, ein sequenzielles await würde die Ladezeit der Seite unnötig verlängern.
    // Trotzdem einzeln abgesichert (separate try/catch statt einem gemeinsamen um das
    // Promise.all) — schlägt einer der Abrufe fehl, sollen die übrigen trotzdem angezeigt werden
    // (analog zum bestehenden Muster der einzelnen .catch(() => null) in ladeMitarbeiterKennzahlen).
    const [kennzahlenErgebnis, gesamtKennzahlenErgebnis, kontrollErgebnis, leadquellenErgebnis] =
      await Promise.all([
        ladeMitarbeiterKennzahlen().catch((error) => {
          console.error(
            "Live-Abruf der Mitarbeiterstatistik aus OnOffice fehlgeschlagen:",
            error
          );
          return undefined;
        }),
        ladeObjektGesamtKennzahlen().catch((error) => {
          console.error(
            "Live-Abruf der unternehmensweiten Objekt-Gesamtkennzahlen aus OnOffice fehlgeschlagen:",
            error
          );
          return undefined;
        }),
        ladeKontrollObjekte().catch((error) => {
          console.error("Live-Abruf der Kontrollobjekte aus OnOffice fehlgeschlagen:", error);
          return undefined;
        }),
        ladeLeadquellenKennzahlen().catch((error) => {
          console.error("Live-Abruf der Leadquellen aus OnOffice fehlgeschlagen:", error);
          return undefined;
        }),
      ]);
    kennzahlen = kennzahlenErgebnis;
    gesamtKennzahlen = gesamtKennzahlenErgebnis;
    kontrollObjekte = kontrollErgebnis;
    leadquellenKennzahlen = leadquellenErgebnis;
  }

  // Kein SectionShell-Wrapper mehr — Mitarbeiterstatistik baut seit August 2026 ihr eigenes
  // Vollbild-Layout mit Sidebar auf (Chat-Vorgabe: "identisches Layout wie bei der Präsentation"),
  // analog dazu, wie app/page.tsx PraesentationApp ohne umgebendes SectionShell rendert.
  return (
    <Mitarbeiterstatistik
      kennzahlen={kennzahlen}
      gesamtKennzahlen={gesamtKennzahlen}
      kontrollObjekte={kontrollObjekte}
      leadquellenKennzahlen={leadquellenKennzahlen}
    />
  );
}
