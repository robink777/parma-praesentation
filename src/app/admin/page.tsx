import { KartenAnsicht } from "@/components/admin/KartenAnsicht";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import { ladeObjektkarteDaten } from "@/lib/onoffice/estate";
import { ObjektkarteDaten } from "@/types";

// Admin-Bereich, zusätzlich zur App-weiten Anmeldung durch ein zweites, separates Passwort
// geschützt (siehe middleware.ts, lib/auth.ts, admin/login/page.tsx). Hauptbereich "Karte" — seit
// Oktober 2026 (Chat-Vorgabe: "zwei Hauptbereiche ... Kartenbereich und ... Statistik") eine
// eigene, schlanke Route statt der früheren Karte+Panel-Kombiseite: Der zweite Hauptbereich
// "Statistik" (Mitarbeiter/Leadquellen/Kontrolle/PLZ/Neuzugänge) lebt jetzt unter
// app/admin/statistik/page.tsx mit eigenem, größerem Datenabruf — diese Seite hier lädt deshalb
// NUR noch, was die Karte selbst braucht.
export default async function AdminPage() {
  let objektkarteDaten: ObjektkarteDaten | undefined;

  if (ONOFFICE_MODE === "live") {
    objektkarteDaten = await ladeObjektkarteDaten().catch((error) => {
      console.error("Live-Abruf der Objektkarte aus OnOffice fehlgeschlagen:", error);
      return undefined;
    });
  }

  return <KartenAnsicht daten={objektkarteDaten} />;
}
