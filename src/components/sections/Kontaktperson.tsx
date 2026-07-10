"use client";

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

// Eine einzelne Personen-Karte (Foto/Initialen-Avatar + Name + Kontaktdaten) — gemeinsam
// genutzt für den Haupt-Ansprechpartner (Betreuer) UND den Setter darunter (siehe
// Kontaktperson unten), damit beide Blöcke optisch identisch aufgebaut sind.
function PersonKarte({ person }: { person: Betreuer }) {
  const name = [person.anrede, person.vorname, person.nachname].filter(Boolean).join(" ");
  const plzOrt = [person.plz, person.ort].filter(Boolean).join(" ");
  const hatAdresse = Boolean(person.strasse || plzOrt);

  return (
    <Card className="flex flex-col items-start gap-lg md:flex-row md:items-center">
      <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full bg-sand">
        {person.profilbildUrl ? (
          <Image src={person.profilbildUrl} alt={name} fill className="object-cover" sizes="160px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-slab text-4xl font-bold text-walnuss">
            {initialen(person.vorname, person.nachname)}
          </div>
        )}
      </div>

      <div className="w-full min-w-0">
        <p className="break-words font-slab text-2xl font-bold text-anthrazit">{name}</p>
        {person.rolle && <p className="label mt-xs break-words">{person.rolle}</p>}
        {person.firma && <p className="mt-xs break-words text-body text-anthrazit/70">{person.firma}</p>}

        {/* w-full + min-w-0 auf jeder Zeile: ohne min-w-0 stauchen sich lange, leerzeichenfreie
            Werte (v.a. E-Mail/URL) in einem Flex-Layout nicht unter ihre "min-content"-Breite
            und liefen bei schmalen Viewports über den Kartenrand hinaus. */}
        <div className="mt-md flex w-full min-w-0 flex-col gap-xs">
          {hatAdresse && (
            <div className="flex w-full min-w-0 items-start gap-xs text-body text-anthrazit/90">
              <Icon name="location" size={18} className="mt-[2px] shrink-0" />
              <span className="min-w-0 break-words">
                {person.strasse}
                {person.strasse && plzOrt && <br />}
                {plzOrt}
              </span>
            </div>
          )}
          {person.telefon && (
            <a
              href={telHref(person.telefon)}
              className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
            >
              <Icon name="phone" size={18} className="shrink-0" />
              <span className="min-w-0 break-words">{person.telefon}</span>
            </a>
          )}
          {person.mobil && (
            <a
              href={telHref(person.mobil)}
              className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
            >
              <Icon name="phone" size={18} className="shrink-0" />
              <span className="min-w-0 break-words">{person.mobil} (mobil)</span>
            </a>
          )}
          {person.email && (
            <a
              href={`mailto:${person.email}`}
              className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
            >
              <Icon name="mail" size={18} className="shrink-0" />
              <span className="min-w-0 break-words">{person.email}</span>
            </a>
          )}
          {person.url && (
            <a
              href={urlHref(person.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full min-w-0 items-center gap-xs text-body text-anthrazit/90 hover:text-messing"
            >
              <Icon name="globe" size={18} className="shrink-0" />
              <span className="min-w-0 break-words">{person.url}</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

// Zeigt den für das Objekt zuständigen Betreuer (Immobilienberater/in) mit Profilbild und
// Kontaktdaten. Wird über OnOffice befüllt (siehe lib/onoffice/estate.ts,
// ladeBetreuerUndAlleMitarbeiter) — solange kein Profilbild hinterlegt ist, erscheint bewusst ein
// Initialen-Avatar statt eines generischen Platzhalterfotos.
//
// Der "Weitere Mitarbeiter"-Slider (übrige Kolleg:innen der Agentur) wurde hier bewusst entfernt
// — das Team der Agentur wird bereits im Reiter "Unternehmen" gezeigt (siehe Unternehmen.tsx,
// alleMitarbeiter), eine zweite Darstellung direkt unter dem Ansprechpartner war redundant.
// Das dadurch frei gewordene Platzangebot nutzt stattdessen ein größeres Profilbild des
// Ansprechpartners (siehe h-40 w-40 in PersonKarte oben, vorher h-28 w-28).
//
// Zusätzlich (Juli 2026): der "Setter" des Objekts (individuelles OnOffice-Feld unter
// "Grunddaten → Technische Angaben", siehe ladeSetterAddressId in estate.ts) als zweiter Block
// unterhalb des Betreuers — mit derselben Karte (PersonKarte oben). Anders als beim Betreuer
// gibt es dafür KEINEN Mock-Fallback: setter ist null, wenn für das Objekt kein Setter
// hinterlegt ist (gültiger, echter Zustand, siehe Praesentation-Typ) — der komplette Block wird
// dann bewusst nicht gerendert, statt eine leere/erfundene Karte zu zeigen.
export function Kontaktperson({ betreuer, setter }: { betreuer: Betreuer; setter: Betreuer | null }) {
  return (
    <SectionShell label="Ihr Ansprechpartner" title="Ihr Ansprechpartner bei Parma Immobilien">
      <PersonKarte person={betreuer} />

      <p className="mt-lg max-w-[60ch] text-small text-anthrazit/60">
        Ihr Ansprechpartner begleitet Sie durch den gesamten Verkaufsprozess — von der ersten
        Bewertung bis zum Notartermin. Melden Sie sich jederzeit direkt.
      </p>

      {setter && (
        <div className="mt-xl">
          <PersonKarte person={setter} />
        </div>
      )}
    </SectionShell>
  );
}
