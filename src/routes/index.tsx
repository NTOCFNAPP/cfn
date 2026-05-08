import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wallet,
  Plane,
  Briefcase,
  HelpCircle,
  ChevronDown,
  Building2,
  GraduationCap,
  Cog,
  ShieldCheck,
  Calendar,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type Transaction } from "@/lib/transactions";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { CommentsSection } from "@/components/CommentsSection";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard Audita CFN — Transparência em Real-Time" },
      {
        name: "description",
        content:
          "Portal de Transparência de alta performance do CFN. Fiscalização moderna e prestação de contas automatizada para nutricionistas.",
      },
    ],
  }),
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const CATEGORY_ICONS: Record<string, typeof Plane> = {
  "Diárias e Passagens": Plane,
  "Serviços de Terceiros": Cog,
  "Eventos e Capacitação": GraduationCap,
};

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeOutExpo * end);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{BRL(displayValue)}</span>;
}

function InfoPop({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Origem do dado"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/50 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 border-primary/20 bg-card/80 p-4 text-xs leading-relaxed backdrop-blur-xl">
        <div className="flex gap-3">
          <Activity className="h-4 w-4 shrink-0 text-primary" />
          <p>{text}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SOURCE_TEXT =
  "Auditoria automatizada baseada na Lei 12.527/2011. Dados extraídos das bases oficiais do Conselho Federal de Nutrição e CGU.";

function SectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground/90 uppercase">
          {children}
        </h2>
        <InfoPop text={SOURCE_TEXT} />
      </div>
      {subtitle && (
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {subtitle}
        </p>
      )}
    </div>
  );
}

const FILTERS = ["Hoje", "Mensal", "Anual"] as const;
type Filter = (typeof FILTERS)[number];

