import { PraesentationConfig } from "@/lib/share";
import { callOnOfficeApi } from "./client";

// Speichert die im Vorbereitungsmodus/Beratungstermin getroffene Auswahl (Vergleichsobjekte,
// Navigationspunkte, Leistungspaket, Vertragsdaten — siehe PraesentationConfig in lib/share.ts) als
// kleine JSON-Datei am Objekt in onOffice (Chat-Vorgabe September 2026: "Vom Handling ist es
// ziemlich nervig, immer wieder beim Neu-Laden alles neu eingeben zu müssen"). Dadurch ist der
// Stand geräteübergreifend für alle Berater/innen verfügbar und überlebt ein Neuladen.
//
// Live gegen den Account geprüft (September 2026, Testobjekt 955): Eine per API angelegte
// Nicht-Bild-Datei erhält automatisch die Kategorie "internal" (erscheint also nicht in Portalen/
// Exposés). Es gibt keine Möglichkeit, eine bestehende Datei zu überschreiben — Speichern =
// neue Datei anlegen, danach ältere Versionen mit demselben Namen löschen.
export const PRAESENTATIONSDATEI_NAME = "parma-praesentation.json";
const PRAESENTATIONSDATEI_TITEL = "Parma Präsentation (Konfiguration)";

const DO = "urn:onoffice-de-ns:smart:2.5:smartml:action:do";
const GET = "urn:onoffice-de-ns:smart:2.5:smartml:action:get";
const DELETE = "urn:onoffice-de-ns:smart:2.5:smartml:action:delete";

// Ohne listlimit liefert onOffice nur 20 Dateien pro Abruf — Objekte mit vielen Dokumenten (Testobjekt
// 955: 32) würden die Konfigurationsdatei sonst je nach Position nicht mehr finden.
const DATEI_LISTLIMIT = 500;

interface RawDateiEintrag {
  id: number | string;
  elements: { originalname?: string; modified?: number; content?: string };
}

async function listeDateien(estateId: string): Promise<RawDateiEintrag[]> {
  const result = await callOnOfficeApi<RawDateiEintrag>([
    {
      actionid: GET,
      resourcetype: "file",
      resourceid: "estate",
      identifier: "",
      cacheable: false,
      parameters: { estateid: estateId, listlimit: DATEI_LISTLIMIT },
    },
  ]);
  return result?.response?.results?.[0]?.data?.records ?? [];
}

// Alle Konfigurationsdateien des Objekts, neueste zuerst (normalerweise genau eine).
async function findeKonfigurationsdateien(estateId: string): Promise<RawDateiEintrag[]> {
  const dateien = await listeDateien(estateId);
  return dateien
    .filter((d) => d.elements.originalname === PRAESENTATIONSDATEI_NAME)
    .sort((a, b) => (b.elements.modified ?? 0) - (a.elements.modified ?? 0) || Number(b.id) - Number(a.id));
}

export async function ladePraesentationsKonfiguration(estateId: string): Promise<PraesentationConfig | null> {
  const neueste = (await findeKonfigurationsdateien(estateId))[0];
  if (!neueste) return null;

  const result = await callOnOfficeApi<RawDateiEintrag>([
    {
      actionid: GET,
      resourcetype: "file",
      resourceid: "estate",
      identifier: "",
      cacheable: false,
      parameters: { estateid: estateId, fileid: Number(neueste.id) },
    },
  ]);
  const content = result?.response?.results?.[0]?.data?.records?.[0]?.elements?.content;
  if (!content) return null;

  try {
    return JSON.parse(Buffer.from(content, "base64").toString("utf-8")) as PraesentationConfig;
  } catch {
    return null;
  }
}

async function loescheDatei(estateId: string, fileId: number | string): Promise<void> {
  await callOnOfficeApi([
    {
      actionid: DELETE,
      resourcetype: "file",
      resourceid: String(fileId),
      identifier: "",
      cacheable: false,
      parameters: { module: "estate", relatedRecordId: estateId, fileId: Number(fileId) },
    },
  ]);
}

export async function speicherePraesentationsKonfiguration(
  estateId: string,
  config: PraesentationConfig
): Promise<void> {
  // Erst die vorhandenen Versionen merken, dann die neue anlegen und ERST DANACH die alten
  // löschen — schlägt das Anlegen fehl, bleibt der bisherige Stand erhalten.
  const alte = await findeKonfigurationsdateien(estateId);

  const upload = await callOnOfficeApi<{ elements: { tmpUploadId?: string } }>([
    {
      actionid: DO,
      resourcetype: "uploadfile",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: { data: Buffer.from(JSON.stringify(config), "utf-8").toString("base64") },
    },
  ]);
  const tmpUploadId = upload?.response?.results?.[0]?.data?.records?.[0]?.elements?.tmpUploadId;
  if (!tmpUploadId) throw new Error("Datei-Upload zu onOffice fehlgeschlagen");

  // Zweiter Aufruf desselben Resourcetypes "uploadfile" (nicht "file" — dort liefert die API
  // Errorcode 25) mit tmpUploadId + Metadaten legt die Datei am Objekt an.
  const anlegen = await callOnOfficeApi<{ elements: { success?: string; fileId?: number } }>([
    {
      actionid: DO,
      resourcetype: "uploadfile",
      resourceid: "",
      identifier: "",
      cacheable: false,
      parameters: {
        module: "estate",
        relatedRecordId: estateId,
        tmpUploadId,
        file: PRAESENTATIONSDATEI_NAME,
        title: PRAESENTATIONSDATEI_TITEL,
        Art: "Dokument",
      },
    },
  ]);
  const ergebnis = anlegen?.response?.results?.[0]?.data?.records?.[0]?.elements;
  if (ergebnis?.success !== "success") throw new Error("Datei konnte in onOffice nicht angelegt werden");

  for (const datei of alte) {
    await loescheDatei(estateId, datei.id).catch(() => undefined);
  }
}
