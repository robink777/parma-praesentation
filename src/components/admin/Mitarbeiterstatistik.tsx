"use client";

import { useEffect, useState } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { Kontrolle } from "./Kontrolle";
import { AKQUISE_NAMEN, SETTING_NAMEN, TEAM, VERTRIEB_NAMEN } from "@/data/unternehmen";
import { Icon } from "@/components/icons/Icon";
import { formatiereBetrag } from "@/lib/berechnung";
import {
  KontrollObjekt,
  MitarbeiterKennzahlen,
  MitarbeiterObjekt,
  ObjektGesamtKennzahlen,
  TeamMitglied,
} from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Unternehmen.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Spaltenbreiten je Objektzeile innerhalb einer aufgeklappten Gruppe (siehe ObjektGruppe unten)
// — von links nach rechts: Titelbild, Objektnummer, Preis, Vermarktungsdauer, Provisionsvorlauf
// (fünfte Spalte, Juli 2026 Chat-Vorgabe: "bitte pro Objekt und einmal gesamt" — etwas breiter als
// die übrigen Zahlenspalten, da hier bei fehlenden OnOffice-Werten zusätzlich ein Hinweis-Icon
// samt Text erscheint, siehe ObjektZeile).
const OBJEKT_GRID_COLS = "grid-cols-[48px_minmax(0,1fr)_110px_110px_160px]";

// Feste Spaltenbreiten (siehe Objektdaten.tsx/InteressentZeile für dasselbe Muster) statt
// justify-between, damit Kopf- und Datenzeilen unabhängig von ihrem jeweiligen Inhalt exakt
// bündig bleiben. Die Namensspalte bekommt den meisten Platz (1.2fr); Termine/Besichtigungen
// bekommen je Zeitraum (30 Tage, Jahr) eine EIGENE Spalte statt einer zusammengefassten
// "81 / 456"-Darstellung (siehe Chat-Vorgabe) — dadurch acht Spalten statt vorher sechs. Die
// erste, schmale Spalte (28px) ist neu und nimmt den Auf-/Zuklapp-Button auf (siehe Chat-Vorgabe:
// Dropdown je Mitarbeiter mit der Objektliste). Letzte Spalte (100px, Juli 2026 Chat-Vorgabe:
// "die Zahl der verkauften Objekte pro Mitarbeiter in diesem Jahr") für "Verkauft {Jahr}".
const KENNZAHLEN_GRID_COLS =
  "grid-cols-[28px_minmax(0,1.2fr)_110px_110px_90px_90px_100px_100px_100px_100px]";

function formatWert(n: number | null): string {
  return n === null ? "–" : zahlenformat.format(n);
}

function formatTage(n: number | null): string {
  return n === null ? "–" : `${zahlenformat.format(n)} Tage`;
}

