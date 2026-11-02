"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Card } from "@/components/layout/SectionShell";
import type { AktivitaetenZeitraum } from "@/lib/onoffice/mitarbeiterstatistik";
import { MitarbeiterAktivitaet } from "@/types";

// Filterbare Aktivitätenliste eines Mitarbeiters, siehe app/admin/aktivitaeten/page.tsx. Nutzer-
// Vorgabe November 2026: "eine liste aller aktivitäten ... Ich will die Kommentar, also die
// Bemerkung sehen können damit die nicht einfach willkührlich telefonate eintragen die nicht
// stattgefunden haben". Die Filter laden per fetch nach statt über Query-Parameter: Im
// Produktions-Build übernahm der Next-Router den reinen Parameterwechsel derselben Seite nicht
// (Antwort kam an, die Ansicht blieb stehen), außerdem gibt es so eine sichtbare Ladeanzeige.
const ZEITRAEUME: { id: AktivitaetenZeitraum; label: string }[] = [
  { id: "heute", label: "Heute" },
  { id: "woche", label: "Diese Woche" },
  { id: "30t", label: "30 Tage" },
];

const TELEFONAT = "Telefonat";

// Die Liste startet bei den Telefonaten: Ein großer Teil des Maklerbuchs sind automatische
// Einträge (in einer Beispielwoche 74 von 81 Zeilen vom Typ "Deal"), zwischen denen die Anrufe
// untergehen würden. "Alle" bleibt einen Klick entfernt.
const ALLE = "alle";

// Ab dieser Differenz zwischen Datum und letzter Speicherung gilt ein Eintrag als nachträglich.
const NACHTRAEGLICH_AB_MS = 10 * 60 * 1000;

interface AktivitaetenAntwort {
  telefonate: MitarbeiterAktivitaet[];
  alle: MitarbeiterAktivitaet[] | null;
  abgeschnitten: boolean;
}

function formatiereZeitpunkt(iso: string): string {
  const [datumsteil, zeitteil] = iso.split(" ");
  const [jahr, monat, tag] = (datumsteil ?? "").split("-");
  if (!jahr || !monat || !tag) return "–";
  return `${tag}.${monat}.${jahr}${zeitteil ? `, ${zeitteil.slice(0, 5)} Uhr` : ""}`;
}

// Ohne Zeitzone geparst: Beide Werte stammen aus demselben onOffice-Format, es zählt nur ihr
// Abstand zueinander.
function alsMillisekunden(iso: string): number {
  return Date.parse(`${iso.replace(" ", "T")}Z`);
}

function wurdeNachtraeglichGespeichert(a: MitarbeiterAktivitaet): boolean {
  const abstand = alsMillisekunden(a.geaendertAm) - alsMillisekunden(a.datum);
  return abstand >= NACHTRAEGLICH_AB_MS;
}

// Ein Teil der Telefonate speichert die Bemerkung als "Telefonat", Zeilenumbruch, Kontaktname und
// erst dahinter den eigentlichen Text ("Telefonat\nHarry Schmitz n.e. Ging keine Mailbox dran").
// Geprüft und angezeigt wird nur dieser eigentliche Text — bleibt nichts übrig, fehlt die Bemerkung.
function eigeneBemerkung(a: MitarbeiterAktivitaet): string {
  if (a.aktionsart !== TELEFONAT || !/^Telefonat\s*(\n|$)/.test(a.bemerkung)) return a.bemerkung;
  const rest = a.bemerkung.replace(/^Telefonat\s*/, "");
  for (const kontakt of a.kontakte) {
    for (const name of [kontakt, kontakt.split(" geb. ")[0]]) {
      if (rest.startsWith(name)) return rest.slice(name.length).replace(/^[\s,;:-]+/, "");
    }
  }
  return rest;
}

function istNichtErreicht(a: MitarbeiterAktivitaet): boolean {
  return a.aktionstyp === "Nicht erreicht" || /^(n\.?\s?e\b|nicht erreicht)/i.test(eigeneBemerkung(a));
}

