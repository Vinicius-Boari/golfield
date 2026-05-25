// Heuristics for auto-detecting columns and extracting metrics

export function classifyColumns(headers: string[], rows: Record<string, string>[]) {
  const sample = rows.slice(0, 80);
  const dateCols: string[] = [];
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];
  const textCols: string[] = [];

  for (const h of headers) {
    const vals = sample.map((r) => (r[h] ?? "").trim()).filter(Boolean);
    if (vals.length === 0) {
      textCols.push(h);
      continue;
    }
    const dateHits = vals.filter(isDateLike).length;
    const numHits = vals.filter(isNumericLike).length;
    if (dateHits / vals.length > 0.6) dateCols.push(h);
    else if (numHits / vals.length > 0.7) numericCols.push(h);
    else {
      const unique = new Set(vals.map((v) => v.toLowerCase())).size;
      if (unique <= Math.max(15, vals.length * 0.4)) categoricalCols.push(h);
      else textCols.push(h);
    }
  }
  return { dateCols, numericCols, categoricalCols, textCols };
}

export function isNumericLike(v: string) {
  if (!v) return false;
  const cleaned = v.replace(/[R$\s.]/g, "").replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(cleaned);
}

export function toNumber(v: string): number {
  if (!v) return 0;
  const cleaned = v.replace(/[R$\s.]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

const DATE_RE = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;

export function isDateLike(v: string) {
  return DATE_RE.test(v.trim());
}

export function parseDate(v: string): Date | null {
  const m = v.trim().match(DATE_RE);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(dt.getTime()) ? null : dt;
}

export function countBy(rows: Record<string, string>[], col: string, top = 8) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = (r[col] ?? "").trim() || "—";
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, value]) => ({ name, value }));
}

export function timeSeries(rows: Record<string, string>[], dateCol: string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = parseDate(r[dateCol] ?? "");
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
}

export function downloadCSV(filename: string, headers: string[], rows: Record<string, string>[]) {
  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
