"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "@/components/icons/Icon";

// Umschalter zwischen den Admin-Hauptbereichen (Oktober 2026 Chat-Vorgabe: "Ähnlich wie jetzt die
// Karte ein Hauptbereich ist ... müssten wir vielleicht einen zweiten statistischen Hauptbereich
// schaffen, wo man einfach hin und her switchen kann. Mit der Option, später einen dritten Bereich
// zu bauen, vielleicht für die Finanz"). Jeder Hauptbereich ist eine ECHTE Route (siehe
// app/admin/page.tsx, app/admin/statistik/page.tsx), kein Client-State — der Nutzer will dieselbe
// Oberfläche später auf mehreren Bildschirmen gleichzeitig zeigen können, jeder Bildschirm zeigt
// dafür dauerhaft eine eigene URL an. Dieser Switcher ist nur das Werkzeug, um an EINEM Bildschirm
// selbst hin- und herzuschalten.
//
// "Finanz" ist bewusst als dritter, sichtbar inaktiver Eintrag schon da (Chat-Vorgabe: "Option,
// später einen dritten Bereich zu bauen") — zeigt den Zielzustand, ohne eine Seite vorzutäuschen,
// die noch keine Daten hat. Wird live, sobald eine Finanz-Datenquelle angebunden ist (einfach
// href ergänzen).
const HAUPTBEREICHE: { href: string; label: string; icon: IconName; aktiv: boolean }[] = [
  { href: "/admin", label: "Karte", icon: "location", aktiv: true },
  { href: "/admin/statistik", label: "Statistik", icon: "calculator", aktiv: true },
  { href: "#", label: "Finanz (bald)", icon: "handshake", aktiv: false },
];

export function HauptbereichSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-[2px] rounded-full bg-stein/95 p-[4px] shadow-[0_2px_12px_rgba(80,63,61,0.18)]">
      {HAUPTBEREICHE.map((bereich) => {
        const ist = bereich.aktiv && pathname === bereich.href;
        if (!bereich.aktiv) {
          return (
            <span
              key={bereich.label}
              className="flex cursor-not-allowed items-center gap-xs rounded-full px-sm py-xs text-small font-medium text-anthrazit/30"
              title="Noch nicht verfügbar"
            >
              <Icon name={bereich.icon} size={16} />
              {bereich.label}
            </span>
          );
        }
        return (
          <Link
            key={bereich.href}
            href={bereich.href}
            className={`flex items-center gap-xs rounded-full px-sm py-xs text-small font-medium transition-colors ${
              ist ? "bg-walnuss text-reinweiss" : "text-anthrazit/60 hover:bg-walnuss/10 hover:text-anthrazit"
            }`}
          >
            <Icon name={bereich.icon} size={16} />
            {bereich.label}
          </Link>
        );
      })}
    </nav>
  );
}
