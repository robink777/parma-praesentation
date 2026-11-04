import Link from "next/link";
import { Card } from "@/components/layout/SectionShell";
import { formatiereBetrag } from "@/lib/berechnung";
import { MitarbeiterObjekt } from "@/types";

// Gemeinsame Listen-Darstellung für die beiden Admin-Detailseiten, die eine Menge von
// MitarbeiterObjekt zeigen: app/admin/provisionsfehler/page.tsx (die "N ohne Angabe"-Hinweise)
// und app/admin/objektliste/page.tsx (Klick auf eine KPI-Kachel der Übersicht). Ausgelagert,
// damit beide Seiten garantiert identisch aussehen.
//
// Nutzer-Vorgabe November 2026 für den Abgleich mit den Excel-Listen der Buchhaltung: Die Listen
// laufen wahlweise nach Monaten oder nach Straßennamen, und je Objekt stehen Innen- und
// Außenprovision, Akquise, Setting und Betreuer. Deshalb eine Tabelle statt der früheren
// Bild-Zeilen. In der Monatsansicht trägt jeder Monat eine Zwischensumme, damit sich die Werte
// Monat für Monat gegen die Buchhaltung legen lassen.
export type ObjektlistenAnsicht = "monat" | "strasse";

export function istObjektlistenAnsicht(wert: string | undefined): wert is ObjektlistenAnsicht {
  return wert === "monat" || wert === "strasse";
}

const monatsFormat = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });
const prozentFormat = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDatum(datum: string | null): string {
  if (!datum) return "–";
  const [jahr, monat, tag] = datum.split("-");
  return `${tag}.${monat}.${jahr}`;
}

function formatMonat(schluessel: string): string {
  return schluessel ? monatsFormat.format(new Date(`${schluessel}-01T00:00:00Z`)) : "Ohne Datum";
}

function formatBetragOderStrich(betrag: number | null): string {
  return betrag === null ? "–" : formatiereBetrag(betrag);
}

function strassenSchluessel(objekt: MitarbeiterObjekt): string {
  return objekt.strasse || objekt.titel;
}

// Straße alphabetisch, Hausnummer numerisch ("2" vor "10", "12a" nach "12").
function vergleicheStrasse(a: MitarbeiterObjekt, b: MitarbeiterObjekt): number {
  return (
    strassenSchluessel(a).localeCompare(strassenSchluessel(b), "de") ||
    a.hausnummer.localeCompare(b.hausnummer, "de", { numeric: true }) ||
    a.ort.localeCompare(b.ort, "de")
  );
}

interface Summen {
  anzahl: number;
  preis: number;
  aussen: number;
  innen: number;
  provision: number;
}

// Kaltmieten gehen nicht in die Kaufpreis-Summe ein, ihre Provision schon.
function summiere(objekte: MitarbeiterObjekt[]): Summen {
  return objekte.reduce<Summen>(
    (s, o) => ({
      anzahl: s.anzahl + 1,
      preis: s.preis + (o.istVermietung ? 0 : o.preis),
      aussen: s.aussen + (o.aussenProvision ?? 0),
      innen: s.innen + (o.innenProvision ?? 0),
      provision: s.provision + (o.provisionsvorlauf ?? 0),
    }),
    { anzahl: 0, preis: 0, aussen: 0, innen: 0, provision: 0 }
  );
}

function ProvisionsZelle({ prozent, betrag }: { prozent: number | null; betrag: number | null }) {
  if (prozent === null) return <td className="px-xs py-[6px] text-right text-anthrazit/30">–</td>;
  return (
    <td className="whitespace-nowrap px-xs py-[6px] text-right">
      <span className="text-anthrazit">{formatBetragOderStrich(betrag)}</span>
      <span className="block text-[11px] text-anthrazit/50">{prozentFormat.format(prozent)} %</span>
    </td>
  );
}

function PersonZelle({ nr, namen, pflicht }: { nr: string | null; namen: Record<string, string>; pflicht: boolean }) {
  if (!nr) {
    return pflicht ? (
      <td className="whitespace-nowrap px-xs py-[6px] font-medium text-status-warnung">fehlt</td>
    ) : (
      <td className="px-xs py-[6px] text-anthrazit/30">–</td>
    );
  }
  return <td className="whitespace-nowrap px-xs py-[6px] text-anthrazit">{namen[nr] ?? `Nutzer ${nr}`}</td>;
}

