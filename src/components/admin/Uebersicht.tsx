import { Icon, IconName } from "@/components/icons/Icon";
import { formatiereBetrag } from "@/lib/berechnung";
import { NeuzugaengeWoche, ObjektGesamtKennzahlen } from "@/types";
import { Neuzugaenge } from "./Neuzugaenge";

// Deutsches Tausendertrennzeichen, analog zu den übrigen Statistik-Komponenten.
const zahlenformat = new Intl.NumberFormat("de-DE");

function formatWert(n: number | null): string {
  return n === null ? "–" : zahlenformat.format(n);
}

function formatTage(n: number | null): string {
  return n === null ? "–" : `${zahlenformat.format(n)} Tage`;
}

function formatBetrag(n: number | null): string {
  return n === null ? "–" : formatiereBetrag(n);
}

function aktuellesJahr(): number {
  return new Date().getFullYear();
}

// Volle, literale Klassennamen je Akzentfarbe statt Zusammensetzung zur Laufzeit
// (`` `bg-${akzent}/15` ``) — Tailwinds Build-Scanner erkennt nur Klassennamen, die irgendwo im
// Quelltext WÖRTLICH stehen, keine zur Laufzeit zusammengesetzten Strings (sonst würden die
// Farben im Produktions-Build stillschweigend fehlen, weil Tailwind die passende CSS-Regel nie
// generiert hätte).
const AKZENT_KLASSEN: Record<string, string> = {
  "chart-1": "bg-chart-1/15 text-chart-1",
  "chart-2": "bg-chart-2/15 text-chart-2",
  "chart-3": "bg-chart-3/15 text-chart-3",
  "chart-4": "bg-chart-4/15 text-chart-4",
  "chart-5": "bg-chart-5/15 text-chart-5",
  "chart-6": "bg-chart-6/15 text-chart-6",
  "chart-7": "bg-chart-7/15 text-chart-7",
  "chart-8": "bg-chart-8/15 text-chart-8",
};

// Eine KPI-Kachel — Oktober 2026 Chat-Vorgabe: "mehr Akzentfarben an den Datenpunkten ... jetzt
// ist es mir viel zu viel Ton in Ton". Jede Kachel bekommt eine FESTE, bedeutungsgebundene
// Akzentfarbe aus der neuen chart-Palette (siehe tailwind.config.ts) statt wie zuvor überall
// derselbe Walnuss-Kreis — welche Kachel welchen Ton bekommt, steht fest in Uebersicht() unten
// und bleibt über die Zeit konsistent (Wiedererkennung statt zufälliger Buntheit). Zahl selbst
// bleibt bewusst in Anthrazit (Text trägt Text-Farbe, nie die Akzentfarbe — dataviz-Richtlinie),
// nur Icon-Kreis und Hintergrund-Tönung tragen die Akzentfarbe.
function KpiKachel({
  label,
  wert,
  icon,
  akzent,
  hinweisAnzahl,
}: {
  label: string;
  wert: string;
  icon: IconName;
  akzent: string;
  hinweisAnzahl?: number;
}) {
  return (
    <div className="rounded-lg bg-reinweiss p-md shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
      <div className="flex items-center gap-sm">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${AKZENT_KLASSEN[akzent]}`}
        >
          <Icon name={icon} size={24} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[12px] font-medium uppercase tracking-label text-anthrazit/50">
            {label}
          </p>
          <p className="font-slab text-3xl font-bold leading-tight text-anthrazit">{wert}</p>
        </div>
      </div>
      {hinweisAnzahl !== undefined && hinweisAnzahl > 0 && (
        <p className="mt-xs flex items-center gap-[4px] text-small text-anthrazit/50">
          <Icon name="warning" size={13} />
          {zahlenformat.format(hinweisAnzahl)} ohne Angabe
        </p>
      )}
    </div>
  );
}

// Landing-Screen des Statistik-Hauptbereichs (siehe StatistikAnsicht.tsx) — fusioniert die
// früheren "Auf einen Blick"-Infoboxen und die frühere eigene "Neuzugänge"-Seite zu EINEM, groß
// und farbig gestalteten TV-Dashboard (Oktober 2026 Chat-Vorgabe: "ich hole jetzt mal ein
// bisschen aus ... alle Unternehmenszahlen ... auf einem großen Bildschirm"). Acht KPI-Kacheln,
// jede mit fester, eigener Akzentfarbe, plus die beiden Neuzugänge-Balkendiagramme darunter.
export function Uebersicht({
  gesamt,
  neuzugaengeVerlauf,
}: {
  gesamt?: ObjektGesamtKennzahlen;
  neuzugaengeVerlauf?: NeuzugaengeWoche[];
}) {
  const jahr = aktuellesJahr();
  const verkauftFehltAnzahl = gesamt?.provisionsvolumenVerkauftJahrFehltAnzahl ?? 0;
  const provisionsvorlaufFehltAnzahl = gesamt?.provisionsvorlaufFehltAnzahl ?? 0;

  const kacheln: {
    label: string;
    wert: string;
    icon: IconName;
    akzent: string;
    hinweisAnzahl?: number;
  }[] = [
    {
      label: `Verkaufte Objekte ${jahr}`,
      wert: formatWert(gesamt?.verkaufteObjekteJahrGesamt ?? null),
      icon: "check",
      akzent: "chart-1",
    },
    {
      label: "Aktive Vermarktung gesamt",
      wert: formatWert(gesamt?.aktivGesamt ?? null),
      icon: "house",
      akzent: "chart-2",
    },
    {
      label: `Gesamtvolumen ${jahr}`,
      wert: formatBetrag(gesamt?.objektvolumenVerkauftJahr ?? null),
      icon: "calculator",
      akzent: "chart-3",
    },
    {
      label: "Objektvolumen gesamt",
      wert: formatBetrag(gesamt?.objektvolumenGesamt ?? null),
      icon: "scale",
      akzent: "chart-4",
    },
    {
      label: "Provisionsvorlauf gesamt",
      wert: formatBetrag(gesamt?.provisionsvorlaufGesamt ?? null),
      icon: "handshake",
      akzent: "chart-5",
      hinweisAnzahl: provisionsvorlaufFehltAnzahl,
    },
    {
      label: "In Aufarbeitung gesamt",
      wert: formatWert(gesamt?.aufarbeitungGesamt ?? null),
      icon: "building",
      akzent: "chart-6",
    },
    {
      label: `Provisionsvolumen ${jahr}`,
      wert: formatBetrag(gesamt?.provisionsvolumenVerkauftJahr ?? null),
      icon: "handshake",
      akzent: "chart-7",
      hinweisAnzahl: verkauftFehltAnzahl,
    },
    {
      label: "Ø Vermarktungsdauer",
      wert: formatTage(gesamt?.durchschnittVermarktungsdauerTage ?? null),
      icon: "clock",
      akzent: "chart-8",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-md md:grid-cols-4">
        {kacheln.map((kachel) => (
          <KpiKachel key={kachel.label} {...kachel} />
        ))}
      </div>
      <div className="mt-lg rounded-lg bg-reinweiss p-lg shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
        <Neuzugaenge verlauf={neuzugaengeVerlauf} />
      </div>
    </div>
  );
}
