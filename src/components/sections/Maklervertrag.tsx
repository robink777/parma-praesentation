"use client";

import { useEffect, useState } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { MAKLER_KONTAKT } from "@/data/makler";
import { LEISTUNGSPAKETE } from "@/data/leistungsversprechen";
import { NavZustandEintrag } from "@/components/layout/nav";
import { Bewertung, Immobilie, Kunde, LeistungspaketId, MaklervertragDaten, MaklervertragPartei } from "@/types";

// Baut die Erstbefüllung des Formulars aus den vorhandenen Präsentationsdaten (Kunde,
// Immobilie, Bewertung), die im Live-Modus bereits aus onOffice stammen. So ist der
// Maklervertrag "aus onOffice vorausgefüllt" — alles, was onOffice (noch) nicht liefert
// (Provision, Mängel, sonstige Vereinbarungen, Vertragsdauer), bleibt leer und wird im
// Beratungstermin direkt im Formular ergänzt.
// Wandelt einen Kunde (aus onOffice bzw. manuell übergebene addressId) in eine Vertragspartei
// fürs Formular um — gemeinsam genutzt für auftraggeber1 UND die automatische Vorbefüllung
// weiterer Eigentümer unten (baueInitialdaten).
// Deutsches Datumsformat (TT.MM.JJJJ) für die freien Text-Datumsfelder im Vertrag (§ 2
// Auftragsdauer) — analog zu heute()/formatiereDatumDe in lib/pdf/MandatDokument.tsx, hier lokal
// gehalten, da bislang kein gemeinsames Datums-Util existiert.
function formatiereDatumDe(datum: Date): string {
  return datum.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Tausenderpunkt-Formatierung ohne Währungszeichen für die Anzeige im Startpreis-Feld (Chat-
// Vorgabe: "genau wie bei Preis des Wartens (auch so ausgeschrieben 000.000)") — bewusst ohne
// "€", da das Feld bereits ein eigenes €-Suffix daneben hat (siehe Blank-Aufruf für startpreis
// weiter unten); anders als formatiereBetrag in lib/berechnung.ts (dort inkl. "€", genutzt in
// PreisDesWartens.tsx), das hier doppelt anzeigen würde.
function formatiereTausender(betrag: number): string {
  return new Intl.NumberFormat("de-DE").format(betrag);
}

function kundeZuPartei(kunde: Kunde): MaklervertragPartei {
  return {
    name: [kunde.anrede, kunde.vorname, kunde.nachname].filter(Boolean).join(" "),
    strasse: kunde.strasse,
    plzOrt: [kunde.plz, kunde.ort].filter(Boolean).join(" "),
    telefon: kunde.telefon,
    email: kunde.email,
  };
}

// Insgesamt bis zu 4 Eigentümer/innen im Vertrag: Auftraggeber 1 (fix) + max. 3 weitere (siehe
// MAX_WEITERE unten in der Komponente sowie MaklervertragDaten.weitereAuftraggeber). Bei mehr als
// 4 tatsächlich hinterlegten Eigentümern (größere Erbengemeinschaft) werden nur die ersten 3
// automatisch vorbefüllt — der Rest lässt sich weiterhin manuell über "+ Weitere/n Eigentümer/in
// hinzufügen" ergänzen, siehe auch die Warnmeldung dazu weiter unten in der Komponente.
const MAX_WEITERE_VORBEFUELLT = 3;

function baueInitialdaten(
  kunde: Kunde,
  weitereEigentuemer: Kunde[],
  immobilie: Immobilie,
  bewertung: Bewertung
): MaklervertragDaten {
  // Straße + Hausnummer als eine Zeile (analog zu formatAdresse in Objektdaten.tsx) — vorher
  // fehlte die Hausnummer hier, obwohl sie als eigenes Feld vorliegt (siehe Immobilie.hausnummer).
  const strasseZeile = [immobilie.strasse, immobilie.hausnummer].filter(Boolean).join(" ");
  const objektAdresse = [strasseZeile, [immobilie.plz, immobilie.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  // § 2 Auftragsdauer standardmäßig auf "heute bis in 3 Monaten" vorausgefüllt (Chat-Vorgabe:
  // "immer vorausfüllen mit dem aktuellen Datum bei von: und dann in 3 Monaten das bis Datum") —
  // deckt sich mit der in Leistungsversprechen genannten Standard-Vertragslaufzeit von drei
  // Monaten (siehe data/leistungsversprechen.ts, § 09.02). Bleibt wie jedes andere Feld hier
  // weiterhin frei überschreibbar, falls im Beratungstermin eine andere Laufzeit vereinbart wird.
  const heuteDatum = new Date();
  const in3Monaten = new Date(heuteDatum);
  in3Monaten.setMonth(in3Monaten.getMonth() + 3);

  return {
    auftraggeber1: kundeZuPartei(kunde),
    // Automatisch vorbefüllt aus den laut onOffice zusätzlich hinterlegten Eigentümern (siehe
    // Praesentation.weitereEigentuemer, lib/praesentation.ts) — im Mock-Modus bzw. bei nur einem
    // Eigentümer bleibt das weiterhin eine leere Liste, genau wie zuvor.
    weitereAuftraggeber: weitereEigentuemer.slice(0, MAX_WEITERE_VORBEFUELLT).map(kundeZuPartei),
    // Genaue Adresse statt Objekttitel (Chat-Vorgabe: "Hier hätte ich gerne die genaue Adresse")
    // — Titel bleibt nur Fallback, falls die Adresse (noch) nicht vollständig gepflegt ist.
    objekt: objektAdresse || immobilie.bezeichnung,
    auftragsdauerVon: formatiereDatumDe(heuteDatum),
    auftragsdauerBis: formatiereDatumDe(in3Monaten),
    // Objektart (grobe Kategorie, z.B. "Haus") UND Objekttyp (genauer, z.B.
    // "Einfamilienhaus"/"Doppelhaushälfte") gemeinsam (Chat-Vorgabe: "hier hätte ich noch gerne
    // den Objekttyp") — beide Felder sind in OnOffice unabhängig voneinander gepflegt (siehe
    // Immobilie.objektart/-typ, mapping.ts).
    verkaufsobjektArt: [immobilie.objektart, immobilie.objekttyp].filter(Boolean).join(" · "),
    verkaufsobjektOrt: objektAdresse,
    // Direkt der Kaufpreis aus onOffice (Chat-Vorgabe: "Ich hätte hier gerne den Kaufpreis aus
    // onoffice") — vorher stand hier "bewertung.empfohlenerAngebotspreis ?? immobilie.kaufpreis":
    // empfohlenerAngebotspreis kommt (anders als der Anschein durch das ?? erweckte) aktuell
    // noch nie live aus onOffice, sondern immer aus MOCK_BEWERTUNG (siehe lib/praesentation.ts,
    // nur die drei PriceHubble-Felder und "stand" werden dort live überschrieben) — der Vorschlag
    // stand deshalb bislang unabhängig vom Objekt immer fest auf 542.000 €.
    startpreis: immobilie.kaufpreis,
    wertermittlungVom: bewertung.stand,
    keineMaengelBekannt: false,
  };
}

// Sichtbar abgesetzte Eingabefelder: Reinweiß-Fläche + Asche-Rahmen, damit sie sich klar
// von der Stein-Karte dahinter abheben und auf Anhieb als bearbeitbar erkennbar sind.
const INPUT_CLASS =
  "rounded-sm border border-asche bg-reinweiss text-anthrazit outline-none transition-colors focus:border-messing focus:ring-1 focus:ring-messing";

function Feld({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label mb-xs block">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASS} w-full px-sm py-xs`}
      />
    </label>
  );
}

function Blank({
  value,
  onChange,
  placeholder,
  suffix,
  width = "w-32",
}: {
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  width?: string;
}) {
  // Der umgebende Container ist selbst "inline-flex" und sizt sich standardmäßig am eigenen
  // Inhalt (max-content) statt am verfügbaren Platz der Elternzeile — ein "w-full" auf dem Input
  // ("width" oben) bezieht sich auf diesen Container und läuft deshalb ins Leere, das Feld bleibt
  // trotz w-full auf Standard-Inputbreite (Ort-Feld in §5 des Maklervertrags, Juli 2026
  // Chat-Vorgabe: "die Eingabefläche zu kurz"). "flex-1" lässt den Container in der Elternzeile
  // (siehe die "flex flex-wrap"-Absätze oben) den verbleibenden Platz einnehmen, erst dadurch
  // greift w-full auf dem Input tatsächlich.
  const istVollbreite = width === "w-full";

  // Lokaler Editier-Puffer statt den Input direkt an "value" zu binden: Felder wie die
  // Maklerprovision wandeln den getippten Text sofort über Number(...) in eine Zahl um (siehe
  // onChange-Aufrufer unten in dieser Datei), was "value" bei jedem Tastendruck neu rendert.
  // Ohne Puffer sprang das Feld bei einem Komma sofort auf den bereits geparsten Wert zurück
  // (z.B. "3" nach Eingabe von "3,"), sodass ein Komma faktisch nicht eintippbar war (Chat-
  // Vorgabe: "kann man im Eingabefeld kein Komma setzen"). Mit dem Puffer zeigt das Feld exakt
  // den zuletzt getippten Text, bis es den Fokus verliert — erst dann wird wieder vom
  // übergebenen "value" übernommen (z.B. nach einer Formatierung durch den Aufrufer).
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const angezeigterWert = entwurf ?? (value ?? "");

  return (
    <span
      className={`inline-flex items-baseline gap-xs align-baseline ${istVollbreite ? "flex-1" : ""}`}
    >
      <input
        type="text"
        value={angezeigterWert}
        placeholder={placeholder}
        onChange={(e) => {
          setEntwurf(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={() => setEntwurf(null)}
        className={`${INPUT_CLASS} ${width} px-xs py-[2px]`}
      />
      {suffix && <span className="text-anthrazit/70">{suffix}</span>}
    </span>
  );
}

function ParagraphCard({ nummer, titel, children }: { nummer: number; titel: string; children: React.ReactNode }) {
  return (
    <Card className="mb-md">
      <h4 className="mb-sm">
        § {nummer} {titel}
      </h4>
      <div className="w-full text-body leading-[1.6] text-anthrazit/90">{children}</div>
    </Card>
  );
}

function ParteiFelder({
  partei,
  onChange,
}: {
  partei: MaklervertragPartei;
  onChange: (partei: MaklervertragPartei) => void;
}) {
  return (
    <div className="flex flex-col gap-sm">
      <Feld label="Name" value={partei.name} onChange={(v) => onChange({ ...partei, name: v })} />
      <Feld label="Straße" value={partei.strasse} onChange={(v) => onChange({ ...partei, strasse: v })} />
      <Feld label="PLZ/Ort" value={partei.plzOrt} onChange={(v) => onChange({ ...partei, plzOrt: v })} />
      <Feld label="Telefon" value={partei.telefon} onChange={(v) => onChange({ ...partei, telefon: v })} />
      <Feld label="Email" value={partei.email} onChange={(v) => onChange({ ...partei, email: v })} />
    </div>
  );
}

export function Maklervertrag({
  kunde,
  weitereEigentuemer = [],
  immobilie,
  bewertung,
  gewaehltesPaket,
  referenzobjekte,
  navZustand,
  readOnly = false,
}: {
  kunde: Kunde;
  // Zusätzliche Eigentümer/innen desselben Objekts (siehe Praesentation.weitereEigentuemer) —
  // werden unten automatisch als weitere Auftraggeber vorbefüllt statt manuell eingetippt
  // werden zu müssen.
  weitereEigentuemer?: Kunde[];
  immobilie: Immobilie;
  bewertung: Bewertung;
  gewaehltesPaket?: LeistungspaketId;
  // Für "Präsentation teilen" unten (siehe praesentationTeilen) — die im Vorbereitungsmodus
  // bzw. währenddessen live angepasste Auswahl (siehe PraesentationApp.tsx), die der Share-Link
  // exakt reproduzieren muss.
  referenzobjekte: (Immobilie | null)[];
  navZustand: NavZustandEintrag[];
  // Geteilter, unveränderbarer Kunden-Link (siehe PraesentationApp.tsx, lib/share.ts) — das
  // Formular wird komplett schreibgeschützt (siehe <fieldset disabled> unten) und "Präsentation
  // teilen" entfällt (ein geteilter Link soll nicht seinerseits weiterteilbar sein).
  readOnly?: boolean;
}) {
  const [daten, setDaten] = useState<MaklervertragDaten>(() =>
    baueInitialdaten(kunde, weitereEigentuemer, immobilie, bewertung)
  );
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareWirdErstellt, setShareWirdErstellt] = useState(false);
  const [shareFehler, setShareFehler] = useState<string | null>(null);
  const [linkKopiert, setLinkKopiert] = useState(false);

  function update<K extends keyof MaklervertragDaten>(key: K, value: MaklervertragDaten[K]) {
    setDaten((d) => ({ ...d, [key]: value }));
  }

  const gewaehltesPaketDaten = LEISTUNGSPAKETE.find((p) => p.id === gewaehltesPaket);

  // Übernimmt die im Leistungsversprechen gewählte Provision automatisch ins Vertragsfeld — der
  // Kunde entscheidet sich dort für ein Paket, hier wird die Provisionszeile in § 7 sofort
  // entsprechend vorausgefüllt, statt sie ein zweites Mal manuell eintragen zu müssen.
  useEffect(() => {
    if (!gewaehltesPaketDaten) return;
    update("provisionProzent", gewaehltesPaketDaten.provisionProzent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gewaehltesPaketDaten?.id]);

  // Insgesamt bis zu 4 Eigentümer/innen: Auftraggeber 1 (fix) + max. 3 weitere.
  const MAX_WEITERE = 3;

  function weitereHinzufuegen() {
    setDaten((d) => ({ ...d, weitereAuftraggeber: [...d.weitereAuftraggeber, {}] }));
  }

  function weitereAktualisieren(index: number, partei: MaklervertragPartei) {
    setDaten((d) => ({
      ...d,
      weitereAuftraggeber: d.weitereAuftraggeber.map((p, i) => (i === index ? partei : p)),
    }));
  }

  function weitereEntfernen(index: number) {
    setDaten((d) => ({
      ...d,
      weitereAuftraggeber: d.weitereAuftraggeber.filter((_, i) => i !== index),
    }));
  }

  // Erzeugt den unveränderbaren, signierten Präsentations-Link (Chat-Vorgabe September 2026:
  // "Die jetzige Funktion 'Mandat erteilen' macht so keinen Sinn ... An der Stelle würde es Sinn
  // machen die ganze Präsentation zu teilen") — ersetzt den bisherigen PDF-Download an dieser
  // Stelle. Einzelne Dokumente (Maklervertrag, Leistungsversprechen, Datenschutz,
  // Gesamtpräsentation) lassen sich stattdessen auf der Verabschiedungsseite herunterladen,
  // sowohl hier live als auch im geteilten Link selbst (siehe Verabschiedung.tsx).
  async function praesentationTeilen() {
    setShareFehler(null);
    setShareWirdErstellt(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estateId: immobilie.id,
          referenzobjektIds: referenzobjekte.filter((o): o is Immobilie => o !== null).map((o) => o.id),
          navZustand,
          gewaehltesPaket,
        }),
      });

      if (!res.ok) {
        const fehlerdaten = await res.json().catch(() => null);
        throw new Error(fehlerdaten?.error || "Link konnte nicht erstellt werden");
      }

      const { url } = await res.json();
      setShareLink(url);
    } catch (error) {
      setShareFehler(error instanceof Error ? error.message : "Link konnte nicht erstellt werden");
    } finally {
      setShareWirdErstellt(false);
    }
  }

  async function linkKopieren() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkKopiert(true);
      setTimeout(() => setLinkKopiert(false), 2000);
    } catch {
      // Clipboard-API kann in manchen Kontexten fehlschlagen (z.B. kein sicherer Kontext) — der
      // Link steht als Text ohnehin sichtbar im Feld, notfalls manuell markierbar.
    }
  }

  return (
    <SectionShell label="Vertrag" title="Maklervertrag">
      <p className="mb-lg w-full text-body text-anthrazit/80">
        {readOnly
          ? "Diese Vertragsdaten wurden im Beratungstermin gemeinsam festgelegt."
          : "Die Vertragsdaten sind aus Ihren Objekt- und Kundendaten vorausgefüllt. Alle Felder lassen sich hier direkt im Gespräch anpassen und ergänzen."}
      </p>

      {/* Schreibgeschützt im geteilten Kunden-Link (readOnly) — <fieldset disabled> deaktiviert
          mit einem einzigen Attribut alle enthaltenen Formularelemente (input/textarea/button),
          statt jedes der zahlreichen Felder in § 1–12 einzeln bedingt zu rendern. Randlos
          gestylt, damit vom nativen <fieldset> optisch nichts zu sehen ist. */}
      <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
      {/* Vertragsparteien */}
      <div className="mb-md grid grid-cols-1 gap-sm md:grid-cols-2">
        <Card>
          <p className="label mb-sm">Immobilienmakler</p>
          <p className="font-slab text-lg font-semibold text-anthrazit">{MAKLER_KONTAKT.name}</p>
          <p className="text-body text-anthrazit/80">{MAKLER_KONTAKT.unternehmen}</p>
          <p className="text-body text-anthrazit/80">{MAKLER_KONTAKT.strasse}</p>
          <p className="text-body text-anthrazit/80">{MAKLER_KONTAKT.plzOrt}</p>
          <p className="text-body text-anthrazit/80">{MAKLER_KONTAKT.telefon}</p>
          <p className="text-body text-anthrazit/80">{MAKLER_KONTAKT.email}</p>
        </Card>

        <Card>
          <p className="label mb-sm">Verkäufer/in · Auftraggeber/in</p>
          <ParteiFelder partei={daten.auftraggeber1} onChange={(p) => update("auftraggeber1", p)} />
        </Card>
      </div>

      {daten.weitereAuftraggeber.map((partei, i) => (
        <Card key={i} className="mb-md">
          <div className="mb-sm flex items-center justify-between">
            <p className="label">Weitere/r Eigentümer/in {i + 2}</p>
            <button
              onClick={() => weitereEntfernen(i)}
              className="text-small text-anthrazit/60 underline hover:text-messing"
            >
              Entfernen
            </button>
          </div>
          <ParteiFelder partei={partei} onChange={(p) => weitereAktualisieren(i, p)} />
        </Card>
      ))}

      {daten.weitereAuftraggeber.length < MAX_WEITERE ? (
        <button
          onClick={weitereHinzufuegen}
          className="mb-lg text-small text-anthrazit/70 underline hover:text-messing"
        >
          + Weitere/n Eigentümer/in hinzufügen
        </button>
      ) : (
        // Statt den Button kommentarlos verschwinden zu lassen (bis Juli 2026): erklärt, warum
        // kein 5. Auftraggeber mehr eintragbar ist — bei größeren Erbengemeinschaften (5+ Erben)
        // ein realer Fall, siehe Logik-Check.
        <p className="mb-lg text-small text-anthrazit/50">
          Maximal 4 Auftraggeber/innen im Formular abbildbar. Bei mehr Eigentümern bitte die
          übrigen Personen handschriftlich auf dem ausgedruckten Vertrag ergänzen.
        </p>
      )}

      <div className="mb-lg">
        <Feld label="Objekt" value={daten.objekt} onChange={(v) => update("objekt", v)} />
      </div>

      {/* Vertragstext */}
      <ParagraphCard nummer={1} titel="Maklervertrag">
        <p>
          Hiermit wird der Makler durch die Veräußerin und/oder den Veräußerer oder dessen/deren
          Bevollmächtigten beauftragt, einen Kaufinteressenten nachzuweisen oder den Abschluss
          eines Kaufvertrags zu vermitteln.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={2} titel="Auftragsdauer">
        <p className="mb-sm flex flex-wrap items-baseline gap-xs">
          <span>Von:</span>
          <Blank
            value={daten.auftragsdauerVon}
            onChange={(v) => update("auftragsdauerVon", v)}
            width="w-40"
          />
          <span>bis:</span>
          <Blank
            value={daten.auftragsdauerBis}
            onChange={(v) => update("auftragsdauerBis", v)}
            width="w-40"
          />
        </p>
        <p>
          Der Auftrag verlängert sich jeweils um einen Monat, wenn er nicht unter Einhaltung
          einer Frist von einer Woche zum Ende der Vertragslaufzeit von einer Vertragspartei in
          Textform gekündigt wird.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={3} titel="Pflichten des Maklers">
        <p>
          Der Makler ist verpflichtet, den Auftrag mit Fachkunde auszuführen, alle
          Abschlusschancen zu nutzen und alle Werbemaßnahmen auf eigene Kosten zu ergreifen, um
          einen kurzfristigen Verkauf zu ermöglichen. Siehe dazu das beiliegende
          Leistungsversprechen. Er hat die/den Auftraggeberin/Auftraggeber nach bestem Wissen
          und Gewissen über den Immobilienmarkt und die erzielbaren Preise zu beraten.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={4} titel="Rechte der Auftraggeberin/des Auftraggebers">
        <p className="mb-sm">
          Die/der Auftraggeberin/Auftraggeber ist/sind nicht berechtigt, an Auftraggeber anderer
          Makler zu verkaufen oder andere Makler zu bezahlen. Die/der Auftraggeberin/Auftraggeber
          verpflichtet/verpflichten sich, den Makler beim Verkauf an andere Interessenten zu den
          Verhandlungen hinzuzuziehen.
        </p>
        <p>
          Die/der Auftraggeberin/Auftraggeber darf/dürfen für evtl. Miteigentümer in Vollmacht
          handeln, ist/sind aber bei Unwirksamkeit der Vollmacht zu Schadensersatz verpflichtet.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={5} titel="Verkaufsobjekt">
        <p className="mb-sm flex flex-wrap items-baseline gap-xs">
          <span>Art:</span>
          <Blank
            value={daten.verkaufsobjektArt}
            onChange={(v) => update("verkaufsobjektArt", v)}
            width="w-56"
          />
        </p>
        <p className="mb-sm flex flex-wrap items-baseline gap-xs">
          <span>Ort:</span>
          <Blank
            value={daten.verkaufsobjektOrt}
            onChange={(v) => update("verkaufsobjektOrt", v)}
            width="w-full"
          />
        </p>
        <p className="flex flex-wrap items-baseline gap-xs">
          <span>Der vereinbarte Startpreis beträgt</span>
          <Blank
            value={daten.startpreis !== undefined ? formatiereTausender(daten.startpreis) : undefined}
            onChange={(v) => update("startpreis", Number(v.replace(/\D/g, "")) || undefined)}
            suffix="€"
            width="w-32"
          />
          <span>entsprechend der Wertermittlung vom</span>
          <Blank
            value={daten.wertermittlungVom}
            onChange={(v) => update("wertermittlungVom", v)}
            width="w-40"
          />
          <span>
            . Parma Immobilien hat die/den Auftraggeberin/Auftraggeber darüber aufgeklärt, dass es
            durch die Marktveränderung nach Zinsanstieg je nach Immobilientyp deutliche
            Abweichungen zum Verkehrswert eintreten können. Zudem zeichnet sich ab, dass mit
            längerer Vermarktungsdauer ein Wertverlust einhergeht. Preisanpassungen werden im
            Laufe der Vermarktungszeit nur in enger Absprache mit der/dem/den
            Auftraggeberin/Auftraggeber/Auftraggebern abgestimmt und erfordern der eindeutigen
            Zustimmung. Dies bedarf keiner Änderung des Maklervertrags, die Unterzeichnung des
            notariellen Kaufvertrages bestätigt die Akzeptanz des Kaufpreises.
          </span>
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={6} titel="Pflichten der Auftraggeberin/des Auftraggebers">
        <p className="mb-sm">
          Die/der Auftraggeberin/Auftraggeber teilt dem Makler alle für den Verkauf bedeutsame
          Informationen richtig und vollständig mit, insbesondere die folgenden bekannten Mängel.
        </p>
        <textarea
          value={daten.maengel ?? ""}
          onChange={(e) => update("maengel", e.target.value)}
          disabled={daten.keineMaengelBekannt}
          placeholder="Bekannte Mängel eintragen …"
          rows={4}
          className="mb-sm w-full resize-none rounded-sm border border-asche bg-reinweiss p-sm text-body text-anthrazit outline-none transition-colors focus:border-messing focus:ring-1 focus:ring-messing disabled:opacity-50"
        />
        <label className="flex items-center gap-sm text-body">
          <input
            type="checkbox"
            checked={daten.keineMaengelBekannt ?? false}
            onChange={(e) =>
              setDaten((d) => ({
                ...d,
                keineMaengelBekannt: e.target.checked,
                maengel: e.target.checked ? "" : d.maengel,
              }))
            }
            className="h-4 w-4 accent-messing"
          />
          Keine Mängel bekannt
        </label>
      </ParagraphCard>

      <ParagraphCard nummer={7} titel="Maklerprovision">
        {gewaehltesPaketDaten && (
          <span className="label mb-sm inline-flex w-fit items-center gap-[4px] rounded-sm bg-messing px-sm py-[2px] text-reinweiss">
            <Icon name="check" size={12} />
            Paket: {gewaehltesPaketDaten.name}
          </span>
        )}
        <p className="mb-sm flex flex-wrap items-baseline gap-xs">
          <span>Die/der Auftraggeberin/Auftraggeber verpflichtet/verpflichten sich, eine Maklerprovision in Höhe von</span>
          <Blank
            value={daten.provisionProzent}
            onChange={(v) => update("provisionProzent", Number(v.replace(",", ".")) || undefined)}
            suffix="%"
            width="w-20"
          />
          <span>
            des erzielten Gesamtkaufpreises inklusive der gesetzlichen MwSt. zu zahlen. Die
            Provision wird mit Abschluss des notariellen Kaufvertrags fällig. Der Makler darf auch
            für den Käufer in entsprechender Höhe provisionspflichtig tätig sein. Etwaige
            Interessenkollisionen wird der Makler mit der/dem/den Auftraggeberin/Auftraggeber/
            Auftraggebern besprechen. Der Provisionsanspruch des Maklers wird durch eine
            nachträgliche Minderung des Kaufpreises nicht berührt. Der Provisionsanspruch des
            Maklers entsteht auch, wenn der/die Auftragsgeberin/Auftraggeber einen
            Kaufinteressenten ohne triftigen Grund ablehnt oder den Verkauf entgegen § 4
            anderweitig vornimmt.
          </span>
        </p>
        <p>
          Ebenso entsteht der Provisionsanspruch, wenn der Kontakt zum Käufer noch während der
          Laufzeit dieses Vertrages durch den Makler zustande gekommen ist und die Veräußerung
          durch notariellen Kaufvertrag zu einem späteren Zeitpunkt erfolgt.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={8} titel="Aufwendungsersatz">
        <p>
          Gibt/geben die/der Auftraggeberin/Auftraggeber die Verkaufsabsicht vorzeitig (bevor ein
          Käufer benannt wurde) auf oder erschwert/erschweren sie/er die Erfüllung des Auftrages
          durch Änderung der festgelegten Bedingungen, oder kündigt/kündigen widerrechtlich den
          Maklerauftrag, so übernimmt/übernehmen sie/er alle Aufwendungen wie Telefon-, Porto-,
          Inserats-, Reise-, KFZ- und Beschaffungskosten für Unterlagen wie Grundbuchauszug,
          Bauunterlagen, Energieausweis und Lageplan. Der Auftraggeberin/Dem Auftraggeber bleibt
          der Nachweis gestattet, dass dem Makler kein oder ein geringer Schaden entstanden ist.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={9} titel="Salvatorische Klausel">
        <p>
          Sollten eine oder mehrere der vorstehenden Vereinbarungen unwirksam sein, so wird die
          Wirksamkeit der übrigen Vertragsvereinbarungen hiervon nicht berührt. Dies gilt auch,
          wenn innerhalb einer Regelung ein Teil unwirksam ist, ein anderer Teil aber wirksam. Die
          jeweils unwirksame Vereinbarung soll zwischen den Parteien durch eine ersetzt werden,
          die den wirtschaftlichen Interessen der Vertragsparteien am nächsten kommt und im
          Übrigen den vertraglichen Vereinbarungen nicht zuwiderläuft. Gerichtsstand ist, soweit
          gesetzlich zulässig, der Geschäftssitz des Maklers.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={10} titel="Datenschutz und Widerrufbelehrung">
        <p className="mb-sm">
          Der Makler hat bei Erhebung und Verarbeitung von Daten des Auftraggebers die
          Bestimmungen der Datenschutzgesetzes (DSGVO) zu beachten. Die als Anlage 1 dieses
          Vertrag beigefügte Datenschutzerklärung des Maklers ist Bestandteil dieses
          Maklervertrags und mit diesem fest zu verbinden.
        </p>
        <p>
          Für den Fall, dass es sich bei dem Kunden um einen Verbraucher gemäß § 13 BGB handelt
          und dieser Vertrag entweder außerhalb der Geschäftsräume des Maklers oder im Wege des
          Fernabsatzes über Fernkommunikationsmittel geschlossen wird, gilt die in Anlage 2 zu
          diesem Vertrag enthaltene Widerrufsbelehrung. Diese Anlage ist zwingender Bestandteil
          dieses Vertrages.
        </p>
      </ParagraphCard>

      <ParagraphCard nummer={11} titel="Schriftform">
        <p>Mündliche Nebenabreden existieren nicht. Änderungen dieses Vertrages bedürfen der Textform.</p>
      </ParagraphCard>

      <ParagraphCard nummer={12} titel="Sonstige Vereinbarungen">
        <textarea
          value={daten.sonstigeVereinbarungen ?? ""}
          onChange={(e) => update("sonstigeVereinbarungen", e.target.value)}
          placeholder="Individuelle Vereinbarungen eintragen …"
          rows={4}
          className="w-full resize-none rounded-sm border border-asche bg-reinweiss p-sm text-body text-anthrazit outline-none transition-colors focus:border-messing focus:ring-1 focus:ring-messing"
        />
      </ParagraphCard>

      <Card className="mb-lg">
        <h4 className="mb-xs">Genehmigung</h4>
        <p className="w-full text-body leading-[1.6] text-anthrazit/90">
          Dem Makler wird ausdrücklich gestattet, die notwendigen Unterlagen zur erfolgreichen
          Vermarktung einzuholen. Diese Genehmigung bezieht sich auf folgende Unterlagen:
          Grundbuchauszug, Lageplan, Baubeschreibung, Statik, Grundrisse, Schnitte,
          Verwaltungsunterlagen und alle weiteren benötigten Unterlagen, die für den Verkauf des
          Objekts benötigt werden.
        </p>
      </Card>

      {/* Unterschrift */}
      <Card className="mb-lg">
        <p className="label mb-sm">Unterschrift</p>
        <div className="mb-md grid grid-cols-1 gap-sm md:grid-cols-2">
          <Feld label="Ort" value={daten.unterschriftOrt} onChange={(v) => update("unterschriftOrt", v)} />
          <Feld
            label="Datum"
            type="date"
            value={daten.unterschriftDatum}
            onChange={(v) => update("unterschriftDatum", v)}
          />
        </div>
        <p className="mb-sm flex items-center gap-sm text-small text-anthrazit/60">
          <Icon name="document" size={18} />
          Die rechtsgültige Unterschrift erfolgt im Anschluss auf Papier oder per digitaler
          Signatur — dieses Formular dient der Vorbereitung und Abstimmung im Beratungstermin.
        </p>
        <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
          <div className="border-t border-asche pt-xs text-small text-anthrazit/70">Auftraggeberin/Auftraggeber</div>
          <div className="border-t border-asche pt-xs text-small text-anthrazit/70">Maklerin/Makler</div>
        </div>
      </Card>
      </fieldset>

      {!readOnly && (shareLink ? (
        <div className="rounded-md bg-stein p-md">
          <p className="mb-sm flex items-center gap-sm text-body font-medium text-anthrazit">
            <Icon name="check" size={20} className="text-messing" />
            Präsentation freigegeben — der Kunde kann diesen Link unveränderbar öffnen.
          </p>
          <div className="flex flex-wrap items-center gap-sm">
            <input
              type="text"
              readOnly
              value={shareLink}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-sm border border-asche bg-reinweiss px-sm py-xs text-small text-anthrazit outline-none"
            />
            <button
              type="button"
              onClick={linkKopieren}
              className="shrink-0 rounded-md bg-walnuss px-md py-xs text-small font-medium text-reinweiss transition-colors hover:bg-anthrazit"
            >
              {linkKopiert ? "Kopiert!" : "Link kopieren"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={praesentationTeilen}
            disabled={shareWirdErstellt}
            className="flex items-center gap-sm rounded-md bg-messing px-lg py-sm font-medium text-reinweiss disabled:opacity-60"
          >
            {shareWirdErstellt && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-reinweiss/40 border-t-reinweiss" />
            )}
            {shareWirdErstellt ? "Link wird erstellt …" : "Präsentation teilen"}
          </button>
          {shareFehler && <p className="mt-sm text-small text-anthrazit/80">Fehler: {shareFehler}</p>}
        </>
      ))}
    </SectionShell>
  );
}
