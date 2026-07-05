"use client";

import { useRef } from "react";
import Image from "next/image";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { Betreuer } from "@/types";

function initialen(vorname: string, nachname: string) {
  return `${vorname.charAt(0)}${nachname.charAt(0)}`.toUpperCase() || "?";
}

// tel:-Links benötigen die reine Ziffernfolge (inkl. führendem "+") ohne Klammern/Leerzeichen,
// damit Telefon-Apps die Nummer zuverlässig erkennen — die Anzeige bleibt trotzdem lesbar
// formatiert (z.B. "(+49) 157 38311348").
function telHref(nummer: string) {
  return `tel:${nummer.replace(/[^0-9+]/g, "")}`;
}

// OnOffice liefert die URL i.d.R. ohne Protokoll (z.B. "www.parmaimmobilien.de") — für einen
// funktionierenden Link muss https:// ergänzt werden, sofern nicht bereits vorhanden.
function urlHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Einzelne Karte im "weitere Mitarbeiter"-Slider — kompaktere Variante der Hauptkarte oben,
// zeigt nur Bild, Name, Rolle sowie Telefon/E-Mail, sofern hinterlegt.
function MitarbeiterCard({ mitarbeiter }: { mitarbeiter: Betreuer }) {
  const name = [mitarbeiter.vorname, mitarbeiter.nachname].filter(Boolean).join(" ");

  return (
    <Card className="flex w-64 shrink-0 snap-start flex-col items-center gap-sm text-center">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sand">
        {mitarbeiter.profilbildUrl ? (
          <Image
            src={mitarbeiter.profilbildUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-slab text-lg font-bold text-walnuss">
            {initialen(mitarbeiter.vorname, mitarbeiter.nachname)}
          </div>
        )}
      </div>

      <div className="w-full min-w-0">
        <p className="break-words font-medium text-anthrazit">{name}</p>
        {mitarbeiter.rolle && (
          <p className="mt-[2px] break-words text-small text-anthrazit/60">{mitarbeiter.rolle}</p>
        )}
      </div>

      {/* Karte hat eine feste Breite (w-64), Telefon/E-Mail-Adressen sind aber lange,
          leerzeichenfreie Zeichenketten ohne natürliche Umbruchstellen. In einem Flex-Container
          mit items-center wird ein Kind sonst NICHT auf die Container-Breite gestaucht, sondern
          bekommt (auch bei begrenztem Platz) mindestens seine "min-content"-Breite — bei einem
          unbrechbaren Token entspricht das der vollen Textlänge, wodurch der Text über den
          Kartenrand hinaus lief und benachbarte Karten im Slider überlagerte. min-w-0 erlaubt dem
          Flex-Item, unter seine min-content-Breite zu schrumpfen; break-words erlaubt dann den
          Zeilenumbruch mitten im Wort/der Adresse statt eines Overflows. */}
      {(mitarbeiter.telefon || mitarbeiter.email) && (
        <div className="flex w-full min-w-0 flex-col items-center gap-[2px]">
          {mitarbeiter.telefon && (
            <a
              href={telHref(mitarbeiter.telefon)}
              className="flex w-full min-w-0 items-center justify-center gap-xs text-small text-anthrazit/80 hover:text-messing"
            >
              <Icon name="phone" size={14} className="shrink-0" />
              <span className="min-w-0 break-words">{mitarbeiter.telefon}</span>
            </a>
          )}
          {mitarbeiter.email && (
            <a
              href={`mailto:${mitarbeiter.email}`}
              className="flex w-full min-w-0 items-center justify-center gap-xs text-small text-anthrazit/80 hover:text-messing"
            >
              <Icon name="mail" size={14} className="shrink-0" />
              <span className="min-w-0 break-words">{mitarbeiter.email}</span>
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

// Horizontaler Slider für die übrigen Kolleg:innen der Agentur (objektunabhängig, siehe
// lib/onoffice/estate.ts, ladeAlleMitarbeiter). Nutzt natives Scroll-Snapping statt
// Index-basiertem State — die Pfeil-Buttons scrollen den Container, Drag/Wischen auf
// Touch-Geräten funktioniert dadurch automatisch mit.
function WeitereMitarbeiterSlider({ mitarbeiter }: { mitarbeiter: Betreuer[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(richtung: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: richtung * 280, behavior: "smooth" });
  }

  if (mitarbeiter.length === 0) return null;

  return (
    <div className="mt-lg">
      <div className="mb-sm flex items-center justify-between">
        <h3>Weitere Mitarbeiter</h3>
        <div className="flex gap-xs">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Zurück"
            className="rounded-sm border-2 border-asche bg-reinweiss p-xs text-anthrazit transition-colors hover:border-messing"
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Weiter"
            className="rounded-sm border-2 border-asche bg-reinweiss p-xs text-anthrazit transition-colors hover:border-messing"
          >
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-md overflow-x-auto scroll-smooth pb-xs"
      >
        {mitarbeiter.map((m) => (
          <MitarbeiterCard key={m.id || `${m.vorname}-${m.nachname}`} mitarbeiter={m} />
        ))}
      </div>
    </div>
  );
}

// Zeigt den für das Objekt zuständigen Betreuer (Immobilienberater/in) mit Profilbild und
// Kontaktdaten. Wird über OnOffice befüllt (siehe lib/onoffice/estate.ts, ladeBetreuerByEstateId)
// — solange kein Profilbild hinterlegt ist, erscheint bewusst ein Initialen-Avatar statt eines
// generischen Platzhalterfotos. Darunter zeigt ein Slider die übrigen Mitarbeiter der Agentur
// (siehe WeitereMitarbeiterSlider oben).
export function Kontaktperson({
  betreuer,
  weitereMitarbeiter,
}: {
  betreuer: Betreuer;
  weitereMitarbeiter: Betreuer[];
}) {
  const name = [betreuer.anrede, betreuer.vorname, betreuer.nachname].filter(Boolean).join(" ");
  const plzOrt = [betreuer.plz, betreuer.ort].filter(Boolean).join(" ");
  const hatAdresse = Boolean(betreuer.strasse || plzOrt);

  return (
    <SectionShell label="Ihre Kontaktperson" title="Ihr Ansprechpartner bei Parma">
      <Card className="flex flex-col items-start gap-lg md:flex-row md:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-sand">
          {betreuer.profilbildUrl ? (
            <Image
              src={betreuer.profilbildUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-slab text-3xl font-bold text-walnuss">
              {initialen(betreuer.vorname, betreuer.nachname)}
            </div>
          )}
        </div>

        <div className="w-full min-w-0">
          <p className="break-words font-slab text-2xl font-bold text-anthrazit">{name}</p>
          {betreuer.rolle && <p className="label mt-xs break-words">{betreuer.rolle}</p>}
          {betreuer.firma && <p className="mt-xs break-words text-body text-anthrazit/70">{betreuer.firma}</p>}

          {/* w-full + min-w-0 auf jeder Zeile: ohne min-w-0 stauchen sich lange, leerzeichenfreie
              Werte (v.a. E-Mail/URL) in einem Flex-Layout nicht unter ihre "min-content"-Breite
              und liefen bei schmalen Viewports über den Kartenrand hinaus (siehe gleiches Problem
              und ausführlicher Kommentar bei MitarbeiterCard oben im "weitere Mitarbeiter"-Slider). */}
          <div className="mt-md flex w-full min-w-0 flex-col gap-xs">
            {hatAdresse && (
              <div className="flex w-full min-w-0 items-start gap-xs text-body text-anthrazit/90">
                <Icon name="location" size={18} className="mt-[2px] shrink-0" />
                <span className="min-w-0 break-words">
                  {betreuer.strasse}
                  {betreuer.strasse && plzOrt && <br />}
                  {plzOrt}
                </span>
              </div>
            )}
            {betreuer.telefon && (
              <a
                href={telHref(betreuer.telefon)}
                className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
              >
                <Icon name="phone" size={18} className="shrink-0" />
                <span className="min-w-0 break-words">{betreuer.telefon}</span>
              </a>
            )}
            {betreuer.mobil && (
              <a
                href={telHref(betreuer.mobil)}
                className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
              >
                <Icon name="phone" size={18} className="shrink-0" />
                <span className="min-w-0 break-words">{betreuer.mobil} (mobil)</span>
              </a>
            )}
            {betreuer.email && (
              <a
                href={`mailto:${betreuer.email}`}
                className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
              >
                <Icon name="mail" size={18} className="shrink-0" />
                <span className="min-w-0 break-words">{betreuer.email}</span>
              </a>
            )}
            {betreuer.url && (
              <a
                href={urlHref(betreuer.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
              >
                <Icon name="globe" size={18} className="shrink-0" />
                <span className="min-w-0 break-words">{betreuer.url}</span>
              </a>
            )}
          </div>
        </div>
      </Card>

      <p className="mt-lg max-w-[60ch] text-small text-anthrazit/60">
        Ihr Ansprechpartner begleitet Sie durch den gesamten Verkaufsprozess — von der ersten
        Bewertung bis zum Notartermin. Melden Sie sich jederzeit direkt.
      </p>

      <WeitereMitarbeiterSlider mitarbeiter={weitereMitarbeiter} />
    </SectionShell>
  );
}
