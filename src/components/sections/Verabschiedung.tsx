"use client";

import { useState } from "react";
import Script from "next/script";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { Betreuer, Bewertung, Immobilie, Kunde, LeistungspaketId, MaklervertragDaten } from "@/types";

// bottimmo-Widget-Script — "afterInteractive", da das Widget der eigentliche Inhalt dieser Folie
// ist und beim Aufrufen zeitnah laden soll (nicht erst, wenn der Browser irgendwann Leerlaufzeit
// hat, wie bei "lazyOnload"). next/script dedupliziert selbst über die id, falls die Folie
// erneut gemountet wird (Wechsel zwischen Reitern).
const BOTTIMMO_SCRIPT_SRC =
  "https://components.bottimmo.com/components/6752d9b04a83ff4efdcf4c50/btm-widget/de-DE";

// Löst einen Datei-Download über einen POST-Aufruf aus (Blob → Object-URL → Klick auf ein
// unsichtbares <a> → Aufräumen) — für die beiden PDFs, deren Inhalt zu umfangreich für eine
// GET-Query ist (Maklervertrag, Gesamtpräsentation). Wirft bei Fehlschlag, der Aufrufer zeigt
// die Meldung an (siehe herunterladen() unten).
async function postUndHerunterladen(url: string, body: unknown, dateiname: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const fehlerdaten = await res.json().catch(() => null);
    throw new Error(fehlerdaten?.error || "Datei konnte nicht erstellt werden");
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = dateiname;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function DownloadZeile({
  icon,
  titel,
  beschreibung,
  onClick,
  href,
  laedt,
}: {
  icon: "document" | "check" | "lock" | "externalLink";
  titel: string;
  beschreibung: string;
  // Entweder onClick (POST-Download, siehe postUndHerunterladen) oder href (einfacher Link/GET) —
  // genau eines von beiden wird übergeben.
  onClick?: () => void;
  href?: string;
  laedt?: boolean;
}) {
  const inhalt = (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-reinweiss text-walnuss">
        <Icon name={icon} size={22} />
      </div>
      <div className="w-full min-w-0 flex-1">
        <p className="font-medium text-anthrazit">{titel}</p>
        <p className="mt-[2px] text-small text-anthrazit/60">{beschreibung}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-xs rounded-sm border-2 border-asche bg-reinweiss px-md py-xs font-medium text-anthrazit transition-colors hover:border-messing">
        {laedt ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-asche border-t-messing" />
        ) : (
          <Icon name="document" size={16} />
        )}
        {laedt ? "Wird erstellt …" : "Öffnen"}
      </span>
    </>
  );

  if (href) {
    return (
      <Card className="flex items-center gap-md">
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-md">
          {inhalt}
        </a>
      </Card>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={laedt} className="w-full text-left disabled:opacity-60">
      <Card className="flex items-center gap-md">{inhalt}</Card>
    </button>
  );
}

// Letzte Folie der Objektpräsentation: Abschluss/Verabschiedung, Ratgeber-Flyer (bottimmo) und
// die einzeln herunterladbaren Dokumente (Chat-Vorgabe September 2026: "Auf der
// Verabschiedungsseite sollte der Kunde dann die Möglichkeit haben alle Dateien einzeln
// herunterzuladen. Maklervertrag inkl. Widerruf, Leistungsversprechen, Wertermittlung,
// Gesamtpräsentation als pdf") — sichtbar sowohl live (Vorschau für den Berater/die Beraterin)
// als auch im geteilten, unveränderbaren Kunden-Link (siehe PraesentationApp.tsx). Die
// PDF-Routen (/api/pdf/*) akzeptieren dafür wahlweise die normale Session ODER das d/sig-Paar
// aus der URL des geteilten Links (siehe middleware.ts) — Letzteres wird hier über
// useSearchParams ausgelesen und an jeden Download angehängt, live sind d/sig einfach leer.
export function Verabschiedung({
  kunde,
  weitereEigentuemer,
  immobilie,
  bewertung,
  betreuer,
  daten,
  gewaehltesPaket,
  referenzobjekte,
  shareParams,
}: {
  kunde: Kunde;
  weitereEigentuemer: Kunde[];
  immobilie: Immobilie;
  bewertung: Bewertung;
  betreuer: Betreuer;
  daten: MaklervertragDaten;
  gewaehltesPaket?: LeistungspaketId;
  referenzobjekte: Immobilie[];
  // Nur im geteilten Kunden-Link gesetzt (siehe app/geteilt/page.tsx → PraesentationApp.tsx) —
  // als Props statt über useSearchParams() gelesen, damit diese Komponente nicht in einen
  // <Suspense>-Rand gewrappt werden muss (Next.js verlangt das für useSearchParams()) und live
  // (Session-Cookie reicht) schlicht undefined bleibt.
  shareParams?: { d: string; sig: string };
}) {
  const shareQuery = shareParams ? `d=${encodeURIComponent(shareParams.d)}&sig=${encodeURIComponent(shareParams.sig)}` : "";

  const [ladendeDatei, setLadendeDatei] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function herunterladen(id: string, aktion: () => Promise<void>) {
    setFehler(null);
    setLadendeDatei(id);
    try {
      await aktion();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Datei konnte nicht erstellt werden");
    } finally {
      setLadendeDatei(null);
    }
  }

  const nachname = kunde.nachname?.replace(/[^a-zA-Z0-9äöüÄÖÜß-]+/g, "_") || "Kunde";
  const mitQuery = (pfad: string) => (shareQuery ? `${pfad}${pfad.includes("?") ? "&" : "?"}${shareQuery}` : pfad);

  return (
    <SectionShell label="Verabschiedung" title="Vielen Dank für Ihre Zeit!">
      <Script id="bottimmo-widget-script" src={BOTTIMMO_SCRIPT_SRC} strategy="afterInteractive" />

      <p className="mb-lg max-w-[60ch] text-lg font-slab leading-[1.4] text-anthrazit">
        Wir freuen uns auf die weitere Zusammenarbeit. Hier finden Sie noch einmal alle Unterlagen
        zum Download sowie passend zu Ihrer Situation einen Ratgeber zum Mitnehmen.
      </p>

      <p className="label mb-sm">Ihre Unterlagen</p>
      <div className="mb-lg flex flex-col gap-sm">
        <DownloadZeile
          icon="document"
          titel="Maklervertrag inkl. Widerruf"
          beschreibung="Vertragsentwurf mit allen Objekt- und Kundendaten"
          laedt={ladendeDatei === "maklervertrag"}
          onClick={() =>
            herunterladen("maklervertrag", () =>
              postUndHerunterladen(
                mitQuery("/api/pdf/maklervertrag"),
                { kunde, immobilie, bewertung, daten, gewaehltesPaket },
                `Maklervertrag_${nachname}.pdf`
              )
            )
          }
        />
        <DownloadZeile
          icon="check"
          titel="Leistungsversprechen"
          beschreibung="Unsere Pakete und Leistungen im Detail"
          href={mitQuery(`/api/pdf/leistungsversprechen${gewaehltesPaket ? `?paket=${gewaehltesPaket}` : ""}`)}
        />
        <DownloadZeile
          icon="lock"
          titel="Datenschutzerklärung"
          beschreibung="Wie wir mit Ihren Daten umgehen"
          href={mitQuery("/api/pdf/datenschutz")}
        />
        {bewertung.pdfUrl && (
          <DownloadZeile
            icon="externalLink"
            titel="Wertermittlung"
            beschreibung="Das vollständige Wertgutachten zu Ihrer Immobilie"
            href={bewertung.pdfUrl}
          />
        )}
        <DownloadZeile
          icon="document"
          titel="Gesamtpräsentation"
          beschreibung="Alle wesentlichen Inhalte dieser Präsentation als ein Dokument"
          laedt={ladendeDatei === "gesamt"}
          onClick={() =>
            herunterladen("gesamt", () =>
              postUndHerunterladen(
                mitQuery("/api/pdf/gesamt"),
                { kunde, weitereEigentuemer, immobilie, bewertung, betreuer, daten, gewaehltesPaket, referenzobjekte },
                `Gesamtpraesentation_${nachname}.pdf`
              )
            )
          }
        />
      </div>
      {fehler && <p className="mb-lg text-small text-anthrazit/80">Fehler: {fehler}</p>}

      <p className="label mb-sm">Ratgeber</p>
      <Card>
        <btm-widget widget="list" slug="GUIDE" />
      </Card>
    </SectionShell>
  );
}
