import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Search,
  Download,
  RefreshCw,
  Database,
  LayoutDashboard,
  TrendingUp,
  Activity,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";

import { getSheetData, listSheets } from "@/lib/sheets.functions";
import {
  classifyColumns,
  countBy,
  downloadCSV,
  isNumericLike,
  parseDate,
  timeSeries,
  toNumber,
} from "@/lib/dashboard-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Vendas — Sincronizado com Google Sheets" },
      {
        name: "description",
        content:
          "Dashboard premium em tempo real conectado ao Google Sheets. KPIs, gráficos dinâmicos e tabela inteligente.",
      },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  "oklch(0.62 0.22 264)",
  "oklch(0.7 0.2 200)",
  "oklch(0.75 0.18 145)",
  "oklch(0.78 0.19 70)",
  "oklch(0.7 0.22 25)",
  "oklch(0.65 0.22 320)",
  "oklch(0.72 0.18 100)",
  "oklch(0.68 0.2 235)",
];

function DashboardPage() {
  const sheetsQuery = useQuery({
    queryKey: ["sheets"],
    queryFn: () => listSheets(),
    refetchInterval: 30_000,
  });

  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = activeSheet ?? sheetsQuery.data?.sheets[5]?.title ?? sheetsQuery.data?.sheets[0]?.title ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground ambient-bg">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          spreadsheetTitle={sheetsQuery.data?.title}
          sheets={sheetsQuery.data?.sheets ?? []}
          current={current}
          onSelect={(t) => {
            setActiveSheet(t);
            setSidebarOpen(false);
          }}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0 lg:pl-72">
          <Header onMenu={() => setSidebarOpen(true)} sheetTitle={current} />
          <main className="px-4 md:px-8 pb-16 pt-6 space-y-6">
            {current ? (
              <SheetDashboard sheetTitle={current} />
            ) : (
              <div className="text-muted-foreground text-sm">Carregando planilhas…</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  spreadsheetTitle,
  sheets,
  current,
  onSelect,
  open,
  onClose,
}: {
  spreadsheetTitle?: string;
  sheets: { id: number; title: string; rowCount: number }[];
  current: string | null;
  onSelect: (t: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 glass border-r flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[oklch(0.62_0.22_264)] to-[oklch(0.7_0.2_200)] flex items-center justify-center text-white shadow-lg shadow-[oklch(0.62_0.22_264)]/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold tracking-tight text-sm">Pulse BI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Live Dashboard</div>
            </div>
          </div>
          <button
            className="lg:hidden text-muted-foreground"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-1 flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Planilha
          </div>
          <div className="px-2 pb-3 text-xs text-muted-foreground line-clamp-2">
            {spreadsheetTitle ?? "Carregando…"}
          </div>
          <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Abas
          </div>
          {sheets.map((s) => {
            const active = s.title === current;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.title)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />
                )}
                <span className="truncate flex-1 text-left">{s.title.trim()}</span>
                <span className={cn("text-[10px] tabular-nums", active ? "opacity-80" : "opacity-50")}>
                  {s.rowCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t text-[11px] text-muted-foreground flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Sincronizando a cada 10s
        </div>
      </aside>
    </>
  );
}

function Header({ onMenu, sheetTitle }: { onMenu: () => void; sheetTitle: string | null }) {
  return (
    <header className="sticky top-0 z-30 glass border-b">
      <div className="flex items-center gap-3 px-4 md:px-8 h-16">
        <button className="lg:hidden text-muted-foreground" onClick={onMenu} aria-label="Open sidebar">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground shrink-0" />
          <h1 className="font-semibold tracking-tight truncate">
            {sheetTitle?.trim() ?? "Painel"}
          </h1>
          <Badge variant="secondary" className="hidden sm:inline-flex ml-2 text-[10px] font-medium">
            <Activity className="h-3 w-3 mr-1" /> Tempo real
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function SheetDashboard({ sheetTitle }: { sheetTitle: string }) {
  const dataQuery = useQuery({
    queryKey: ["sheet", sheetTitle],
    queryFn: () => getSheetData({ data: { title: sheetTitle } }),
    refetchInterval: 10_000,
  });

  if (dataQuery.isLoading) return <LoadingSkeleton />;
  if (dataQuery.error)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar: {(dataQuery.error as Error).message}
      </div>
    );
  if (!dataQuery.data) return null;

  return (
    <DashboardContent
      headers={dataQuery.data.headers}
      rows={dataQuery.data.rows}
      sheetTitle={sheetTitle}
      lastUpdated={dataQuery.dataUpdatedAt}
      isFetching={dataQuery.isFetching}
      refetch={() => dataQuery.refetch()}
    />
  );
}

function DashboardContent({
  headers,
  rows,
  sheetTitle,
  lastUpdated,
  isFetching,
  refetch,
}: {
  headers: string[];
  rows: Record<string, string>[];
  sheetTitle: string;
  lastUpdated: number;
  isFetching: boolean;
  refetch: () => void;
}) {
  const cols = useMemo(() => classifyColumns(headers, rows), [headers, rows]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dateField, setDateField] = useState<string>(cols.dateCols[0] ?? "");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let r = rows;

    // Filter out rows without a valid order number if a "pedido" column exists
    const pedidoCol = headers.find((h) => {
      const low = h.toLowerCase().trim();
      return low === "pedido" || low === "nº pedido" || low === "numero do pedido";
    });

    if (pedidoCol) {
      r = r.filter((row) => {
        const val = (row[pedidoCol] ?? "").trim();
        // Must exist and contain at least one digit
        return val !== "" && /\d/.test(val);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((row) => Object.values(row).some((v) => v.toLowerCase().includes(q)));
    }
    for (const [k, v] of Object.entries(filters)) {
      if (!v || v === "__all__") continue;
      r = r.filter((row) => (row[k] ?? "").trim() === v);
    }
    if (dateField && (dateFrom || dateTo)) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      r = r.filter((row) => {
        const d = parseDate(row[dateField] ?? "");
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    if (sortKey) {
      const numeric = cols.numericCols.includes(sortKey);
      const dateCol = cols.dateCols.includes(sortKey);
      r = [...r].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        let cmp = 0;
        if (numeric) cmp = toNumber(av) - toNumber(bv);
        else if (dateCol) {
          const ad = parseDate(av)?.getTime() ?? 0;
          const bd = parseDate(bv)?.getTime() ?? 0;
          cmp = ad - bd;
        } else cmp = av.localeCompare(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, search, filters, dateField, dateFrom, dateTo, sortKey, sortDir, cols]);

  // KPIs
  const totalRecords = filtered.length;
  const previousCount = rows.length;
  const sumCol = cols.numericCols[0];
  const sumValue = sumCol ? filtered.reduce((acc, r) => acc + toNumber(r[sumCol]), 0) : null;
  const uniqueClients = cols.categoricalCols[0]
    ? new Set(filtered.map((r) => (r[cols.categoricalCols[0]] ?? "").trim()).filter(Boolean)).size
    : null;
  const completion = (() => {
    const statusCol =
      headers.find((h) => /status|ok|liberad|conferenc/i.test(h)) ?? cols.categoricalCols[0];
    if (!statusCol) return null;
    const positives = filtered.filter((r) => /ok|true|conclu|sim|entregue|liberad/i.test(r[statusCol] ?? "")).length;
    return filtered.length ? Math.round((positives / filtered.length) * 100) : 0;
  })();

  // Chart data
  const barCol = cols.categoricalCols[0];
  const pieCol = cols.categoricalCols[1] ?? cols.categoricalCols[0];
  const barData = barCol ? countBy(filtered, barCol, 8) : [];
  const pieData = pieCol ? countBy(filtered, pieCol, 6) : [];
  const lineData = dateField ? timeSeries(filtered, dateField, sumCol) : [];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (h: string) => {
    if (sortKey === h) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(h);
      setSortDir("asc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilters({});
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Registros"
          value={totalRecords.toLocaleString("pt-BR")}
          delta={previousCount ? `${Math.round((totalRecords / previousCount) * 100)}% do total` : undefined}
          icon={<Database className="h-4 w-4" />}
          accent="from-[oklch(0.62_0.22_264)] to-[oklch(0.7_0.2_200)]"
        />
        {sumValue !== null && (
          <KpiCard
            label={sumCol ?? "Total"}
            value={sumValue.toLocaleString("pt-BR", {
              style: /valor|preco|total|receita/i.test(sumCol ?? "") ? "currency" : "decimal",
              currency: "BRL",
              maximumFractionDigits: 2,
            })}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="from-emerald-500 to-teal-400"
          />
        )}
        {uniqueClients !== null && (
          <KpiCard
            label={`${cols.categoricalCols[0]} únicos`}
            value={uniqueClients.toLocaleString("pt-BR")}
            icon={<Sparkles className="h-4 w-4" />}
            accent="from-amber-500 to-orange-400"
          />
        )}
        {completion !== null && (
          <KpiCard
            label="Taxa de conclusão"
            value={`${completion}%`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="from-fuchsia-500 to-pink-400"
            progress={completion}
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Distribuição" subtitle={barCol ?? "—"} className="lg:col-span-2">
          {barData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.22 264)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="oklch(0.7 0.2 200)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Composição" subtitle={pieCol ?? "—"}>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--background)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Evolução temporal" subtitle={dateField ? (sumCol ? `${dateField} · Soma de ${sumCol}` : `${dateField} · Contagem`) : "Sem data detectada"} className="lg:col-span-3">
          {lineData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={lineData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.22 264)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.62 0.22 264)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  formatter={(val: number) => [
                    sumCol && /valor|preco|total|receita/i.test(sumCol)
                      ? `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : val.toLocaleString("pt-BR"),
                    sumCol || "Quantidade",
                  ]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.62 0.22 264)"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* Filters + Table */}
      <div className="glass rounded-2xl p-4 md:p-6 shadow-xl shadow-black/5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros avançados
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Atualizado{" "}
            {new Date(lastUpdated).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
            <Button size="sm" variant="ghost" onClick={refetch} className="h-7 px-2">
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisa inteligente em todos os campos…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>

          {cols.categoricalCols.slice(0, 3).map((c) => {
            const options = Array.from(
              new Set(rows.map((r) => (r[c] ?? "").trim()).filter(Boolean)),
            ).slice(0, 60);
            return (
              <Select
                key={c}
                value={filters[c] ?? "__all__"}
                onValueChange={(v) => {
                  setFilters((f) => ({ ...f, [c]: v }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={c} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos · {c}</SelectItem>
                  {options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}

          {cols.dateCols.length > 0 && (
            <>
              <Select value={dateField} onValueChange={setDateField}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Campo de data" />
                </SelectTrigger>
                <SelectContent>
                  {cols.dateCols.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10" />
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button size="sm" variant="outline" onClick={resetFilters} className="h-8">
            Limpar filtros
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCSV(`${sheetTitle.trim()}.csv`, headers, filtered)}
            className="h-8"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {filtered.length.toLocaleString("pt-BR")} de {rows.length.toLocaleString("pt-BR")} registros
          </Badge>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 whitespace-nowrap select-none cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort(h)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h}
                        <ChevronsUpDown className={cn("h-3 w-3", sortKey === h ? "opacity-100" : "opacity-30")} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {pageRows.map((row, idx) => (
                    <motion.tr
                      key={`${safePage}-${idx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.01 }}
                      className="border-t hover:bg-muted/30 transition-colors"
                    >
                      {headers.map((h) => {
                        const v = row[h] ?? "";
                        return (
                          <td key={h} className="px-4 py-2.5 whitespace-nowrap max-w-[260px] truncate">
                            <CellRender value={v} header={h} />
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={headers.length} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      Nenhum registro encontrado para os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t bg-muted/20 text-xs">
            <div className="text-muted-foreground">
              Página {safePage} de {totalPages}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CellRender({ value, header }: { value: string; header: string }) {
  const v = value.trim();
  if (!v) return <span className="text-muted-foreground/40">—</span>;
  if (/^(ok|true|sim|liberad|conclu|entregue)/i.test(v))
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">
        {v}
      </Badge>
    );
  if (/^(false|nao|não|pendente|atras)/i.test(v))
    return (
      <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300">
        {v}
      </Badge>
    );
  if (isNumericLike(v) && /valor|preco|total|receita/i.test(header))
    return <span className="tabular-nums font-medium">R$ {toNumber(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>;
  return <span>{v}</span>;
}

function KpiCard({
  label,
  value,
  delta,
  icon,
  accent,
  progress,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
  accent: string;
  progress?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl p-5 relative overflow-hidden shadow-xl shadow-black/5"
    >
      <div className={cn("absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl", accent)} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </span>
        <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br text-white flex items-center justify-center", accent)}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      {delta && (
        <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3" />
          {delta}
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn("h-full rounded-full bg-gradient-to-r", accent)}
          />
        </div>
      )}
    </motion.div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("glass rounded-2xl p-5 shadow-xl shadow-black/5", className)}
    >
      <div className="mb-4">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      {children}
    </motion.div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
      Dados insuficientes
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="h-72 rounded-2xl bg-muted/40 lg:col-span-2" />
        <div className="h-72 rounded-2xl bg-muted/40" />
        <div className="h-64 rounded-2xl bg-muted/40 lg:col-span-3" />
      </div>
      <div className="h-96 rounded-2xl bg-muted/40" />
    </div>
  );
}
