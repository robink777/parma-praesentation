import Script from "next/script";
import { SectionShell, Card } from "@/components/layout/SectionShell";

// bottimmo-Widget-Script — "afterInteractive", da das Widget der eigentliche Inhalt dieser Folie
// ist und beim Aufrufen zeitnah laden soll (nicht erst, wenn der Browser irgendwann Leerlaufzeit
// hat, wie bei "lazyOnload"). next/script dedupliziert selbst über die id, falls die Folie
// erneut gemountet wird (Wechsel zwischen Reitern).
const BOTTIMMO_SCRIPT_SRC =
  "https://components.bottimmo.com/components/6752d9b04a83ff4efdcf4c50/btm-widget/de-DE";

// Letzte Folie der Objektpräsentation: Abschluss/Verabschiedung plus alle Ratgeber-Flyer auf
// einen Blick über das bottimmo-Listen-Widget (widget="list", slug="GUIDE") — zeigt automatisch
// sämtliche im bottimmo-Portal hinterlegten Ratgeber, statt sie hier einzeln pro Thema/Slug
// nachpflegen zu müssen (Chat-Vorgabe: "Widget um alle Ratgeber auf einmal einzubinden").
export function Verabschiedung() {
  return (
    <SectionShell label="Verabschiedung" title="Vielen Dank für Ihre Zeit!">
      <Script id="bottimmo-widget-script" src={BOTTIMMO_SCRIPT_SRC} strategy="afterInteractive" />

      <p className="mb-lg max-w-[60ch] text-lg font-slab leading-[1.4] text-anthrazit">
        Wir freuen uns auf die weitere Zusammenarbeit. Passend zu Ihrer Situation finden Sie hier
        noch einen Ratgeber zum Mitnehmen.
      </p>

      <Card>
        <btm-widget widget="list" slug="GUIDE" />
      </Card>
    </SectionShell>
  );
}
