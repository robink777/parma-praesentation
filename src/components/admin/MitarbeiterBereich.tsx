"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/layout/SectionShell";
import { AKQUISE_NAMEN, SETTING_NAMEN, TEAM, VERTRIEB_NAMEN } from "@/data/unternehmen";
import { Icon } from "@/components/icons/Icon";
import { formatiereBetrag } from "@/lib/berechnung";
import { MitarbeiterKennzahlen, MitarbeiterObjekt, TeamMitglied } from "@/types";

// "Mitarbeiter"-Baustein des Admin-Dashboards (siehe AdminDashboard.tsx) — bis Oktober
// 2026 Teil der Alleskönner-Komponente "Mitarbeiterstatistik" (Karte + komplettes Statistik-Panel
// in einer Datei, siehe Git-Historie), seither auf eine eigene Route aufgeteilt (Chat-Vorgabe:
// "zwei Hauptbereiche ... Kartenbereich und ... Statistik"). Die komplette Fach-/Abruflogik hier
// unten ist UNVERÄNDERT aus der alten Komponente übernommen (lazy geladene Objektlisten je
// Mitarbeiter samt Retry, Vertrieb/Akquise/Setting/Weitere-Reiter, 30-Tage/Jahr-Umschalter) — nur
// die Tailwind-Klassen sind für die jetzt vollflächige, für TV-Distanz gedachte Statistik-Seite
// großzügiger skaliert (vormals auf ein schmales 1/3-Panel zugeschnitten, siehe Kommentar-
// Historie unten).
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

