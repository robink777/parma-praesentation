"use client";

import { useState } from "react";
import Image from "next/image";
import { AKQUISE_NAMEN, SETTING_NAMEN, TEAM, VERTRIEB_NAMEN } from "@/data/unternehmen";
import { fotoLookup, initialen } from "@/lib/mitarbeiterFotos";
import { Betreuer, MitarbeiterKennzahlen, TeamMitglied } from "@/types";

// "Mitarbeiter"-Baustein des Admin-Dashboards (siehe AdminDashboard.tsx) — Oktober 2026
// Chat-Vorgabe: "ich will dass sie den ersten beiden Seiten gleicht (vom Look) ... Kacheln ...
// jeweils eine Kachel für einen Mitarbeiter, mit Titelbild, Statistikzahlen dahinter". Komplett
// neu gegenüber der vorherigen Tabellen-/Listendarstellung (siehe Git-Historie) — EINE
// Kachel-Komponente (MitarbeiterKachel unten) für alle vier Reiter, im selben Reinweiß-auf-Stein-
// Look wie Uebersicht.tsx/KarteBereich.tsx, als drittes vollflächiges, scrollfreies Dashboard
// (siehe AdminDashboard.tsx, istVollflaechig).
//
// Die vorherige Aufklapp-Objektliste je Mitarbeiter (Klick auf den Namen -> Objekte, siehe
// api/admin/mitarbeiter-objekte/route.ts) entfällt hier bewusst: Ein Kachel-Überblick und eine
// Klick-zum-Aufklappen-Arbeitsliste sind zwei unterschiedliche Bedienparadigmen, die sich in
// diesem Format nicht sauber vereinen lassen. Backend/Route bleiben unangetastet bestehen (siehe
// dort), falls dieser Drilldown an anderer Stelle wieder gebraucht wird.
const zahlenformat = new Intl.NumberFormat("de-DE");

function formatWert(n: number | null): string {
  return n === null ? "–" : zahlenformat.format(n);
}

// Quote 1. → 2. Termin, immer auf Basis der Jahreszahlen (Chat-Vorgabe: "bitte jeweils fürs Jahr
// angeben") — unabhängig vom 30-Tage/Jahr-Umschalter, damit die Quote nicht durch die kleinen,
// schwankungsanfälligen 30-Tage-Zahlen verzerrt wird. null, wenn im laufenden Jahr noch kein
// Ersttermin stattfand (Division durch 0 wäre irreführend, kein "0%").
function akquiseQuoteErstZuZweit(k: MitarbeiterKennzahlen): number | null {
  if (!k.akquiseErsttermineJahr) return null;
  return Math.round(((k.akquiseZweittermineJahr ?? 0) / k.akquiseErsttermineJahr) * 100);
}

function formatProzent(n: number | null): string {
  return n === null ? "–" : `${zahlenformat.format(n)} %`;
}

// Teilt TEAM in die vier Reiter-Listen auf (VERTRIEB_NAMEN/AKQUISE_NAMEN/SETTING_NAMEN, siehe
// data/unternehmen.ts, August 2026 Chat-Vorgabe: "ich brauche bei Mitarbeiter neben Vertrieb noch
// zwei weitere Reiter ... Akquise (Daniel, Robin, Axel) und Setting (Sarah, Kathi). Alle anderen
// Mitarbeiter können als 'weitere Mitarbeiter' gelistet bleiben"), jeweils in der bestehenden
// TEAM-Reihenfolge statt der Nennreihenfolge aus dem Chat. Axel Wehmeier taucht bewusst sowohl in
// vertrieb als auch in akquise auf (siehe Kommentar bei AKQUISE_NAMEN) — "weitere" enthält jeden,
// der in KEINER der drei Listen steht.
function teileTeamAuf(): {
  vertrieb: TeamMitglied[];
  akquise: TeamMitglied[];
  setting: TeamMitglied[];
  weitere: TeamMitglied[];
} {
  const vertrieb = TEAM.filter((m) => VERTRIEB_NAMEN.includes(m.name));
  const akquise = TEAM.filter((m) => AKQUISE_NAMEN.includes(m.name));
  const setting = TEAM.filter((m) => SETTING_NAMEN.includes(m.name));
  const weitere = TEAM.filter(
    (m) =>
      !VERTRIEB_NAMEN.includes(m.name) &&
      !AKQUISE_NAMEN.includes(m.name) &&
      !SETTING_NAMEN.includes(m.name)
  );
  return { vertrieb, akquise, setting, weitere };
}

