import { NextRequest, NextResponse } from "next/server";
import { erzeugeTvSignatur } from "@/lib/auth";

// Liefert den fertigen, dauerhaften TV-Vorführungs-Link (siehe app/tv/page.tsx, lib/auth.ts
// erzeugeTvSignatur) — Oktober 2026 Chat-Vorgabe: "ich hätte gerne einen Link generieren ... den
// ich dann auf den Fernsehern in den einzelnen Büros öffne". request.nextUrl.origin statt einer
// hartkodierten Domain, damit derselbe Code lokal (localhost) wie auf Vercel den jeweils
// richtigen Link liefert. Automatisch geschützt durch middleware.ts (istAdminApiPfad greift für
// alle Pfade unter /api/admin außer /api/admin-login) — nur mit Admin-Login abrufbar, der Link
// selbst braucht dann aber kein Passwort mehr (siehe dort).
export async function GET(request: NextRequest) {
  const sig = await erzeugeTvSignatur();
  const url = new URL("/tv", request.nextUrl.origin);
  url.searchParams.set("sig", sig);
  return NextResponse.json({ url: url.toString() });
}
