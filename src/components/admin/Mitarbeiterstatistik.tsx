"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { AdminNav } from "./AdminNavigation";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { Kontrolle } from "./Kontrolle";
import { Leadquellen } from "./Leadquellen";
import { Objektkarte } from "./Objektkarte";
import { PlzObjekte } from "./PlzObjekte";
import { AKQUISE_NAMEN, SETTING_NAMEN, TEAM, VERTRIEB_NAMEN } from "@/data/unternehmen";
import { Icon } from "@/components/icons/Icon";
import { formatiereBetrag } from "@/lib/berechnung";
import {
  KontrollObjekt,
  LeadquellenKennzahlen,
  MitarbeiterKennzahlen,
  MitarbeiterObjekt,
  ObjektGesamtKennzahlen,
  ObjektkarteDaten,
  TeamMitglied,
} from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Unternehmen.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Oktober 2026 Chat-Vorgabe: "kontrolliere die gesamte Optik ... ganz viele Werte werden optisch
// nicht gut abgebildet. Ich hätte gerne im Gesamten mehr Freiflächen. Die Ausgabe der Daten soll
// ordentlicher aussehen" — die Tabelle lebt seit der 2/3-Karte+1/3-Panel-Aufteilung (siehe
// Mitarbeiterstatistik-Hauptkomponente unten) in einer ca. 400-480px schmalen Spalte. Die
// vorherigen starren CSS-Grid-Spalten (bis zu zehn Stück á 90-160px, siehe Git-Historie) brauchten
// dafür über 800px Mindestbreite und waren nur per Horizontal-Scroll erreichbar — in der Praxis
// sah man nur Name + eine abgeschnittene Spalte. Ersetzt durch ein umbrechendes
// Label-über-Wert-Raster (siehe Metrik/baueMetriken/KennzahlenZeile unten), das bei jeder Breite
// lesbar bleibt, keinen Horizontal-Scroll braucht und durch den Grid-Gap von selbst mehr
// Weißraum zwischen den Werten schafft. Dieselbe Idee gilt für die Objektliste je Mitarbeiter
// (siehe ObjektZeile weiter unten).

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
type KennzahlenModus = "standard" | "akquise";

// Zeitraum-Umschaltung für Vertrieb/Akquise/Setting (August 2026 Chat-Vorgabe: "die Option
// einbauen dass man von 30T zu Jahr wechseln kann damit die Tabelle etwas schlanker ist") —
// undefined = "Weitere Mitarbeiter"-Fall, zeigt weiterhin beide Zeitfenster nebeneinander.
type Zeitraum = "30T" | "Jahr";

// Jeder Wert trägt sein Label direkt bei sich, statt sich über eine separate, positionsabhängige
// Kopfzeile zu erschließen (siehe Kommentar oben bei der Datei-Einleitung) — dadurch bleibt jede
// einzelne Metrik auch dann verständlich, wenn das umgebende Raster umbricht.
function Metrik({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[84px] flex-col gap-[2px]">
      <span className="label text-anthrazit/40">{label}</span>
      <span className="font-mono text-sm text-anthrazit">{children}</span>
    </div>
  );
}

// Baut die Liste der anzuzeigenden Kennzahlen (Label + formatierter Wert) in der passenden
// Reihenfolge — dieselbe modus-/zeitraum-Verzweigung, die zuvor doppelt zwischen
// KennzahlenKopfzeile und KennzahlenZeile gepflegt werden musste (siehe Git-Historie), jetzt an
// einer einzigen Stelle.
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
    // zeitraum ist im Akquise-Reiter in der Praxis immer gesetzt (siehe Mitarbeiterstatistik
    // unten — der ZeitraumSchalter steuert alle drei Reiter außer "Weitere Mitarbeiter"); der
    // Fallback auf "Jahr" ist nur eine Absicherung gegen den optionalen Typ.
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

