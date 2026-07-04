import crypto from "crypto";
import { ONOFFICE_API_URL, ONOFFICE_SECRET, ONOFFICE_TOKEN } from "./config";

// HMAC v2 laut onOffice-API-Dokumentation (apidoc.onoffice.de):
// Reihenfolge timestamp+token+resourcetype+actionid, SHA-256, Base64 (nicht Hex).
function buildHmac(timestamp: number, resourcetype: string, actionid: string): string {
  const message = String(timestamp) + ONOFFICE_TOKEN + resourcetype + actionid;
  return crypto.createHmac("sha256", ONOFFICE_SECRET).update(message).digest("base64");
}

export interface OnOfficeAction {
  actionid: string;
  resourcetype: string;
  resourceid?: string;
  identifier?: string;
  timestamp?: number;
  hmac?: string;
  hmac_version?: string;
  cacheable?: boolean;
  parameters: Record<string, unknown>;
}

interface OnOfficeApiResult<T> {
  data?: { records?: T[] };
  status?: { code: number; errorcode: number; message: string };
}

export interface OnOfficeResponse<T> {
  response?: { results?: OnOfficeApiResult<T>[] };
  status?: { code: number; errorcode: number; message: string };
}

export async function callOnOfficeApi<T = unknown>(
  actions: Omit<OnOfficeAction, "timestamp" | "hmac" | "hmac_version">[]
): Promise<OnOfficeResponse<T>> {
  const timestamp = Math.floor(Date.now() / 1000);

  const signedActions: OnOfficeAction[] = actions.map((action) => ({
    ...action,
    timestamp,
    hmac: buildHmac(timestamp, action.resourcetype, action.actionid),
    hmac_version: "2",
  }));

  const response = await fetch(ONOFFICE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: ONOFFICE_TOKEN,
      request: { actions: signedActions },
    }),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`onOffice API Fehler: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as OnOfficeResponse<T>;

  if (json.status && json.status.code >= 400) {
    throw new Error(`onOffice API Fehler: ${json.status.message} (Code ${json.status.errorcode})`);
  }

  return json;
}
