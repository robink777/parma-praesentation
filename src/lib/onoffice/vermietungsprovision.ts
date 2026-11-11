// Provision einer Vermietung aus den frei eingetragenen OnOffice-Feldern Außen-Provision und
// Innen-Provision (aussen_courtage/innen_courtage), netto in Euro. Nutzer-Vorgabe November 2026:
// "Die Provision muss frei einzutragen sein" — vorher rechnete die App fest mit 2 Kaltmieten,
// die Buchhaltung hatte aber z. B. bei der Rurstraße 67 2,5 Kaltmieten. OnOffice hat für
// Mietprovisionen kein strukturiertes Feld (prozent_* sind bei Mietobjekten 0).
//
// Je Seite gilt:
//   - "2 Kaltmieten", "2,5 KM", "2 Nettokaltmieten", "2 Monatsmieten" → Anzahl × Kaltmiete
//   - ein Betrag wie "3.600,00" oder "1.530 €" → dieser Betrag
//   - steht "inkl." (MwSt.) im Text, ist der Wert brutto und wird durch 1,19 geteilt, sonst netto
//     ("zzgl. 19 % MwSt." oder ohne Angabe = netto)
//   - "0" ist erlaubt (nur eine Seite zahlt); eine nackte Zahl bis 10 gilt als nicht auswertbar
//   - ein Prozentwert ist bei Vermietungen nicht auswertbar
// Ist keine Seite auswertbar, fehlt die Provisionsangabe — bewusst ohne Ersatzwert.

const MWST_FAKTOR = 1.19;

// "inkl. 19 % MwSt.", "zzgl. ges. MwSt.", "inkl. gesetzlicher Mehrwertsteuer" usw.
const MWST_ZUSATZ =
  /\b(inkl|incl|zzgl|zuzgl|plus)\.?\s*(der\s+)?(ges\.?|gesetzl\.?|gesetzlicher|gesetzlichen)?\s*(\d+(?:[.,]\d+)?\s*%)?\s*(mwst|mehrwertsteuer|ust|umsatzsteuer)\.?/g;

const KALTMIETEN = /^(\d+(?:[.,]\d+)?)\s*(?:x\s*)?(?:netto-?\s*)?(?:kaltmieten?|monatsmieten?|mieten?|km|nkm|mm)\b\.?$/;
const BETRAG = /^(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)\s*(?:€|eur|euro)?\.?$/;

function deutscheZahl(roh: string): number {
  return Number(roh.replace(/\./g, "").replace(",", "."));
}

export function vermietungsProvisionSeite(text: string | undefined, kaltmiete: number): number | null {
  let t = (text ?? "").replace(/ /g, " ").trim().toLowerCase();
  if (!t) return null;
  const brutto = /\b(inkl|incl)\b/.test(t);
  t = t.replace(MWST_ZUSATZ, " ").replace(/\b(netto|brutto)\b/g, " ").replace(/\s+/g, " ").trim();
  const faktor = brutto ? 1 / MWST_FAKTOR : 1;

  const km = t.match(KALTMIETEN);
  if (km) return kaltmiete > 0 ? deutscheZahl(km[1]) * kaltmiete * faktor : null;
  const betrag = t.match(BETRAG);
  if (betrag) {
    const wert = deutscheZahl(betrag[1]);
    // Eine nackte Zahl bis 10 ist eher eine vergessene Einheit ("2" statt "2 Kaltmieten") als ein
    // Eurobetrag — lieber als nicht auswertbar melden als 2 € zu zählen. 0 bleibt gültig.
    if (wert > 0 && wert <= 10) return null;
    return wert * faktor;
  }
  return null;
}

export function vermietungsProvision(
  aussen: string | undefined,
  innen: string | undefined,
  kaltmiete: number
): number | null {
  const a = vermietungsProvisionSeite(aussen, kaltmiete);
  const i = vermietungsProvisionSeite(innen, kaltmiete);
  if (a === null && i === null) return null;
  return (a ?? 0) + (i ?? 0);
}
