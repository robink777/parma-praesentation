import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { MitarbeiterReiter } from "@/components/admin/MitarbeiterBereich";
import { ladeAdminDashboardDaten } from "@/lib/onoffice/adminDashboard";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import { ladeUrlaubsUebersicht } from "@/lib/urlaub/abgleich";

// Admin-Bereich, zusätzlich zur App-weiten Anmeldung durch ein zweites, separates Passwort
// geschützt (siehe middleware.ts, lib/auth.ts, admin/login/page.tsx). EINE Seite für das gesamte
// Dashboard (Übersicht/Karte/Mitarbeiter/Leadquellen/Kontrolle, siehe AdminDashboard.tsx) — bis
// Oktober 2026 kurzzeitig auf zwei Routen aufgeteilt (siehe Git-Historie, app/admin/statistik/),
// direkt danach wieder zusammengeführt (Chat-Vorgabe: "Damit können wir uns den Bereich
// 'Karten/Statistik/Finanz' sparen"). Datenabruf selbst jetzt in lib/onoffice/adminDashboard.ts
// (seit die TV-Vorführung unter app/tv/page.tsx denselben Datensatz braucht, siehe dort).
//
// abschnitt/reiter bringen den Zurück-Link der Aktivitätenliste (app/admin/aktivitaeten/page.tsx)
// wieder an dieselbe Stelle statt auf die Übersicht.
const REITER: MitarbeiterReiter[] = ["vertrieb", "akquise", "setting", "weitere"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ abschnitt?: string; reiter?: string }>;
}) {
  const { abschnitt, reiter } = await searchParams;
  // Urlaub bewusst NICHT in ladeAdminDashboardDaten: Den Datensatz bekommt auch die
  // passwortfreie TV-Seite, Urlaubsdaten gehören nur in den Admin-Bereich. Der Abgleich auf
  // gelöschte Urlaubstage läuft deshalb nur hier (siehe lib/urlaub/abgleich.ts).
  const [daten, urlaub] = await Promise.all([
    ladeAdminDashboardDaten(),
    ONOFFICE_MODE === "live"
      ? ladeUrlaubsUebersicht().catch((error) => {
          console.error("Urlaub konnte nicht geladen werden:", error);
          return undefined;
        })
      : Promise.resolve(undefined),
  ]);
  return (
    <AdminDashboard
      {...daten}
      urlaub={urlaub}
      startAbschnitt={abschnitt === "mitarbeiter" ? abschnitt : undefined}
      startReiter={REITER.find((r) => r === reiter)}
    />
  );
}
