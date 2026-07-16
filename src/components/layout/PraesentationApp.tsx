"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { NAV_ITEMS } from "./nav";
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
import { Maklervertrag } from "@/components/sections/Maklervertrag";
import { waehleVorauswahl } from "@/lib/vergleichswert";

// Anzahl der Vergleichsobjekt-Slots im Vergleichswert-Reiter (Juli 2026 Chat-Vorgabe: "Mache aus
// den 3 Vergleichsobjekten bitte 6") — eine einzige Stelle statt eines an mehreren Stellen
// wiederholten Zahlenwerts, damit eine künftige erneute Anpassung nicht wieder an mehreren Stellen
// synchron gehalten werden muss.
const ANZAHL_REFERENZOBJEKTE = 6;

export function PraesentationApp({ daten }: { daten: Praesentation }) {
  const [activeId, setActiveId] = useState("begruessung");
  const [gewaehltesPaket, setGewaehltesPaket] = useState<LeistungspaketId | undefined>();
  // Referenzobjekte im Vergleichswert-Reiter (siehe Vergleichswert.tsx) — hier (statt lokal im
  // Reiter selbst) gehalten, damit die Auswahl beim Wechsel zwischen Reitern erhalten bleibt,
  // analog zu gewaehltesPaket oben. Wird beim ersten Laden automatisch vorbefüllt (siehe
  // useEffect unten), bleibt danach aber genau wie vorher vollständig manuell anpassbar/austauschbar.
  const [referenzobjekte, setReferenzobjekte] = useState<(Immobilie | null)[]>(
    Array(ANZAHL_REFERENZOBJEKTE).fill(null)
  );
  // Zeigt an, ob der Vorauswahl-Abruf unten noch läuft — damit der Vergleichswert-Reiter
  // währenddessen einen (kleinen) Ladezustand statt einfach nichts anzeigt, siehe
  // Vergleichswert.tsx (zeigtLadeplatzhalter). Start-Wert true, da der Abruf sofort beim Mounten
  // dieser Komponente losläuft (useEffect unten).
  const [vorauswahlLaedt, setVorauswahlLaedt] = useState(true);
  // Sidebar zeigt bei mehreren Eigentümern (Miteigentum/Erbengemeinschaft) jede Person auf einer
  // eigenen Zeile (siehe Sidebar.tsx) — bewusst nur Anrede + Nachname (kurz, passt auch bei
  // mehreren Zeilen in die schmale Sidebar); der vollständige Name (inkl. Vorname) steht weiterhin
  // auf der Begrüßungsseite, siehe Begruessung.tsx.
  const kundeNamen = [daten.kunde, ...daten.weitereEigentuemer]
    .map((k) => [k.anrede, k.nachname].filter(Boolean).join(" "))
    .filter(Boolean);

  function referenzobjektAendern(index: number, objekt: Immobilie | null) {
    setReferenzobjekte((prev) => prev.map((o, i) => (i === index ? objekt : o)));
  }

  // Automatische Vorauswahl der Vergleichsobjekte (siehe lib/vergleichswert.ts,
  // waehleVorauswahl): läuft beim Laden der Präsentation — bewusst hier in PraesentationApp statt
  // in Vergleichswert.tsx, da der Vergleichswert-Reiter beim Wechsel zwischen Reitern
  // unmountet/wieder gemountet wird und der Effekt sonst bei jedem erneuten Öffnen des Reiters
  // erneut liefe. Holt den Pool tatsächlich verkaufter Objekte über denselben Endpunkt wie die
  // manuelle Suche (siehe /api/onoffice/route.ts, verkauft=1) und wendet die vom Nutzer
  // vorgegebene, kaskadierende Filterlogik (PLZ → Wohnfläche → Baujahr → Kaufpreis) an.
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
    let abgebrochen = false;

    async function ladeVorauswahl() {
      try {
        const res = await fetch("/api/onoffice?limit=250&verkauft=1");
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

  return (
    <div className="flex h-screen w-screen">
      <Sidebar navItems={NAV_ITEMS} activeId={activeId} onSelect={setActiveId} kundeNamen={kundeNamen} />
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
          />
        )}
        {activeId === "leistungsversprechen" && (
          <Leistungsversprechen gewaehltesPaket={gewaehltesPaket} onWaehlePaket={setGewaehltesPaket} />
        )}
        {activeId === "maklervertrag" && (
          <Maklervertrag
            kunde={daten.kunde}
            weitereEigentuemer={daten.weitereEigentuemer}
            immobilie={daten.immobilie}
            bewertung={daten.bewertung}
            gewaehltesPaket={gewaehltesPaket}
          />
        )}
      </main>
    </div>
  );
}