type KennzahlenModus = "vertrieb" | "akquise" | "standard";
type Zeitraum = "30T" | "Jahr";

const LEERE_KENNZAHLEN: MitarbeiterKennzahlen = {
  aktiveObjekte: null,
  objekteInAufarbeitung: null,
  termine30Tage: null,
  termineJahr: null,
  besichtigungen30Tage: null,
  besichtigungenJahr: null,
  kundenAktiv: null,
  verkaufteObjekteJahr: null,
  akquiseErsttermin30Tage: null,
  akquiseErsttermineJahr: null,
  akquiseZweittermin30Tage: null,
  akquiseZweittermineJahr: null,
  akquiseVertragstermin30Tage: null,
  akquiseVertragstermineJahr: null,
  telefonateHeute: null,
  telefonateWoche: null,
  termineHeute: null,
  termineWoche: null,
};

// Baut die Liste der auf einer Kachel anzuzeigenden Kennzahlen (Label + formatierter Wert) in
// der passenden Reihenfolge — EIN Builder für alle vier Reiter, je nach modus/zeitraum.
// "vertrieb": Anrufe und Termine je "heute" und "diese Woche" — ALLES echte Zählwerte, bewusst
// KEINE Durchschnittsrate (Nutzer-Korrektur: erst "ich will Anrufe pro Tag und pro Monat! Keine
// Durchschnittswert", direkt darauf präzisiert auf "Termine pro Tag und Termine pro Woche" mit
// demselben Prinzip). Aufarbeitung/Aktive Immobilien/Verkäufe sind hier NICHT mehr dabei — die
// zeigt stattdessen ObjektBalken unterhalb der Kachel (Chat-Vorgabe: "Die Objektstatistik hätte
// ich gerne darunter als Balkendiagramm"). "akquise"/"standard" unverändert aus der vorherigen
// Tabellen-Darstellung übernommen (siehe Git-Historie baueMetriken).
function baueMetriken(
  k: MitarbeiterKennzahlen,
  modus: KennzahlenModus,
  zeitraum?: Zeitraum
): { label: string; wert: string }[] {
  if (modus === "vertrieb") {
    return [
      { label: "Anrufe heute", wert: formatWert(k.telefonateHeute) },
      { label: "Anrufe Woche", wert: formatWert(k.telefonateWoche) },
      { label: "Termine heute", wert: formatWert(k.termineHeute) },
      { label: "Termine Woche", wert: formatWert(k.termineWoche) },
    ];
  }

  const basis = [
    { label: "Aktive Objekte", wert: formatWert(k.aktiveObjekte) },
    { label: "Aufarbeitung", wert: formatWert(k.objekteInAufarbeitung) },
  ];

  if (modus === "akquise") {
    const z = zeitraum ?? "Jahr";
    return [
      ...basis,
      {
        label: z === "30T" ? "Erst 30T" : "Erst Jahr",
        wert: formatWert(z === "30T" ? k.akquiseErsttermin30Tage : k.akquiseErsttermineJahr),
      },
      {
        label: z === "30T" ? "Zweit 30T" : "Zweit Jahr",
        wert: formatWert(z === "30T" ? k.akquiseZweittermin30Tage : k.akquiseZweittermineJahr),
      },
      { label: "Quote 1→2", wert: formatProzent(akquiseQuoteErstZuZweit(k)) },
      {
        label: z === "30T" ? "Vertrag 30T" : "Vertrag Jahr",
        wert: formatWert(
          z === "30T" ? k.akquiseVertragstermin30Tage : k.akquiseVertragstermineJahr
        ),
      },
    ];
  }

  if (zeitraum) {
    return [
      ...basis,
      {
        label: zeitraum === "30T" ? "Termine 30T" : "Termine Jahr",
        wert: formatWert(zeitraum === "30T" ? k.termine30Tage : k.termineJahr),
      },
      {
        label: zeitraum === "30T" ? "Besicht. 30T" : "Besicht. Jahr",
        wert: formatWert(zeitraum === "30T" ? k.besichtigungen30Tage : k.besichtigungenJahr),
      },
      { label: "Kunden aktiv", wert: formatWert(k.kundenAktiv) },
      { label: "Verkauft", wert: formatWert(k.verkaufteObjekteJahr) },
    ];
  }

  return [
    ...basis,
    { label: "Termine 30T", wert: formatWert(k.termine30Tage) },
    { label: "Termine Jahr", wert: formatWert(k.termineJahr) },
    { label: "Besicht. 30T", wert: formatWert(k.besichtigungen30Tage) },
    { label: "Besicht. Jahr", wert: formatWert(k.besichtigungenJahr) },
    { label: "Kunden aktiv", wert: formatWert(k.kundenAktiv) },
    { label: "Verkauft", wert: formatWert(k.verkaufteObjekteJahr) },
  ];
}

