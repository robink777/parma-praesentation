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

// Rundet einen 30-Tage-Gesamtwert auf eine Pro-Tag-Rate herunter (Oktober 2026 Chat-Vorgabe:
// "wie viele Telefonate pro Tag, wie viele Termine pro Tag") — eine Nachkommastelle, damit auch
// Mitarbeiter mit wenigen Vorgängen pro Monat (z.B. 4 Telefonate/30 Tage = 0,1/Tag) nicht
// fälschlich als "0" erscheinen.
const proTagFormat = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatProTag(n: number | null): string {
  return n === null ? "–" : proTagFormat.format(n / 30);
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
  telefonate30Tage: null,
};

// Baut die Liste der auf einer Kachel anzuzeigenden Kennzahlen (Label + formatierter Wert) in
// der passenden Reihenfolge — EIN Builder für alle vier Reiter, je nach modus/zeitraum.
// "vertrieb": die fünf Oktober-2026-Kennzahlen ("Telefonate pro Tag, Termine pro Tag, Objekte in
// der Aufarbeitung, aktive Immobilien, Verkäufe"), fest auf die letzten 30 Tage bzw. das laufende
// Jahr bezogen, kein Umschalter nötig. "akquise"/"standard" unverändert aus der vorherigen
// Tabellen-Darstellung übernommen (siehe Git-Historie baueMetriken).
function baueMetriken(
  k: MitarbeiterKennzahlen,
  modus: KennzahlenModus,
  zeitraum?: Zeitraum
): { label: string; wert: string }[] {
  if (modus === "vertrieb") {
    return [
      { label: "Telefonate/Tag", wert: formatProTag(k.telefonate30Tage) },
      { label: "Termine/Tag", wert: formatProTag(k.termine30Tage) },
      { label: "Aufarbeitung", wert: formatWert(k.objekteInAufarbeitung) },
      { label: "Aktive Immobilien", wert: formatWert(k.aktiveObjekte) },
      { label: "Verkäufe", wert: formatWert(k.verkaufteObjekteJahr) },
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

// Eine Mitarbeiter-Kachel — Reinweiß auf Stein, rounded-lg + dezenter Schatten, exakt im selben
// Karten-Look wie KpiKachel in Uebersicht.tsx. Titelbild aus OnOffice (siehe fotoLookup,
// ladeAlleMitarbeiter in onoffice/estate.ts) statt eines generischen Icons, mit
// Initialen-Avatar-Fallback (analog zu Unternehmen.tsx) für Mitarbeiter ohne hinterlegtes Foto.
function MitarbeiterKachel({
  mitglied,
  fotoUrl,
  metriken,
}: {
  mitglied: TeamMitglied;
  fotoUrl?: string;
  metriken: { label: string; wert: string }[];
}) {
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
          metriken={baueMetriken(kennzahlen?.[mitglied.name] ?? LEERE_KENNZAHLEN, modus, zeitraum)}
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
