import { baueUebersichtKacheln, KpiKachel } from "@/components/shared/KpiKachel";
import { NeuzugaengeWoche, ObjektGesamtKennzahlen } from "@/types";
import { Neuzugaenge } from "./Neuzugaenge";

// Landing-Screen des Admin-Dashboards (siehe AdminDashboard.tsx) — fusioniert die
// früheren "Auf einen Blick"-Infoboxen und die frühere eigene "Neuzugänge"-Seite zu EINEM, groß
// und farbig gestalteten TV-Dashboard (Oktober 2026 Chat-Vorgabe: "ich hole jetzt mal ein
// bisschen aus ... alle Unternehmenszahlen ... auf einem großen Bildschirm"). Acht KPI-Kacheln
// (siehe components/shared/KpiKachel.tsx — von dort auch die Smartphone-Ansicht,
// components/tv/TvMobil.tsx, dieselben Definitionen bezieht), jede mit fester, eigener
// Akzentfarbe, plus die beiden Neuzugänge-Balkendiagramme darunter.
export function Uebersicht({
  gesamt,
  neuzugaengeVerlauf,
}: {
  gesamt?: ObjektGesamtKennzahlen;
  neuzugaengeVerlauf?: NeuzugaengeWoche[];
}) {
  const kacheln = baueUebersichtKacheln(gesamt);

  return (
    <div className="flex h-full min-h-0 flex-col gap-sm">
      <div className="grid shrink-0 grid-cols-2 gap-sm md:grid-cols-4">
        {kacheln.map((kachel) => (
          <KpiKachel key={kachel.label} {...kachel} />
        ))}
      </div>
      <div className="min-h-0 flex-1 rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)] md:p-md">
        <Neuzugaenge verlauf={neuzugaengeVerlauf} />
      </div>
    </div>
  );
}
