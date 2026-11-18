"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UrlaubsKonto, UrlaubsWarnung } from "@/lib/urlaub/typen";

// Urlaubszähler auf den Mitarbeiter-Kacheln und Lösch-Warnungen darüber (Nutzer-Vorgabe November
// 2026: "die haben alle 25 tage urlaub. Kannst du einen counter einbauen der die urlaubstage
// zählt, und anzeigt wieviele noch übrig sind? wichtig! falls ein mitarbeiter nachträglich einen
// urlaubstag löscht will ich einen warnhinweis haben"). Daten: lib/onoffice/urlaub.ts,
// Abgleich: lib/urlaub/abgleich.ts.

const zahl = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const wochentag = new Intl.DateTimeFormat("de-DE", { weekday: "short", timeZone: "UTC" });

export function formatTage(n: number): string {
  return zahl.format(n);
}

export function datumKurz(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
}

function datumLang(iso: string): string {
  const tag = wochentag.format(new Date(`${iso}T12:00:00Z`)).replace(".", "");
  return `${tag} ${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

// Text für das (i) der Kachel: Regel + alle gezählten Tage + Einträge zum Prüfen.
export function urlaubsInfoText(konto: UrlaubsKonto): string {
  const tage = konto.tage.map((t) => `${datumKurz(t.datum)}${t.anteil < 1 ? " (½)" : ""}`).join(", ");
  const teile = [
    `Urlaub: Terminart „Urlaub“ im onOffice-Kalender, nur Mo–Fr ohne NRW-Feiertage. Ab 6 Std. zwischen 8 und 17 Uhr ein ganzer Tag, ab 2 Std. ein halber. Anspruch ${konto.anspruch} Tage.`,
    tage ? `Gezählte Tage: ${tage}` : "Noch keine Urlaubstage eingetragen.",
  ];
  if (konto.verdacht.length > 0) {
    teile.push(
      "Nicht gezählt, bitte Terminart prüfen: " +
        konto.verdacht
          .map((v) => `„${v.betreff}“ ${datumKurz(v.von)}${v.bis !== v.von ? `–${datumKurz(v.bis)}` : ""} (${v.terminart}, ${formatTage(v.arbeitstage)} AT)`)
          .join("; ")
    );
  }
  return teile.join("\n\n");
}

// Balken + Zahlen unten auf der Kachel.
export function UrlaubsZeile({ konto, warnungen }: { konto: UrlaubsKonto; warnungen: number }) {
  const { anspruch, genommen, geplant, uebrig } = konto;
  const basis = Math.max(anspruch, genommen + geplant) || 1;
  const ueberzogen = uebrig < 0;
  return (
    <div className="mt-sm shrink-0 border-t border-sand pt-sm">
      <div className="flex items-baseline justify-between gap-sm">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.04em] text-anthrazit/60">Urlaub</p>
        <p className={`font-slab text-[clamp(18px,2.8vh,26px)] font-bold leading-none ${ueberzogen ? "text-status-kritisch" : "text-anthrazit"}`}>
          {formatTage(uebrig)}
          <span className="ml-[6px] font-sans text-small font-medium text-anthrazit/60">
            {ueberzogen ? "Tage überzogen" : "übrig"}
          </span>
        </p>
      </div>
      <div
        className="mt-xs flex h-[10px] gap-[2px] overflow-hidden rounded-full bg-sand"
        role="img"
        aria-label={`${formatTage(genommen)} genommen, ${formatTage(geplant)} geplant, ${formatTage(uebrig)} übrig von ${anspruch}`}
      >
        <div className="bg-chart-8" style={{ width: `${(genommen / basis) * 100}%` }} />
        <div className="bg-chart-8/40" style={{ width: `${(geplant / basis) * 100}%` }} />
      </div>
      <p className="mt-[6px] text-small text-anthrazit/70">
        {formatTage(genommen)} genommen · {formatTage(geplant)} geplant · von {anspruch}
      </p>
      {(warnungen > 0 || konto.verdacht.length > 0) && (
        <p className="mt-[4px] text-small font-medium">
          {warnungen > 0 && (
            <span className="text-status-kritisch">
              ⚠ {warnungen} gelöschte{warnungen === 1 ? "r" : ""} Urlaubstag{warnungen === 1 ? "" : "e"}
            </span>
          )}
          {warnungen > 0 && konto.verdacht.length > 0 && <span className="text-anthrazit/40"> · </span>}
          {konto.verdacht.length > 0 && (
            <span className="text-status-warnung">
              {konto.verdacht.length} Eintrag{konto.verdacht.length === 1 ? "" : "e"} prüfen (i)
            </span>
          )}
        </p>
      )}
    </div>
  );
}

// Legende für den Urlaubsbalken (einmal über dem Raster, wie ObjektBalkenLegende).
export function UrlaubsLegende({ warnungenAktiv }: { warnungenAktiv: boolean }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-md text-small text-anthrazit/60">
      <span className="flex items-center gap-xs">
        <span className="inline-block h-[10px] w-[10px] rounded-full bg-chart-8" />
        Urlaub genommen
      </span>
      <span className="flex items-center gap-xs">
        <span className="inline-block h-[10px] w-[10px] rounded-full bg-chart-8/40" />
        geplant
      </span>
      {!warnungenAktiv && <span className="text-status-warnung">Lösch-Warnung noch nicht aktiv (Speicher fehlt)</span>}
    </div>
  );
}

function WarnungsZeile({ w, onGesehen }: { w: UrlaubsWarnung; onGesehen: () => void }) {
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(false);

  async function gesehen() {
    setLaeuft(true);
    setFehler(false);
    try {
      const antwort = await fetch("/api/admin/urlaub-warnung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schluessel: w.schluessel }),
      });
      // Admin-Sitzung abgelaufen (AdminSessionWaechter meldet beim Verlassen ab): neu laden,
      // dann erscheint die Anmeldung.
      if (antwort.status === 401) {
        window.location.reload();
        return;
      }
      if (!antwort.ok) throw new Error(String(antwort.status));
      onGesehen();
    } catch {
      setFehler(true);
      setLaeuft(false);
    }
  }

  const was = w.grund === "geloescht" ? "gelöscht" : "verkürzt, verschoben oder Terminart geändert";
  const wer = w.geaendertVon
    ? ` von ${w.geaendertVon} am ${datumKurz(w.geaendertAm!.slice(0, 10))}${w.geaendertAm!.slice(0, 4)} um ${w.geaendertAm!.slice(11, 16)} Uhr`
    : "";
  return (
    <li className="flex flex-wrap items-center justify-between gap-sm py-[6px]">
      <p className="min-w-0 flex-1 text-body text-anthrazit">
        <span className="font-semibold">{w.name}:</span> Urlaubstag {datumLang(w.datum)}
        {w.anteil < 1 ? " (halber Tag)" : ""}
        {w.vergangen ? <span className="font-semibold text-status-kritisch"> – lag schon in der Vergangenheit</span> : ""} – {was}
        {wer}. <span className="text-anthrazit/60">Termin „{w.betreff || "ohne Betreff"}“</span>
      </p>
      <button
        type="button"
        onClick={gesehen}
        disabled={laeuft}
        className="shrink-0 rounded-md border-2 border-asche bg-reinweiss px-sm py-[4px] text-small font-medium text-anthrazit hover:border-anthrazit disabled:opacity-50"
      >
        {fehler ? "Fehler – erneut" : laeuft ? "…" : "Gesehen"}
      </button>
    </li>
  );
}

// Warnkasten über den Mitarbeiter-Kacheln. Bleibt, bis jede Zeile als gesehen markiert ist.
export function UrlaubsWarnungen({ warnungen }: { warnungen: UrlaubsWarnung[] }) {
  const router = useRouter();
  const [ausgeblendet, setAusgeblendet] = useState<string[]>([]);
  const offen = warnungen.filter((w) => !ausgeblendet.includes(w.schluessel));
  if (offen.length === 0) return null;
  return (
    <div className="shrink-0 rounded-md border-2 border-status-kritisch bg-reinweiss px-md py-sm" role="alert">
      <p className="font-mono text-[12px] font-medium uppercase tracking-[0.04em] text-status-kritisch">
        ⚠ Urlaub nachträglich gelöscht ({offen.length})
      </p>
      <ul className="divide-y divide-sand">
        {offen.map((w) => (
          <WarnungsZeile
            key={w.schluessel}
            w={w}
            onGesehen={() => {
              setAusgeblendet((a) => [...a, w.schluessel]);
              router.refresh();
            }}
          />
        ))}
      </ul>
    </div>
  );
}
