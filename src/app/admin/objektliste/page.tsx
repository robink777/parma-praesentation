import Image from "next/image";
import Link from "next/link";
import { istObjektlistenAnsicht, ObjektlisteKarte } from "@/components/admin/ObjektlisteKarte";
import { ladeNutzerNamen } from "@/lib/onoffice/estate";
import { ladeObjektlisteFuerKategorie } from "@/lib/onoffice/mitarbeiterstatistik";

// Kein Caching — Live-Abruf bei jedem Aufruf, analog zum restlichen Admin-Bereich (siehe
// lib/onoffice/client.ts, cache: "no-store").
export const dynamic = "force-dynamic";

// Detailseite hinter JEDER der acht KPI-Kacheln der Übersicht (siehe baueUebersichtKacheln in
// components/shared/KpiKachel.tsx) — Nutzer-Vorgabe November 2026: "Ich hätte gerne dass man aus
// der Gesamtübersicht in die jeweiligen Listen navigieren kann. Ähnlich wie bei den
// Fehlermeldungen bei z.b. Provisionsvorlauf gesamt, aber überall." Gleiches Seiten-Grundgerüst
// wie app/admin/provisionsfehler/page.tsx (dessen "N ohne Angabe"-Link weiterhin separat
// bestehen bleibt, siehe hinweisHref in KpiKachel.tsx), hier aber über die VOLLSTÄNDIGE,
// ungefilterte Objektmenge je Kategorie statt nur der Fehler-Teilmenge. Mehrere Kacheln teilen
// sich dieselbe Kategorie (z.B. "Verkaufte Objekte", "Gesamtvolumen" UND "Provisionsvolumen
// {Jahr}" sind alle "verkauftJahr") und landen deshalb bewusst auf derselben Liste — das ist
// gewollt, nicht übersehen: alle drei Kennzahlen errechnen sich aus exakt derselben Objektmenge.
const KATEGORIE_TEXT = {
  verkauftJahr: {
    titel: (jahr: number) => `Verkaufte Objekte ${jahr}`,
    beschreibung: (jahr: number) =>
      `Alle im laufenden Kalenderjahr (${jahr}) verkauften Objekte (verkauft_am) — Grundlage für "Verkaufte Objekte", "Gesamtvolumen" und "Provisionsvolumen" ${jahr}.`,
  },
  aktiv: {
    titel: () => "Aktive Vermarktung",
    beschreibung: () => 'Alle Objekte mit status = 1 (Aktiv) und vermarktungsart = kauf — Grundlage für "Aktive Vermarktung gesamt".',
  },
  aufarbeitung: {
    titel: () => "In Aufarbeitung",
    beschreibung: () =>
      'Alle Objekte mit status = 2 (Inaktiv), status2 = vorbereitung und vermarktungsart = kauf — Grundlage für "In Aufarbeitung gesamt".',
  },
  alle: {
    titel: () => "Aktive Vermarktung + Aufarbeitung",
    beschreibung: () =>
      'Aktive Vermarktung UND Aufarbeitung zusammen — Grundlage für "Objektvolumen gesamt", "Provisionsvorlauf gesamt" und "Ø Vermarktungsdauer".',
  },
} as const;

type Kategorie = keyof typeof KATEGORIE_TEXT;

function istKategorie(wert: string | undefined): wert is Kategorie {
  return wert === "verkauftJahr" || wert === "aktiv" || wert === "aufarbeitung" || wert === "alle";
}

export default async function ObjektlistePage({
  searchParams,
}: {
  searchParams: Promise<{ kategorie?: string; ansicht?: string }>;
}) {
  const { kategorie: kategorieParam, ansicht: ansichtParam } = await searchParams;
  const kategorie: Kategorie = istKategorie(kategorieParam) ? kategorieParam : "aktiv";
  const ansicht = istObjektlistenAnsicht(ansichtParam) ? ansichtParam : "monat";
  const jahr = new Date().getFullYear();
  const text = KATEGORIE_TEXT[kategorie];

  const [objekte, namen] = await Promise.all([
    ladeObjektlisteFuerKategorie(kategorie).catch(() => undefined),
    ladeNutzerNamen().catch(() => ({}) as Record<string, string>),
  ]);

  return (
    <div className="min-h-screen bg-stein">
      <header className="flex items-center gap-sm px-lg py-sm">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={104} height={26} priority />
        <div className="h-5 w-px bg-walnuss/15" />
        <p className="label">Admin-Bereich</p>
      </header>
      <main className="mx-auto max-w-[1600px] px-lg pb-xl">
        <Link href="/admin" className="mb-md inline-block text-small text-anthrazit/60 hover:text-anthrazit">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="mb-xs font-slab text-2xl font-bold text-anthrazit">{text.titel(jahr)}</h1>
        <p className="mb-lg max-w-[65ch] text-body text-anthrazit/60">{text.beschreibung(jahr)}</p>

        <ObjektlisteKarte
          objekte={objekte}
          leerText="Keine Objekte in dieser Kategorie gefunden."
          namen={namen}
          ansicht={ansicht}
          ansichtHref={{
            monat: `/admin/objektliste?kategorie=${kategorie}&ansicht=monat`,
            strasse: `/admin/objektliste?kategorie=${kategorie}&ansicht=strasse`,
          }}
          datumsfeld={kategorie === "verkauftJahr" ? "verkauftAm" : "auftragVon"}
          zeigeDauer={kategorie !== "verkauftJahr"}
        />
      </main>
    </div>
  );
}
