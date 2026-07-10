"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/layout/SectionShell";
import { TEAM } from "@/data/unternehmen";
import { Icon } from "@/components/icons/Icon";
import { formatiereBetrag } from "@/lib/berechnung";
import { MitarbeiterKennzahlen, MitarbeiterObjekt, ObjektGesamtKennzahlen, TeamMitglied } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Unternehmen.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Spaltenbreiten je Objektzeile innerhalb einer aufgeklappten Gruppe (siehe ObjektGruppe unten)
// — von links nach rechts genau die vier Chat-Vorgabe-Inhalte: Titelbild, Objektnummer, Preis,
// Vermarktungsdauer.
const OBJEKT_GRID_COLS = "grid-cols-[48px_minmax(0,1fr)_110px_110px]";

// Feste Spaltenbreiten (siehe Objektdaten.tsx/InteressentZeile für dasselbe Muster) statt
// justify-between, damit Kopf- und Datenzeilen unabhängig von ihrem jeweiligen Inhalt exakt
// bündig bleiben. Die Namensspalte bekommt den meisten Platz (1.2fr); Termine/Besichtigungen
// bekommen je Zeitraum (30 Tage, Jahr) eine EIGENE Spalte statt einer zusammengefassten
// "81 / 456"-Darstellung (siehe Chat-Vorgabe) — dadurch acht Spalten statt vorher sechs. Die
// erste, schmale Spalte (28px) ist neu und nimmt den Auf-/Zuklapp-Button auf (siehe Chat-Vorgabe:
// Dropdown je Mitarbeiter mit der Objektliste).
const KENNZAHLEN_GRID_COLS =
  "grid-cols-[28px_minmax(0,1.2fr)_110px_110px_90px_90px_100px_100px_100px]";

function formatWert(n: number | null): string {
  return n === null ? "–" : zahlenformat.format(n);
}

function formatTage(n: number | null): string {
  return n === null ? "–" : `${zahlenformat.format(n)} Tage`;
}

function formatBetrag(n: number | null): string {
  return n === null ? "–" : formatiereBetrag(n);
}

// Namen der Vertriebs-Mitarbeiter (Chat-Vorgabe: "1. Liste Vertrieb. hier Vanessa, Jacqueline,
// Kira, Dawid, Axel, Stanimira") — alle übrigen TEAM-Mitglieder (data/unternehmen.ts) landen in
// der zweiten Liste (siehe teileTeamAuf unten). Exakte Schreibweise wie in TEAM ("Dawid Parma",
// nicht "David Parma", siehe Kommentar dort).
const VERTRIEB_NAMEN = [
  "Vanessa Krifft",
  "Jacqueline Henot",
  "Kira Woldt",
  "Dawid Parma",
  "Axel Wehmeier",
  "Stanimira Georgieva",
];

// Teilt TEAM in die beiden Chat-Vorgabe-Listen auf, jeweils in der bestehenden TEAM-Reihenfolge
// (data/unternehmen.ts) statt der Nennreihenfolge aus dem Chat — konsistent mit der übrigen,
// unveränderten Mitarbeiterreihenfolge.
function teileTeamAuf(): { vertrieb: TeamMitglied[]; weitere: TeamMitglied[] } {
  const vertrieb = TEAM.filter((m) => VERTRIEB_NAMEN.includes(m.name));
  const weitere = TEAM.filter((m) => !VERTRIEB_NAMEN.includes(m.name));
  return { vertrieb, weitere };
}

// Vier Infoboxen mit unternehmensweiten Summen über der Mitarbeitertabelle (Chat-Vorgabe: "Häuser
// in Aufarbeitung gesamt, Aktive Vermarktung gesamt, durchschnittliche Vermarktungsdauer gesamt,
// Objektvolumen gesamt") — Aufbau nach dem bestehenden Kennzahlen-Karten-Muster aus
// Unternehmen.tsx (Card + zentrierte Icon/Wert/Label-Spalte), damit die Admin-Seite optisch zum
// Rest der Anwendung passt, statt ein neues Kartenmuster einzuführen.
function Infoboxen({ gesamt }: { gesamt?: ObjektGesamtKennzahlen }) {
  const eintraege = [
    { label: "In Aufarbeitung gesamt", wert: formatWert(gesamt?.aufarbeitungGesamt ?? null), icon: "building" as const },
    { label: "Aktive Vermarktung gesamt", wert: formatWert(gesamt?.aktivGesamt ?? null), icon: "house" as const },
    { label: "Ø Vermarktungsdauer", wert: formatTage(gesamt?.durchschnittVermarktungsdauerTage ?? null), icon: "clock" as const },
    { label: "Objektvolumen gesamt", wert: formatBetrag(gesamt?.objektvolumenGesamt ?? null), icon: "calculator" as const },
  ];

  return (
    <div className="mb-lg grid grid-cols-2 gap-sm md:grid-cols-4">
      {eintraege.map((eintrag) => (
        <Card key={eintrag.label} className="text-center">
          <Icon name={eintrag.icon} size={28} className="mx-auto mb-xs text-walnuss" />
          <p className="font-slab text-3xl font-bold text-walnuss">{eintrag.wert}</p>
          <p className="label mt-xs">{eintrag.label}</p>
        </Card>
      ))}
    </div>
  );
}

