import { ParmaLoader } from "@/components/ParmaLoader";

// Eigener Ladescreen für den Admin-Bereich. Vorher gab es hier keinen — /admin lag als
// einzelne page.tsx direkt unter dem Root-Layout, dessen app/loading.tsx (siehe dort) die
// Suspense-Fallback beim Navigieren übernahm. Seit app/admin/layout.tsx (siehe dort,
// AdminSessionWaechter) dazwischenliegt, greift diese Root-Fallback beim Wechsel von
// /admin/login zu /admin nicht mehr zuverlässig — beobachtet als kompletts Fehlen des
// Ladescreens nach dem Admin-Login, während ladeMitarbeiterKennzahlen() (viele parallele
// OnOffice-Abrufe, siehe onoffice/mitarbeiterstatistik.ts) mehrere Sekunden braucht. Eine eigene
// loading.tsx auf Segment-Ebene (Next.js-Konvention, siehe app/loading.tsx) behebt das, egal aus
// welchem genauen Grund die Vererbung von oben nicht mehr greift.
export default function AdminLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-reinweiss">
      <ParmaLoader label="Mitarbeiterstatistik wird geladen" />
    </div>
  );
}
