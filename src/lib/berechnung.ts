import {
  FinanzierungsDaten,
  Nebenkosten,
  FinanzierungsErgebnis,
  TilgungsplanZeile,
} from "@/types";

export const GRUNDERWERBSTEUER: Record<string, number> = {
  "Baden-Württemberg": 5.0,
  Bayern: 3.5,
  Berlin: 6.0,
  Brandenburg: 6.5,
  Bremen: 5.0,
  Hamburg: 5.5,
  Hessen: 6.0,
  "Mecklenburg-Vorpommern": 5.0,
  Niedersachsen: 5.0,
  "Nordrhein-Westfalen": 6.5,
  "Rheinland-Pfalz": 5.0,
  Saarland: 6.5,
  Sachsen: 3.5,
  "Sachsen-Anhalt": 5.0,
  "Schleswig-Holstein": 6.5,
  Thüringen: 6.5,
};

export function berechneNebenkosten(daten: FinanzierungsDaten): Nebenkosten {
  const { kaufpreis, bundesland, mitMakler, maklerProzent } = daten;

  const grunderwerbsteuerSatz = GRUNDERWERBSTEUER[bundesland] ?? 5.0;
  const grunderwerbsteuer = (kaufpreis * grunderwerbsteuerSatz) / 100;
  const notarkosten = kaufpreis * 0.015;
  const grundbucheintrag = kaufpreis * 0.005;
  const maklercourtage = mitMakler ? (kaufpreis * maklerProzent) / 100 : 0;

  const gesamt =
    grunderwerbsteuer + notarkosten + grundbucheintrag + maklercourtage;

  return {
    grunderwerbsteuer,
    notarkosten,
    grundbucheintrag,
    maklercourtage,
    gesamt,
  };
}

export function berechneFinanzierung(
  daten: FinanzierungsDaten
): FinanzierungsErgebnis {
  const { kaufpreis, eigenkapital, zinssatz, laufzeitJahre, tilgungProzent } =
    daten;

  const nebenkosten = berechneNebenkosten(daten);

  // Darlehensbetrag = Kaufpreis + Nebenkosten - Eigenkapital
  const gesamtbedarf = kaufpreis + nebenkosten.gesamt;
  const darlehensbetrag = Math.max(0, gesamtbedarf - eigenkapital);

  const monatlicheZinsrate = zinssatz / 100 / 12;
  const anzahlMonate = laufzeitJahre * 12;

  let monatlicheRate = 0;

  if (monatlicheZinsrate === 0) {
    monatlicheRate = darlehensbetrag / anzahlMonate;
  } else {
    // Annuitätenformel: R = K * (i * (1+i)^n) / ((1+i)^n - 1)
    const faktor = Math.pow(1 + monatlicheZinsrate, anzahlMonate);
    monatlicheRate = darlehensbetrag * ((monatlicheZinsrate * faktor) / (faktor - 1));
  }

  const gesamtkosten = monatlicheRate * anzahlMonate + eigenkapital + nebenkosten.gesamt;
  const gesamtzinsen = monatlicheRate * anzahlMonate - darlehensbetrag;

  const tilgungsplan = berechneTilgungsplan(
    darlehensbetrag,
    monatlicheZinsrate,
    monatlicheRate,
    laufzeitJahre,
    tilgungProzent
  );

  const eigenkapitalanteilProzent =
    gesamtbedarf > 0 ? (eigenkapital / gesamtbedarf) * 100 : 0;

  return {
    darlehensbetrag,
    monatlicheRate,
    jaehrlicheRate: monatlicheRate * 12,
    gesamtkosten,
    gesamtzinsen,
    nebenkosten,
    eigenkapitalanteilProzent,
    tilgungsplan,
  };
}

function berechneTilgungsplan(
  darlehensbetrag: number,
  monatlicheZinsrate: number,
  monatlicheRate: number,
  laufzeitJahre: number,
  _tilgungProzent: number
): TilgungsplanZeile[] {
  const plan: TilgungsplanZeile[] = [];
  let restschuld = darlehensbetrag;

  for (let jahr = 1; jahr <= laufzeitJahre; jahr++) {
    let jaehrlicheZinsen = 0;
    let jaehrlicheTilgung = 0;

    for (let monat = 1; monat <= 12; monat++) {
      if (restschuld <= 0) break;

      const zinsenDiesesMonat = restschuld * monatlicheZinsrate;
      const tilgungDiesesMonat = Math.min(
        monatlicheRate - zinsenDiesesMonat,
        restschuld
      );

      jaehrlicheZinsen += zinsenDiesesMonat;
      jaehrlicheTilgung += tilgungDiesesMonat;
      restschuld -= tilgungDiesesMonat;
    }

    plan.push({
      jahr,
      restschuld: Math.max(0, restschuld),
      tilgung: jaehrlicheTilgung,
      zinsen: jaehrlicheZinsen,
      rate: monatlicheRate * 12,
    });

    if (restschuld <= 0) break;
  }

  return plan;
}

export function formatiereBetrag(betrag: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(betrag);
}

export function formatiereProzent(wert: number, stellen = 2): string {
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  }).format(wert / 100);
}
