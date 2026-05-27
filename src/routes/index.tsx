import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
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
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Menu,
  X,
  Box,
  Lock,
  User,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Pencil,
} from "lucide-react";

import { getSheetData, listSheets, appendSheetRow, updateSheetRow } from "@/lib/sheets.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Vendas" },
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


function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "golfield" && password === "631525") {
      // Get current time in Brasília (UTC-3)
      const now = new Date();
      const brasiliaOffset = -3;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const brTime = new Date(utc + (3600000 * brasiliaOffset));
      
      // Set expiry to 00:00 of the next day in Brasília
      const expiry = new Date(brTime);
      expiry.setHours(24, 0, 0, 0);
      
      // Convert back to UTC timestamp for consistent comparison
      const expiryTimestamp = expiry.getTime() - (3600000 * brasiliaOffset);
      
      localStorage.setItem("auth_token", "authorized");
      localStorage.setItem("auth_expiry", expiryTimestamp.toString());
      onLogin();
    } else {
      setError("Credenciais inválidas");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 ambient-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="h-16 w-16 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-900/20">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">GolField</h1>
          <p className="text-muted-foreground">Área Restrita</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu usuário"
                className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus:ring-cyan-500/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus:ring-cyan-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-700 hover:to-cyan-900 text-white font-bold shadow-lg shadow-cyan-900/20 transition-all active:scale-95">
            Entrar no Painel
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("auth_token");
    const expiry = localStorage.getItem("auth_expiry");
    if (token === "authorized" && expiry) {
      if (new Date().getTime() < parseInt(expiry)) {
        return true;
      }
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_expiry");
    }
    return false;
  });

  const sheetsQuery = useQuery({
    queryKey: ["sheets"],
    queryFn: () => listSheets(),
    refetchInterval: 60_000,
    enabled: isAuthenticated,
  });

  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [extraTabs, setExtraTabs] = useState<string[]>(() => {
    try {
      const v = localStorage.getItem("extra_tabs");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });

  const BASE_TABS = ["ABRIL", "MAIO", "PEDIDOS DE MAIO"];
  const visibleTitles = useMemo(
    () => [...BASE_TABS, ...extraTabs.map((t) => t.toUpperCase().trim())],
    [extraTabs],
  );

  const availableSheets = useMemo(() => {
    if (!isAuthenticated) return [];
    return (sheetsQuery.data?.sheets ?? [])
      .filter((s) => visibleTitles.includes(s.title.toUpperCase().trim()))
      .sort(
        (a, b) =>
          visibleTitles.indexOf(a.title.toUpperCase().trim()) -
          visibleTitles.indexOf(b.title.toUpperCase().trim()),
      );
  }, [sheetsQuery.data, isAuthenticated, visibleTitles]);

  const addExtraTab = (title: string) => {
    const up = title.toUpperCase().trim();
    if (visibleTitles.includes(up)) return;
    const next = [...extraTabs, title];
    setExtraTabs(next);
    localStorage.setItem("extra_tabs", JSON.stringify(next));
    setActiveSheet(title);
  };

  const removeExtraTab = (title: string) => {
    const next = extraTabs.filter((t) => t !== title);
    setExtraTabs(next);
    localStorage.setItem("extra_tabs", JSON.stringify(next));
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const current = activeSheet ?? availableSheets[availableSheets.length - 1]?.title ?? sheetsQuery.data?.sheets[sheetsQuery.data.sheets.length - 1]?.title ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground ambient-bg">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          spreadsheetTitle={sheetsQuery.data?.title}
          sheets={sheetsQuery.data?.sheets ?? []}
          visibleTitles={visibleTitles}
          extraTabs={extraTabs}
          onAddTab={addExtraTab}
          onRemoveTab={removeExtraTab}
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
            {sheetsQuery.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
                Erro ao conectar: {(sheetsQuery.error as Error).message}
              </div>
            ) : current ? (
              <SheetDashboard sheetTitle={current} />
            ) : (
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando planilhas…
              </div>
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
  visibleTitles,
  extraTabs,
  onAddTab,
  onRemoveTab,
  current,
  onSelect,
  open,
  onClose,
}: {
  spreadsheetTitle?: string;
  sheets: { id: number; title: string; rowCount: number }[];
  visibleTitles: string[];
  extraTabs: string[];
  onAddTab: (title: string) => void;
  onRemoveTab: (title: string) => void;
  current: string | null;
  onSelect: (t: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const visibleSheets = sheets
    .filter((s) => visibleTitles.includes(s.title.toUpperCase().trim()))
    .sort(
      (a, b) =>
        visibleTitles.indexOf(a.title.toUpperCase().trim()) -
        visibleTitles.indexOf(b.title.toUpperCase().trim()),
    );
  const addableSheets = sheets.filter(
    (s) => !visibleTitles.includes(s.title.toUpperCase().trim()),
  );

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
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-sm text-foreground">GolField</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">DashBoard</div>
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
          <div className="px-2 py-2 flex items-center gap-2">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Adicionar aba"
                  title="Adicionar aba"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-64 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                  Adicionar aba da planilha
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {addableSheets.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Todas as abas já estão visíveis.
                    </div>
                  ) : (
                    addableSheets.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onAddTab(s.title);
                          setPickerOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-muted text-left"
                      >
                        <Plus className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        <span className="truncate flex-1">{s.title.trim()}</span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Abas
            </span>
          </div>
          {visibleSheets.map((s) => {
            const active = s.title === current;
            const isExtra = extraTabs.includes(s.title);
            return (
              <div key={s.id} className="group relative">
                <button
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
                </button>
                {isExtra && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTab(s.title);
                    }}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                      active ? "text-primary-foreground hover:bg-white/20" : "text-muted-foreground hover:bg-muted-foreground/20",
                    )}
                    aria-label="Remover aba"
                    title="Remover aba"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>


        <div className="px-6 py-4 border-t text-[11px] text-muted-foreground flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Sincronizando a cada 30s
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
          <Badge variant="secondary" className="hidden sm:inline-flex ml-2 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">
            <Activity className="h-3 w-3 mr-1" /> Sincronizado
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
    refetchInterval: 30_000,
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
  const [dateFromEntrada, setDateFromEntrada] = useState<string>("");
  const [dateToEntrada, setDateToEntrada] = useState<string>("");
  const [dateFromSaida, setDateFromSaida] = useState<string>("");
  const [dateToSaida, setDateToSaida] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showOnlyEnvio, setShowOnlyEnvio] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async (all: boolean) => {
    setIsGeneratingPdf(true);
    if (all) setIsPrintingAll(true);
    setShowPdfOptions(false);
    
    // Wait for state update and re-render
    setTimeout(async () => {
      const element = reportRef.current;
      if (!element) return;

      const opt = {
        margin: 10,
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        filename: `relatorio-${sheetTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toLocaleDateString('pt-BR')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
      };

      try {
        await html2pdf().set(opt).from(element).save();
      } finally {
        setIsGeneratingPdf(false);
        setIsPrintingAll(false);
      }
    }, 500);
  };
  

  const validRows = useMemo(() => {
    const pedidoCol = headers.find((h) => {
      const low = h.toLowerCase().trim();
      return (
        low === "pedido" ||
        low === "nº pedido" ||
        low === "nº do pedido" ||
        low === "numero do pedido" ||
        low === "código" ||
        low === "id" ||
        low === "venda" ||
        low.startsWith("nº")
      );
    });

    if (pedidoCol) {
      return rows.filter((row) => {
        const val = (row[pedidoCol] ?? "").trim();
        // Deve conter pelo menos um dígito para ser considerado um pedido válido
        return val !== "" && /\d/.test(val);
      });
    }
    return rows;
  }, [rows, headers]);

  const filtered = useMemo(() => {
    let r = validRows;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((row) => Object.values(row).some((v) => v.toLowerCase().includes(q)));
    }
    for (const [k, v] of Object.entries(filters)) {
      if (!v || v === "__all__") continue;
      if (v === "__has_nf__") {
        r = r.filter((row) => (row[k] ?? "").trim() !== "");
        continue;
      }
      if (v === "__no_nf__") {
        r = r.filter((row) => (row[k] ?? "").trim() === "");
        continue;
      }
      r = r.filter((row) => (row[k] ?? "").trim() === v);
    }
    
    // Filtro DATA ENTRADA (Coluna ENVIO DO P)
    if (dateFromEntrada || dateToEntrada) {
      const from = dateFromEntrada ? new Date(dateFromEntrada) : null;
      const to = dateToEntrada ? new Date(dateToEntrada) : null;
      const headerEntrada = headers.find(h => h.toUpperCase().trim() === "ENVIO DO P");
      if (headerEntrada) {
        r = r.filter((row) => {
          const d = parseDate(row[headerEntrada] ?? "");
          if (!d) return false;
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
      }
    }

    // Filtro DATA SAIDA (Coluna DATA SAIDA)
    if (dateFromSaida || dateToSaida) {
      const from = dateFromSaida ? new Date(dateFromSaida) : null;
      const to = dateToSaida ? new Date(dateToSaida) : null;
      const headerSaida = headers.find(h => h.toUpperCase().trim() === "DATA SAIDA");
      if (headerSaida) {
        r = r.filter((row) => {
          const d = parseDate(row[headerSaida] ?? "");
          if (!d) return false;
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
      }
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

    if (showOnlyEnvio) {
      const envioCol = headers.find((h) => /envio|despacho/i.test(h));
      if (envioCol) {
        r = r.filter((row) => (row[envioCol] ?? "").trim() !== "");
      }
    }
    return r;
  }, [validRows, search, filters, dateFromEntrada, dateToEntrada, dateFromSaida, dateToSaida, sortKey, sortDir, cols, showOnlyEnvio, headers]);

  // KPIs
  const totalRecords = filtered.length;
  const previousCount = validRows.length;
  const sumCol = cols.numericCols[0];
  const sumValue = sumCol ? filtered.reduce((acc, r) => acc + toNumber(r[sumCol]), 0) : null;
  const uniqueClients = cols.categoricalCols[0]
    ? new Set(filtered.map((r) => (r[cols.categoricalCols[0]] ?? "").trim()).filter(Boolean)).size
    : null;
  
  const statusCol = headers.find((h) => /status|ok|liberad|conferenc/i.test(h)) ?? cols.categoricalCols[0];
  const okCol = headers.find((h) => h.toUpperCase().trim() === "OK");
  
  const countLiberados = filtered.filter((r) => {
    const val = (r[statusCol] ?? "").toUpperCase().trim();
    return val === "TRUE" || val === "VERDADEIRO" || val === "OK" || val === "SIM";
  }).length;

  const countOk = okCol 
    ? filtered.filter((r) => (r[okCol] ?? "").toUpperCase().trim() === "OK").length
    : 0;

  const countNaoLiberados = filtered.length - countLiberados;
  const completion = filtered.length ? Math.round((countLiberados / filtered.length) * 100) : 0;

  // Chart data
  const barCol = cols.categoricalCols[0];
  const pieCol = cols.categoricalCols[1] ?? cols.categoricalCols[0];
  const barData = barCol ? countBy(filtered, barCol, 8) : [];
  const pieData = pieCol ? countBy(filtered, pieCol, 6) : [];
  
  const dateFieldForChart = headers.find(h => h.toUpperCase().trim() === "ENVIO DO P") ?? cols.dateCols[0];
  const lineData = dateFieldForChart ? timeSeries(filtered, dateFieldForChart, sumCol) : [];

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
    setDateFromEntrada("");
    setDateToEntrada("");
    setDateFromSaida("");
    setDateToSaida("");
    setPage(1);
    setShowOnlyEnvio(false);
    
  };

  return (
    <div ref={reportRef} className={cn("space-y-6", isGeneratingPdf && "pdf-mode")}>
      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total de Pedidos"
          value={totalRecords.toLocaleString("pt-BR")}
          icon={<Database className="h-4 w-4" />}
          accent="from-cyan-600 to-cyan-800"
        />
        <KpiCard
          label="Liberado"
          value={countLiberados.toLocaleString("pt-BR")}
          delta={`${completion}% de aproveitamento`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-400"
          progress={completion}
        />
        <KpiCard
          label="Não Liberado"
          value={countNaoLiberados.toLocaleString("pt-BR")}
          icon={<X className="h-4 w-4" />}
          accent="from-red-500 to-orange-400"
        />
        <KpiCard
          label="Entregue"
          value={countOk.toLocaleString("pt-BR")}
          icon={<Box className="h-4 w-4" />}
          accent="from-blue-500 to-indigo-400"
        />
      </div>


      {/* Filters + Table */}
      <div className="glass rounded-2xl p-4 md:p-6 shadow-xl shadow-black/5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar em tudo..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10 rounded-xl border-muted-foreground/20 focus:ring-primary/20"
              />
            </div>
          </div>

          {["Liberado", "Impresso", "Envio", "R.Separação", "Conferencia", "Entregador", "NF"].map((colName) => {
            const actualHeader = headers.find(h => h.toLowerCase().trim() === colName.toLowerCase().trim());
            if (!actualHeader) return null;

            const options = Array.from(
              new Set(validRows.map((r) => (r[actualHeader] ?? "").trim()).filter(Boolean))
            ).sort().slice(0, 100);

            return (
              <div key={colName} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  {colName}
                </label>
                <Select
                  value={filters[actualHeader] ?? "__all__"}
                  onValueChange={(v) => {
                    setFilters((f) => ({ ...f, [actualHeader]: v }));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-muted-foreground/20">
                    <SelectValue placeholder={`Filtrar ${colName}`} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="__all__">Todos</SelectItem>
                    {colName.toUpperCase() === "NF" ? (
                      <>
                        <SelectItem value="__has_nf__">SIM</SelectItem>
                        <SelectItem value="__no_nf__">NÃO</SelectItem>
                      </>
                    ) : (
                      options.map((o) => {
                        let display = o;
                        if (o.toUpperCase() === "TRUE") display = "SIM";
                        if (o.toUpperCase() === "FALSE") display = "NÃO";
                        return (
                          <SelectItem key={o} value={o}>{display}</SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
            );
          })}

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              Data Entrada
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFromEntrada}
                onChange={(e) => {
                  setDateFromEntrada(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border-muted-foreground/20"
              />
              <Input
                type="date"
                value={dateToEntrada}
                onChange={(e) => {
                  setDateToEntrada(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border-muted-foreground/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              Data Saida
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFromSaida}
                onChange={(e) => {
                  setDateFromSaida(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border-muted-foreground/20"
              />
              <Input
                type="date"
                value={dateToSaida}
                onChange={(e) => {
                  setDateToSaida(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border-muted-foreground/20"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pt-2 border-t border-muted/30">
          <Button
            size="sm"
            variant="outline"
            onClick={resetFilters}
            className="h-8 px-4 rounded-lg border-muted-foreground/20 hover:bg-muted"
          >
            Limpar filtros
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <AddRecordButton sheetTitle={sheetTitle} headers={headers} onAdded={refetch} />

            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPrintOptions(!showPrintOptions)}
                className="h-8 px-4 rounded-lg border-muted-foreground/20 hover:bg-muted bg-primary/5 text-primary hover:text-primary hover:bg-primary/10"
              >
                <Activity className="h-3.5 w-3.5 mr-1" /> Relatório / Imprimir
              </Button>
            
              <AnimatePresence>
                {showPrintOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 glass rounded-xl border border-white/10 shadow-2xl z-50 p-2 space-y-1"
                  >
                    <button
                      onClick={() => {
                        setIsPrintingAll(false);
                        setShowPrintOptions(false);
                        setTimeout(() => window.print(), 100);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center justify-between"
                    >
                      <span>Página Atual</span>
                      <span className="text-[10px] opacity-50">Apenas esta pág.</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsPrintingAll(true);
                        setShowPrintOptions(false);
                        setTimeout(() => {
                          window.print();
                          setIsPrintingAll(false);
                        }, 100);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center justify-between"
                    >
                      <span>Tudo</span>
                      <span className="text-[10px] opacity-50">Todas as pág.</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-4 rounded-lg border-muted-foreground/20 hover:bg-muted bg-emerald-500/5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
              onClick={() => {
                const spreadsheetId = "1LoDg7FS0Aadc9WX-lPYHF8QNS3dfPWelAVPBccH-q4c";
                window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`, "_blank");
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Editar Planilha
            </Button>

            <div className="flex items-center gap-3 ml-2">
              <div 
                className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => refetch()}
              >
                <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
                <span>
                  Sincronizado {new Date(lastUpdated).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <Badge variant="secondary" className="font-medium whitespace-nowrap px-3 py-1 rounded-full bg-primary/10 text-primary border-none">
                {filtered.length.toLocaleString("pt-BR")} registros
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 whitespace-nowrap no-print">
                    Ações
                  </th>
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
                  {(isPrintingAll || isGeneratingPdf || window.matchMedia('print').matches ? ((isPrintingAll || isGeneratingPdf) ? filtered : pageRows) : pageRows).map((row, idx) => (
                    <motion.tr
                      key={`${safePage}-${idx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.01 }}
                      className="border-t hover:bg-muted/30 transition-colors"
                    >
                        <td className="px-4 py-2.5 text-left whitespace-nowrap no-print">
                          <EditRecordButton
                            sheetTitle={sheetTitle}
                            headers={headers}
                            row={row}
                            onSaved={refetch}
                          />
                        </td>
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
                    <td colSpan={headers.length + 1} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      Nenhum registro encontrado para os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t bg-muted/20 text-xs no-print">
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

function AddRecordButton({
  sheetTitle,
  headers,
  onAdded,
}: {
  sheetTitle: string;
  headers: string[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const row = headers.map((h) => values[h] ?? "");
      return appendSheetRow({ data: { title: sheetTitle, values: row } });
    },
    onSuccess: () => {
      toast.success("Registro adicionado à planilha!");
      setValues({});
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["sheet", sheetTitle] });
      onAdded();
    },
    onError: (e: Error) => toast.error(`Erro ao adicionar: ${e.message}`),
  });

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-4 rounded-lg border-muted-foreground/20 bg-cyan-500/5 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-500/10"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar registro
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar registro · {sheetTitle.trim()}</DialogTitle>
            <DialogDescription>
              Os dados serão enviados em tempo real para a planilha do Google Sheets.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2"
          >
            {headers.map((h) => (
              <div key={h} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{h}</label>
                <Input
                  value={values[h] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [h]: e.target.value }))}
                  placeholder={h}
                  className="h-9"
                />
              </div>
            ))}

            <DialogFooter className="sm:col-span-2 mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white"
              >
                {mutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar à planilha
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditRecordButton({
  sheetTitle,
  headers,
  row,
  onSaved,
}: {
  sheetTitle: string;
  headers: string[];
  row: Record<string, string> & { __rowIndex?: string };
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const rowIndex = Number(row.__rowIndex);

  const openDialog = () => {
    const init: Record<string, string> = {};
    headers.forEach((h) => (init[h] = row[h] ?? ""));
    setValues(init);
    setOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const arr = headers.map((h) => values[h] ?? "");
      return updateSheetRow({ data: { title: sheetTitle, rowIndex, values: arr } });
    },
    onSuccess: () => {
      toast.success("Registro atualizado na planilha!");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["sheet", sheetTitle] });
      onSaved();
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });

  if (!rowIndex) return null;

  return (
    <>
      <button
        onClick={openDialog}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        title="Editar registro"
      >
        <Pencil className="h-3 w-3" />
        Editar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar registro · linha {rowIndex}</DialogTitle>
            <DialogDescription>
              As alterações serão salvas em tempo real na planilha do Google Sheets.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2"
          >
            {headers.map((h) => (
              <div key={h} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{h}</label>
                <Input
                  value={values[h] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [h]: e.target.value }))}
                  placeholder={h}
                  className="h-9"
                />
              </div>
            ))}

            <DialogFooter className="sm:col-span-2 mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white"
              >
                {mutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Salvando…
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Salvar alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

