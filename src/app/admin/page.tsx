import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { MitarbeiterReiter } from "@/components/admin/MitarbeiterBereich";
import { ladeAdminDashboardDaten } from "@/lib/onoffice/adminDashboard";

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
  const daten = await ladeAdminDashboardDaten();
  return (
    <AdminDashboard
      {...daten}
      startAbschnitt={abschnitt === "mitarbeiter" ? abschnitt : undefined}
      startReiter={REITER.find((r) => r === reiter)}
    />
  );
}