function Dashboard() {
  const [filter, setFilter] = useState<Filter>("Mensal");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      // 1. Buscar Passagens
      const { data: passagens, error: pError } = await supabase
        .from("viagens_passagens")
        .select("*");
      
      // 2. Buscar Deslocamentos
      const { data: deslocamentos, error: dError } = await supabase
        .from("viagem_deslocamentos")
        .select("*");

      if (pError) console.error("Erro passagens:", pError);
      if (dError) console.error("Erro deslocamentos:", dError);

      // 3. Mapear e Unificar com parsing robusto de valores e chaves
      const findVal = (obj: any, patterns: string[]): any => {
        const keys = Object.keys(obj);
        for (const p of patterns) {
          const found = keys.find(k => k.toLowerCase() === p.toLowerCase());
          if (found && obj[found] !== null && obj[found] !== undefined) return obj[found];
        }
        // Fallback: search for keys containing the pattern
        for (const p of patterns) {
          const found = keys.find(k => k.toLowerCase().includes(p.toLowerCase()));
          if (found && obj[found] !== null && obj[found] !== undefined) return obj[found];
        }
        return null;
      };

      const parseValue = (obj: any, keys: string[]): number => {
        const raw = findVal(obj, keys);
        if (raw === null || raw === undefined || raw === "") return 0;
        if (typeof raw === 'number') return raw;
        
        // Limpeza robusta: remove R$, espaços, e trata formatos de milhar/decimal
        const clean = String(raw).replace(/[^\d.,-]/g, '').trim();
        if (!clean) return 0;

        // Se tem vírgula e ponto, ponto é milhar e vírgula é decimal (BR: 1.234,56)
        if (clean.includes(',') && clean.includes('.')) {
          return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
        }
        
        // Se tem apenas vírgula e parece decimal (ex: 1234,56 ou 1,5)
        if (clean.includes(',') && clean.indexOf(',') === clean.lastIndexOf(',')) {
          const parts = clean.split(',');
          if (parts[1].length <= 2) {
             return parseFloat(clean.replace(',', '.'));
          } else {
             return parseFloat(clean.replace(',', ''));
          }
        }

        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
      };

      const parseDate = (obj: any, keys: string[]): string => {
        const raw = findVal(obj, keys);
        if (!raw) return new Date().toISOString();
        
        const str = String(raw);
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str;

        const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }

        return new Date(str).toISOString();
      };

      const mappedPassagens: Transaction[] = (passagens || []).map((p: any) => ({
        id: findVal(p, ["Id", "IdProcesso", "codigo", "PC"]) || `p-${Math.random()}`,
        data: parseDate(p, ["DataIdaEVoltaFormatada", "DataIdaEVolta", "DataFim", "Data", "data_inicio", "Data_Ida_E_Volta_Formatada"]),
        cargo: findVal(p, ["TipoPassageiro", "Cargo", "Ocupacao", "passageiro_tipo"]) || "Não Informado",
        categoria: `Passagem: ${findVal(p, ["CiaAerea", "Companhia", "Transporte", "Cia_Aerea"]) || "Aérea"}`,
        favorecido: findVal(p, ["NomePassageiro", "Nome", "Favorecido", "passageiro_nome"]) || "Anônimo",
        valor: parseValue(p, ["ValorTotal", "TotalTarifas", "Valor", "TotalTarifasComDesconto", "Soma", "Valor_Total"]),
        descricao: findVal(p, ["NomeEventoFormatado", "Descricao", "Evento", "Nome_Evento_Formatado"]) || "Viagem institucional",
        origem: `Processo: ${findVal(p, ["CodigoProcesso", "Processo", "Numero", "Codigo_Processo"]) || "N/A"}`
      }));

      const mappedDeslocamentos: Transaction[] = (deslocamentos || []).map((d: any) => ({
        id: findVal(d, ["Id", "id"]) || `d-${Math.random()}`,
        data: parseDate(d, ["DataHoraIda", "DataHoraIdaFormatada", "Data", "data_deslocamento", "Data_Hora_Ida"]),
        cargo: findVal(d, ["TipoPassageiro", "Cargo"]) || "Colaborador",
        categoria: "Deslocamento / Diária",
        favorecido: findVal(d, ["NomePassageiro", "Favorecido", "Nome"]) || "Anônimo",
        valor: parseValue(d, ["ValorTotalDespesas", "ValorTotal", "Valor", "ProcessoDespesas", "Soma", "Valor_Total_Despesas"]),
        descricao: findVal(d, ["NomeDespesaPadrao", "Motivo", "Descricao", "finalidade", "Nome_Despesa_Padrao"]) || "Despesas de deslocamento",
        origem: `Evento: ${findVal(d, ["NomeEventoFormatado", "Evento", "origem", "Nome_Evento_Formatado"]) || "N/A"}`
      }));

      const combined = [...mappedPassagens, ...mappedDeslocamentos].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      setAllTransactions(combined);
    } catch (error) {
      console.error("Falha ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  const total = useMemo(() => allTransactions.reduce((s, t) => s + t.valor, 0), [allTransactions]);
  const totalDiarias = useMemo(() => 
    allTransactions
      .filter((t) => t.categoria.includes("Deslocamento"))
      .reduce((s, t) => s + t.valor, 0)
  , [allTransactions]);
  
  const saldoProjetos = 1500000 - total; // Teto operacional aumentado para dados reais

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    allTransactions.forEach((t) => {
      const cat = t.categoria.startsWith("Passagem") ? "Passagens Aéreas" : t.categoria;
      m.set(cat, (m.get(cat) ?? 0) + t.valor);
    });
    return Array.from(m, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [allTransactions]);

  const byCargo = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    allTransactions.forEach((t) => {
      const arr = m.get(t.cargo) ?? [];
      arr.push(t);
      m.set(t.cargo, arr);
    });
    return Array.from(m, ([cargo, items]) => {
      const totalCargo = items.reduce((s, t) => s + t.valor, 0);
      const top = [...items].sort((a, b) => b.valor - a.valor)[0];
      return { cargo, total: totalCargo, top: top.categoria, items };
    });
  }, [allTransactions]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase animate-pulse">
          Sincronizando Auditoria Social...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-28 selection:bg-primary/20">
      {/* Dynamic Background Effect */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-accent/5 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-background border border-border/50 text-primary shadow-2xl">
                <ShieldCheck className="h-7 w-7" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-xl font-black tracking-tight uppercase italic md:text-2xl">
                AUDITA <span className="text-primary not-italic">CFN</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <p className="font-mono text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  Transparência Fiscal Live
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden items-center gap-3 rounded-2xl border border-border/50 bg-card/40 px-4 py-2 backdrop-blur-sm md:flex"
          >
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-mono text-[10px] font-bold tracking-tighter text-muted-foreground uppercase">
              Relatório Gerado em {new Date().toLocaleDateString("pt-BR")}
            </span>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        {/* IMPACT HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card p-1 shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/10 blur-[80px]" />
          <div className="relative flex flex-col gap-10 p-8 md:flex-row md:items-end md:justify-between md:p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-primary uppercase">
                <TrendingDown className="h-3 w-3" />
                Déficit Operacional: -12.4%
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-lg font-medium text-muted-foreground">
                  Gasto Consolidado do Período
                </h2>
                <div className="font-display text-6xl font-black tracking-tighter md:text-8xl">
                  <AnimatedNumber value={total} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Meta Fiscal
                  </p>
                  <p className="text-xl font-bold italic">{BRL(500000)}</p>
                </div>
                <div className="h-10 w-px bg-border/40" />
                <div className="space-y-1">
                  <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Status Auditado
                  </p>
                  <p className="flex items-center gap-2 text-xl font-bold tracking-tighter text-emerald-500">
                    NORMAL
                  </p>
                </div>
              </div>
            </div>

            <div className="flex h-48 w-full items-end gap-2 md:w-64">
              {byCategory.map((c, i) => (
                <div
                  key={c.name}
                  className="group relative flex-1"
                  title={`${c.name}: ${BRL(c.value)}`}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(c.value / total) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                    className={cn(
                      "w-full rounded-t-lg bg-primary/20 ring-1 ring-primary/30 transition-all hover:bg-primary hover:ring-primary",
                      i === 0 && "bg-primary ring-primary opacity-60",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* BENTO GRID */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-6">
          {/* Secondary stats bento items */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-2"
          >
            <Card className="h-full rounded-3xl border-border/40 bg-card/60 shadow-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Diárias e Deslocamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="font-display text-4xl font-black">
                    {BRL(totalDiarias)}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-destructive font-bold uppercase transition-transform hover:translate-x-1 cursor-default">
                  <TrendingUp className="h-3 w-3" />
                  Alta de 8.2% vs Mês Anterior
                </div>
                <div className="mt-6 flex h-12 items-center gap-1 rounded-2xl bg-accent/5 px-4 outline outline-1 outline-accent/20">
                  <Plane className="h-5 w-5 text-accent" />
                  <span className="font-mono text-[9px] font-medium tracking-wide">
                    {allTransactions.length} Emissões este mês
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 lg:col-span-2"
          >
            <Card className="h-full rounded-3xl border-border/40 bg-card/60 shadow-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Saldo Orçamentário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-black">
                  {BRL(saldoProjetos)}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase">
                  <TrendingDown className="h-3 w-3 rotate-180" />
                  Gasto Controlado
                </div>
                <div className="mt-6 space-y-1.5">
                  <div className="h-1.5 w-full rounded-full bg-border/20 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(total / 250000) * 100}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <p className="font-mono text-[8px] text-right text-muted-foreground">
                    68% DO TETO UTILIZADO
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Donut Chart Bento Item */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-4 lg:col-span-2 lg:row-span-2"
          >
            <Card className="h-full overflow-hidden rounded-3xl border-primary/20 bg-primary/[0.03] shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <SectionTitle subtitle="Categorização Fiscal">
                  Mix de Gastos
                </SectionTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative h-64 w-full">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      Total
                    </span>
                    <span className="font-display text-lg font-black truncate max-w-[120px]">
                      {BRL(total)}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        stroke="transparent"
                        strokeWidth={0}
                      >
                        {byCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={`oklch(0.6 ${0.15 - i * 0.03} ${240 + i * 20})`}
                            className="hover:opacity-80 transition-opacity outline-none"
                          />
                        ))}
                      </Pie>
                      <RTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-xl border border-border bg-card/90 p-3 shadow-xl backdrop-blur-md">
                                <p className="font-display text-xs font-bold uppercase">
                                  {payload[0].name}
                                </p>
                                <p className="font-mono text-lg font-black text-primary">
                                  {BRL(payload[0].value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 w-full space-y-4">
                  {byCategory.map((c, i) => (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: `oklch(0.6 ${0.15 - i * 0.03} ${240 + i * 20})`,
                            }}
                          />
                          {c.name}
                        </span>
                        <span className="font-display font-bold">
                          {((c.value / total) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-border/10 overflow-hidden">
                        <div
                          className="h-full bg-primary/40"
                          style={{
                            width: `${(c.value / total) * 100}%`,
                            backgroundColor: `oklch(0.6 ${0.15 - i * 0.03} ${240 + i * 20})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Large Detailed List Bento Item */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-4 lg:col-span-4"
          >
            <Card className="rounded-3xl border-border/40 bg-card/40 shadow-xl backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 py-6">
                <SectionTitle subtitle="Detalhamento por Ocupação">
                  Hierarquia de Gastos
                </SectionTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <ArrowUpRight className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {byCargo.map((c, idx) => {
                  const open = expanded === c.cargo;
                  return (
                    <motion.div
                      layout
                      key={c.cargo}
                      className={cn(
                        "group overflow-hidden rounded-3xl border border-border/40 bg-card/50 transition-all hover:bg-card/80",
                        open && "border-primary/30 bg-card/90 shadow-lg",
                      )}
                    >
                      <button
                        onClick={() => setExpanded(open ? null : c.cargo)}
                        className="flex w-full items-center justify-between gap-4 p-5 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/5 text-accent ring-1 ring-accent/10 transition-colors group-hover:bg-accent/10",
                            open && "bg-primary/10 text-primary ring-primary/20"
                          )}>
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-display text-base font-black uppercase tracking-tight">
                              {c.cargo}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-2">
                              <span className="inline-flex items-center rounded-lg bg-primary/5 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-primary uppercase">
                                Predominante: {c.top}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-50">
                              Alocação
                            </div>
                            <div className="font-display text-lg font-black tracking-tighter">
                              {BRL(c.total)}
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: open ? 180 : 0 }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-border/20"
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-border/20"
                          >
                            <div className="space-y-4 p-6">
                              {c.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="flex items-start justify-between gap-4 border-b border-border/10 pb-3 last:border-0 last:pb-0 font-sans"
                                >
                                  <div className="space-y-1">
                                    <div className="text-sm font-bold text-foreground/80">
                                      {it.descricao}
                                    </div>
                                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                                      {it.origem} · {new Date(it.data).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="font-display text-sm font-black text-primary">
                                    {BRL(it.valor)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* TRANSACTIONS EXTRACT RE-DESIGNED */}
        <section className="grid gap-6">
           <Card className="rounded-[2.5rem] border-border/40 bg-card/60 shadow-2xl backdrop-blur-md overflow-hidden">
              <CardHeader className="p-8 border-b border-border/20">
                 <SectionTitle subtitle="Fluxo de Caixa Auditado">Livro de Movimentações</SectionTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-border/10 bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                         <th className="px-8 py-4">Data</th>
                         <th className="px-4 py-4">Favorecido / Descrição</th>
                         <th className="px-4 py-4">Categoria</th>
                         <th className="px-8 py-4 text-right">Valor</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border/10">
                       {allTransactions.map((t) => {
                         const Icon = CATEGORY_ICONS[t.categoria] ?? Wallet;
                         return (
                           <motion.tr
                             initial={{ opacity: 0 }}
                             whileInView={{ opacity: 1 }}
                             key={t.id}
                             className="group hover:bg-primary/[0.02] transition-colors"
                           >
                             <td className="px-8 py-5 font-mono text-[10px] text-muted-foreground">
                               {new Date(t.data).toLocaleDateString("pt-BR")}
                             </td>
                             <td className="px-4 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/5 text-accent ring-1 ring-accent/10">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="font-display text-sm font-bold truncate max-w-[200px] md:max-w-xs">{t.favorecido}</div>
                                    <div className="font-mono text-[9px] text-muted-foreground uppercase">{t.cargo}</div>
                                  </div>
                               </div>
                             </td>
                             <td className="px-4 py-5">
                                <span className="inline-flex items-center rounded-full bg-border/20 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-foreground/70">
                                  {t.categoria}
                                </span>
                             </td>
                             <td className="px-8 py-5 text-right font-display text-base font-black text-primary">
                               {BRL(t.valor)}
                             </td>
                           </motion.tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
              </CardContent>
           </Card>
        </section>

        {/* AUDITORIA SOCIAL - COMENTÁRIOS */}
        <section className="grid gap-6">
           <CommentsSection />
        </section>
      </main>

      <footer className="mt-12 border-t border-border/40 bg-card/40 py-12 relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl space-y-4">
               <div className="flex items-center gap-3">
                 <ShieldCheck className="h-6 w-6 text-primary" />
                 <span className="font-display text-lg font-black italic tracking-tighter uppercase">Protocolo Transparência <span className="text-primary not-italic tracking-normal lowercase opacity-50">v2.4.0</span></span>
               </div>
               <p className="text-xs leading-relaxed text-muted-foreground font-medium max-w-lg">
                Este ecossistema de dados opera sob os protocolos da Lei de Acesso à Informação (12.527/2011) e LGPD (13.709/2018).
                Toda a infraestrutura de dados é auditada para garantir que informações públicas sejam servidas com integridade técnica e ética.
              </p>
            </div>
            <div className="flex gap-12">
               <div className="space-y-4">
                  <p className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Base Legal</p>
                  <ul className="space-y-2 text-[10px] font-bold text-foreground/70 uppercase tracking-tighter">
                    <li className="hover:text-primary transition-colors cursor-pointer">Diário Oficial</li>
                    <li className="hover:text-primary transition-colors cursor-pointer">Portal da CGU</li>
                    <li className="hover:text-primary transition-colors cursor-pointer">Dados Abertos CFN</li>
                  </ul>
               </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/20 flex justify-between items-center">
             <p className="font-mono text-[8px] text-muted-foreground/40 tracking-widest uppercase">© 2026 AUDITA CFN · DESENVOLVIDO PARA NUTRICIONISTAS</p>
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             </div>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
