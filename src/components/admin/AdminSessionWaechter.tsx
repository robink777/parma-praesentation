"use client";

import { useEffect } from "react";

// Meldet die Admin-Session ab, sobald der Admin-Bereich verlassen wird (siehe Chat-Vorgabe:
// "die Login-Abfrage sollte jedes Mal kommen wenn ich den Admin-Bereich verlasse" — anders als
// die App-weite Session in lib/auth.ts, die bewusst 60 Tage durchhält, soll das kurzlebigere
// Admin-Cookie (8 Stunden, siehe ADMIN_SESSION_MAX_AGE_SEKUNDEN) NICHT bis zu diesem natürlichen
// Ablauf gültig bleiben, sondern sofort beim Verlassen invalidiert werden).
//
// Diese Komponente wird von app/admin/layout.tsx gerendert, das den gesamten Admin-Bereich
// (/admin und /admin/login) umschließt. Ein Layout wird von Next.js genau dann unmountet, wenn
// clientseitig zu einer Route außerhalb dieses Layouts navigiert wird (z. B. Klick auf "Zurück
// zur Startseite" in app/admin/page.tsx) — der Cleanup des Effekts unten deckt diesen Fall ab.
// Für den Fall, dass die Seite stattdessen per Tab-Schließen/Neuladen/manueller URL-Eingabe
// verlassen wird (kein React-Unmount, da der gesamte Browser-Kontext verschwindet), zusätzlich
// ein "pagehide"-Listener mit sendBeacon — der läuft zuverlässig auch während des Entladens der
// Seite, wo ein normales fetch() oft abgebrochen würde.
export function AdminSessionWaechter() {
  useEffect(() => {
    const meldeAbPerBeacon = () => {
      navigator.sendBeacon("/api/admin-logout");
    };

    window.addEventListener("pagehide", meldeAbPerBeacon);

    return () => {
      window.removeEventListener("pagehide", meldeAbPerBeacon);
      // keepalive: true sorgt dafür, dass der Request auch dann noch abgeschickt wird, wenn die
      // Navigation (die diesen Unmount ausgelöst hat) den Vorgang eigentlich schon "verlässt".
      fetch("/api/admin-logout", { method: "POST", keepalive: true }).catch(() => {
        // Unkritisch, falls es fehlschlägt: Das Cookie läuft spätestens nach 8 Stunden ohnehin ab.
      });
    };
  }, []);

  return null;
}
