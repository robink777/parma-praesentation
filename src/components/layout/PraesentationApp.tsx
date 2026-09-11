"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { NAV_ITEMS, NavZustandEintrag, useNavZustand } from "./nav";
import { Vorbereitungsmodus } from "./Vorbereitungsmodus";
import { Immobilie, LeistungspaketId, Praesentation } from "@/types";
import { Begruessung } from "@/components/sections/Begruessung";
import { Kontaktperson } from "@/components/sections/Kontaktperson";
import { Unternehmen } from "@/components/sections/Unternehmen";
import { Objektdaten } from "@/components/sections/Objektdaten";
import { DeepImmo } from "@/components/sections/DeepImmo";
import { Kaeuferverhalten } from "@/components/sections/Kaeuferverhalten";
import { PreisDesWartens } from "@/components/sections/PreisDesWartens";
import { Dokumente } from "@/components/sections/Dokumente";
import { Vergleichswert } from "@/components/sections/Vergleichswert";
import { Leistungsversprechen } from "@/components/sections/Leistungsversprechen";
import { Maklervertrag, baueInitialdaten } from "@/components/sections/Maklervertrag";
import { Verabschiedung } from "@/components/sections/Verabschiedung";
import { waehleVorauswahl } from "@/lib/vergleichswert";
import { MaklervertragDaten } from "@/types";

// Anzahl der Vergleichsobjekt-Slots im Vergleichswert-Reiter (Juli 2026 Chat-Vorgabe: "Mache aus
// den 3 Vergleichsobjekten bitte 6") — eine einzige Stelle statt eines an mehreren Stellen
// wiederholten Zahlenwerts, damit eine künftige erneute Anpassung nicht wieder an mehreren Stellen
// synchron gehalten werden muss.
const ANZAHL_REFERENZOBJEKTE = 6;