function formatBetrag(n: number | null): string {
  return n === null ? "–" : formatiereBetrag(n);
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
      <Icon name="warning" size={13} />
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

// Vier Infoboxen mit unternehmensweiten Summen über der Mitarbeitertabelle (Chat-Vorgabe: "Häuser
// in Aufarbeitung gesamt, Aktive Vermarktung gesamt, durchschnittliche Vermarktungsdauer gesamt,
// Objektvolumen gesamt") — Aufbau nach dem bestehenden Kennzahlen-Karten-Muster aus
// Unternehmen.tsx (Card + zentrierte Icon/Wert/Label-Spalte), damit die Admin-Seite optisch zum
// Rest der Anwendung passt, statt ein neues Kartenmuster einzuführen.
function Infoboxen({ gesamt }: { gesamt?: ObjektGesamtKennzahlen }) {
  const fehltAnzahl = gesamt?.provisionsvorlaufFehltAnzahl ?? 0;
  const jahr = aktuellesJahr();
  const verkauftFehltAnzahl = gesamt?.provisionsvolumenVerkauftJahrFehltAnzahl ?? 0;

  const eintraege = [
    { label: "In Aufarbeitung gesamt", wert: formatWert(gesamt?.aufarbeitungGesamt ?? null), icon: "building" as const },
    { label: "Aktive Vermarktung gesamt", wert: formatWert(gesamt?.aktivGesamt ?? null), icon: "house" as const },
    { label: "Ø Vermarktungsdauer", wert: formatTage(gesamt?.durchschnittVermarktungsdauerTage ?? null), icon: "clock" as const },
    { label: "Objektvolumen gesamt", wert: formatBetrag(gesamt?.objektvolumenGesamt ?? null), icon: "calculator" as const },
  ];

  // Neuer Block "Verkaufte Objekte {Jahr} / Provisionsvolumen {Jahr} / Gesamtvolumen {Jahr}" (Juli
  // 2026 Chat-Vorgabe: "Zeige oben in der Gesamtstatistik bitte einen weiteren Block an") — bewusst
  // OBEN, als eigene Reihe vor den bestehenden vier Boxen, da diese drei Kennzahlen (anders als die
  // Snapshot-Werte darunter) das laufende Kalenderjahr betreffen und dadurch inhaltlich
  // zusammengehören. Jahreszahl über aktuellesJahr() (siehe unten) dynamisch, analog zur
  // Spaltenüberschrift-Logik, die zuvor "Verkauft {Jahr}" beschriftete (jetzt ohne Jahr, da die
  // Jahresangabe hier oben zentral steht statt an jeder einzelnen Stelle wiederholt zu werden).
  const jahresEintraege = [
    {
      label: `Verkaufte Objekte ${jahr}`,
      wert: formatWert(gesamt?.verkaufteObjekteJahrGesamt ?? null),
      icon: "check" as const,
    },
    {
      label: `Provisionsvolumen ${jahr}`,
      wert: formatBetrag(gesamt?.provisionsvolumenVerkauftJahr ?? null),
      icon: "handshake" as const,
      hinweisAnzahl: verkauftFehltAnzahl,
    },
    {
      label: `Gesamtvolumen ${jahr}`,
      wert: formatBetrag(gesamt?.objektvolumenVerkauftJahr ?? null),
      icon: "calculator" as const,
    },
  ];

  // Provisionsvorlauf gesamt (Juli 2026 Chat-Vorgabe) bekommt eine eigene Reihe unter den vier
  // übrigen Infoboxen, in der Breite auf die vier Boxen darüber angeglichen (Nutzerwunsch) statt
  // als fünfte, schmalere Box im selben Grid — dadurch bleibt Platz für die Hinweiszeile, wenn
  // nicht alle Objekte einen auswertbaren Wert liefern.
  return (
    <div className="mb-lg">
      <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
        {jahresEintraege.map((eintrag) => (
          <Card key={eintrag.label} className="text-center">
            <Icon name={eintrag.icon} size={28} className="mx-auto mb-xs text-walnuss" />
            <p className="font-slab text-3xl font-bold text-walnuss">{eintrag.wert}</p>
            <p className="label mt-xs">{eintrag.label}</p>
            {"hinweisAnzahl" in eintrag && (eintrag.hinweisAnzahl ?? 0) > 0 && (
              <p className="mt-xs flex items-center justify-center gap-[3px] text-anthrazit/50">
                <Icon name="warning" size={12} />
                <span className="text-small italic">
                  {zahlenformat.format(eintrag.hinweisAnzahl ?? 0)} Objekte ohne Angabe
                </span>
              </p>
            )}
          </Card>
        ))}
      </div>
      <div className="mt-sm grid grid-cols-2 gap-sm md:grid-cols-4">
        {eintraege.map((eintrag) => (
          <Card key={eintrag.label} className="text-center">
            <Icon name={eintrag.icon} size={28} className="mx-auto mb-xs text-walnuss" />
            <p className="font-slab text-3xl font-bold text-walnuss">{eintrag.wert}</p>
            <p className="label mt-xs">{eintrag.label}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-sm text-center">
        <Icon name="handshake" size={28} className="mx-auto mb-xs text-walnuss" />
        <p className="font-slab text-3xl font-bold text-walnuss">
          {formatBetrag(gesamt?.provisionsvorlaufGesamt ?? null)}
        </p>
        <p className="label mt-xs">Provisionsvorlauf gesamt</p>
        {fehltAnzahl > 0 && (
          <p className="mt-xs flex items-center justify-center gap-[3px] text-anthrazit/50">
            <Icon name="warning" size={12} />
            <span className="text-small italic">
              {zahlenformat.format(fehltAnzahl)} Objekte ohne Angabe
            </span>
          </p>
        )}
      </Card>
    </div>
  );
}

// Jahreszahl für die Spaltenüberschrift "Verkauft {Jahr}" — bewusst zur Laufzeit aus dem
// Systemdatum bestimmt statt hartkodiert (Chat-Vorgabe: "Schreibe die Funktion allerdings so dass
// es jedes Jahr zurück gestellt wird"), damit die Beschriftung automatisch mit der zugrunde
// liegenden Kennzahl (siehe ermittleJahresDatumsfenster in onoffice/mitarbeiterstatistik.ts)
// Schritt hält.
function aktuellesJahr(): number {
  return new Date().getFullYear();
}

// "standard" = Vertrieb/Setting/Weitere Mitarbeiter (unverändertes Spaltenschema), "akquise" =
// eigener Reiter mit anderen Kennzahlen (August 2026 Chat-Vorgabe: "Statt Termine 30T, Termine
// Jahr, Besichtigung 30T und Besicht. Jahr. Auch aktive Kunden und Verkauf kann raus ...
// stattdessen: Anzahl Akquise - Ersttermin/-Zweittermin/-Vertragstermin, jeweils 30T und Jahr").
// Beide Modi haben dieselbe SpaltenANZAHL (8 Datenspalten nach Name), KENNZAHLEN_GRID_COLS bleibt
// dadurch für beide gültig.
type KennzahlenModus = "standard" | "akquise";

function KennzahlenKopfzeile({ modus }: { modus: KennzahlenModus }) {
  return (
    <div
      className={`grid ${KENNZAHLEN_GRID_COLS} items-end gap-xs border-b border-anthrazit/10 pb-xs`}
    >
      <span aria-hidden="true" />
      <span className="label">Mitarbeiter</span>
      <span className="label text-left">Aktive Objekte</span>
      <span className="label text-left">Aufarbeitung</span>
      {modus === "akquise" ? (
        <>
          <span className="label text-left">Erst 30T</span>
          <span className="label text-left">Erst Jahr</span>
          <span className="label text-left">Zweit 30T</span>
          <span className="label text-left">Zweit Jahr</span>
          <span className="label text-left">Vertrag 30T</span>
          <span className="label text-left">Vertrag Jahr</span>
        </>
      ) : (
        <>
          <span className="label text-left">Termine 30T</span>
          <span className="label text-left">Termine Jahr</span>
          <span className="label text-left">Besicht. 30T</span>
          <span className="label text-left">Besicht. Jahr</span>
          <span className="label text-left">Kunden aktiv</span>
          <span className="label text-left">Verkauft</span>
        </>
      )}
    </div>
  );
}

// Eine Objektzeile innerhalb einer aufgeklappten Gruppe (siehe ObjektGruppe unten) — von links
// nach rechts: Titelbild, Objektnummer, Preis, Vermarktungsdauer (Chat-Vorgabe).
function ObjektZeile({ objekt }: { objekt: MitarbeiterObjekt }) {
  return (
    <div
      className={`grid ${OBJEKT_GRID_COLS} items-center gap-sm border-b border-anthrazit/5 py-xs last:border-b-0`}
    >
      <div className="h-9 w-12 shrink-0 overflow-hidden rounded bg-stein">
        {objekt.titelbildUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- externe OnOffice-Bild-URL, kein lokaler Import möglich
          <img
            src={objekt.titelbildUrl}
            alt={objekt.titel}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <span className="min-w-0 truncate font-mono text-sm text-anthrazit">{objekt.objektnr}</span>
      <span className="text-left font-mono text-sm text-anthrazit">
        {formatiereBetrag(objekt.preis)}
      </span>
      <span className="text-left font-mono text-sm text-anthrazit">
        {objekt.vermarktungsdauerTage === null
          ? "–"
          : `${zahlenformat.format(objekt.vermarktungsdauerTage)} Tage`}
      </span>
      <span className="text-left font-mono text-sm text-anthrazit">
        {objekt.provisionsvorlaufFehlt ? (
          <DatenFehltHinweis titel="Außen-/Innen-Provision" />
        ) : objekt.provisionsvorlauf === null ? (
          // Vermietungsobjekte (siehe mapMitarbeiterVermietung in onoffice/estate.ts): kein
          // Hinweis-Icon, da hier grundsätzlich kein Provisionsvorlauf erwartet wird (anders als
          // bei Kaufobjekten mit fehlenden OnOffice-Werten, siehe provisionsvorlaufFehlt oben).
          "–"
        ) : (
          formatiereBetrag(objekt.provisionsvorlauf)
        )}
      </span>
    </div>
  );
}

// Eine Gruppe innerhalb der aufgeklappten Objektliste (siehe MitarbeiterObjekte darunter) —
// getrennt nach "in Aufarbeitung" und "aktive Vermarktung" (Chat-Vorgabe), jeweils mit derselben
// Filterlogik wie die zugehörige Kennzahlen-Spalte (zaehleObjekteInAufarbeitung/
// zaehleAktiveObjekte in onoffice/estate.ts). Eigenes, zweites Auf-/Zuklapp-Level (Chat-Vorgabe:
// "ein weiteres Dropdown für diese beiden Punkte, damit sie untereinander dargestellt werden
// können") — beide Gruppen liegen dadurch übereinander statt nebeneinander, unabhängig
// voneinander auf-/zuklappbar. Kein zusätzlicher Abruf beim Auf-/Zuklappen: Die Daten beider
// Gruppen sind bereits geladen (siehe MitarbeiterObjekte), nur die Anzeige wird umgeschaltet.
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
          size={14}
          className={`shrink-0 text-anthrazit/40 transition-transform ${offen ? "rotate-90" : ""}`}
        />
        <span className="label text-anthrazit/60">
          {titel} ({objekte.length})
        </span>
      </button>
      {offen &&
        (objekte.length === 0 ? (
          <p className="py-xs pl-5 text-small text-anthrazit/40">Keine Objekte</p>
        ) : (
          <div className="pl-5">
            <div
              className={`grid ${OBJEKT_GRID_COLS} gap-sm border-b border-anthrazit/5 pb-[2px]`}
            >
              <span aria-hidden="true" />
              <span className="label text-left">Objekt</span>
              <span className="label text-left">Preis</span>
              <span className="label text-left">Vermarktung</span>
              <span className="label text-left">Provisionsvorlauf</span>
            </div>
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
      // Vermietungsobjekte (vermarktungsart=miete, Juli 2026 Chat-Vorgabe) — bewusst EINE
      // gemeinsame Liste statt zweier nach Status getrennter Listen wie bei Kaufobjekten (aktiv/
      // aufarbeitung), da der Nutzer nur EINEN zusätzlichen Dropdown wollte.
      vermietung: MitarbeiterObjekt[];
      // Verkaufte Objekte im aktuellen Kalenderjahr (Juli 2026 Chat-Vorgabe: "ich sehe immer noch
      // keine Verkauften Objekte! Bitte auch noch ausführen") — die reine Zahl in der Tabelle
      // reichte nicht, hier die einzelnen Objekte für die vierte Dropdown-Gruppe.
      verkauft: MitarbeiterObjekt[];
    };

// Lädt die Objektliste EINES Mitarbeiters erst beim ersten Aufklappen (siehe Chat-Vorgabe: kein
// zusätzlicher Abruf für alle ~20 Mitarbeiter beim initialen Seitenaufruf, siehe auch
// api/admin/mitarbeiter-objekte/route.ts). Wird von KennzahlenZeile nur gemountet, solange
// "wurdeGeoeffnet" true ist — danach bleibt sie gemountet (kein erneuter Abruf beim
// Wiederaufklappen), nur die Sichtbarkeit der ganzen Zeile wird umgeschaltet.
function MitarbeiterObjekte({ name }: { name: string }) {
  const [zustand, setZustand] = useState<ObjektlisteZustand>({ status: "lädt" });
  // Erhöht sich bei Klick auf "Erneut versuchen" (siehe Fehler-Zweig unten) — steht im
  // Dependency-Array des useEffect darunter, damit ein Klick den Abruf gezielt wiederholt, ohne
  // dass die ganze Zeile neu auf-/zugeklappt werden muss (siehe Chat-Vorgabe: nach einem
  // fehlgeschlagenen Laden soll ein erneuter Versuch möglich sein).
  const [versuch, setVersuch] = useState(0);

  useEffect(() => {
    let abgebrochen = false;
    // Bei einem Retry (versuch > 0) erst wieder auf "lädt" zurücksetzen, sonst bliebe der
    // Fehler-Zustand bis zum Abschluss des neuen Abrufs sichtbar stehen.
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
    return <p className="py-sm text-small text-anthrazit/40">Objektliste wird geladen …</p>;
  }
  if (zustand.status === "fehler") {
    return (
      <div className="flex items-center gap-sm py-sm">
        <p className="text-small text-anthrazit/40">Objektliste konnte nicht geladen werden.</p>
        <button
          type="button"
          onClick={() => setVersuch((bisher) => bisher + 1)}
          className="text-small text-anthrazit/60 underline underline-offset-4 hover:text-anthrazit"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col py-sm">
      {/* Reihenfolge laut Chat-Vorgabe: "Vermietung" als erster Punkt, vor "In Aufarbeitung" und
          "Aktive Vermarktung". "Verkauft {Jahr}" (Juli 2026 Chat-Vorgabe: "ich sehe immer noch
          keine Verkauften Objekte! Bitte auch noch ausführen") kommt als vierte Gruppe dazu — der
          Nutzer hat für diese Gruppe keine bestimmte Position verlangt, daher ans Ende. */}
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
};

function KennzahlenZeile({
  mitglied,
  kennzahlen,
  modus,
}: {
  mitglied: TeamMitglied;
  kennzahlen?: MitarbeiterKennzahlen;
  modus: KennzahlenModus;
}) {
  const [offen, setOffen] = useState(false);
  const [wurdeGeoeffnet, setWurdeGeoeffnet] = useState(false);

  const k = kennzahlen ?? LEERE_KENNZAHLEN;

  function umschalten() {
    setOffen((bisher) => !bisher);
    setWurdeGeoeffnet(true);
  }

  return (
    <div className="border-b border-anthrazit/10 last:border-b-0">
      <div className={`grid ${KENNZAHLEN_GRID_COLS} items-center gap-xs py-sm`}>
        <button
          type="button"
          onClick={umschalten}
          aria-expanded={offen}
          aria-label={`Objektliste von ${mitglied.name} ${offen ? "einklappen" : "ausklappen"}`}
          className="flex h-6 w-6 items-center justify-center text-anthrazit/40 transition-colors hover:text-anthrazit"
        >
          <Icon
            name="chevronRight"
            size={16}
            className={`transition-transform ${offen ? "rotate-90" : ""}`}
          />
        </button>
        {/* Nur der Name, keine Rolle/Titel mehr (siehe Chat-Vorgabe) */}
        <p className="min-w-0 truncate font-medium text-anthrazit">{mitglied.name}</p>
        <span className="text-left font-mono text-sm text-anthrazit">
          {formatWert(k.aktiveObjekte)}
        </span>
        <span className="text-left font-mono text-sm text-anthrazit">
          {formatWert(k.objekteInAufarbeitung)}
        </span>
        {modus === "akquise" ? (
          <>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.akquiseErsttermin30Tage)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.akquiseErsttermineJahr)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.akquiseZweittermin30Tage)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.akquiseZweittermineJahr)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.akquiseVertragstermin30Tage)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.akquiseVertragstermineJahr)}
            </span>
          </>
        ) : (
          <>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.termine30Tage)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.termineJahr)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.besichtigungen30Tage)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.besichtigungenJahr)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.kundenAktiv)}
            </span>
            <span className="text-left font-mono text-sm text-anthrazit">
              {formatWert(k.verkaufteObjekteJahr)}
            </span>
          </>
        )}
      </div>
      {wurdeGeoeffnet && (
        <div className={`border-t border-anthrazit/5 pl-8 ${offen ? "block" : "hidden"}`}>
          <MitarbeiterObjekte name={mitglied.name} />
        </div>
      )}
    </div>
  );
}

