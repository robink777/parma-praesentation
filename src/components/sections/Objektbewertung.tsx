"use client";

import { useEffect, useState } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { Bewertung } from "@/types";

const TOGGLE_BUTTON_CLASS =
  "inline-flex shrink-0 items-center gap-xs rounded-sm border-2 border-asche bg-reinweiss px-md py-xs font-medium text-anthrazit transition-colors hover:border-messing";

function Toolbar({
  onToggleFullscreen,
  isFullscreen,
}: {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-sm border-b border-asche/30 bg-reinweiss px-md py-sm">
      <p className="label">Wertgutachten.pdf</p>
      <button type="button" onClick={onToggleFullscreen} className={TOGGLE_BUTTON_CLASS}>
        <Icon name={isFullscreen ? "close" : "expand"} size={16} />
        {isFullscreen ? "Schließen" : "Vollbild"}
      </button>
    </div>
  );
}

function PdfObject({ pdfUrl, className = "" }: { pdfUrl: string; className?: string }) {
  return (
    <object data={pdfUrl} type="application/pdf" className={`bg-stein ${className}`} aria-label="Wertgutachten (PDF)">
      <div className="flex h-full flex-col items-center justify-center gap-sm bg-stein p-lg text-center">
        <Icon name="document" size={32} className="text-anthrazit/40" />
        <p className="text-body text-anthrazit/70">
          Das PDF kann in diesem Browser nicht eingebettet angezeigt werden.
        </p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="text-body text-walnuss underline underline-offset-4"
        >
          Wertgutachten in neuem Tab öffnen
        </a>
      </div>
    </object>
  );
}

// Zeigt das im Vorfeld hochgeladene Wertgutachten (PDF, z.B. Sprengnetter-Marktpreisermittlung)
// unverändert in einem eingebetteten PDF-Viewer an. Bewusst schlank gehalten: keine eigene
// Datentransformation, kein Nachbau der Inhalte — das PDF ist die alleinige Quelle. Perspektivisch
// soll die eigentliche Wertermittlung direkt im Programm anhand der OnOffice-Daten berechnet
// werden (Ertrags-/Sach-/Vergleichswertverfahren); bis dahin ist dies die Übergangslösung.
export function Objektbewertung({ bewertung }: { bewertung: Bewertung }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  return (
    <SectionShell label="Objektbewertung" title="Das vollständige Wertgutachten">
      {bewertung.pdfUrl ? (
        <>
          <div className="flex h-[calc(100vh-260px)] min-h-[480px] flex-col overflow-hidden rounded-md border border-asche/30">
            <Toolbar isFullscreen={false} onToggleFullscreen={() => setIsFullscreen(true)} />
            <PdfObject pdfUrl={bewertung.pdfUrl} className="w-full flex-1" />
          </div>

          {isFullscreen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-anthrazit/95 p-sm md:p-lg">
              <div className="flex h-full w-full flex-col overflow-hidden rounded-md border border-asche/30 shadow-lg">
                <Toolbar isFullscreen onToggleFullscreen={() => setIsFullscreen(false)} />
                <PdfObject pdfUrl={bewertung.pdfUrl} className="w-full flex-1" />
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="flex flex-col items-center gap-sm py-2xl text-center">
          <Icon name="document" size={32} className="text-anthrazit/40" />
          <p className="max-w-[50ch] text-body text-anthrazit/70">
            Für dieses Objekt wurde noch kein Wertgutachten (PDF) hochgeladen.
          </p>
        </Card>
      )}
    </SectionShell>
  );
}