export function PraesentationApp({
  daten,
  readOnly = false,
  initialeReferenzobjekte,
  initialerNavZustand,
  initialesPaket,
  initialesMaklervertragDaten,
  shareParams,
}: {
  daten: Praesentation;
  // Nur im geteilten Kunden-Link gesetzt (siehe app/geteilt/page.tsx) — an Verabschiedung.tsx
  // weitergereicht, damit die dortigen PDF-Downloads auch ohne Session-Cookie funktionieren
  // (siehe middleware.ts).
  shareParams?: { d: string; sig: string };
  // Gesetzt für den geteilten, unveränderbaren Kunden-Link (siehe app/geteilt/page.tsx,
  // lib/share.ts) — überspringt den Vorbereitungsmodus komplett (der Kunde sieht direkt das vom
  // Berater/von der Beraterin fertig konfigurierte Ergebnis) und blendet die
  // Bearbeitungsmöglichkeiten in der Sidebar aus (siehe bearbeitungErlaubt-Prop dort).
  readOnly?: boolean;
  // Die folgenden Props kommen ausschließlich vom geteilten Kunden-Link (siehe
  // app/geteilt/page.tsx) — dort bereits zu vollständigen Immobilie-Objekten aufgelöst
  // (ladeImmobilieById je referenzobjektIds-Eintrag aus der PraesentationConfig, siehe
  // lib/share.ts) bzw. 1:1 aus der Konfiguration übernommen, damit der Kunde exakt die im
  // Vorbereitungsmodus getroffene Auswahl sieht statt wieder beim Default zu starten.
  initialeReferenzobjekte?: (Immobilie | null)[];
  initialerNavZustand?: NavZustandEintrag[];
  initialesPaket?: LeistungspaketId;
  initialesMaklervertragDaten?: MaklervertragDaten;
}) {
  const [activeId, setActiveId] = useState("begruessung");
  // Vorbereitungsmodus (siehe Vorbereitungsmodus.tsx) steht der eigentlichen Präsentation
  // voran, bis der Berater/die Beraterin "Präsentation starten" klickt — unabhängig davon, ob
  // die Präsentation über die Objektauswahl oder einen direkten OnOffice-Link (estateId in der
  // URL) aufgerufen wurde. Im readOnly-Modus (geteilter Kunden-Link) entfällt dieser Schritt
  // komplett, da die Konfiguration dort bereits feststeht.
  const [praesentationGestartet, setPraesentationGestartet] = useState(readOnly);
  const { navZustand, verschieben, umschalten, zuruecksetzen } = useNavZustand(NAV_ITEMS, initialerNavZustand);
  const [gewaehltesPaket, setGewaehltesPaket] = useState<LeistungspaketId | undefined>(initialesPaket);
  // Maklervertrag-Formulardaten liegen seit "Präsentation teilen" (siehe Maklervertrag.tsx)
  // hier statt lokal im Reiter selbst — damit sowohl der Share-Link (praesentationTeilen) als
  // auch die PDF-Downloads auf der Verabschiedungsseite (Verabschiedung.tsx) exakt die im
  // Beratungstermin eingegebenen/bearbeiteten Werte verwenden, nicht erneut die automatischen
  // Standardwerte (baueInitialdaten). Im geteilten Link kommt initialesMaklervertragDaten aus
  // der Konfiguration (siehe app/geteilt/page.tsx); live wird es wie zuvor aus den Objekt-/
  // Kundendaten vorausgefüllt.
  const [maklervertragDaten, setMaklervertragDaten] = useState<MaklervertragDaten>(
    () =>
      initialesMaklervertragDaten ??
      baueInitialdaten(daten.kunde, daten.weitereEigentuemer, daten.immobilie, daten.bewertung)
  );
  // Referenzobjekte im Vergleichswert-Reiter (siehe Vergleichswert.tsx) — hier (statt lokal im
  // Reiter selbst) gehalten, damit die Auswahl beim Wechsel zwischen Reitern erhalten bleibt,
  // analog zu gewaehltesPaket oben. Wird beim ersten Laden automatisch vorbefüllt (siehe
  // useEffect unten), bleibt danach aber genau wie vorher vollständig manuell anpassbar/austauschbar.
  // Auf ANZAHL_REFERENZOBJEKTE aufgefüllt, falls initialeReferenzobjekte (geteilter Link) weniger
  // Einträge hat, als es Slots gibt.
  const [referenzobjekte, setReferenzobjekte] = useState<(Immobilie | null)[]>(() =>
    initialeReferenzobjekte
      ? [...initialeReferenzobjekte, ...Array(ANZAHL_REFERENZOBJEKTE).fill(null)].slice(0, ANZAHL_REFERENZOBJEKTE)
      : Array(ANZAHL_REFERENZOBJEKTE).fill(null)
  );
  // Zeigt an, ob der Vorauswahl-Abruf unten noch läuft — damit der Vergleichswert-Reiter
  // währenddessen einen (kleinen) Ladezustand statt einfach nichts anzeigt, siehe
  // Vergleichswert.tsx (zeigtLadeplatzhalter). Start-Wert true, da der Abruf sofort beim Mounten
  // dieser Komponente losläuft (useEffect unten).
  const [vorauswahlLaedt, setVorauswahlLaedt] = useState(true);
  // Sidebar zeigt bei mehreren Eigentümern (Miteigentum/Erbengemeinschaft) jede Person auf einer
  // eigenen Zeile inkl. E-Mail/Telefon (siehe Sidebar.tsx, Chat-Vorgabe: "blende die Mailadresse
  // und Telefonnummer der Kunden in der dauerhaften Navi links ein") — Name bewusst nur Anrede +
  // Nachname (kurz, passt auch bei mehreren Personen in die schmale Sidebar); der vollständige
  // Name (inkl. Vorname) steht weiterhin auf der Begrüßungsseite, siehe Begruessung.tsx.
  const kundenKontakte = [daten.kunde, ...daten.weitereEigentuemer]
    .map((k) => ({
      name: [k.anrede, k.nachname].filter(Boolean).join(" "),
      email: k.email,
      telefon: k.telefon,
    }))
    .filter((k) => k.name);

  function referenzobjektAendern(index: number, objekt: Immobilie | null) {
    setReferenzobjekte((prev) => prev.map((o, i) => (i === index ? objekt : o)));
  }

  // Automatische Vorauswahl der Vergleichsobjekte (siehe lib/vergleichswert.ts,
  // waehleVorauswahl): läuft beim Laden der Präsentation — bewusst hier in PraesentationApp statt
  // in Vergleichswert.tsx, da der Vergleichswert-Reiter beim Wechsel zwischen Reitern
  // unmountet/wieder gemountet wird und der Effekt sonst bei jedem erneuten Öffnen des Reiters
  // erneut liefe. Holt den Vergleichspool (verkaufte UND aktuell aktiv vermarktete Objekte)
  // über denselben Endpunkt wie die manuelle Suche (siehe /api/onoffice/route.ts,
  // vergleichspool=1) und wendet die vom Nutzer vorgegebene, kaskadierende Filterlogik
  // (PLZ → Wohnfläche → Baujahr → Kaufpreis) an.
  // Überschreibt NUR den Ausgangszustand (alle Slots noch leer, siehe setReferenzobjekte
  // unten) — jede spätere manuelle Auswahl/Entfernung bleibt danach unangetastet, die Vorauswahl
  // ist also lediglich ein komfortabler Startwert, kein sich aufdrängendes Automatik-Feature.
  //
  // BEWUSST KEIN zusätzlicher "nur einmal ausführen"-Ref (z.B. useRef(false) mit Guard am
  // Effekt-Anfang): React/Next mountet Komponenten im Dev-Modus (React Strict Mode, im App Router
  // seit Next 13.4 standardmäßig aktiv) einmal probeweise, räumt sofort wieder auf und mountet
  // dann "echt" neu — genau um Effekte ohne sauberes Cleanup aufzudecken. Ein persistenter Ref
  // überlebt diesen Zyklus, das lokale `abgebrochen`-Flag der jeweiligen Effekt-Instanz aber auch
  // (es wird beim Probe-Unmount auf true gesetzt) — die Kombination führte dazu, dass der Probe-
  // Durchlauf seinen eigenen Abruf per `abgebrochen` verwarf UND der darauffolgende echte
  // Durchlauf wegen des bereits gesetzten Refs komplett übersprungen wurde: Im Dev-Modus (nicht
  // aber im Produktions-Build/Vercel, wo Strict Mode nicht doppelt mountet) lief die Vorauswahl
  // dadurch nie durch (siehe Praxis-Test mit "Hamweg 15" auf localhost). Ohne den Ref läuft der
  // Effekt im Dev-Modus zweimal unabhängig voneinander — der erste (Probe-)Durchlauf bricht sich
  // selbst per `abgebrochen` ab, der zweite (echte) läuft normal durch. Der
  // `prev.every(...)`-Check unten verhindert ohnehin ein doppeltes Anwenden des Vorschlags, falls
  // beide Durchläufe tatsächlich abschließen sollten.
  useEffect(() => {
    // Im readOnly-Modus (geteilter Kunden-Link) bringt initialConfig bereits eine feststehende
    // Auswahl mit (siehe lib/share.ts) — die automatische Vorauswahl soll diese nicht
    // überschreiben, der Ladezustand wird sofort beendet.
    if (readOnly) {
      setVorauswahlLaedt(false);
      return;
    }

    let abgebrochen = false;

    async function ladeVorauswahl() {
      try {
        const res = await fetch("/api/onoffice?limit=250&vergleichspool=1");
        if (!res.ok) return;
        const kandidaten = await res.json();
        if (abgebrochen || !Array.isArray(kandidaten)) return;

        const vorschlag = waehleVorauswahl(daten.immobilie, kandidaten, ANZAHL_REFERENZOBJEKTE);
        if (vorschlag.length === 0) return;

        setReferenzobjekte((prev) =>
          prev.every((o) => o === null)
            ? Array.from({ length: ANZAHL_REFERENZOBJEKTE }, (_, i) => vorschlag[i] ?? null)
            : prev
        );
      } catch {
        // Stiller Fehlschlag: Die Vorauswahl ist ein Komfort-Feature — schlägt der Abruf fehl,
        // bleibt die manuelle Suche im Vergleichswert-Reiter unverändert vollständig nutzbar.
      } finally {
        // Nur den NICHT abgebrochenen Durchlauf den Ladezustand beenden lassen — im Dev-Modus
        // (React Strict Mode Doppel-Mount, siehe Kommentar oben) würde der abgebrochene
        // Probe-Durchlauf sonst den Ladezustand bereits beenden, während der echte Abruf noch
        // läuft (kurzes, nur lokal auf localhost sichtbares Flackern).
        if (!abgebrochen) setVorauswahlLaedt(false);
      }
    }

    ladeVorauswahl();
    return () => {
      abgebrochen = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!praesentationGestartet) {
    return (
      <Vorbereitungsmodus
        titel={daten.immobilie.bezeichnung}
        kundenNamen={kundenKontakte.map((k) => k.name)}
        immobilie={daten.immobilie}
        referenzobjekte={referenzobjekte}
        onReferenzobjektAendern={referenzobjektAendern}
        vorauswahlLaedt={vorauswahlLaedt}
        navItems={NAV_ITEMS}
        navZustand={navZustand}
        onVerschieben={verschieben}
        onUmschalten={umschalten}
        onZuruecksetzen={zuruecksetzen}
        onStart={() => setPraesentationGestartet(true)}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen">
      <Sidebar
        navItems={NAV_ITEMS}
        activeId={activeId}
        onSelect={setActiveId}
        kundenKontakte={kundenKontakte}
        navZustand={navZustand}
        onVerschieben={verschieben}
        onUmschalten={umschalten}
        onZuruecksetzen={zuruecksetzen}
        bearbeitungErlaubt={!readOnly}
      />
      <main className="flex-1 overflow-hidden bg-reinweiss">
        {activeId === "begruessung" && (
          <Begruessung kunde={daten.kunde} weitereEigentuemer={daten.weitereEigentuemer} />
        )}
        {activeId === "kontaktperson" && (
          <Kontaktperson betreuer={daten.betreuer} setter={daten.setter} />
        )}
        {activeId === "unternehmen" && (
          <Unternehmen
            alleMitarbeiter={daten.alleMitarbeiter}
            kennzahlen={daten.unternehmenKennzahlen}
          />
        )}
        {activeId === "objekt" && (
          <Objektdaten
            immobilie={daten.immobilie}
            automatischeInteressenten={daten.automatischeInteressenten}
          />
        )}
        {activeId === "deepimmo" && <DeepImmo immobilie={daten.immobilie} />}
        {activeId === "kaeuferverhalten" && <Kaeuferverhalten />}
        {activeId === "preis-des-wartens" && <PreisDesWartens immobilie={daten.immobilie} />}
        {activeId === "dokumente" && <Dokumente dokumente={daten.dokumente} />}
        {activeId === "vergleich" && (
          <Vergleichswert
            immobilie={daten.immobilie}
            referenzobjekte={referenzobjekte}
            onReferenzobjektAendern={referenzobjektAendern}
            vorauswahlLaedt={vorauswahlLaedt}
            readOnly={readOnly}
          />
        )}
        {activeId === "leistungsversprechen" && (
          <Leistungsversprechen gewaehltesPaket={gewaehltesPaket} onWaehlePaket={setGewaehltesPaket} />
        )}
        {activeId === "maklervertrag" && (
          <Maklervertrag
            immobilie={daten.immobilie}
            gewaehltesPaket={gewaehltesPaket}
            referenzobjekte={referenzobjekte}
            navZustand={navZustand}
            daten={maklervertragDaten}
            onDatenChange={setMaklervertragDaten}
            readOnly={readOnly}
          />
        )}
        {activeId === "verabschiedung" && (
          <Verabschiedung
            kunde={daten.kunde}
            weitereEigentuemer={daten.weitereEigentuemer}
            immobilie={daten.immobilie}
            bewertung={daten.bewertung}
            betreuer={daten.betreuer}
            daten={maklervertragDaten}
            gewaehltesPaket={gewaehltesPaket}
            referenzobjekte={referenzobjekte.filter((o): o is Immobilie => o !== null)}
            shareParams={shareParams}
          />
        )}
      </main>
    </div>
  );
}