// Verkaufte Objekte zeigen den tatsächlichen Kaufpreis und darunter immer den Angebotspreis. In der
// Akzentfarbe nur, wenn zum vollen Angebotspreis verkauft wurde (Nutzer-Vorgabe November 2026): Ein
// Abschlag ist der Normalfall und braucht kein Signal, der volle Preis ist die Ausnahme.
function PreisZelle({ objekt }: { objekt: MitarbeiterObjekt }) {
  const zusatz = (text: string) => <span className="block text-[11px] text-anthrazit/50">{text}</span>;
  const vollerPreis = !objekt.kaufpreisFehlt && objekt.angebotspreis === objekt.preis;
  const angebot =
    objekt.angebotspreis > 0 ? (
      <span className={`block text-[11px] ${vollerPreis ? "font-medium text-messing" : "text-anthrazit/50"}`}>
        Angebot {formatiereBetrag(objekt.angebotspreis)}
      </span>
    ) : null;
  if (objekt.istVermietung) {
    return (
      <td className="whitespace-nowrap px-xs py-[6px] text-right text-anthrazit">
        {formatiereBetrag(objekt.preis)}
        {zusatz("Kaltmiete")}
      </td>
    );
  }
  if (objekt.kaufpreisFehlt) {
    return (
      <td className="whitespace-nowrap px-xs py-[6px] text-right">
        <span className="font-medium text-status-warnung">Tats. Kaufpreis fehlt</span>
        {angebot}
      </td>
    );
  }
  return (
    <td className="whitespace-nowrap px-xs py-[6px] text-right text-anthrazit">
      {formatiereBetrag(objekt.preis)}
      {angebot}
    </td>
  );
}

function ObjektZeile({
  objekt,
  datum,
  namen,
  zeigeDauer,
}: {
  objekt: MitarbeiterObjekt;
  datum: string | null;
  namen: Record<string, string>;
  zeigeDauer: boolean;
}) {
  const adresse = objekt.strasse ? `${objekt.strasse} ${objekt.hausnummer}`.trim() : objekt.titel;
  return (
    <tr className="border-b border-anthrazit/5 align-top last:border-b-0 hover:bg-anthrazit/[0.02]">
      <td className="whitespace-nowrap px-xs py-[6px] font-mono text-anthrazit/70">{formatDatum(datum)}</td>
      <td className="min-w-[220px] px-xs py-[6px]">
        <span className="font-medium text-anthrazit">{adresse}</span>
        <span className="block text-[11px] text-anthrazit/50">
          {[`${objekt.plz} ${objekt.ort}`.trim(), objekt.objektnr].filter(Boolean).join(" · ")}
        </span>
      </td>
      <PreisZelle objekt={objekt} />
      <ProvisionsZelle prozent={objekt.aussenProvisionProzent} betrag={objekt.aussenProvision} />
      <ProvisionsZelle prozent={objekt.innenProvisionProzent} betrag={objekt.innenProvision} />
      <td className="whitespace-nowrap px-xs py-[6px] text-right font-medium text-anthrazit">
        {objekt.provisionsvorlaufFehlt ? (
          <span className="text-status-warnung">fehlt</span>
        ) : (
          formatBetragOderStrich(objekt.provisionsvorlauf)
        )}
        {objekt.istVermietung && <span className="block text-[11px] font-normal text-anthrazit/50">Vermietung</span>}
      </td>
      <PersonZelle nr={objekt.akquisiteurNr} namen={namen} pflicht />
      <PersonZelle nr={objekt.akquiseVertriebNr} namen={namen} pflicht={false} />
      <PersonZelle nr={objekt.setterNr} namen={namen} pflicht={false} />
      <PersonZelle nr={objekt.betreuerNr} namen={namen} pflicht />
      {zeigeDauer && (
        <td className="whitespace-nowrap px-xs py-[6px] text-right text-anthrazit/70">
          {objekt.vermarktungsdauerTage === null ? "–" : `${objekt.vermarktungsdauerTage} T.`}
        </td>
      )}
    </tr>
  );
}

// Summenzeile in denselben Spalten wie die Objektzeilen — als Monatskopf und als Gesamtsumme.
function SummenZeile({ label, summen, zeigeDauer, gesamt }: { label: string; summen: Summen; zeigeDauer: boolean; gesamt?: boolean }) {
  return (
    <tr className={gesamt ? "border-t-2 border-anthrazit/15 bg-sand/60" : "border-b border-anthrazit/10 bg-sand/40"}>
      <td colSpan={2} className="px-xs py-[6px] font-medium text-anthrazit">
        {label}
        <span className="ml-xs font-normal text-anthrazit/50">
          {summen.anzahl} {summen.anzahl === 1 ? "Objekt" : "Objekte"}
        </span>
      </td>
      <td className="whitespace-nowrap px-xs py-[6px] text-right font-medium text-anthrazit">{formatiereBetrag(summen.preis)}</td>
      <td className="whitespace-nowrap px-xs py-[6px] text-right font-medium text-anthrazit">{formatiereBetrag(summen.aussen)}</td>
      <td className="whitespace-nowrap px-xs py-[6px] text-right font-medium text-anthrazit">{formatiereBetrag(summen.innen)}</td>
      <td className="whitespace-nowrap px-xs py-[6px] text-right font-bold text-anthrazit">{formatiereBetrag(summen.provision)}</td>
      <td colSpan={zeigeDauer ? 5 : 4} />
    </tr>
  );
}

