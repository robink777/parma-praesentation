"use client";

import { useRouter } from "next/navigation";
import { HauptbereichSwitcher } from "./HauptbereichSwitcher";
import { Objektkarte } from "./Objektkarte";
import { ObjektkarteDaten } from "@/types";
import { ADMIN_REFRESH_INTERVAL_MS, useAutoRefresh } from "@/lib/useAutoRefresh";

// Hauptbereich "Karte" (siehe app/admin/page.tsx) — seit der Aufteilung in zwei echte
// Hauptbereiche (Oktober 2026 Chat-Vorgabe, siehe HauptbereichSwitcher.tsx) nimmt die Karte jetzt
// die GANZE Fläche ein statt nur der linken zwei Drittel; der frühere rechte 1/3-Panel lebt jetzt
// als eigener Hauptbereich unter /admin/statistik (siehe StatistikAnsicht.tsx).
//
// Ein PLZ-Klick auf der Karte sprang früher per lokalem setState in den "plz"-Navi-Punkt
// desselben Panels (siehe Git-Historie) — jetzt, wo Karte und Statistik getrennte Seiten sind,
// navigiert er stattdessen zur Statistik-Seite mit der geklickten PLZ als Query-Parameter
// (StatistikAnsicht.tsx liest tab/plz/ort beim Laden aus, siehe app/admin/statistik/page.tsx).
// Der Klick-Handler in Objektkarte.tsx selbst (Prop-Signatur onPlzKlick(plz, ort)) bleibt dabei
// unverändert — nur wer ihn aufruft ändert sich.
export function KartenAnsicht({ daten }: { daten?: ObjektkarteDaten }) {
  const router = useRouter();
  useAutoRefresh(ADMIN_REFRESH_INTERVAL_MS);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Objektkarte
        daten={daten}
        onPlzKlick={(plz, ort) =>
          router.push(`/admin/statistik?tab=plz&plz=${encodeURIComponent(plz)}&ort=${encodeURIComponent(ort)}`)
        }
      />
      {/* Oben zentriert statt links/rechts: links sitzt bereits Objektkarte.tsx's Logo-Chip,
          rechts MapLibre's eigenes Zoom-Control (NavigationControl, "top-right") — die Mitte ist
          die einzige freie Ecke oben. */}
      <div className="absolute left-1/2 top-md z-20 -translate-x-1/2">
        <HauptbereichSwitcher />
      </div>
    </div>
  );
}
