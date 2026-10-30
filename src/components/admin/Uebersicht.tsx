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
//
// Dieselbe Komponente läuft sowohl im Admin-Bereich (AdminDashboard.tsx) als auch auf der
// öffentlichen, unauthentifizierten TV-Folie (TvSlideshow.tsx) — "interaktiv" schaltet deshalb
// bewusst einzeln zu, ob die "N ohne Angabe"-Hinweise zu den neuen Detailseiten verlinken (Nutzer-
// Vorgabe Oktober 2026: "im Admin-Bereich ... eine neue Seite öffnen wo genau diese Objekte
// angezeigt werden"). Auf der TV-Folie bleibt es bei der ursprünglichen Vorgabe "da soll nichts
// klickbar sein" — Default false, damit TvSlideshow.tsx unverändert bleiben kann.
export function Uebersicht({
  gesamt,
  neuzugaengeVerlauf,
  interaktiv = false,
}: {
  gesamt?: ObjektGesamtKennzahlen;
  neuzugaengeVerlauf?: NeuzugaengeWoche[];
  interaktiv?: boolean;
}) {
  const kacheln = baueUebersichtKacheln(
    gesamt,
    interaktiv
      ? {
          provisionsvorlauf: "/admin/provisionsfehler?quelle=gesamt",
          provisionsvolumenJahr: "/admin/provisionsfehler?quelle=verkauft",
        }
      : undefined
  );

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