// Eine Objektzeile innerhalb einer aufgeklappten Gruppe (siehe ObjektGruppe unten) — Titelbild
// links, Objektnummer + die übrigen Werte (Preis, Vermarktungsdauer, Provisionsvorlauf,
// Chat-Vorgabe) als umbrechende Zeile darunter statt in starren Spalten, aus demselben Grund wie
// bei KennzahlenZeile oben (schmales 1/3-Panel).
function ObjektZeile({ objekt }: { objekt: MitarbeiterObjekt }) {
  return (
    <div className="flex items-center gap-sm border-b border-anthrazit/5 py-xs last:border-b-0">
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
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="truncate font-mono text-sm text-anthrazit">{objekt.objektnr}</span>
        <div className="flex flex-wrap gap-x-sm gap-y-[2px] text-small text-anthrazit/60">
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
              // Vermietungsobjekte (siehe mapMitarbeiterVermietung in onoffice/estate.ts): kein
              // Hinweis-Icon, da hier grundsätzlich kein Provisionsvorlauf erwartet wird (anders
              // als bei Kaufobjekten mit fehlenden OnOffice-Werten, siehe provisionsvorlaufFehlt
              // oben).
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
          size={16}
          className={`shrink-0 text-anthrazit/40 transition-transform ${offen ? "rotate-90" : ""}`}
        />
        {/* Nur der Name, keine Rolle/Titel mehr (siehe Chat-Vorgabe) */}
        <p className="min-w-0 truncate font-medium text-anthrazit">{mitglied.name}</p>
      </button>
      <div className="mt-sm flex flex-wrap gap-x-md gap-y-sm pl-6">
        {metriken.map((metrik) => (
          <Metrik key={metrik.label} label={metrik.label}>
            {metrik.wert}
          </Metrik>
        ))}
      </div>
      {wurdeGeoeffnet && (
        <div className={`mt-sm border-t border-anthrazit/5 pl-6 ${offen ? "block" : "hidden"}`}>
          <MitarbeiterObjekte name={mitglied.name} />
        </div>
      )}
    </div>
  );
}

// Eine der vier Reiter-Listen (Vertrieb/Akquise/Setting/Weitere Mitarbeiter, siehe teileTeamAuf
// oben) als eigene Karte — dieselbe Zeilenstruktur für alle vier, nur "modus" schaltet zwischen
// dem Standard- und dem Akquise-Kennzahlensatz um (siehe baueMetriken/KennzahlenZeile oben).
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
      <h3 className="mb-sm font-slab text-lg font-bold text-anthrazit">{titel}</h3>
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

