import Link from "next/link";
import { Icon, IconName } from "@/components/icons/Icon";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
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
// minimumFractionDigits bewusst gleich maximumFractionDigits gesetzt: Node (SSR) und der
// Browser (Hydration) formatieren denselben Wert sonst nicht immer gleich — mit nur
// maximumFractionDigits entscheidet jede ICU-Implementierung für sich, ob eine Nachkommastelle
// nötig ist, wodurch Server und Client bei genau rundenden Werten ("35 Mio." vs. "35,0 Mio.")
// auseinanderlaufen und React einen Hydration-Mismatch meldet. Mit fixer Nachkommastellenzahl
// ist die Ausgabe für einen gegebenen Wert in jeder Engine identisch.
const betragKompaktFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 1,
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
  // Ziel der Detailseite für den "N ohne Angabe"-Hinweis (siehe app/admin/provisionsfehler/
  // page.tsx) — NUR im Admin-Bereich gesetzt (siehe Uebersicht.tsx, interaktiv-Prop). Auf der
  // TV-/Smartphone-Ansicht bleibt dieses Feld bewusst immer undefined: "da soll nichts klickbar
  // sein" galt schon für die ursprüngliche TV-Vorgabe und gilt genauso für die Smartphone-Ansicht.
  hinweisHref?: string;
  // Erläuterungstext für das (i)-Hover-Symbol (siehe InfoTooltip) — welches OnOffice-Feld bzw.
  // welche Formel hinter dem Wert steckt. NUR im Admin-Bereich gesetzt (siehe Uebersicht.tsx,
  // interaktiv-Prop) — Nutzer-Vorgabe Oktober 2026: "bei jedem statistischen Wert ... ein kleines
  // (i) ... nicht im TV- oder Smartphone-Bereich".
  info?: string;
}

// Oktober 2026 Chat-Vorgabe: "mehr Akzentfarben an den Datenpunkten ... jetzt ist es mir viel zu
// viel Ton in Ton". Jede Kachel bekommt eine FESTE, bedeutungsgebundene Akzentfarbe aus der
// chart-Palette (siehe tailwind.config.ts) statt überall derselbe Walnuss-Kreis — welche Kachel
// welchen Ton bekommt, steht fest in baueUebersichtKacheln() unten und bleibt über die Zeit
// konsistent (Wiedererkennung statt zufälliger Buntheit). Zahl selbst bleibt bewusst in Anthrazit
// (Text trägt Text-Farbe, nie die Akzentfarbe — dataviz-Richtlinie), nur Icon-Kreis und
// Hintergrund-Tönung tragen die Akzentfarbe.
export function KpiKachel({ label, wert, icon, akzent, hinweisAnzahl, hinweisHref, info }: KpiKachelDaten) {
  return (
    <div className="relative min-w-0 rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)] md:p-md">
      {info && <InfoTooltip text={info} className="absolute right-sm top-sm" />}
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
      {hinweisAnzahl !== undefined &&
        hinweisAnzahl > 0 &&
        (hinweisHref ? (
          <Link
            href={hinweisHref}
            className="mt-xs flex items-center gap-[4px] truncate text-small text-anthrazit/50 underline decoration-dotted underline-offset-2 hover:text-anthrazit"
          >
            <Icon name="warning" size={13} className="shrink-0" />
            {zahlenformat.format(hinweisAnzahl)} ohne Angabe
          </Link>
        ) : (
          <p className="mt-xs flex items-center gap-[4px] truncate text-small text-anthrazit/50">
            <Icon name="warning" size={13} className="shrink-0" />
            {zahlenformat.format(hinweisAnzahl)} ohne Angabe
          </p>
        ))}
    </div>
  );
}

