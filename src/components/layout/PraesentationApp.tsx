"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { NAV_ITEMS, NavZustandEintrag, erstelleStandardNavZustand, useNavZustand } from "./nav";
import { useAutoSpeichern } from "./useAutoSpeichern";
import { ParmaLoader } from "@/components/ParmaLoader";
import { SpeicherHinweis } from "./SpeicherHinweis";
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
import type { PraesentationConfig } from "@/lib/share";

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
  // Ob schon geprüft wurde, ob in onOffice ein gespeicherter Stand existiert (siehe Effekt unten)
  // — bis dahin weder Vorbereitungsmodus noch Präsentation zeigen (sonst blitzt bei bereits
  // konfigurierten Objekten kurz die Vorbereitungsseite auf), sondern einen Ladezustand.
  const [konfigGeprueft, setKonfigGeprueft] = useState(readOnly);
  const { navZustand, setNavZustand, verschieben, umschalten, zuruecksetzen } = useNavZustand(NAV_ITEMS, initialerNavZustand);
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
  // Erst true, wenn der aus onOffice geladene Stand bzw. die automatische Vorauswahl angewendet
  // ist (siehe Effekt unten) — ab dann speichert useAutoSpeichern jede Änderung zurück nach
  // onOffice. Bleibt false im geteilten Kunden-Link (unveränderbar) und im Demo-Modus (kein
  // onOffice-Objekt, an das eine Datei gehängt werden könnte).
  const [speichernVerfuegbar, setSpeichernVerfuegbar] = useState(false);
  // Wird true, sobald der Nutzer selbst etwas ändert (Vergleichsobjekt, Navigation, Paket,
  // Vertragsdaten) — erst dann wird in onOffice gespeichert, siehe useAutoSpeichern.ts.
  const [veraendert, setVeraendert] = useState(false);
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

  const { status: speicherStatus, setStatus: setSpeicherStatus } = useAutoSpeichern(
    {
      estateId: daten.immobilie.id,
      referenzobjektIds: referenzobjekte.filter((o): o is Immobilie => o !== null).map((o) => o.id),
      navZustand,
      gewaehltesPaket,
      maklervertragDaten,
    },
    speichernVerfuegbar && veraendert,
    `${praesentationGestartet}|${activeId}`
  );

  function referenzobjektAendern(index: number, objekt: Immobilie | null) {
    setVeraendert(true);
    setReferenzobjekte((prev) => prev.map((o, i) => (i === index ? objekt : o)));
  }

  const navVerschieben: typeof verschieben = (...args) => {
    setVeraendert(true);
    verschieben(...args);
  };
  const navUmschalten: typeof umschalten = (...args) => {
    setVeraendert(true);
    umschalten(...args);
  };
  const navZuruecksetzen = () => {
    setVeraendert(true);
    zuruecksetzen();
  };
  const paketWaehlen: typeof setGewaehltesPaket = (wert) => {
    setVeraendert(true);
    setGewaehltesPaket(wert);
  };
  const vertragsdatenAendern: typeof setMaklervertragDaten = (wert) => {
    setVeraendert(true);
    setMaklervertragDaten(wert);
  };

  // Automatische Vorauswahl der Vergleichsobjekte (siehe lib/vergleichswert.ts,
  // waehleVorauswahl): läuft beim Laden der Präsentation — bewusst hier in PraesentationApp statt
  // in Vergleichswert.tsx, da der Vergleichswert-Reiter beim Wechsel zwischen Reitern
  // unmountet/wieder gemountet wird und der Effekt sonst bei jedem erneuten Öffnen des Reiters
  // erneut liefe. Holt AUSSCHLIESSLICH tatsächlich verkaufte Objekte (siehe
  // /api/onoffice/route.ts, Parameter "vorauswahl") — bewusst enger als die manuelle Suche im
  // Vergleichswert-Reiter, die seit Chat-Vorgabe September 2026 den kompletten Kauf-Bestand
  // durchsucht ("Die erste Vorauswahl sollte aber bitte so bleiben wie gehabt und sich erstmal
  // nur auf tatsächlich verkaufte Objekte beziehen") — und wendet die vom Nutzer vorgegebene,
  // kaskadierende Filterlogik (PLZ → Wohnfläche → Baujahr → Kaufpreis) an.
  // Ist für dieses Objekt bereits ein Stand in onOffice gespeichert (siehe useAutoSpeichern.ts,
  // /api/praesentation-konfig), wird dieser stattdessen geladen und die Vorauswahl übersprungen —
  // die Vorauswahl liefert nur den Startwert für eine noch nie bearbeitete Präsentation.
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

    // Liefert den Vorschlag statt ihn selbst anzuwenden — der Aufrufer wendet ihn zusammen mit
    // dem Beenden des Ladezustands (vorauswahlLaedt) in einem Schritt an.
    async function ladeVorauswahl(): Promise<Immobilie[]> {
      try {
        const res = await fetch("/api/onoffice?limit=250&vorauswahl=1");
        if (!res.ok) return [];
        const kandidaten = await res.json();
        if (!Array.isArray(kandidaten)) return [];
        return waehleVorauswahl(daten.immobilie, kandidaten, ANZAHL_REFERENZOBJEKTE);
      } catch {
        // Stiller Fehlschlag: Die Vorauswahl ist ein Komfort-Feature — schlägt der Abruf fehl,
        // bleibt die manuelle Suche im Vergleichswert-Reiter unverändert vollständig nutzbar.
        return [];
      }
    }

    // Gespeicherter Stand aus onOffice (siehe /api/praesentation-konfig): null = nichts
    // gespeichert, Abruf nicht möglich (Demo-Modus) oder fehlgeschlagen — dann läuft wie bisher
    // die automatische Vorauswahl.
    async function ladeGespeichert(): Promise<{ verfuegbar: boolean; config: PraesentationConfig | null }> {
      try {
        const res = await fetch(`/api/praesentation-konfig?estateId=${encodeURIComponent(daten.immobilie.id)}`);
        if (!res.ok) return { verfuegbar: false, config: null };
        const antwort = await res.json();
        return { verfuegbar: antwort.verfuegbar === true, config: antwort.config ?? null };
      } catch {
        return { verfuegbar: false, config: null };
      }
    }

    async function ladeReferenzobjekte(ids: string[]): Promise<(Immobilie | null)[]> {
      return Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/onoffice?id=${encodeURIComponent(id)}`);
            return res.ok ? ((await res.json()) as Immobilie) : null;
          } catch {
            return null;
          }
        })
      );
    }

    // Gespeicherte Navigation an die aktuellen NAV_ITEMS angleichen: entfernte Punkte fallen
    // weg, seit dem Speichern neu hinzugekommene erscheinen mit ihrem Standardzustand.
    function gleicheNavAb(gespeichert: NavZustandEintrag[]): NavZustandEintrag[] {
      const standard = erstelleStandardNavZustand(NAV_ITEMS);
      const bekannt = new Set(standard.map((e) => e.id));
      const behalten = gespeichert.filter((e) => bekannt.has(e.id));
      const fehlend = standard.filter((e) => !behalten.some((b) => b.id === e.id));
      return [...behalten, ...fehlend];
    }

    async function starten() {
      const { verfuegbar, config } = await ladeGespeichert();
      if (abgebrochen) return;

      // Ob gespeichert werden kann, steht jetzt fest — bewusst VOR der (bei onOffice teils
      // >10 Sekunden dauernden) Vorauswahl: Wer "Präsentation starten" klickt oder die Seite
      // verlässt, bevor sie fertig ist, soll trotzdem sofort eine Datei in onOffice bekommen.
      setSpeichernVerfuegbar(verfuegbar);
      if (!config) setKonfigGeprueft(true);

      if (config) {
        const geladeneObjekte = await ladeReferenzobjekte(config.referenzobjektIds);
        if (abgebrochen) return;
        setReferenzobjekte(
          [...geladeneObjekte, ...Array(ANZAHL_REFERENZOBJEKTE).fill(null)].slice(0, ANZAHL_REFERENZOBJEKTE)
        );
        setNavZustand(gleicheNavAb(config.navZustand));
        setGewaehltesPaket(config.gewaehltesPaket);
        if (config.maklervertragDaten) setMaklervertragDaten(config.maklervertragDaten);
        setSpeicherStatus({ art: "geladen" });
        setSpeichernVerfuegbar(true);
        // Wurde der Stand gespeichert, bevor die (langsame) Vorauswahl fertig war, enthält die
        // Datei noch keine Vergleichsobjekte — dann wird die Vorauswahl jetzt nachgeholt (siehe
        // unten), statt dauerhaft mit leeren Slots zu starten.
        const ohneVergleichsobjekte = geladeneObjekte.every((o) => o === null);
        setVorauswahlLaedt(ohneVergleichsobjekte);
        // Bereits konfiguriertes Objekt: direkt in die Präsentation (Chat-Vorgabe September 2026:
        // "nach der ersten Voreinstellung nicht mehr auf die Vorbereitungsseite zurückgeführt ...
        // standardmäßig in der Präsentation landen") — zurück zur Vorbereitung geht über die
        // Sidebar (onZurVorbereitung).
        setPraesentationGestartet(true);
        setKonfigGeprueft(true);

        if (ohneVergleichsobjekte) {
          const nachgeholt = await ladeVorauswahl();
          if (abgebrochen) return;
          if (nachgeholt.length > 0) {
            setReferenzobjekte((prev) =>
              prev.every((o) => o === null)
                ? Array.from({ length: ANZAHL_REFERENZOBJEKTE }, (_, i) => nachgeholt[i] ?? null)
                : prev
            );
            setVeraendert(true);
          }
          setVorauswahlLaedt(false);
        }
        return;
      }

      const vorschlag = await ladeVorauswahl();
      if (abgebrochen) return;
      if (vorschlag.length > 0) {
        setReferenzobjekte((prev) =>
          prev.every((o) => o === null)
            ? Array.from({ length: ANZAHL_REFERENZOBJEKTE }, (_, i) => vorschlag[i] ?? null)
            : prev
        );
      }
      // Nur den NICHT abgebrochenen Durchlauf den Ladezustand beenden lassen — im Dev-Modus
      // (React Strict Mode Doppel-Mount, siehe Kommentar oben) würde der abgebrochene
      // Probe-Durchlauf sonst den Ladezustand bereits beenden, während der echte Abruf noch
      // läuft (kurzes, nur lokal auf localhost sichtbares Flackern).
      setVorauswahlLaedt(false);
    }

    starten();
    return () => {
      abgebrochen = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!konfigGeprueft) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-reinweiss">
        <ParmaLoader label="Präsentation wird geladen" size={120} />
      </div>
    );
  }

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
        onVerschieben={navVerschieben}
        onUmschalten={navUmschalten}
        onZuruecksetzen={navZuruecksetzen}
        speicherStatus={speicherStatus}
        onStart={() => {
          // Der Start gilt als abgeschlossene Voreinstellung: auch ohne weitere Änderung wird der
          // Stand gespeichert, damit ein Neuladen direkt in der Präsentation landet.
          setVeraendert(true);
          setPraesentationGestartet(true);
        }}
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
        onVerschieben={navVerschieben}
        onUmschalten={navUmschalten}
        onZuruecksetzen={navZuruecksetzen}
        bearbeitungErlaubt={!readOnly}
        onZurVorbereitung={readOnly ? undefined : () => setPraesentationGestartet(false)}
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
          // readOnly hier bewusst fest statt aus der readOnly-Prop von PraesentationApp: Die
          // Auswahl der Vergleichsobjekte findet ausschließlich im Vorbereitungsmodus statt (siehe
          // Vorbereitungsmodus.tsx, dieselbe Komponente dort ohne readOnly) — im eigentlichen
          // Präsentations-Reiter (egal ob live vor dem Kunden oder über den geteilten Link)
          // sollen weder leere Suchkacheln noch das Entfernen-Icon erscheinen.
          <Vergleichswert
            immobilie={daten.immobilie}
            referenzobjekte={referenzobjekte}
            onReferenzobjektAendern={referenzobjektAendern}
            vorauswahlLaedt={vorauswahlLaedt}
            readOnly
          />
        )}
        {activeId === "leistungsversprechen" && (
          <Leistungsversprechen gewaehltesPaket={gewaehltesPaket} onWaehlePaket={paketWaehlen} />
        )}
        {activeId === "maklervertrag" && (
          <Maklervertrag
            immobilie={daten.immobilie}
            gewaehltesPaket={gewaehltesPaket}
            referenzobjekte={referenzobjekte}
            navZustand={navZustand}
            daten={maklervertragDaten}
            onDatenChange={vertragsdatenAendern}
            readOnly={readOnly}
          />
        )}
        {activeId === "verabschiedung" && (
          <Verabschiedung
            kunde={daten.kunde}
            immobilie={daten.immobilie}
            bewertung={daten.bewertung}
            daten={maklervertragDaten}
            gewaehltesPaket={gewaehltesPaket}
            shareParams={shareParams}
          />
        )}
      </main>
      {!readOnly && (
        <SpeicherHinweis
          status={speicherStatus}
          className="pointer-events-none fixed bottom-sm right-md rounded-sm bg-reinweiss/90 px-sm py-xs"
        />
      )}
    </div>
  );
}