// Umschalter zwischen "30 Tage" und "Jahr" für Vertrieb/Akquise/Setting (August 2026
// Chat-Vorgabe: "die Option einbauen dass man von 30T zu Jahr wechseln kann damit die Tabelle
// etwas schlanker ist") — EIN gemeinsamer Umschalter statt je einem pro Tabelle, da ohnehin immer
// nur eine der drei Tabellen gleichzeitig sichtbar ist (siehe MitarbeiterReiterleiste oben).
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
    <div className="mb-sm inline-flex rounded-md border-2 border-asche bg-reinweiss p-[2px]">
      {optionen.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`rounded-sm px-sm py-[2px] text-small font-medium transition-colors ${
            aktiv === option.id ? "bg-walnuss text-reinweiss" : "text-anthrazit/60 hover:text-anthrazit"
          }`}
        >
          {option.label}
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
// Akquise-Terminarten (siehe baueMetriken/KennzahlenZeile, modus="akquise"). Die
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
  leadquellenKennzahlen,
  objektkarteDaten,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  gesamtKennzahlen?: ObjektGesamtKennzahlen;
  kontrollObjekte?: KontrollObjekt[];
  leadquellenKennzahlen?: LeadquellenKennzahlen;
  objektkarteDaten?: ObjektkarteDaten;
}) {
  const { vertrieb, akquise, setting, weitere } = teileTeamAuf();
  const [abschnitt, setAbschnitt] = useState("uebersicht");
  const [mitarbeiterReiter, setMitarbeiterReiter] = useState<MitarbeiterReiter>("vertrieb");
  const [zeitraum, setZeitraum] = useState<Zeitraum>("Jahr");
  // Zuletzt auf der Karte angeklickte PLZ-Fläche, für den "plz"-Navi-Bereich (siehe
  // PlzObjekte.tsx) — Chat-Vorgabe Oktober 2026: "ich will dass jedes Mal wenn man in den
  // einzelnen PLZ Bereich geht, auf der rechten Seite sich zu dieser PLZ öffnet". null, solange
  // noch keine Fläche angeklickt wurde (siehe Leerzustand in PlzObjekte).
  const [gewaehltePlz, setGewaehltePlz] = useState<{ plz: string; ort: string } | null>(null);

  const handlePlzKlick = (plz: string, ort: string) => {
    setGewaehltePlz({ plz, ort });
    setAbschnitt("plz");
  };

  return (
    // Chat-Vorgabe Oktober 2026: "die Karte soll in 2/3 der Ansicht auftauchen und dann ein
    // Overlay auf dem 1/3 auf der rechten Seite. Im Overlay kann die Navi rein" — feste
    // Zwei-Spalten-Aufteilung statt der vorherigen Vollbild-Karte mit schwebendem Overlay
    // darüber: Die Karte (links, 2/3) bleibt dadurch IMMER vollständig und ungedeckt sichtbar,
    // Navigation und der jeweils gewählte Inhalt leben zusammen im rechten Drittel.
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="relative h-full w-2/3">
        <Objektkarte
          daten={objektkarteDaten}
          onPlzKlick={handlePlzKlick}
          ausgewaehltePlz={gewaehltePlz?.plz ?? null}
        />
      </div>

      <div className="flex h-full w-1/3 flex-col overflow-hidden border-l border-walnuss/10 bg-reinweiss">
        <AdminNav navItems={ADMIN_NAV_ITEMS} activeId={abschnitt} onSelect={setAbschnitt} />
        <div className="flex-1 overflow-y-auto">
          {abschnitt === "uebersicht" && (
            <SectionShell label="Admin-Bereich" title="Auf einen Blick" compact>
              <Infoboxen gesamt={gesamtKennzahlen} />
            </SectionShell>
          )}
          {abschnitt === "mitarbeiter" && (
            <SectionShell label="Admin-Bereich" title="Mitarbeiter" compact>
              <p className="mb-lg max-w-[65ch] text-body text-anthrazit/70">
                Auslastung des Teams als Entscheidungsgrundlage dafür, wer ein Objekt nach der
                Akquise übernimmt.
              </p>
              <MitarbeiterReiterleiste aktiv={mitarbeiterReiter} onSelect={setMitarbeiterReiter} />
              {/* Zeitraum-Umschalter nur für Vertrieb/Akquise/Setting (Chat-Vorgabe nennt
                  explizit nur diese drei) — "Weitere Mitarbeiter" bleibt unverändert bei beiden
                  Spalten nebeneinander. */}
              {mitarbeiterReiter !== "weitere" && (
                <ZeitraumSchalter aktiv={zeitraum} onSelect={setZeitraum} />
              )}
              {mitarbeiterReiter === "vertrieb" && (
                <MitarbeiterTabelle
                  titel="Vertrieb"
                  mitglieder={vertrieb}
                  kennzahlen={kennzahlen}
                  zeitraum={zeitraum}
                />
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
                <MitarbeiterTabelle
                  titel="Setting"
                  mitglieder={setting}
                  kennzahlen={kennzahlen}
                  zeitraum={zeitraum}
                />
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
          {abschnitt === "leadquellen" && (
            <SectionShell label="Admin-Bereich" title="Leadquellen" compact>
              <Leadquellen kennzahlen={leadquellenKennzahlen} />
            </SectionShell>
          )}
          {abschnitt === "kontrolle" && (
            <SectionShell label="Admin-Bereich" title="Kontrolle" compact>
              <Kontrolle objekte={kontrollObjekte} />
            </SectionShell>
          )}
          {abschnitt === "plz" && (
            <SectionShell
              label="Admin-Bereich"
              title={gewaehltePlz ? `${gewaehltePlz.plz} · ${gewaehltePlz.ort}` : "PLZ"}
              compact
            >
              <PlzObjekte
                plz={gewaehltePlz?.plz ?? null}
                ort={gewaehltePlz?.ort ?? null}
                daten={objektkarteDaten}
              />
            </SectionShell>
          )}
        </div>
      </div>
    </div>
  );
}