// Eine der vier Reiter-Listen (Vertrieb/Akquise/Setting/Weitere Mitarbeiter, siehe teileTeamAuf
// oben) als eigene Karte mit eigener Kopfzeile — dieselbe Tabellenstruktur für alle vier, nur
// "modus" schaltet zwischen dem Standard-Spaltenschema und dem Akquise-Spaltenschema um (siehe
// KennzahlenKopfzeile/KennzahlenZeile oben).
function MitarbeiterTabelle({
  titel,
  mitglieder,
  kennzahlen,
  modus = "standard",
}: {
  titel: string;
  mitglieder: TeamMitglied[];
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  modus?: KennzahlenModus;
}) {
  return (
    <Card>
      <h3 className="mb-sm font-slab text-lg font-bold text-anthrazit">{titel}</h3>
      <div className="overflow-x-auto">
        <div className="flex min-w-[1010px] flex-col">
          <KennzahlenKopfzeile modus={modus} />
          {mitglieder.map((mitglied) => (
            <KennzahlenZeile
              key={mitglied.name}
              mitglied={mitglied}
              kennzahlen={kennzahlen?.[mitglied.name]}
              modus={modus}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

// Die vier Reiter innerhalb des "Mitarbeiter"-Abschnitts (August 2026 Chat-Vorgabe: "ich brauche
// bei Mitarbeiter neben Vertrieb noch zwei weitere Reiter ... Akquise ... und Setting ... Alle
// anderen Mitarbeiter können als 'weitere Mitarbeiter' gelistet bleiben") — bewusst als
// Reiterleiste statt vier gestapelter Tabellen, damit die kleineren Gruppen (Akquise: 3, Setting:
// 2, Weitere: 1) nicht zwischen der großen Vertriebstabelle verloren gehen.
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
    <div className="mb-lg flex flex-wrap gap-xs border-b border-anthrazit/10">
      {MITARBEITER_REITER.map((reiter) => (
        <button
          key={reiter.id}
          type="button"
          onClick={() => onSelect(reiter.id)}
          className={`border-b-2 px-md py-xs text-small font-medium transition-colors ${
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

// Grundgerüst der Mitarbeiterstatistik: Zeigt die bestehende TEAM-Liste (data/unternehmen.ts,
// NICHT alle Live-OnOffice-Nutzer — auf ausdrücklichen Nutzerwunsch, siehe Chat), aufgeteilt in
// vier Reiter ("Vertrieb"/"Akquise"/"Setting"/"Weitere Mitarbeiter", siehe teileTeamAuf/
// VERTRIEB_NAMEN/AKQUISE_NAMEN/SETTING_NAMEN in data/unternehmen.ts). Vertrieb/Setting/Weitere
// Mitarbeiter zeigen dieselben fünf Auslastungs-Kennzahlen, Akquise zeigt stattdessen die drei
// Akquise-Terminarten (siehe KennzahlenKopfzeile/KennzahlenZeile, modus="akquise"). Die
// unternehmensweiten Infoboxen (siehe Infoboxen oben, Chat-Vorgabe) und die Mitarbeiter-Tabellen
// liegen in getrennten, per Sidebar wählbaren Abschnitten (ADMIN_NAV_ITEMS, siehe
// admin/adminNav.ts) statt einer einzigen langen Scroll-Seite — dieselbe Sidebar-Komponente wie
// in der Kundenpräsentation (components/layout/Sidebar.tsx), auf Chat-Vorgabe hin: "ich hätte
// gerne in der Statistik ein identisches Layout wie bei der Präsentation". Eine
// "Kontrolle"-Seite je Status (Datenqualität, siehe Chat) kommt als weiterer
// ADMIN_NAV_ITEMS-Eintrag dazu, sobald sie gebaut ist. Die Kennzahlen selbst werden erst in den
// nächsten Schritten einzeln aus OnOffice geladen (siehe MitarbeiterKennzahlen in
// types/index.ts) — bis dahin zeigt jede Zelle bewusst "–" statt einer erfundenen Zahl
// (kennzahlen-Prop optional, fehlt hier vollständig). Die übergebende Seite (app/admin/page.tsx)
// reicht die Kennzahlen später als Map "Name → MitarbeiterKennzahlen" durch.
//
// Client-Komponente (siehe Chat-Vorgabe: Auf-/Zuklapp-Button je Mitarbeiter mit Objektliste) —
// jede Zeile lädt ihre Objektliste erst bei Bedarf nach, siehe MitarbeiterObjekte oben.
export function Mitarbeiterstatistik({
  kennzahlen,
  gesamtKennzahlen,
  kontrollObjekte,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  gesamtKennzahlen?: ObjektGesamtKennzahlen;
  kontrollObjekte?: KontrollObjekt[];
}) {
  const { vertrieb, akquise, setting, weitere } = teileTeamAuf();
  const [abschnitt, setAbschnitt] = useState("uebersicht");
  const [mitarbeiterReiter, setMitarbeiterReiter] = useState<MitarbeiterReiter>("vertrieb");

  return (
    <div className="flex h-screen w-screen">
      {/* logoHref bewusst NICHT gesetzt (Default "/") — der Logo-Klick führt wie in der
          Präsentation zurück zur Startseite und verlässt damit zugleich den Admin-Bereich
          (siehe app/admin/layout.tsx, AdminSessionWaechter: meldet die Admin-Session beim
          Verlassen des Layouts automatisch ab). Ersetzt den früheren separaten
          "Zurück zur Startseite"-Link in app/admin/page.tsx. */}
      <Sidebar navItems={ADMIN_NAV_ITEMS} activeId={abschnitt} onSelect={setAbschnitt} />
      <main className="flex-1 overflow-hidden bg-reinweiss">
        {abschnitt === "uebersicht" && (
          <SectionShell label="Admin-Bereich" title="Auf einen Blick">
            <Infoboxen gesamt={gesamtKennzahlen} />
          </SectionShell>
        )}
        {abschnitt === "mitarbeiter" && (
          <SectionShell label="Admin-Bereich" title="Mitarbeiter">
            <p className="mb-lg max-w-[65ch] text-body text-anthrazit/70">
              Auslastung des Teams als Entscheidungsgrundlage dafür, wer ein Objekt nach der
              Akquise übernimmt.
            </p>
            <MitarbeiterReiterleiste aktiv={mitarbeiterReiter} onSelect={setMitarbeiterReiter} />
            {mitarbeiterReiter === "vertrieb" && (
              <MitarbeiterTabelle titel="Vertrieb" mitglieder={vertrieb} kennzahlen={kennzahlen} />
            )}
            {mitarbeiterReiter === "akquise" && (
              <MitarbeiterTabelle
                titel="Akquise"
                mitglieder={akquise}
                kennzahlen={kennzahlen}
                modus="akquise"
              />
            )}
            {mitarbeiterReiter === "setting" && (
              <MitarbeiterTabelle titel="Setting" mitglieder={setting} kennzahlen={kennzahlen} />
            )}
            {mitarbeiterReiter === "weitere" && (
              <MitarbeiterTabelle
                titel="Weitere Mitarbeiter"
                mitglieder={weitere}
                kennzahlen={kennzahlen}
              />
            )}
          </SectionShell>
        )}
        {abschnitt === "kontrolle" && (
          <SectionShell label="Admin-Bereich" title="Kontrolle">
            <Kontrolle objekte={kontrollObjekte} />
          </SectionShell>
        )}
      </main>
    </div>
  );
}
