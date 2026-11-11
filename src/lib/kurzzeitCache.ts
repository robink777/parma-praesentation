// Kurzzeit-Zwischenspeicher im Arbeitsspeicher des Server-Prozesses.
//
// Anlass (10.11.2026): Vercel hat das Projekt wegen „Fluid Active CPU“ angehalten (4 h 15 min bei
// 4 h frei). Jeder offene Bildschirm (TV, TV mobil, Admin) lud jede Minute ALLE Kennzahlen neu, und
// jeder Abruf löst rund 150–170 onOffice-Abfragen aus. Mit diesem Speicher teilen sich alle
// Bildschirme, die innerhalb von `ttlMs` anfragen, EINEN Abruf. Laufende Abrufe werden ebenfalls
// geteilt (zwei Fernseher, die gleichzeitig fragen, lösen nur einen onOffice-Durchgang aus).
//
// Bewusst im Arbeitsspeicher statt unstable_cache: Die Daten enthalten teils Date-Objekte, die
// eine JSON-Serialisierung stillschweigend in Strings verwandeln würde. Jede Server-Instanz hat
// ihren eigenen Speicher — das reicht, weil Vercel Fluid Instanzen wiederverwendet.
// Fehlgeschlagene Abrufe werden nicht gespeichert, der nächste Aufruf versucht es neu.
interface Eintrag<T> {
  bis: number;
  wert: Promise<T>;
}

const speicher = new Map<string, Eintrag<unknown>>();

export function kurzzeitCache<T>(schluessel: string, ttlMs: number, laden: () => Promise<T>): Promise<T> {
  const jetzt = Date.now();
  const vorhanden = speicher.get(schluessel) as Eintrag<T> | undefined;
  if (vorhanden && vorhanden.bis > jetzt) return vorhanden.wert;

  const wert = laden();
  speicher.set(schluessel, { bis: jetzt + ttlMs, wert });
  wert.catch(() => {
    if (speicher.get(schluessel)?.wert === wert) speicher.delete(schluessel);
  });
  return wert;
}

// 45 s: Die Bildschirme fragen im Minutentakt, aber nicht synchron. So lädt jede Instanz höchstens
// gut einmal pro Minute aus onOffice, und die Zahlen sind nie älter als eine Dreiviertelminute.
export const DASHBOARD_CACHE_MS = 45_000;
