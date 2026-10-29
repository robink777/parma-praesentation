import Image from "next/image";
import { TEAM, VERTRIEB_NAMEN } from "@/data/unternehmen";
import { fotoLookup, initialen } from "@/lib/mitarbeiterFotos";
import { Betreuer, MitarbeiterKennzahlen } from "@/types";

// Das "kleine Spiel" für die TV-Vorführung (Oktober 2026 Chat-Vorgabe: "ein kleines Spiel, wo man
// dann zum Beispiel sagt, der Mitarbeiter mit den meisten Telefonaten ist auf Platz 1") — eine
// live nach Anrufen heute sortierte Rangliste des Vertriebsteams, Platz 1-3 farblich hervorgehoben
// (Messing/Asche/Terrakotta — dieselben Töne, die im Rest der App bereits "Marke"/"neutral"/
// "dritte Kategorie" bedeuten, keine neu erfundenen Gold/Silber/Bronze-Farben). Bewusst nur
// Vertrieb (siehe VERTRIEB_NAMEN) statt des ganzen Teams: Telefonate sind eine Vertriebs-Kennzahl,
// ein Vergleich gegen z.B. Back-Office-Rollen wäre irreführend.
const zahlenformat = new Intl.NumberFormat("de-DE");

const RANG_KLASSEN = [
  "bg-messing text-reinweiss",
  "bg-asche text-reinweiss",
  "bg-chart-3 text-reinweiss",
];

export function MitarbeiterLeaderboard({
  kennzahlen,
  alleMitarbeiter,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  alleMitarbeiter?: Betreuer[];
}) {
  const fotos = fotoLookup(alleMitarbeiter ?? []);
  const vertrieb = TEAM.filter((m) => VERTRIEB_NAMEN.includes(m.name));

  const rangliste = vertrieb
    .map((mitglied) => ({
      mitglied,
      anrufe: kennzahlen?.[mitglied.name]?.telefonateHeute ?? 0,
    }))
    .sort((a, b) => b.anrufe - a.anrufe);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg bg-reinweiss p-lg shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
      <p className="label mb-xs shrink-0">Live-Rangliste</p>
      <h2 className="mb-md shrink-0 font-slab text-[clamp(22px,4vh,34px)] font-bold leading-tight text-anthrazit">
        Anrufe heute
      </h2>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-sm">
        {rangliste.map((eintrag, i) => (
          <div
            key={eintrag.mitglied.name}
            className="flex items-center gap-md rounded-md bg-stein px-md py-sm"
          >
            <span
              className={`flex h-[clamp(32px,5vh,44px)] w-[clamp(32px,5vh,44px)] shrink-0 items-center justify-center rounded-full font-slab text-lg font-bold ${
                RANG_KLASSEN[i] ?? "bg-anthrazit/10 text-anthrazit/50"
              }`}
            >
              {i + 1}
            </span>
            <div className="relative h-[clamp(36px,5.5vh,48px)] w-[clamp(36px,5.5vh,48px)] shrink-0 overflow-hidden rounded-full bg-sand">
              {fotos[eintrag.mitglied.name] ? (
                <Image
                  src={fotos[eintrag.mitglied.name]}
                  alt={eintrag.mitglied.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-slab text-sm font-bold text-walnuss">
                  {initialen(eintrag.mitglied.name)}
                </div>
              )}
            </div>
            <p className="min-w-0 flex-1 truncate text-[clamp(16px,2.6vh,22px)] font-medium text-anthrazit">
              {eintrag.mitglied.name}
            </p>
            <p className="shrink-0 font-slab text-[clamp(20px,3.6vh,32px)] font-bold text-anthrazit">
              {zahlenformat.format(eintrag.anrufe)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
