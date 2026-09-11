import { NextRequest, NextResponse } from "next/server";
import { erstelleShareLink, PraesentationConfig } from "@/lib/share";

// Baut den signierten, unveränderbaren Präsentations-Link (siehe "Präsentation teilen" in
// Maklervertrag.tsx) aus der aktuellen Konfiguration des Beraters/der Beraterin (ausgewählte
// Vergleichsobjekte, Navigationspunkte, gewähltes Paket). Läuft bewusst als eigene API-Route
// statt clientseitig: Die Signatur (lib/share.ts, erzeugeShareSignatur) braucht AUTH_SECRET,
// das aus Sicherheitsgründen nicht ins Frontend-Bundle darf.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.estateId !== "string" ||
    !Array.isArray(body.referenzobjektIds) ||
    !Array.isArray(body.navZustand)
  ) {
    return NextResponse.json({ error: "Unvollständige Präsentations-Konfiguration" }, { status: 400 });
  }

  const config: PraesentationConfig = {
    estateId: body.estateId,
    addressId: typeof body.addressId === "string" ? body.addressId : undefined,
    referenzobjektIds: body.referenzobjektIds,
    navZustand: body.navZustand,
    gewaehltesPaket: typeof body.gewaehltesPaket === "string" ? body.gewaehltesPaket : undefined,
    maklervertragDaten:
      body.maklervertragDaten && typeof body.maklervertragDaten === "object" ? body.maklervertragDaten : undefined,
  };

  const url = await erstelleShareLink(new URL(request.url).origin, config);
  return NextResponse.json({ url });
}
