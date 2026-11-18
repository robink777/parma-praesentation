import { NextRequest, NextResponse } from "next/server";
import { quittiereUrlaubsWarnung } from "@/lib/urlaub/abgleich";

// Markiert eine Urlaubs-Warnung als gesehen (siehe lib/urlaub/abgleich.ts). Geschützt durch
// middleware.ts (istAdminApiPfad: alle Pfade unter /api/admin brauchen die Admin-Anmeldung).
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { schluessel?: unknown } | null;
  const schluessel = typeof body?.schluessel === "string" ? body.schluessel : "";
  if (!schluessel) {
    return NextResponse.json({ error: "schluessel fehlt" }, { status: 400 });
  }
  try {
    const ok = await quittiereUrlaubsWarnung(schluessel);
    return NextResponse.json({ ok });
  } catch (error) {
    console.error("Urlaubs-Warnung konnte nicht quittiert werden:", error);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}