// Die acht KPI-Kacheln-Definitionen (Reihenfolge + feste Akzentfarbe je Kennzahl) — einzige
// Quelle der Wahrheit, damit TV/Admin-Desktop und Smartphone-Ansicht nie auseinanderlaufen.
// `hinweisHrefs`/`zeigeInfo` bleiben leer/false auf TV und Smartphone (siehe Uebersicht.tsx/
// TvMobil.tsx) — nur der Admin-Aufrufer übergibt die beiden Detailseiten-Links und schaltet die
// (i)-Erläuterungen frei (Nutzer-Vorgabe: "bei jedem statistischen Wert ... ein kleines (i) ...
// nicht im TV- oder Smartphone-Bereich"). Formeln/Felder in den info-Texten 1:1 aus den
// Kommentaren bei ladeObjektGesamtKennzahlen (onoffice/mitarbeiterstatistik.ts) und
// mapMitarbeiterObjekt/ladeAlleAktivenObjekte/ladeAlleObjekteInAufarbeitung/
// ladeAlleVerkauftenObjekte (onoffice/estate.ts) übernommen.
export function baueUebersichtKacheln(
  gesamt?: ObjektGesamtKennzahlen,
  hinweisHrefs?: { provisionsvorlauf?: string; provisionsvolumenJahr?: string },
  zeigeInfo?: boolean
): KpiKachelDaten[] {
  const jahr = new Date().getFullYear();
  const verkauftFehltAnzahl = gesamt?.provisionsvolumenVerkauftJahrFehltAnzahl ?? 0;
  const provisionsvorlaufFehltAnzahl = gesamt?.provisionsvorlaufFehltAnzahl ?? 0;
  const info = (text: string) => (zeigeInfo ? text : undefined);

  return [
    {
      label: `Verkaufte Objekte ${jahr}`,
      wert: formatWert(gesamt?.verkaufteObjekteJahrGesamt ?? null),
      icon: "check",
      akzent: "chart-1",
      info: info(
        'Anzahl Objekte mit Feld "verkauft_am" (Verkauft/Vermietet am) im laufenden Kalenderjahr, vermarktungsart=kauf. Bewusst OHNE Status-2-Filter (verkauft_am ist zuverlässiger gepflegt als Status 2), exakte Duplikate bereinigt.'
      ),
    },
    {
      label: "Aktive Vermarktung gesamt",
      wert: formatWert(gesamt?.aktivGesamt ?? null),
      icon: "house",
      akzent: "chart-2",
      info: info('Anzahl Objekte mit status=1 (Aktiv) und vermarktungsart=kauf.'),
    },
    {
      label: `Gesamtvolumen ${jahr}`,
      wert: formatBetrag(gesamt?.objektvolumenVerkauftJahr ?? null),
      icon: "calculator",
      akzent: "chart-3",
      info: info(
        'Summe des Felds "kaufpreis" über alle im laufenden Kalenderjahr verkauften Objekte (dieselbe Objektmenge wie "Verkaufte Objekte" links daneben).'
      ),
    },
    {
      label: "Objektvolumen gesamt",
      wert: formatBetrag(gesamt?.objektvolumenGesamt ?? null),
      icon: "scale",
      akzent: "chart-4",
      info: info(
        'Summe des Felds "kaufpreis" über alle aktiven Objekte (status=1) UND Objekte in Aufarbeitung (status=2, status2=vorbereitung).'
      ),
    },
    {
      label: "Provisionsvorlauf gesamt",
      wert: formatBetrag(gesamt?.provisionsvorlaufGesamt ?? null),
      icon: "handshake",
      akzent: "chart-5",
      hinweisAnzahl: provisionsvorlaufFehltAnzahl,
      hinweisHref: hinweisHrefs?.provisionsvorlauf,
      info: info(
        'Je Objekt: kaufpreis × (prozent_aussenprovision + prozent_innenprovision) ÷ 100 ÷ 1,19 (19% MwSt. herausgerechnet), summiert über aktive Objekte + Aufarbeitung. Objekte ohne beide Provisions-Prozentfelder fließen nicht ein (siehe "ohne Angabe").'
      ),
    },
    {
      label: "In Aufarbeitung gesamt",
      wert: formatWert(gesamt?.aufarbeitungGesamt ?? null),
      icon: "building",
      akzent: "chart-6",
      info: info('Anzahl Objekte mit status=2 (Inaktiv), status2=vorbereitung und vermarktungsart=kauf.'),
    },
    {
      label: `Provisionsvolumen ${jahr}`,
      wert: formatBetrag(gesamt?.provisionsvolumenVerkauftJahr ?? null),
      icon: "handshake",
      akzent: "chart-7",
      hinweisAnzahl: verkauftFehltAnzahl,
      hinweisHref: hinweisHrefs?.provisionsvolumenJahr,
      info: info(
        'Gleiche Formel wie "Provisionsvorlauf gesamt", aber nur über die im laufenden Kalenderjahr verkauften Objekte (Feld verkauft_am).'
      ),
    },
    {
      label: "Ø Vermarktungsdauer",
      wert: formatTage(gesamt?.durchschnittVermarktungsdauerTage ?? null),
      icon: "clock",
      akzent: "chart-8",
      info: info(
        'Durchschnitt der Tage zwischen dem Feld "auftragvon" und heute, über alle aktiven Objekte + Aufarbeitung mit gültigem auftragvon-Datum.'
      ),
    },
  ];
}
