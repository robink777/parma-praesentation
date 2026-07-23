import type { DetailedHTMLProps, HTMLAttributes } from "react";

// Registriert das <btm-widget>-Custom-Element (bottimmo-Ratgeber-Flyer, siehe
// components/sections/Verabschiedung.tsx) als gültiges JSX-Element — es wird nicht von React
// selbst bereitgestellt, sondern zur Laufzeit vom extern geladenen bottimmo-Script definiert
// (siehe next/script-Einbindung in Verabschiedung.tsx).
//
// Augmentiert "react" statt der globalen JSX-Namespace: Mit dem automatischen JSX-Runtime (React
// 19/Next.js) löst TypeScript den JSX-Namespace über das Modul "react" auf (siehe
// react/jsx-runtime.d.ts, `export { JSX } from "./"`), nicht über eine globale Ambient-JSX.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "btm-widget": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        widget?: string;
        slug?: string;
        type?: string;
      };
    }
  }
}