// Die drei Objekt-Kennzahlen als EIN gemeinsamer Balken statt eigener Kacheln-Felder (Chat-
// Vorgabe: "Die Objektstatistik hätte ich gerne darunter als Balkendiagramm. Einen Balken mit
// den Werten darin"). Farben bewusst dieselben wie an anderer Stelle im Dashboard für dieselbe
// Bedeutung (siehe Uebersicht.tsx: "Verkaufte Objekte" = chart-1, "Aktive Vermarktung" = chart-2,
// "In Aufarbeitung" = chart-6) — wiedererkennbare Farbcodierung statt neu erfundener Töne.
const OBJEKT_BALKEN_SEGMENTE: {
  label: string;
  farbKlasse: string;
  wert: (k: MitarbeiterKennzahlen) => number | null;
}[] = [
  { label: "Aufarbeitung", farbKlasse: "bg-chart-6", wert: (k) => k.objekteInAufarbeitung },
  { label: "Aktive Immobilien", farbKlasse: "bg-chart-2", wert: (k) => k.aktiveObjekte },
  { label: "Verkäufe", farbKlasse: "bg-chart-1", wert: (k) => k.verkaufteObjekteJahr },
];

// Kleine Legende über dem Vertrieb-Raster (siehe MitarbeiterBereich unten) — EINMAL für alle
// Kacheln statt pro Kachel wiederholt, da Reihenfolge/Farben für jede Person gleich bleiben
// (dataviz-Regel: Farbe allein genügt nie, Legende macht die drei Segmente eindeutig).
function ObjektBalkenLegende() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-md text-small text-anthrazit/60">
      {OBJEKT_BALKEN_SEGMENTE.map((segment) => (
        <span key={segment.label} className="flex items-center gap-xs">
          <span className={`inline-block h-[10px] w-[10px] rounded-full ${segment.farbKlasse}`} />
          {segment.label}
        </span>
      ))}
    </div>
  );
}

// EIN Balken, in drei proportionale Abschnitte geteilt (Aufarbeitung/Aktive Immobilien/
// Verkäufe), Wert als Zahl direkt im jeweiligen Abschnitt. Mindestbreite 10 % je Abschnitt (dann
// auf 100 % renormiert) — ohne sie würde ein Abschnitt mit Wert 0 auf 0 Breite kollabieren und
// die "0" wäre nirgends mehr lesbar.
function ObjektBalken({ k }: { k: MitarbeiterKennzahlen }) {
  const werte = OBJEKT_BALKEN_SEGMENTE.map((segment) => segment.wert(k) ?? 0);
  const summe = werte.reduce((a, b) => a + b, 0) || 1;
  const roh = werte.map((w) => Math.max(0.1, w / summe));
  const rohSumme = roh.reduce((a, b) => a + b, 0);

  return (
    <div className="mt-sm flex h-[clamp(22px,4vh,32px)] shrink-0 gap-[2px] overflow-hidden rounded-sm">
      {OBJEKT_BALKEN_SEGMENTE.map((segment, i) => (
        <div
          key={segment.label}
          className={`flex items-center justify-center ${segment.farbKlasse}`}
          style={{ width: `${(roh[i] / rohSumme) * 100}%` }}
          title={`${segment.label}: ${zahlenformat.format(werte[i])}`}
        >
          <span className="font-slab text-[clamp(11px,1.8vh,14px)] font-bold text-reinweiss [text-shadow:0_1px_2px_rgba(27,20,19,0.45)]">
            {zahlenformat.format(werte[i])}
          </span>
        </div>
      ))}
    </div>
  );
}