function Filter({ label, aktiv, onClick }: { label: string; aktiv: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm px-sm py-xs text-small font-medium transition-colors ${
        aktiv ? "bg-walnuss text-reinweiss" : "bg-reinweiss text-anthrazit/60 hover:text-anthrazit"
      }`}
    >
      {label}
    </button>
  );
}

function Kennzahl({ label, wert }: { label: string; wert: number }) {
  return (
    <Card compact>
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-anthrazit/50">{label}</p>
      <p className="font-slab text-[28px] font-bold leading-tight text-anthrazit">{wert}</p>
    </Card>
  );
}

function Hinweis({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-[4px] text-small text-anthrazit/60">
      <Icon name="warning" size={13} className="shrink-0" />
      {text}
    </span>
  );
}

function AktivitaetZeile({ aktivitaet }: { aktivitaet: MitarbeiterAktivitaet }) {
  const bemerkung = eigeneBemerkung(aktivitaet);
  // Nutzer-Vorgabe November 2026: Nicht erreichte Anrufe zählen weiter mit, sollen sich aber optisch
  // unterscheiden. Bewusst nur diese Seite markiert: Ein "Erreicht" ließe sich aus dem Text nicht
  // belegen und sähe in einer Kontrollliste wie eine Bestätigung aus.
  const nichtErreicht = aktivitaet.aktionsart === TELEFONAT && istNichtErreicht(aktivitaet);
  return (
    <div
      className={`grid gap-x-md gap-y-xs border-b border-l-[3px] border-b-anthrazit/5 py-sm pl-sm last:border-b-0 md:grid-cols-[170px_220px_1fr] ${
        nichtErreicht ? "border-l-status-warnung bg-status-warnung/5" : "border-l-transparent"
      }`}
    >
      <p className="font-mono text-small text-anthrazit/60">{formatiereZeitpunkt(aktivitaet.datum)}</p>
      <div className="min-w-0">
        <p className="font-medium text-anthrazit">
          {aktivitaet.aktionsart || "–"}
          {aktivitaet.aktionstyp && (
            <span className="font-normal text-anthrazit/50"> · {aktivitaet.aktionstyp}</span>
          )}
        </p>
        <p className="mt-[2px] text-small text-anthrazit/60">
          {aktivitaet.kontakte.length > 0 ? aktivitaet.kontakte.join(", ") : "Kein Kontakt verknüpft"}
        </p>
        {nichtErreicht && (
          <span className="mt-[4px] inline-block rounded-sm bg-status-warnung/10 px-xs text-small font-medium text-status-warnung">
            Nicht erreicht
          </span>
        )}
      </div>
      <div className="min-w-0">
        {bemerkung ? (
          <p className="whitespace-pre-line text-body text-anthrazit">{bemerkung}</p>
        ) : aktivitaet.aktionsart === TELEFONAT ? (
          <Hinweis text="Keine Bemerkung" />
        ) : (
          <p className="text-small text-anthrazit/40">Keine Bemerkung</p>
        )}
        {wurdeNachtraeglichGespeichert(aktivitaet) && (
          <div className="mt-[2px]">
            <Hinweis text={`Gespeichert am ${formatiereZeitpunkt(aktivitaet.geaendertAm)}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export function AktivitaetenListe({ name }: { name: string }) {
  const [zeitraum, setZeitraum] = useState<AktivitaetenZeitraum>("woche");
  const [art, setArt] = useState(TELEFONAT);
  const [daten, setDaten] = useState<AktivitaetenAntwort | null>(null);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState(false);

  const mitAllenArten = art !== TELEFONAT;

  useEffect(() => {
    const abbruch = new AbortController();
    const parameter = new URLSearchParams({ name, zeitraum });
    if (mitAllenArten) parameter.set("alle", "1");

    setLaedt(true);
    setFehler(false);
    fetch(`/api/admin/mitarbeiter-aktivitaeten?${parameter.toString()}`, { signal: abbruch.signal })
      .then((antwort) => {
        if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
        return antwort.json();
      })
      .then((json: AktivitaetenAntwort) => {
        setDaten(json);
        setLaedt(false);
      })
      .catch(() => {
        if (abbruch.signal.aborted) return;
        setFehler(true);
        setLaedt(false);
      });

    return () => abbruch.abort();
  }, [name, zeitraum, mitAllenArten]);

  const telefonate = daten?.telefonate ?? [];
  const alle = daten?.alle ?? telefonate;
  const arten = [...new Set([TELEFONAT, ...alle.map((a) => a.aktionsart).filter(Boolean)])].sort((a, b) => {
    if (a === TELEFONAT) return -1;
    if (b === TELEFONAT) return 1;
    return a.localeCompare(b, "de");
  });
  const quelle = art === TELEFONAT ? telefonate : alle;
  const sichtbar = art === ALLE || art === TELEFONAT ? quelle : quelle.filter((a) => a.aktionsart === art);

  return (
    <>
      <div className="mb-sm flex flex-wrap items-center gap-xs">
        {ZEITRAEUME.map((z) => (
          <Filter key={z.id} label={z.label} aktiv={z.id === zeitraum} onClick={() => setZeitraum(z.id)} />
        ))}
        {laedt && <span className="ml-xs text-small text-anthrazit/50">Wird geladen …</span>}
      </div>

      {fehler ? (
        <Card compact className="text-center">
          <p className="text-body text-anthrazit/50">Aktivitäten konnten nicht geladen werden.</p>
        </Card>
      ) : (
        <div className={`transition-opacity ${laedt ? "opacity-50" : ""}`}>
          <div className="mb-sm grid grid-cols-2 gap-sm md:grid-cols-4">
            <Kennzahl label="Telefonate" wert={telefonate.length} />
            <Kennzahl label="Ohne Bemerkung" wert={telefonate.filter((a) => !eigeneBemerkung(a)).length} />
            <Kennzahl label="Nicht erreicht" wert={telefonate.filter(istNichtErreicht).length} />
            <Kennzahl label="Nachträglich" wert={telefonate.filter(wurdeNachtraeglichGespeichert).length} />
          </div>

          <div className="mb-sm flex flex-wrap gap-xs">
            {arten.map((a) => (
              <Filter
                key={a}
                label={`${a} (${a === TELEFONAT ? telefonate.length : alle.filter((x) => x.aktionsart === a).length})`}
                aktiv={a === art}
                onClick={() => setArt(a)}
              />
            ))}
            <Filter
              label={daten?.alle ? `Alle (${daten.alle.length})` : "Alle Aktivitäten"}
              aktiv={art === ALLE}
              onClick={() => setArt(ALLE)}
            />
          </div>

          {daten?.abgeschnitten && mitAllenArten && (
            <p className="mb-sm text-small text-anthrazit/60">
              Es werden nur die neuesten {alle.length} Einträge dieses Zeitraums angezeigt. Die Telefonate sind
              vollständig.
            </p>
          )}

          {sichtbar.length === 0 ? (
            !laedt && (
              <Card compact className="py-xl text-center">
                <p className="text-body text-anthrazit/70">In diesem Zeitraum gibt es keine Einträge.</p>
              </Card>
            )
          ) : (
            <Card compact>
              <div className="flex flex-col">
                {sichtbar.map((aktivitaet) => (
                  <AktivitaetZeile key={aktivitaet.id} aktivitaet={aktivitaet} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
