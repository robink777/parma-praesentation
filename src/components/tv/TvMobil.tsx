"use client";

import Image from "next/image";
import { ADMIN_REFRESH_INTERVAL_MS, useAutoRefresh } from "@/lib/useAutoRefresh";
import { baueUebersichtKacheln, KpiKachel } from "@/components/shared/KpiKachel";
import { kategorisiere, stapelFuerWoche } from "@/lib/neuzugaengeKategorisierung";
import { KATEGORIE_BG_KLASSEN } from "@/components/shared/kategorieFarben";
import {
  SEGMENT_FARBEN,
  SEGMENT_LABEL,
  SEGMENT_PUNKTE_TEXT,
  SEGMENT_REIHENFOLGE,
} from "@/components/shared/wettkampfDarstellung";
import { fotoLookup, initialen } from "@/lib/mitarbeiterFotos";
import { AdminDashboardDaten } from "@/lib/onoffice/adminDashboard";
import type { WettkampfEintrag } from "@/lib/onoffice/wettkampf";
import { Betreuer, MitarbeiterKennzahlen, NeuzugaengeVerteilungsEintrag, NeuzugaengeWoche } from "@/types";

// Smartphone-Ansicht der TV-Vorführung (siehe TvSlideshow.tsx für die Fernseher-Variante) —
// Oktober 2026 Chat-Vorgabe: "eine Smartphone-Version ... darf scrollbar sein, soll auf dem
// Smartphone gut leserlich sein und soll nicht automatisch die Ansicht wechseln". Eigene Route
// (/tv/mobil) statt Responsive-Umbau derselben Seite — TV (feste Höhe, kein Scroll, automatischer
// Folienwechsel) und Smartphone (scrollbar, kein Auto-Wechsel, andere Typografie) sind UX-mäßig
// gegensätzlich genug, dass ein gemeinsames Layout hinter Media Queries trotzdem zwei komplette
// Render-Pfade bräuchte — mit einer eigenen Route bleibt die TV-Seite unangetastet. Teilt sich mit
// der TV-Seite trotzdem denselben Daten-Loader (app/tv/mobil/page.tsx ruft dieselben Funktionen
// wie app/tv/page.tsx auf) UND dieselben Darstellungs-Bausteine für Kategorien/Farben/Labels
// (components/shared/KpiKachel.tsx, kategorieFarben.ts, wettkampfDarstellung.ts,
// lib/neuzugaengeKategorisierung.ts) — nur die Layout-Container selbst sind eigenständig: normale
// Block-/Grid-Elemente in Dokumentenfluss statt des TV-typischen h-full/flex-1-Ketten, die ohne
// eine begrenzte Bildschirmhöhe (hier: eine scrollende Seite) nicht zuverlässig funktionieren.
//
// Kein Folien-Timer: useAutoRefresh aktualisiert die Daten weiterhin alle 60 Sekunden im
// Hintergrund (dieselbe Kennzahl soll nicht veralten, nur weil man sie am Handy statt am
// Fernseher anschaut), aber es gibt keinen setInterval, der die Ansicht selbst wechselt.
const zahlenformat = new Intl.NumberFormat("de-DE");

function formatWert(n: number | null | undefined): string {
  return n === null || n === undefined ? "–" : zahlenformat.format(n);
}

// Herkunft Kontakt kennt über 30 mögliche Werte im Feldkatalog, Status 2 dagegen nur 19 feste
// Werte — dieselbe Begründung/Entscheidung wie in Neuzugaenge.tsx (Desktop/TV-Variante).
const KUNDEN_MAX_KATEGORIEN = 7;

function KategorieLegende({ kategorien }: { kategorien: { label: string; farbe: string }[] }) {
  return (
    <div className="mt-xs flex flex-wrap items-center gap-x-sm gap-y-[2px]">
      {kategorien.map((k) => (
        <span key={k.label} className="flex items-center gap-[3px] text-[11px] text-anthrazit/50">
          <span
            className={`inline-block h-[8px] w-[8px] shrink-0 rounded-full ${KATEGORIE_BG_KLASSEN[k.farbe]}`}
          />
          {k.label}
        </span>
      ))}
    </div>
  );
}