export function ObjektlisteKarte({
  objekte,
  leerText,
  namen,
  ansicht,
  ansichtHref,
  datumsfeld,
  zeigeDauer = false,
}: {
  objekte: MitarbeiterObjekt[] | undefined;
  leerText: string;
  namen: Record<string, string>;
  ansicht: ObjektlistenAnsicht;
  ansichtHref: Record<ObjektlistenAnsicht, string>;
  // Welches Datum Spalte und Monatsgruppen bestimmt: Verkaufsdatum bei verkauften Objekten,
  // Auftragsbeginn bei Bestand und Aufarbeitung.
  datumsfeld: "verkauftAm" | "auftragVon";
  zeigeDauer?: boolean;
}) {
  if (objekte === undefined) {
    return (
      <Card compact className="text-center">
        <p className="text-body text-anthrazit/50">Objekte konnten nicht geladen werden.</p>
      </Card>
    );
  }

  if (objekte.length === 0) {
    return (
      <Card compact className="py-xl text-center">
        <p className="text-body text-anthrazit/70">{leerText}</p>
      </Card>
    );
  }

  const datumVon = (o: MitarbeiterObjekt) => o[datumsfeld];

  // Monate aufsteigend, Objekte ohne Datum am Ende; innerhalb eines Monats nach Datum, dann Straße.
  const monate = new Map<string, MitarbeiterObjekt[]>();
  if (ansicht === "monat") {
    const sortiert = [...objekte].sort(
      (a, b) => (datumVon(a) || "9999").localeCompare(datumVon(b) || "9999") || vergleicheStrasse(a, b)
    );
    for (const objekt of sortiert) {
      const schluessel = datumVon(objekt)?.slice(0, 7) ?? "";
      monate.set(schluessel, [...(monate.get(schluessel) ?? []), objekt]);
    }
  }
  const nachStrasse = ansicht === "strasse" ? [...objekte].sort(vergleicheStrasse) : [];

  return (
    <Card compact>
      <div className="mb-sm flex flex-wrap items-center gap-sm">
        <p className="label">Sortierung</p>
        <div className="flex rounded-full bg-sand p-[3px]">
          {(["monat", "strasse"] as const).map((a) => (
            <Link
              key={a}
              href={ansichtHref[a]}
              className={`rounded-full px-sm py-[4px] text-small font-medium transition-colors ${
                ansicht === a ? "bg-reinweiss text-anthrazit shadow-[0_1px_3px_rgba(80,63,61,0.12)]" : "text-anthrazit/60 hover:text-anthrazit"
              }`}
            >
              {a === "monat" ? "Nach Monat" : "Nach Straße"}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-small">
          <thead>
            <tr className="border-b border-anthrazit/15 text-left font-mono text-[10px] uppercase tracking-[0.06em] text-anthrazit/50">
              <th className="px-xs py-[6px] font-medium">{datumsfeld === "verkauftAm" ? "Verkauft am" : "Auftrag seit"}</th>
              <th className="px-xs py-[6px] font-medium">Objekt</th>
              <th className="px-xs py-[6px] text-right font-medium">Kaufpreis</th>
              <th className="px-xs py-[6px] text-right font-medium">Außenprov.</th>
              <th className="px-xs py-[6px] text-right font-medium">Innenprov.</th>
              <th className="px-xs py-[6px] text-right font-medium">Provision</th>
              <th className="px-xs py-[6px] font-medium">Akquise</th>
              <th className="px-xs py-[6px] font-medium">Akquise Vertrieb</th>
              <th className="px-xs py-[6px] font-medium">Setting</th>
              <th className="px-xs py-[6px] font-medium">Betreuer</th>
              {zeigeDauer && <th className="px-xs py-[6px] text-right font-medium">Dauer</th>}
            </tr>
          </thead>
          <tbody>
            {ansicht === "monat"
              ? [...monate.entries()].flatMap(([schluessel, gruppe]) => [
                  <SummenZeile key={`kopf-${schluessel}`} label={formatMonat(schluessel)} summen={summiere(gruppe)} zeigeDauer={zeigeDauer} />,
                  ...gruppe.map((objekt) => (
                    <ObjektZeile key={objekt.id} objekt={objekt} datum={datumVon(objekt)} namen={namen} zeigeDauer={zeigeDauer} />
                  )),
                ])
              : nachStrasse.map((objekt) => (
                  <ObjektZeile key={objekt.id} objekt={objekt} datum={datumVon(objekt)} namen={namen} zeigeDauer={zeigeDauer} />
                ))}
            <SummenZeile label="Gesamt" summen={summiere(objekte)} zeigeDauer={zeigeDauer} gesamt />
          </tbody>
        </table>
      </div>

      <p className="mt-sm text-[11px] text-anthrazit/50">
        Provisionen netto (÷ 1,19) auf den Kaufpreis, bei verkauften Objekten auf den tatsächlichen Kaufpreis.
        Vermietungen mit 2 Kaltmieten; ihre Kaltmiete zählt nicht zur Kaufpreis-Summe. Eine Seite darf 0 % haben
        (Provision nur von einer Seite); „fehlt“ heißt, dass keine Seite einen Satz hat.
      </p>
    </Card>
  );
}
