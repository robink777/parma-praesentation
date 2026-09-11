import { PraesentationApp } from "@/components/layout/PraesentationApp";
import { ladePraesentationsDaten } from "@/lib/praesentation";
import { ladeImmobilieById } from "@/lib/onoffice/estate";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import { MOCK_IMMOBILIE, MOCK_VERGLEICHSPOOL } from "@/lib/onoffice/mock";
import { pruefeShareParameter } from "@/lib/share";
import { Immobilie } from "@/types";

// Kein Caching dieser Seite (analog zu app/page.tsx) — jeder Aufruf des geteilten Links soll
// die aktuellen Live-Daten aus onOffice zeigen, kein gecachter Snapshot vom Zeitpunkt des
// Teilens. Nur die Auswahl selbst (Vergleichsobjekte, Navigationspunkte, siehe
// PraesentationConfig in lib/share.ts) ist "eingefroren" — nicht die zugrunde liegenden
// Objekt-/Kundendaten.
export const dynamic = "force-dynamic";

// Löst die in der Konfiguration nur als IDs hinterlegten Vergleichsobjekte zu vollständigen
// Immobilie-Datensätzen auf — analog zum Mock/Live-Zweig in /api/onoffice/route.ts (dieselbe
// Unterscheidung, hier direkt als Server-Component-Funktion statt über einen zusätzlichen
// HTTP-Roundtrip gegen die eigene API).
async function ladeReferenzobjekte(ids: string[]): Promise<(Immobilie | null)[]> {
  if (ONOFFICE_MODE !== "live") {
    const pool = [MOCK_IMMOBILIE, ...MOCK_VERGLEICHSPOOL];
    return ids.map((id) => pool.find((i) => i.id === id) ?? null);
  }
  return Promise.all(ids.map((id) => ladeImmobilieById(id).catch(() => null)));
}

// Ziel des geteilten, unveränderbaren Präsentationslinks (Chat-Vorgabe September 2026: "Die
// geteilte Präsentation müsste unveränderbar sein"). Ersetzt den bisherigen "Mandat
// erteilen"-PDF-Download als Abschluss-Aktion (siehe Maklervertrag.tsx, "Präsentation teilen") —
// der Kunde öffnet stattdessen die gesamte, vom Berater/von der Beraterin im Vorbereitungsmodus
// konfigurierte Präsentation schreibgeschützt, ohne das interne App-Passwort zu benötigen (siehe
// middleware.ts: dieser Pfad ist von der APP_PASSWORD-Prüfung ausgenommen, Zugriffsschutz
// übernimmt stattdessen die Signaturprüfung unten).
export default async function GeteiltPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; sig?: string }>;
}) {
  const params = await searchParams;
  const config = await pruefeShareParameter(params.d ?? null, params.sig ?? null);

  if (!config) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-sm bg-reinweiss px-xl text-center">
        <p className="label">Nicht verfügbar</p>
        <h1 className="text-[28px] font-slab font-bold text-anthrazit">
          Dieser Link ist ungültig
        </h1>
        <p className="max-w-[50ch] text-body text-anthrazit/70">
          Bitte wenden Sie sich an Ihren Ansprechpartner bei Parma Immobilien für einen aktuellen
          Link zu Ihrer Präsentation.
        </p>
      </div>
    );
  }

  const [daten, referenzobjekte] = await Promise.all([
    ladePraesentationsDaten({ estateId: config.estateId, addressId: config.addressId }),
    ladeReferenzobjekte(config.referenzobjektIds),
  ]);

  return (
    <PraesentationApp
      daten={daten}
      readOnly
      initialeReferenzobjekte={referenzobjekte}
      initialerNavZustand={config.navZustand}
      initialesPaket={config.gewaehltesPaket}
      initialesMaklervertragDaten={config.maklervertragDaten}
      shareParams={{ d: params.d!, sig: params.sig! }}
    />
  );
}
