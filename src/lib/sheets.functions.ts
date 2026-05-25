import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SPREADSHEET_ID = "1LoDg7FS0Aadc9WX-lPYHF8QNS3dfPWelAVPBccH-q4c";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function headers() {
  const k = process.env.LOVABLE_API_KEY;
  const c = process.env.GOOGLE_SHEETS_API_KEY;
  if (!k) throw new Error("LOVABLE_API_KEY missing");
  if (!c) throw new Error("GOOGLE_SHEETS_API_KEY missing");
  return {
    Authorization: `Bearer ${k}`,
    "X-Connection-Api-Key": c,
  };
}

async function fetchWithRetry(url: string, label: string, attempts = 5): Promise<Response> {
  let lastErr = "";
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: headers() });
      if (res.ok) return res;
      if ([502, 503, 504, 429].includes(res.status) && i < attempts - 1) {
        lastErr = `HTTP ${res.status}`;
        // Longer backoff for 429
        const base = res.status === 429 ? 2000 : 500;
        await new Promise((r) => setTimeout(r, base * Math.pow(2, i)));
        continue;
      }
      const errorBody = await res.text();
      console.error(`[fetchWithRetry] ${label} failed ${res.status}: ${errorBody.slice(0, 500)}`);
      throw new Error(`${label} failed ${res.status}: ${errorBody.slice(0, 200)}`);
    } catch (e) {
      if (i === attempts - 1) throw e;
      lastErr = (e as Error).message;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${lastErr}`);
}

// Simple in-memory cache with TTL to avoid hitting Sheets API rate limits
const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 30_000; // 30s cache

async function cachedJSON(key: string, url: string, label: string) {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < TTL_MS) return hit.data;
  try {
    const res = await fetchWithRetry(url, label);
    const j = await res.json();
    cache.set(key, { at: now, data: j });
    return j;
  } catch (e) {
    // On rate limit, return stale cache if available
    if (hit) return hit.data;
    throw e;
  }
}

export type SheetMeta = { id: number; title: string; rowCount: number };

export const listSheets = createServerFn({ method: "GET" }).handler(async () => {
  const j: any = await cachedJSON(
    "list",
    `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties,properties.title`,
    "Sheets list",
  );
  const sheets: SheetMeta[] = (j.sheets ?? []).map((s: any) => ({
    id: s.properties.sheetId,
    title: s.properties.title,
    rowCount: s.properties.gridProperties?.rowCount ?? 0,
  }));
  return { title: j.properties?.title ?? "Planilha", sheets };
});

export type SheetData = {
  title: string;
  headers: string[];
  rows: Record<string, string>[];
};

export const getSheetData = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ title: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const range = `'${data.title.replace(/'/g, "''")}'!A1:Z10000`;
    const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
    const j: any = await cachedJSON(`data:${data.title}`, url, "Values fetch");
    const values: string[][] = j.values ?? [];
    if (values.length === 0) {
      return { title: data.title, headers: [], rows: [] } satisfies SheetData;
    }
    const rawHeaders = values[0].map((h, i) => (h?.trim() ? h.trim() : `Col ${i + 1}`));
    const rows = values.slice(1).map((r) => {
      const o: Record<string, string> = {};
      rawHeaders.forEach((h, i) => {
        o[h] = (r[i] ?? "").toString();
      });
      return o;
    });
    const filtered = rows.filter((r) => Object.values(r).some((v) => v && v.trim() !== ""));
    return { title: data.title, headers: rawHeaders, rows: filtered } satisfies SheetData;
  });