// Eine Mitarbeiter-Kachel — Reinweiß auf Stein, rounded-lg + dezenter Schatten, exakt im selben
// Karten-Look wie KpiKachel in Uebersicht.tsx. Titelbild aus OnOffice (siehe fotoLookup,
// ladeAlleMitarbeiter in onoffice/estate.ts) statt eines generischen Icons, mit
// Initialen-Avatar-Fallback (analog zu Unternehmen.tsx) für Mitarbeiter ohne hinterlegtes Foto.
// Balken (ObjektBalken) nur im Vertrieb-Reiter, direkt unter dem Kennzahlen-Raster.
function MitarbeiterKachel({
  mitglied,
  fotoUrl,
  kennzahlen,
  modus,
  zeitraum,
}: {
  mitglied: TeamMitglied;
  fotoUrl?: string;
  kennzahlen: MitarbeiterKennzahlen;
  modus: KennzahlenModus;
  zeitraum?: Zeitraum;
}) {
  const metriken = baueMetriken(kennzahlen, modus, zeitraum);
  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)] md:p-md">
      <div className="mb-sm flex shrink-0 items-center gap-sm">
        <div className="relative h-[clamp(36px,6vh,56px)] w-[clamp(36px,6vh,56px)] shrink-0 overflow-hidden rounded-full bg-sand">
          {fotoUrl ? (
            <Image src={fotoUrl} alt={mitglied.name} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-slab text-sm font-bold text-walnuss">
              {initialen(mitglied.name)}
            </div>
          )}
        </div>
        <p className="min-w-0 truncate text-lg font-medium text-anthrazit">{mitglied.name}</p>
      </div>
      <div className="grid flex-1 grid-cols-2 content-start gap-x-sm gap-y-xs">
        {metriken.map((m) => (
          <div key={m.label} className="min-w-0">
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-anthrazit/50">
              {m.label}
            </p>
            <p className="truncate font-slab text-[clamp(16px,2.6vh,22px)] font-bold leading-tight text-anthrazit">
              {m.wert}
            </p>
          </div>
        ))}
      </div>
      {modus === "vertrieb" && <ObjektBalken k={kennzahlen} />}
    </div>
  );
}