// Eine Woche als horizontale Zeile: Datum links, gestapelter Balken (Breite statt Höhe, damit er
// im normalen Dokumentenfluss einer scrollenden Seite funktioniert — keine SVG-viewBox/h-full-
// Kette wie im Desktop-Pendant Neuzugaenge.tsx nötig), Gesamtzahl rechts. ladeNeuzugaengeVerlauf
// liefert bereits neueste Woche zuerst — genau die Reihenfolge, die auf einer scrollenden Seite
// gewünscht ist (aktuellste/relevanteste Information zuerst, kein Umdrehen wie im Desktop-
// Zeitstrahl nötig).
function WochenZeile({
  woche,
  maxWert,
  wert,
  verteilungVon,
  kategorisierung,
}: {
  woche: NeuzugaengeWoche;
  maxWert: number;
  wert: (w: NeuzugaengeWoche) => number | null;
  verteilungVon: (w: NeuzugaengeWoche) => NeuzugaengeVerteilungsEintrag[];
  kategorisierung: ReturnType<typeof kategorisiere>;
}) {
  const w = wert(woche) ?? 0;
  const laeuft = woche.label.includes("(laufend)");
  const stapel = stapelFuerWoche(woche, verteilungVon, kategorisierung);

  return (
    <div className={`flex items-center gap-sm ${laeuft ? "opacity-60" : ""}`}>
      <span className="w-[76px] shrink-0 font-mono text-[11px] text-anthrazit/50">
        {woche.label.split("–")[0]}
        {laeuft ? "*" : ""}
      </span>
      <div className="h-[14px] flex-1 overflow-hidden rounded-sm bg-stein">
        <div className="flex h-full">
          {kategorisierung.kategorien.map((kat) => {
            const anzahl = stapel.get(kat.label) ?? 0;
            if (anzahl <= 0) return null;
            return (
              <div
                key={kat.label}
                className={KATEGORIE_BG_KLASSEN[kat.farbe]}
                style={{ width: `${(anzahl / maxWert) * 100}%` }}
                title={`${kat.label}: ${zahlenformat.format(anzahl)}`}
              />
            );
          })}
        </div>
      </div>
      <span className="w-[30px] shrink-0 text-right font-mono text-[13px] font-semibold text-anthrazit">
        {zahlenformat.format(w)}
      </span>
    </div>
  );
}

function NeuzugaengeAbschnitt({
  titel,
  einheit,
  wochen,
  wert,
  verteilungVon,
  maxKategorien,
}: {
  titel: string;
  einheit: string;
  wochen: NeuzugaengeWoche[];
  wert: (woche: NeuzugaengeWoche) => number | null;
  verteilungVon: (woche: NeuzugaengeWoche) => NeuzugaengeVerteilungsEintrag[];
  maxKategorien: number;
}) {
  const maxWert = Math.max(1, ...wochen.map((w) => wert(w) ?? 0));
  const kategorisierung = kategorisiere(wochen, verteilungVon, maxKategorien);

  return (
    <div>
      <p className="mb-sm font-slab text-base font-bold text-anthrazit">{titel}</p>
      <div className="space-y-xs">
        {wochen.map((woche) => (
          <WochenZeile
            key={woche.von}
            woche={woche}
            maxWert={maxWert}
            wert={wert}
            verteilungVon={verteilungVon}
            kategorisierung={kategorisierung}
          />
        ))}
      </div>
      <p className="mt-xs text-[11px] text-anthrazit/40">
        {einheit} je Kalenderwoche · * aktuelle Woche, noch nicht abgeschlossen
      </p>
      <KategorieLegende kategorien={kategorisierung.kategorien} />
    </div>
  );
}

