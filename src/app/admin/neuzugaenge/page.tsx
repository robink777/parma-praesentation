import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/layout/SectionShell";
import { formatiereBetrag } from "@/lib/berechnung";
import { ermittleNeuzugaengeZeitraum } from "@/lib/onoffice/mitarbeiterstatistik";
import { ladeNeueKundenListe, ladeNeueObjekteListe } from "@/lib/onoffice/estate";
import { NeuerKunde, NeuesObjekt } from "@/types";

// Kein Caching — Live-Abruf bei jedem Aufruf, analog zum restlichen Admin-Bereich (siehe
// lib/onoffice/client.ts, cache: "no-store").
export const dynamic = "force-dynamic";

// Detailseite hinter den "Neue Objekte"/"Neue Kunden"-Diagrammen der Übersicht (siehe
// components/admin/Neuzugaenge.tsx) — Nutzer-Vorgabe November 2026: "Ich hätte gerne irgendwie
// Zugriff auf die Objekte und Adressen die neu rein kommen, gerne als neue Liste wie bei den
// anderen Feldern" (gleiches Link-Muster wie die acht KPI-Kacheln der Übersicht, siehe
// app/admin/objektliste/page.tsx). Zeigt das GESAMTE 7-Tage-Fenster des Diagramms als eine Liste
// (nicht Tag für Tag einzeln aufklickbar) — jede Zeile trägt ihr eigenes Anlegedatum, damit die
// zeitliche Einordnung trotzdem sichtbar bleibt, ohne die SVG-Balken selbst klickbar machen zu
// müssen.
function formatiereZeitpunkt(iso: string): string {
  if (!iso) return "–";
  // "YYYY-MM-DD HH:mm:ss" -> "02.11.2026, 14:32 Uhr". Kein Date-Parsing nötig (und bei
  // "0000-00-00..." auch nicht sinnvoll möglich) — reine Stringzerlegung analog zu den anderen
  // Datumshelfern in onoffice/mitarbeiterstatistik.ts.
  const [datumsteil, zeitteil] = iso.split(" ");
  const [jahr, monat, tag] = (datumsteil ?? "").split("-");
  if (!jahr || !monat || !tag) return iso;
  const uhrzeit = zeitteil ? zeitteil.slice(0, 5) : null;
  return `${tag}.${monat}.${jahr}${uhrzeit ? `, ${uhrzeit} Uhr` : ""}`;
}

function ObjekteListe({ objekte }: { objekte: NeuesObjekt[] | undefined }) {
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
        <p className="text-body text-anthrazit/70">In diesem Zeitraum wurden keine Objekte angelegt.</p>
      </Card>
    );
  }
  return (
    <Card compact>
      <div className="flex flex-col">
        {objekte.map((objekt) => (
          <div
            key={objekt.id}
            className="flex items-center gap-sm border-b border-anthrazit/5 py-sm last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-anthrazit">{objekt.titel}</p>
              <p className="mt-[2px] truncate text-small text-anthrazit/50">
                <span className="font-mono">{objekt.objektnr}</span> · {objekt.status2Label} ·{" "}
                {formatiereZeitpunkt(objekt.erstelltAm)}
              </p>
            </div>
            <p className="shrink-0 text-body font-medium text-anthrazit">
              {objekt.preis > 0 ? formatiereBetrag(objekt.preis) : "–"}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function KundenListe({ kunden }: { kunden: NeuerKunde[] | undefined }) {
  if (kunden === undefined) {
    return (
      <Card compact className="text-center">
        <p className="text-body text-anthrazit/50">Adressen konnten nicht geladen werden.</p>
      </Card>
    );
  }
  if (kunden.length === 0) {
    return (
      <Card compact className="py-xl text-center">
        <p className="text-body text-anthrazit/70">In diesem Zeitraum wurden keine Adressen angelegt.</p>
      </Card>
    );
  }
  return (
    <Card compact>
      <div className="flex flex-col">
        {kunden.map((kunde) => (
          <div
            key={kunde.id}
            className="flex items-center gap-sm border-b border-anthrazit/5 py-sm last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-anthrazit">{kunde.name}</p>
              <p className="mt-[2px] truncate text-small text-anthrazit/50">{kunde.herkunft}</p>
            </div>
            <p className="shrink-0 text-small text-anthrazit/50">{formatiereZeitpunkt(kunde.eintragsdatum)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

type Art = "objekte" | "kunden";

export default async function NeuzugaengePage({
  searchParams,
}: {
  searchParams: Promise<{ art?: string }>;
}) {
  const { art: artParam } = await searchParams;
  const art: Art = artParam === "kunden" ? "kunden" : "objekte";
  const { von, bis } = ermittleNeuzugaengeZeitraum();

  const objekte = art === "objekte" ? await ladeNeueObjekteListe(von, bis).catch(() => undefined) : undefined;
  const kunden = art === "kunden" ? await ladeNeueKundenListe(von, bis).catch(() => undefined) : undefined;

  return (
    <div className="min-h-screen bg-stein">
      <header className="flex items-center gap-sm px-lg py-sm">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={104} height={26} priority />
        <div className="h-5 w-px bg-walnuss/15" />
        <p className="label">Admin-Bereich</p>
      </header>
      <main className="mx-auto max-w-content px-lg pb-xl">
        <Link href="/admin" className="mb-md inline-block text-small text-anthrazit/60 hover:text-anthrazit">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="mb-xs font-slab text-2xl font-bold text-anthrazit">
          {art === "kunden" ? "Neue Adressen" : "Neue Objekte"}
        </h1>
        <p className="mb-lg max-w-[65ch] text-body text-anthrazit/60">
          {art === "kunden"
            ? "Alle Adressen, die in den letzten 7 Tagen in OnOffice angelegt wurden (Feld Eintragsdatum)."
            : "Alle Objekte, die in den letzten 7 Tagen in OnOffice angelegt wurden (Feld erstellt_am) — unabhängig vom Status 2."}
        </p>

        {art === "kunden" ? <KundenListe kunden={kunden} /> : <ObjekteListe objekte={objekte} />}
      </main>
    </div>
  );
}
