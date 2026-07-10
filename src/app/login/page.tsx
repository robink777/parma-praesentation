"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

// Login-Seite der kontenlosen Zugriffssperre (siehe middleware.ts, lib/auth.ts) — nur ein
// Passwortfeld, keine Registrierung, kein Nutzername. Bei korrektem Passwort setzt
// /api/login das Session-Cookie, anschließend wird zur ursprünglich angefragten Seite
// zurückgeleitet (siehe "von"-Query-Parameter, von der Middleware beim Redirect gesetzt).
//
// useSearchParams() erfordert eine umschließende <Suspense>-Grenze (Next.js-Vorgabe für
// clientseitig gelesene Suchparameter) — daher der Split in eine innere LoginFormular- und die
// äußere, exportierte Seiten-Komponente.
function LoginFormular() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passwort, setPasswort] = useState("");
  const [ladet, setLadet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLadet(true);
    setFehler(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwort }),
      });

      if (!res.ok) {
        setFehler("Falsches Passwort. Bitte erneut versuchen.");
        return;
      }

      const ziel = searchParams.get("von") || "/";
      router.push(ziel);
      router.refresh();
    } catch {
      setFehler("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLadet(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-reinweiss px-lg py-2xl">
      <div className="w-full max-w-[420px]">
        <Image
          src="/logos/immobilien-quer.svg"
          alt="Parma Immobilien"
          width={200}
          height={50}
          className="mb-xl"
          priority
        />

        <p className="label mb-xs">Zugang</p>
        <h1 className="mb-sm text-[32px] leading-[1.2]">Bitte anmelden</h1>
        <p className="mb-lg max-w-[45ch] text-body text-anthrazit/60">
          Diese Präsentation ist passwortgeschützt. Bitte geben Sie das Ihnen mitgeteilte
          Passwort ein.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
          <input
            type="password"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            placeholder="Passwort"
            autoFocus
            className="w-full rounded-md border-2 border-asche bg-reinweiss px-sm py-sm text-body text-anthrazit outline-none transition-colors placeholder:text-anthrazit/40 focus:border-messing"
          />

          {fehler && <p className="text-small text-anthrazit/80">{fehler}</p>}

          <button
            type="submit"
            disabled={ladet || passwort.length === 0}
            className="mt-xs rounded-md bg-messing px-lg py-sm text-center font-medium text-reinweiss transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ladet ? "Anmelden …" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFormular />
    </Suspense>
  );
}