// Eine Mitarbeiter-Karte im Wettkampf-Ranking: Rang/Foto/Name/Punkte oben, darunter der
// gestapelte Punkte-Balken (gleiche Kategorien/Farben wie auf der TV-Folie, siehe
// AktivitaetenSaeule in MitarbeiterLeaderboard.tsx — hier als Breiten- statt Höhen-Balken), ganz
// unten eine kompakte 3×2-Tabelle (heute/Woche/gesamt × Anrufe/Termine).
function WettkampfKarte({
  eintrag,
  rang,
  fotoUrl,
  kennzahlen,
}: {
  eintrag: WettkampfEintrag;
  rang: number;
  fotoUrl?: string;
  kennzahlen?: MitarbeiterKennzahlen;
}) {
  const gesamtFuerAnteile = eintrag.punkte || 1;
  const zeitraeume: { label: string; anrufe: string; termine: string }[] = [
    {
      label: "Heute",
      anrufe: formatWert(kennzahlen?.telefonateHeute),
      termine: formatWert(kennzahlen?.termineHeute),
    },
    {
      label: "Woche",
      anrufe: formatWert(kennzahlen?.telefonateWoche),
      termine: formatWert(kennzahlen?.termineWoche),
    },
    {
      label: "Gesamt",
      anrufe: formatWert(eintrag.telefonateGesamt),
      termine: formatWert(eintrag.termineGesamt),
    },
  ];

  return (
    <div className="rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
      <div className="flex items-center gap-sm">
        <span className="w-[18px] shrink-0 text-right font-mono text-[11px] text-anthrazit/40">
          #{rang}
        </span>
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sand">
          {fotoUrl ? (
            <Image src={fotoUrl} alt={eintrag.name} fill className="object-cover" sizes="36px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-slab text-xs font-bold text-walnuss">
              {initialen(eintrag.name)}
            </div>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate font-medium text-anthrazit">{eintrag.name}</p>
        <p className="shrink-0 font-slab text-lg font-bold text-anthrazit">
          {zahlenformat.format(eintrag.punkte)}
        </p>
      </div>
      <div className="mt-xs flex h-[10px] overflow-hidden rounded-sm bg-stein">
        {eintrag.segmente
          .filter((s) => s.punkte > 0)
          .map((s) => (
            <div
              key={s.kategorie}
              className={SEGMENT_FARBEN[s.kategorie]}
              style={{ width: `${(s.punkte / gesamtFuerAnteile) * 100}%` }}
            />
          ))}
      </div>
      <div className="mt-sm grid grid-cols-4 gap-x-xs gap-y-[3px] border-t border-anthrazit/5 pt-xs text-center text-small">
        <div />
        {zeitraeume.map((z) => (
          <div key={z.label} className="font-mono text-[10px] uppercase text-anthrazit/40">
            {z.label}
          </div>
        ))}
        <div className="text-left font-mono text-[10px] uppercase text-anthrazit/40">Anrufe</div>
        {zeitraeume.map((z) => (
          <div key={z.label} className="font-slab font-bold text-anthrazit">
            {z.anrufe}
          </div>
        ))}
        <div className="text-left font-mono text-[10px] uppercase text-anthrazit/40">Termine</div>
        {zeitraeume.map((z) => (
          <div key={z.label} className="font-slab font-bold text-anthrazit">
            {z.termine}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TvMobil(
  daten: AdminDashboardDaten & { rangliste: WettkampfEintrag[]; saisonBisIso: string }
) {
  useAutoRefresh(ADMIN_REFRESH_INTERVAL_MS);

  const kacheln = baueUebersichtKacheln(daten.gesamtKennzahlen);
  const fotos = fotoLookup(daten.alleMitarbeiter ?? []);
  const verlauf = daten.neuzugaengeVerlauf ?? [];
  const saisonBis = new Date(daten.saisonBisIso);
  const resttage = Math.max(0, Math.ceil((saisonBis.getTime() - Date.now()) / 86_400_000));

  return (
    <div className="min-h-screen bg-stein pb-xl">
      <header className="sticky top-0 z-10 flex items-center bg-stein/95 px-md py-sm backdrop-blur">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={120} height={30} priority />
      </header>
      <main className="flex flex-col gap-lg px-md pt-sm">
        <section>
          <h2 className="mb-sm font-slab text-lg font-bold text-anthrazit">Übersicht</h2>
          <div className="grid grid-cols-1 gap-sm">
            {kacheln.map((kachel) => (
              <KpiKachel key={kachel.label} {...kachel} />
            ))}
          </div>
        </section>

        {verlauf.length > 0 && (
          <section className="rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
            <h2 className="mb-sm font-slab text-lg font-bold text-anthrazit">Neuzugänge</h2>
            <div className="flex flex-col gap-lg">
              <NeuzugaengeAbschnitt
                titel="Neue Objekte"
                einheit="Objekte"
                wochen={verlauf}
                wert={(w) => w.neueObjekte}
                verteilungVon={(w) => w.neueObjekteVerteilung}
                maxKategorien={Infinity}
              />
              <NeuzugaengeAbschnitt
                titel="Neue Kunden"
                einheit="Kunden"
                wochen={verlauf}
                wert={(w) => w.neueKunden}
                verteilungVon={(w) => w.neueKundenVerteilung}
                maxKategorien={KUNDEN_MAX_KATEGORIEN}
              />
            </div>
          </section>
        )}

        <section>
          <div className="mb-sm flex items-baseline justify-between">
            <h2 className="font-slab text-lg font-bold text-anthrazit">Wettkampf</h2>
            <p className="font-mono text-[11px] text-anthrazit/45">
              bis {saisonBis.toLocaleDateString("de-DE")} · noch {zahlenformat.format(resttage)} Tage
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-sm gap-y-[2px]">
            {SEGMENT_REIHENFOLGE.map((kat) => (
              <span key={kat} className="flex items-center gap-[3px] text-[11px] text-anthrazit/50">
                <span className={`inline-block h-[8px] w-[8px] shrink-0 rounded-full ${SEGMENT_FARBEN[kat]}`} />
                {SEGMENT_LABEL[kat]} ({SEGMENT_PUNKTE_TEXT[kat]})
              </span>
            ))}
          </div>
          <div className="mt-sm flex flex-col gap-sm">
            {daten.rangliste.map((eintrag, i) => (
              <WettkampfKarte
                key={eintrag.name}
                eintrag={eintrag}
                rang={i + 1}
                fotoUrl={fotos[eintrag.name]}
                kennzahlen={daten.kennzahlen?.[eintrag.name]}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