// Kleiner Hinweis-Baustein für Werte, die sich NICHT aus einem "noch nicht geladen"-Zustand
// ergeben, sondern daraus, dass ein OnOffice-Feld leer oder nicht auswertbar ist (aktuell:
// Provisionsvorlauf, siehe MitarbeiterObjekt.provisionsvorlaufFehlt) — bewusst mit Icon + Text
// statt eines schlichten "–", damit auf einen Blick klar ist, dass hier in OnOffice etwas
// nachgetragen werden muss (Chat-Vorgabe: "Hinweisfeld ... wenn Werte fehlen").
function DatenFehltHinweis({ titel }: { titel: string }) {
  return (
    <span
      className="inline-flex items-center gap-[3px] text-anthrazit/50"
      title={`${titel}: In OnOffice nicht (vollständig) ausgefüllt`}
    >
      <Icon name="warning" size={14} />
      <span className="text-small italic">Angabe fehlt</span>
    </span>
  );
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

// "standard" = Vertrieb/Setting/Weitere Mitarbeiter (unverändertes Spaltenschema), "akquise" =
// eigener Reiter mit anderen Kennzahlen (August 2026 Chat-Vorgabe: "Statt Termine 30T, Termine
// Jahr, Besichtigung 30T und Besicht. Jahr. Auch aktive Kunden und Verkauf kann raus ...
// stattdessen: Anzahl Akquise - Ersttermin/-Zweittermin/-Vertragstermin, jeweils 30T und Jahr").
type KennzahlenModus = "standard" | "akquise";

// Zeitraum-Umschaltung für Vertrieb/Akquise/Setting (August 2026 Chat-Vorgabe: "die Option
// einbauen dass man von 30T zu Jahr wechseln kann damit die Tabelle etwas schlanker ist") —
// undefined = "Weitere Mitarbeiter"-Fall, zeigt weiterhin beide Zeitfenster nebeneinander.
type Zeitraum = "30T" | "Jahr";

// Jeder Wert trägt sein Label direkt bei sich, statt sich über eine separate, positionsabhängige
// Kopfzeile zu erschließen — dadurch bleibt jede einzelne Metrik auch dann verständlich, wenn das
// umgebende Raster umbricht.
function Metrik({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[96px] flex-col gap-[2px]">
      <span className="label text-anthrazit/40">{label}</span>
      <span className="font-mono text-body font-medium text-anthrazit">{children}</span>
    </div>
  );
}

// Baut die Liste der anzuzeigenden Kennzahlen (Label + formatierter Wert) in der passenden
// Reihenfolge.
function baueMetriken(
  k: MitarbeiterKennzahlen,
  modus: KennzahlenModus,
  zeitraum?: Zeitraum
): { label: string; wert: string }[] {
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

// Eine Objektzeile innerhalb einer aufgeklappten Gruppe (siehe ObjektGruppe unten).
function ObjektZeile({ objekt }: { objekt: MitarbeiterObjekt }) {
  return (
    <div className="flex items-center gap-md border-b border-anthrazit/5 py-sm last:border-b-0">
      <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-stein">
        {objekt.titelbildUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- externe OnOffice-Bild-URL, kein lokaler Import möglich
          <img
            src={objekt.titelbildUrl}
            alt={objekt.titel}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <span className="truncate font-mono text-base text-anthrazit">{objekt.objektnr}</span>
        <div className="flex flex-wrap gap-x-md gap-y-[2px] text-body text-anthrazit/60">
          <span>{formatiereBetrag(objekt.preis)}</span>
          <span>
            {objekt.vermarktungsdauerTage === null
              ? "–"
              : `${zahlenformat.format(objekt.vermarktungsdauerTage)} Tage`}
          </span>
          <span>
            {objekt.provisionsvorlaufFehlt ? (
              <DatenFehltHinweis titel="Außen-/Innen-Provision" />
            ) : objekt.provisionsvorlauf === null ? (
              "–"
            ) : (
              formatiereBetrag(objekt.provisionsvorlauf)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// Eine Gruppe innerhalb der aufgeklappten Objektliste (siehe MitarbeiterObjekte darunter) —
// getrennt nach "in Aufarbeitung" und "aktive Vermarktung", jeweils mit derselben Filterlogik wie
// die zugehörige Kennzahlen-Spalte.
function ObjektGruppe({ titel, objekte }: { titel: string; objekte: MitarbeiterObjekt[] }) {
  const [offen, setOffen] = useState(false);

  return (
    <div className="border-b border-anthrazit/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOffen((bisher) => !bisher)}
        aria-expanded={offen}
        className="flex w-full items-center gap-xs py-xs text-left"
      >
        <Icon
          name="chevronRight"
          size={16}
          className={`shrink-0 text-anthrazit/40 transition-transform ${offen ? "rotate-90" : ""}`}
        />
        <span className="label text-anthrazit/60">
          {titel} ({objekte.length})
        </span>
      </button>
      {offen &&
        (objekte.length === 0 ? (
          <p className="py-xs pl-6 text-body text-anthrazit/40">Keine Objekte</p>
        ) : (
          <div className="pl-6">
            {objekte.map((objekt) => (
              <ObjektZeile key={objekt.id} objekt={objekt} />
            ))}
          </div>
        ))}
    </div>
  );
}

type ObjektlisteZustand =
  | { status: "lädt" }
  | { status: "fehler" }
  | {
      status: "geladen";
      aktiv: MitarbeiterObjekt[];
      aufarbeitung: MitarbeiterObjekt[];
      vermietung: MitarbeiterObjekt[];
      verkauft: MitarbeiterObjekt[];
    };

// Lädt die Objektliste EINES Mitarbeiters erst beim ersten Aufklappen (kein zusätzlicher Abruf
// für alle ~20 Mitarbeiter beim initialen Seitenaufruf, siehe api/admin/mitarbeiter-objekte/
// route.ts). Wird von KennzahlenZeile nur gemountet, solange "wurdeGeoeffnet" true ist — danach
// bleibt sie gemountet (kein erneuter Abruf beim Wiederaufklappen), nur die Sichtbarkeit der
// ganzen Zeile wird umgeschaltet.
function MitarbeiterObjekte({ name }: { name: string }) {
  const [zustand, setZustand] = useState<ObjektlisteZustand>({ status: "lädt" });
  const [versuch, setVersuch] = useState(0);

  useEffect(() => {
    let abgebrochen = false;
    setZustand({ status: "lädt" });
    fetch(`/api/admin/mitarbeiter-objekte?name=${encodeURIComponent(name)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Antwort nicht ok");
        return res.json();
      })
      .then(
        (daten: {
          aktiv: MitarbeiterObjekt[];
          aufarbeitung: MitarbeiterObjekt[];
          vermietung: MitarbeiterObjekt[];
          verkauft: MitarbeiterObjekt[];
        }) => {
          if (!abgebrochen) {
            setZustand({
              status: "geladen",
              aktiv: daten.aktiv,
              aufarbeitung: daten.aufarbeitung,
              vermietung: daten.vermietung,
              verkauft: daten.verkauft,
            });
          }
        }
      )
      .catch(() => {
        if (!abgebrochen) setZustand({ status: "fehler" });
      });
    return () => {
      abgebrochen = true;
    };
  }, [name, versuch]);

  if (zustand.status === "lädt") {
    return <p className="py-sm text-body text-anthrazit/40">Objektliste wird geladen …</p>;
  }
  if (zustand.status === "fehler") {
    return (
      <div className="flex items-center gap-sm py-sm">
        <p className="text-body text-anthrazit/40">Objektliste konnte nicht geladen werden.</p>
        <button
          type="button"
          onClick={() => setVersuch((bisher) => bisher + 1)}
          className="text-body text-anthrazit/60 underline underline-offset-4 hover:text-anthrazit"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col py-sm">
      <ObjektGruppe titel="Vermietung" objekte={zustand.vermietung} />
      <ObjektGruppe titel="In Aufarbeitung" objekte={zustand.aufarbeitung} />
      <ObjektGruppe titel="Aktive Vermarktung" objekte={zustand.aktiv} />
      <ObjektGruppe titel="Verkauft" objekte={zustand.verkauft} />
    </div>
  );
}

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

function KennzahlenZeile({
  mitglied,
  kennzahlen,
  modus,
  zeitraum,
}: {
  mitglied: TeamMitglied;
  kennzahlen?: MitarbeiterKennzahlen;
  modus: KennzahlenModus;
  zeitraum?: Zeitraum;
}) {
  const [offen, setOffen] = useState(false);
  const [wurdeGeoeffnet, setWurdeGeoeffnet] = useState(false);

  const k = kennzahlen ?? LEERE_KENNZAHLEN;
  const metriken = baueMetriken(k, modus, zeitraum);

  function umschalten() {
    setOffen((bisher) => !bisher);
    setWurdeGeoeffnet(true);
  }

  return (
    <div className="border-b border-anthrazit/10 py-sm last:border-b-0">
      <button
        type="button"
        onClick={umschalten}
        aria-expanded={offen}
        aria-label={`Objektliste von ${mitglied.name} ${offen ? "einklappen" : "ausklappen"}`}
        className="flex w-full items-center gap-xs text-left"
      >
        <Icon
          name="chevronRight"
          size={18}
          className={`shrink-0 text-anthrazit/40 transition-transform ${offen ? "rotate-90" : ""}`}
        />
        <p className="min-w-0 truncate text-lg font-medium text-anthrazit">{mitglied.name}</p>
      </button>
      <div className="mt-sm flex flex-wrap gap-x-md gap-y-sm pl-md">
        {metriken.map((metrik) => (
          <Metrik key={metrik.label} label={metrik.label}>
            {metrik.wert}
          </Metrik>
        ))}
      </div>
      {wurdeGeoeffnet && (
        <div className={`mt-xs border-t border-anthrazit/5 pl-md ${offen ? "block" : "hidden"}`}>
          <MitarbeiterObjekte name={mitglied.name} />
        </div>
      )}
    </div>
  );
}

// Eine der vier Reiter-Listen (Vertrieb/Akquise/Setting/Weitere Mitarbeiter, siehe teileTeamAuf
// oben) als eigene Karte — dieselbe Zeilenstruktur für alle vier, nur "modus" schaltet zwischen
// dem Standard- und dem Akquise-Kennzahlensatz um.
function MitarbeiterTabelle({
  titel,
  mitglieder,
  kennzahlen,
  modus = "standard",
  zeitraum,
}: {
  titel: string;
  mitglieder: TeamMitglied[];
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  modus?: KennzahlenModus;
  zeitraum?: Zeitraum;
}) {
  return (
    <Card>
      <h3 className="mb-sm font-slab text-2xl font-bold text-anthrazit">{titel}</h3>
      <div className="flex flex-col">
        {mitglieder.map((mitglied) => (
          <KennzahlenZeile
            key={mitglied.name}
            mitglied={mitglied}
            kennzahlen={kennzahlen?.[mitglied.name]}
            modus={modus}
            zeitraum={zeitraum}
          />
        ))}
      </div>
    </Card>
  );
}

// Eine Zeile der Vertriebs-Vergleichstabelle (siehe VertriebTabelle unten) — gleiches
// Aufklapp-Prinzip wie KennzahlenZeile oben (Klick auf den Namen lädt/zeigt die Objektliste),
// aber als echte <tr>/<td>-Struktur statt gestapelter Metrik-Chips, damit alle Mitarbeiter
// untereinander direkt vergleichbar sind (Oktober 2026 Chat-Vorgabe: "ich hätte gerne alle
// Mitarbeiter auf einen Blick zu sehen"). Die aufgeklappte Objektliste braucht dafür eine ZWEITE
// <tr> mit vollem colSpan, eine <tr> kann selbst kein Block-Element mit eigenem Innenleben sein.
function VertriebZeile({
  mitglied,
  kennzahlen,
}: {
  mitglied: TeamMitglied;
  kennzahlen?: MitarbeiterKennzahlen;
}) {
  const [offen, setOffen] = useState(false);
  const [wurdeGeoeffnet, setWurdeGeoeffnet] = useState(false);
  const k = kennzahlen ?? LEERE_KENNZAHLEN;

  function umschalten() {
    setOffen((bisher) => !bisher);
    setWurdeGeoeffnet(true);
  }

  return (
    <>
      <tr className="border-b border-anthrazit/10">
        <td className="py-sm pr-md">
          <button
            type="button"
            onClick={umschalten}
            aria-expanded={offen}
            aria-label={`Objektliste von ${mitglied.name} ${offen ? "einklappen" : "ausklappen"}`}
            className="flex items-center gap-xs text-left"
          >
            <Icon
              name="chevronRight"
              size={16}
              className={`shrink-0 text-anthrazit/40 transition-transform ${offen ? "rotate-90" : ""}`}
            />
            <span className="truncate text-lg font-medium text-anthrazit">{mitglied.name}</span>
          </button>
        </td>
        <td className="px-md py-sm text-right font-mono text-body text-anthrazit">
          {formatProTag(k.telefonate30Tage)}
        </td>
        <td className="px-md py-sm text-right font-mono text-body text-anthrazit">
          {formatProTag(k.termine30Tage)}
        </td>
        <td className="px-md py-sm text-right font-mono text-body text-anthrazit">
          {formatWert(k.objekteInAufarbeitung)}
        </td>
        <td className="px-md py-sm text-right font-mono text-body text-anthrazit">
          {formatWert(k.aktiveObjekte)}
        </td>
        <td className="py-sm pl-md text-right font-mono text-body text-anthrazit">
          {formatWert(k.verkaufteObjekteJahr)}
        </td>
      </tr>
      {wurdeGeoeffnet && (
        <tr className={offen ? "" : "hidden"}>
          <td colSpan={6} className="border-b border-anthrazit/10 pb-sm pl-md">
            <MitarbeiterObjekte name={mitglied.name} />
          </td>
        </tr>
      )}
    </>
  );
}

// Vertrieb als echte Vergleichstabelle statt der gestapelten Metrik-Zeilen der übrigen drei
// Reiter (siehe MitarbeiterTabelle oben) — Oktober 2026 Chat-Vorgabe, bewusst nur für Vertrieb:
// "ich hätte gerne alle Mitarbeiter auf einen Blick zu sehen, zumindest die
// Vertriebsmitarbeiter". Fünf feste Spalten statt des 30-Tage-/Jahr-Umschalters der übrigen
// Reiter — jede Spalte hat hier ihre eigene, bewusst gewählte feste Bezugsgröße (Telefonate/
// Termine als Pro-Tag-Rate über die letzten 30 Tage, Aufarbeitung/Aktive Immobilien als
// Snapshot, Verkäufe fürs laufende Kalenderjahr), ein zusätzlicher Umschalter wäre hier nur
// verwirrend.
function VertriebTabelle({
  mitglieder,
  kennzahlen,
}: {
  mitglieder: TeamMitglied[];
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
}) {
  return (
    <Card>
      <h3 className="mb-sm font-slab text-2xl font-bold text-anthrazit">Vertrieb</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b-2 border-anthrazit/15 text-left">
              <th className="label pb-xs pr-md font-normal text-anthrazit/50">Mitarbeiter</th>
              <th className="label pb-xs px-md text-right font-normal text-anthrazit/50">
                Telefonate/Tag
              </th>
              <th className="label pb-xs px-md text-right font-normal text-anthrazit/50">
                Termine/Tag
              </th>
              <th className="label pb-xs px-md text-right font-normal text-anthrazit/50">
                Aufarbeitung
              </th>
              <th className="label pb-xs px-md text-right font-normal text-anthrazit/50">
                Aktive Immobilien
              </th>
              <th className="label pb-xs pl-md text-right font-normal text-anthrazit/50">
                Verkäufe
              </th>
            </tr>
          </thead>
          <tbody>
            {mitglieder.map((mitglied) => (
              <VertriebZeile
                key={mitglied.name}
                mitglied={mitglied}
                kennzahlen={kennzahlen?.[mitglied.name]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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
    <div className="mb-sm flex flex-wrap gap-xs border-b border-anthrazit/10">
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

// Umschalter zwischen "30 Tage" und "Jahr" für Vertrieb/Akquise/Setting (August 2026
// Chat-Vorgabe: "die Option einbauen dass man von 30T zu Jahr wechseln kann damit die Tabelle
// etwas schlanker ist") — EIN gemeinsamer Umschalter statt je einem pro Tabelle, da ohnehin immer
// nur eine der drei Tabellen gleichzeitig sichtbar ist.
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
    <div className="mb-md inline-flex rounded-md border-2 border-asche bg-reinweiss p-[3px]">
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
// ausdrücklichen Nutzerwunsch), aufgeteilt in vier Reiter. Vertrieb zeigt die neue
// Vergleichstabelle (siehe VertriebTabelle oben), Setting/Weitere Mitarbeiter weiterhin dieselben
// gestapelten Auslastungs-Kennzahlen, Akquise die drei Akquise-Terminarten (siehe
// baueMetriken/KennzahlenZeile, modus="akquise").
export function MitarbeiterBereich({
  kennzahlen,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
}) {
  const { vertrieb, akquise, setting, weitere } = teileTeamAuf();
  const [mitarbeiterReiter, setMitarbeiterReiter] = useState<MitarbeiterReiter>("vertrieb");
  const [zeitraum, setZeitraum] = useState<Zeitraum>("Jahr");

  return (
    <div>
      <p className="mb-md max-w-[65ch] text-body text-anthrazit/60">
        Auslastung des Teams als Entscheidungsgrundlage dafür, wer ein Objekt nach der Akquise
        übernimmt.
      </p>
      <MitarbeiterReiterleiste aktiv={mitarbeiterReiter} onSelect={setMitarbeiterReiter} />
      {mitarbeiterReiter === "akquise" || mitarbeiterReiter === "setting" ? (
        <ZeitraumSchalter aktiv={zeitraum} onSelect={setZeitraum} />
      ) : null}
      {mitarbeiterReiter === "vertrieb" && (
        <VertriebTabelle mitglieder={vertrieb} kennzahlen={kennzahlen} />
      )}
      {mitarbeiterReiter === "akquise" && (
        <MitarbeiterTabelle
          titel="Akquise"
          mitglieder={akquise}
          kennzahlen={kennzahlen}
          modus="akquise"
          zeitraum={zeitraum}
        />
      )}
      {mitarbeiterReiter === "setting" && (
        <MitarbeiterTabelle titel="Setting" mitglieder={setting} kennzahlen={kennzahlen} zeitraum={zeitraum} />
      )}
      {mitarbeiterReiter === "weitere" && (
        <MitarbeiterTabelle titel="Weitere Mitarbeiter" mitglieder={weitere} kennzahlen={kennzahlen} />
      )}
    </div>
  );
}
