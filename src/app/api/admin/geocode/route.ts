import { NextRequest, NextResponse } from "next/server";

// Geocodiert EINE Adresse über Nominatim (OpenStreetMap, kein API-Key nötig) — Chat-Vorgabe
// Oktober 2026: "für die Immobilien, die wir als Adresse gelistet haben, in der jeweiligen
// Postleitzahl die Pins setzen, wenn ich anklicke". Bewusst eine Adresse pro Aufruf statt eines
// Batch-Endpunkts: der Client (Objektkarte.tsx) ruft diese Route selbst sequenziell mit Pause
// zwischen den Aufrufen auf, statt hier serverseitig viele Adressen in einem Request
// abzuarbeiten — das hält Nominatims Nutzungsrichtlinie (max. 1 Anfrage/Sekunde) ein UND
// vermeidet, dass ein einzelner Serverless-Aufruf bei einer PLZ mit vielen Objekten in ein
// Timeout läuft (bei z.B. 80 Adressen á ~1s wäre das über eine Minute in einem einzigen Request).
// Gleicher Dienst/User-Agent wie im früheren standort-karte-Skill (scripts/geocode.mjs), der für
// Einzelobjekt-Lagekarten denselben Ansatz nutzt. Automatisch geschützt durch middleware.ts
// (istAdminApiPfad greift für alle Pfade unter /api/admin außer /api/admin-login).
export async function GET(request: NextRequest) {
  const adresse = new URL(request.url).searchParams.get("adresse");
  if (!adresse) {
    return NextResponse.json({ error: "Parameter 'adresse' fehlt" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", adresse);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "de");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Parma-Standortkarte/1.0 (info@parmaimmobilien.de)" },
    });
    // Ein nicht-ok Status von NOMINATIM (z.B. 429 "Too many requests", bei intensivem Testen an
    // einem Tag live beobachtet Oktober 2026) MUSS sich von "Adresse nicht gefunden"
    // unterscheiden lassen — sonst würde Objektkarte.tsx eine nur vorübergehende Überlastung des
    // kostenlosen Dienstes dauerhaft (auch über localStorage, siehe dort) als "keine Koordinate
    // gefunden" merken, obwohl ein späterer erneuter Versuch funktionieren würde. Eigener
    // Fehlerstatus statt 200 mit lat:null, damit der Client das unterscheiden und den Treffer
    // NICHT cachen kann (siehe die antwort.ok-Prüfung dort).
    if (!res.ok) {
      return NextResponse.json({ lat: null, lon: null, ueberlastet: res.status === 429 }, { status: 502 });
    }

    const treffer = (await res.json()) as { lat: string; lon: string }[];
    if (treffer.length === 0) return NextResponse.json({ lat: null, lon: null });

    return NextResponse.json({ lat: parseFloat(treffer[0].lat), lon: parseFloat(treffer[0].lon) });
  } catch (error) {
    console.error("Geocoding fehlgeschlagen für Adresse:", adresse, error);
    return NextResponse.json({ lat: null, lon: null }, { status: 502 });
  }
}