// Kachel-Raster EINES Reiters — grid-cols passt sich der Mitgliederzahl an (Vertrieb bis zu
// sechs, die übrigen Reiter zwei bis drei), damit auch bei wenigen Kacheln keine unnötig breiten
// Lücken entstehen.
function MitarbeiterRaster({
  mitglieder,
  kennzahlen,
  fotos,
  modus,
  zeitraum,
}: {
  mitglieder: TeamMitglied[];
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  fotos: Record<string, string>;
  modus: KennzahlenModus;
  zeitraum?: Zeitraum;
}) {
  const spalten = mitglieder.length >= 4 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid h-full min-h-0 auto-rows-fr ${spalten} gap-sm`}>
      {mitglieder.map((mitglied) => (
        <MitarbeiterKachel
          key={mitglied.name}
          mitglied={mitglied}
          fotoUrl={fotos[mitglied.name]}
          kennzahlen={kennzahlen?.[mitglied.name] ?? LEERE_KENNZAHLEN}
          modus={modus}
          zeitraum={zeitraum}
        />
      ))}
    </div>
  );
}

// Die vier Reiter innerhalb des "Mitarbeiter"-Bereichs (August 2026 Chat-Vorgabe: "ich brauche
// bei Mitarbeiter neben Vertrieb noch zwei weitere Reiter ... Akquise ... und Setting ... Alle
// anderen Mitarbeiter können als 'weitere Mitarbeiter' gelistet bleiben").
type MitarbeiterReiter = "vertrieb" | "akquise" | "setting" | "weitere";

const MITARBEITER_REITER: { id: MitarbeiterReiter; label: string }[] = [
  { id: "vertrieb", label: "Vertrieb" },
  { id: "akquise", label: "Akquise" },
  { id: "setting", label: "Setting" },
  { id: "weitere", label: "Weitere Mitarbeiter" },
];

function MitarbeiterReiterleiste({
  aktiv,
  onSelect,
}: {
  aktiv: MitarbeiterReiter;
  onSelect: (reiter: MitarbeiterReiter) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-xs border-b border-anthrazit/10">
      {MITARBEITER_REITER.map((reiter) => (
        <button
          key={reiter.id}
          type="button"
          onClick={() => onSelect(reiter.id)}
          className={`border-b-2 px-sm py-xs text-lg font-medium transition-colors ${
            aktiv === reiter.id
              ? "border-messing text-anthrazit"
              : "border-transparent text-anthrazit/50 hover:text-anthrazit"
          }`}
        >
          {reiter.label}
        </button>
      ))}
    </div>
  );
}

// Umschalter zwischen "30 Tage" und "Jahr" für Akquise/Setting (August 2026 Chat-Vorgabe: "die
// Option einbauen dass man von 30T zu Jahr wechseln kann") — Vertrieb/Weitere Mitarbeiter
// brauchen ihn nicht (Vertrieb hat feste Bezugsgrößen je Kennzahl, Weitere zeigt beide
// Zeitfenster ohnehin nebeneinander).
function ZeitraumSchalter({
  aktiv,
  onSelect,
}: {
  aktiv: Zeitraum;
  onSelect: (zeitraum: Zeitraum) => void;
}) {
  const optionen: { id: Zeitraum; label: string }[] = [
    { id: "30T", label: "30 Tage" },
    { id: "Jahr", label: "Jahr" },
  ];
  return (
    <div className="inline-flex shrink-0 rounded-md border-2 border-asche bg-reinweiss p-[3px]">
      {optionen.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`rounded-sm px-md py-xs text-lg font-medium transition-colors ${
            aktiv === option.id ? "bg-walnuss text-reinweiss" : "text-anthrazit/60 hover:text-anthrazit"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Zeigt die bestehende TEAM-Liste (data/unternehmen.ts, NICHT alle Live-OnOffice-Nutzer — auf
// ausdrücklichen Nutzerwunsch), aufgeteilt in vier Reiter, als Kachel-Raster (siehe
// MitarbeiterKachel/MitarbeiterRaster oben). Vertrieb zeigt die fünf Oktober-2026-Kennzahlen,
// Setting/Weitere Mitarbeiter die ursprünglichen Auslastungs-Kennzahlen, Akquise die drei
// Akquise-Terminarten.
export function MitarbeiterBereich({
  kennzahlen,
  alleMitarbeiter,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  alleMitarbeiter?: Betreuer[];
}) {
  const { vertrieb, akquise, setting, weitere } = teileTeamAuf();
  const fotos = fotoLookup(alleMitarbeiter ?? []);
  const [mitarbeiterReiter, setMitarbeiterReiter] = useState<MitarbeiterReiter>("vertrieb");
  const [zeitraum, setZeitraum] = useState<Zeitraum>("Jahr");

  return (
    <div className="flex h-full min-h-0 flex-col gap-sm">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-sm">
        <MitarbeiterReiterleiste aktiv={mitarbeiterReiter} onSelect={setMitarbeiterReiter} />
        {(mitarbeiterReiter === "akquise" || mitarbeiterReiter === "setting") && (
          <ZeitraumSchalter aktiv={zeitraum} onSelect={setZeitraum} />
        )}
        {mitarbeiterReiter === "vertrieb" && <ObjektBalkenLegende />}
      </div>
      <div className="min-h-0 flex-1">
        {mitarbeiterReiter === "vertrieb" && (
          <MitarbeiterRaster mitglieder={vertrieb} kennzahlen={kennzahlen} fotos={fotos} modus="vertrieb" />
        )}
        {mitarbeiterReiter === "akquise" && (
          <MitarbeiterRaster
            mitglieder={akquise}
            kennzahlen={kennzahlen}
            fotos={fotos}
            modus="akquise"
            zeitraum={zeitraum}
          />
        )}
        {mitarbeiterReiter === "setting" && (
          <MitarbeiterRaster
            mitglieder={setting}
            kennzahlen={kennzahlen}
            fotos={fotos}
            modus="standard"
            zeitraum={zeitraum}
          />
        )}
        {mitarbeiterReiter === "weitere" && (
          <MitarbeiterRaster mitglieder={weitere} kennzahlen={kennzahlen} fotos={fotos} modus="standard" />
        )}
      </div>
    </div>
  );
}
