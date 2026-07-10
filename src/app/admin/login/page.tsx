"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons/Icon";

// Zweite, separate Login-Seite für den Admin-Bereich (Mitarbeiterstatistik, siehe
// app/admin/page.tsx) — bewusst analog zu app/login/page.tsx aufgebaut, postet aber gegen
// /api/admin-login statt /api/login und verlangt ein eigenes, zweites Passwort. Wer hier landet,
// ist bereits App-weit angemeldet (siehe middleware.ts) — diese Seite selbst ist die zusätzliche,
// engere Sperre nur für den Admin-Bereich.
function AdminLoginFormular() {
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
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwort }),
      });

      if (!res.ok) {
        setFehler("Falsches Passwort. Bitte erneut versuchen.");
        return;
      }

      const ziel = searchParams.get("von") || "/admin";
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

        <p className="label mb-xs">Admin-Bereich</p>
        <h1 className="mb-sm text-[32px] leading-[1.2]">Zusätzliche Anmeldung</h1>
        <p className="mb-lg max-w-[45ch] text-body text-anthrazit/60">
          Der Admin-Bereich ist zusätzlich zur regulären Anmeldung mit einem zweiten Passwort
          geschützt. Bitte geben Sie dieses Passwort ein.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-sm flex items-center text-walnuss/40">
              <Icon name="lock" size={20} />
            </div>
            <input
              type="password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              placeholder="Admin-Passwort"
              autoFocus
              className="w-full rounded-md border-2 border-asche bg-reinweiss py-sm pl-[48px] pr-sm text-body text-anthrazit outline-none transition-colors placeholder:text-anthrazit/40 focus:border-messing"
            />
          </div>

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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginFormular />
    </Suspense>
  );
}