function KennzahlenKopfzeile() {
  return (
    <div
      className={`grid ${KENNZAHLEN_GRID_COLS} items-end gap-xs border-b border-anthrazit/10 pb-xs`}
    >
      <span aria-hidden="true" />
      <span className="label">Mitarbeiter</span>
      <span className="label text-left">Aktive Objekte</span>
      <span className="label text-left">Aufarbeitung</span>
      <span className="label text-left">Termine 30T</span>
      <span className="label text-left">Termine Jahr</span>
      <span className="label text-left">Besicht. 30T</span>
      <span className="label text-left">Besicht. Jahr</span>
      <span className="label text-left">Kunden aktiv</span>
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
  | { status: "geladen"; aktiv: MitarbeiterObjekt[]; aufarbeitung: MitarbeiterObjekt[] };

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
      .then((daten: { aktiv: MitarbeiterObjekt[]; aufarbeitung: MitarbeiterObjekt[] }) => {
        if (!abgebrochen) {
          setZustand({ status: "geladen", aktiv: daten.aktiv, aufarbeitung: daten.aufarbeitung });
        }
      })
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
      <ObjektGruppe titel="In Aufarbeitung" objekte={zustand.aufarbeitung} />
      <ObjektGruppe titel="Aktive Vermarktung" objekte={zustand.aktiv} />
    </div>
  );
}

function KennzahlenZeile({
  mitglied,
  kennzahlen,
}: {
  mitglied: TeamMitglied;
  kennzahlen?: MitarbeiterKennzahlen;
}) {
  const [offen, setOffen] = useState(false);
  const [wurdeGeoeffnet, setWurdeGeoeffnet] = useState(false);

  const k = kennzahlen ?? {
    aktiveObjekte: null,
    objekteInAufarbeitung: null,
    termine30Tage: null,
    termineJahr: null,
    besichtigungen30Tage: null,
    besichtigungenJahr: null,
    kundenAktiv: null,
  };

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
      </div>
      {wurdeGeoeffnet && (
        <div className={`border-t border-anthrazit/5 pl-8 ${offen ? "block" : "hidden"}`}>
          <MitarbeiterObjekte name={mitglied.name} />
        </div>
      )}
    </div>
  );
}

// Eine der beiden Chat-Vorgabe-Listen ("Vertrieb" / "Weitere Mitarbeiter", siehe teileTeamAuf
// oben) als eigene Karte mit eigener Kopfzeile — dieselbe Tabellenstruktur wie vorher, nur pro
// Liste einzeln gerendert statt einmal für das gesamte TEAM zusammen.
function MitarbeiterTabelle({
  titel,
  mitglieder,
  kennzahlen,
}: {
  titel: string;
  mitglieder: TeamMitglied[];
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
}) {
  return (
    <Card>
      <h3 className="mb-sm font-slab text-lg font-bold text-anthrazit">{titel}</h3>
      <div className="overflow-x-auto">
        <div className="flex min-w-[1010px] flex-col">
          <KennzahlenKopfzeile />
          {mitglieder.map((mitglied) => (
            <KennzahlenZeile
              key={mitglied.name}
              mitglied={mitglied}
              kennzahlen={kennzahlen?.[mitglied.name]}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

// Grundgerüst der Mitarbeiterstatistik: Zeigt die bestehende TEAM-Liste (data/unternehmen.ts,
// NICHT alle Live-OnOffice-Nutzer — auf ausdrücklichen Nutzerwunsch, siehe Chat), aufgeteilt in
// zwei Listen ("Vertrieb" und "Weitere Mitarbeiter", siehe teileTeamAuf/VERTRIEB_NAMEN oben,
// Chat-Vorgabe), jeweils mit den fünf vereinbarten Auslastungs-Kennzahlen. Darüber vier
// unternehmensweite Infoboxen (siehe Infoboxen oben, Chat-Vorgabe). Die Kennzahlen selbst werden
// erst in den nächsten Schritten einzeln aus OnOffice geladen (siehe MitarbeiterKennzahlen in
// types/index.ts) — bis dahin zeigt jede Zelle bewusst "–" statt einer erfundenen Zahl
// (kennzahlen-Prop optional, fehlt hier vollständig). Die übergebende Seite (app/admin/page.tsx)
// reicht die Kennzahlen später als Map "Name → MitarbeiterKennzahlen" durch.
//
// Client-Komponente (siehe Chat-Vorgabe: Auf-/Zuklapp-Button je Mitarbeiter mit Objektliste) —
// jede Zeile lädt ihre Objektliste erst bei Bedarf nach, siehe MitarbeiterObjekte oben.
export function Mitarbeiterstatistik({
  kennzahlen,
  gesamtKennzahlen,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  gesamtKennzahlen?: ObjektGesamtKennzahlen;
}) {
  const { vertrieb, weitere } = teileTeamAuf();

  return (
    <>
      <Infoboxen gesamt={gesamtKennzahlen} />
      <div className="flex flex-col gap-lg">
        <MitarbeiterTabelle titel="Vertrieb" mitglieder={vertrieb} kennzahlen={kennzahlen} />
        <MitarbeiterTabelle titel="Weitere Mitarbeiter" mitglieder={weitere} kennzahlen={kennzahlen} />
      </div>
    </>
  );
}
