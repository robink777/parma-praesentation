import { Icon, IconName } from "@/components/icons/Icon";
import { ObjektGesamtKennzahlen } from "@/types";

// Gemeinsame KPI-Kachel-Definition für die "Übersicht"-Folie — genutzt von
// components/admin/Uebersicht.tsx (TV/Admin-Desktop) UND components/tv/TvMobil.tsx (Smartphone-
// Ansicht), damit Kennzahlen, Reihenfolge und Akzentfarben auf beiden Oberflächen garantiert
// identisch bleiben, auch wenn jede Seite ihren eigenen Grid-Wrapper/Layout drumherum baut.
const zahlenformat = new Intl.NumberFormat("de-DE");

function formatWert(n: number | null): string {
  return n === null ? "–" : zahlenformat.format(n);
}

function formatTage(n: number | null): string {
  return n === null ? "–" : `${zahlenformat.format(n)} Tage`;
}

// Kompakte Notation ("28,3 Mio. €" statt "28.274.000 €") statt der zentralen formatiereBetrag()
// — eine KPI-Kachel ist für den Überblick auf einen Blick da, nicht für den exakten Euro-Betrag.
const betragKompaktFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

function formatBetrag(n: number | null): string {
  return n === null ? "–" : betragKompaktFormat.format(n);
}

// Volle, literale Klassennamen je Akzentfarbe statt Zusammensetzung zur Laufzeit
// (`` `bg-${akzent}/15` ``) — Tailwinds Build-Scanner erkennt nur Klassennamen, die irgendwo im
// Quelltext WÖRTLICH stehen, keine zur Laufzeit zusammengesetzten Strings (sonst würden die
// Farben im Produktions-Build stillschweigend fehlen, weil Tailwind die passende CSS-Regel nie
// generiert hätte).
export const AKZENT_KLASSEN: Record<string, string> = {
  "chart-1": "bg-chart-1/15 text-chart-1",
  "chart-2": "bg-chart-2/15 text-chart-2",
  "chart-3": "bg-chart-3/15 text-chart-3",
  "chart-4": "bg-chart-4/15 text-chart-4",
  "chart-5": "bg-chart-5/15 text-chart-5",
  "chart-6": "bg-chart-6/15 text-chart-6",
  "chart-7": "bg-chart-7/15 text-chart-7",
  "chart-8": "bg-chart-8/15 text-chart-8",
};

export interface KpiKachelDaten {
  label: string;
  wert: string;
  icon: IconName;
  akzent: string;
  hinweisAnzahl?: number;
}

// Oktober 2026 Chat-Vorgabe: "mehr Akzentfarben an den Datenpunkten ... jetzt ist es mir viel zu
// viel Ton in Ton". Jede Kachel bekommt eine FESTE, bedeutungsgebundene Akzentfarbe aus der
// chart-Palette (siehe tailwind.config.ts) statt überall derselbe Walnuss-Kreis — welche Kachel
// welchen Ton bekommt, steht fest in baueUebersichtKacheln() unten und bleibt über die Zeit
// konsistent (Wiedererkennung statt zufälliger Buntheit). Zahl selbst bleibt bewusst in Anthrazit
// (Text trägt Text-Farbe, nie die Akzentfarbe — dataviz-Richtlinie), nur Icon-Kreis und
// Hintergrund-Tönung tragen die Akzentfarbe.
export function KpiKachel({ label, wert, icon, akzent, hinweisAnzahl }: KpiKachelDaten) {
  return (
    <div className="min-w-0 rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)] md:p-md">
      <div className="flex items-center gap-sm">
        <span
          className={`flex h-[clamp(32px,5.5vh,48px)] w-[clamp(32px,5.5vh,48px)] shrink-0 items-center justify-center rounded-full ${AKZENT_KLASSEN[akzent]}`}
        >
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 font-mono text-[10px] font-medium uppercase leading-snug tracking-[0.06em] text-anthrazit/50">
            {label}
          </p>
          <p className="truncate font-slab text-[clamp(16px,3vh,28px)] font-bold leading-tight text-anthrazit">
            {wert}
          </p>
        </div>
      </div>
      {hinweisAnzahl !== undefined && hinweisAnzahl > 0 && (
        <p className="mt-xs flex items-center gap-[4px] truncate text-small text-anthrazit/50">
          <Icon name="warning" size={13} className="shrink-0" />
          {zahlenformat.format(hinweisAnzahl)} ohne Angabe
        </p>
      )}
    </div>
  );
}

// Die acht KPI-Kacheln-Definitionen (Reihenfolge + feste Akzentfarbe je Kennzahl) — einzige
// Quelle der Wahrheit, damit TV/Admin-Desktop und Smartphone-Ansicht nie auseinanderlaufen.
export function baueUebersichtKacheln(gesamt?: ObjektGesamtKennzahlen): KpiKachelDaten[] {
  const jahr = new Date().getFullYear();
  const verkauftFehltAnzahl = gesamt?.provisionsvolumenVerkauftJahrFehltAnzahl ?? 0;
  const provisionsvorlaufFehltAnzahl = gesamt?.provisionsvorlaufFehltAnzahl ?? 0;

  return [
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
}
