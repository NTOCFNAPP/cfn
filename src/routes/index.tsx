import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { transactions, type Transaction } from "@/lib/transactions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Portal de Transparência CFN" },
      {
        name: "description",
        content:
          "Portal de Transparência do Conselho Federal de Nutrição — gestão de recursos e prestação de contas para a categoria.",
      },
    ],
  }),
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CATEGORY_ICONS: Record<string, typeof Plane> = {
  "Diárias e Passagens": Plane,
  "Serviços de Terceiros": Cog,
  "Eventos e Capacitação": GraduationCap,
};

const PALETTE = [
  "var(--color-primary)",
  "oklch(0.72 0.14 160)",
  "oklch(0.85 0.10 160)",
  "oklch(0.45 0.10 160)",
];

function InfoPop({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Origem do dado"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm leading-relaxed">
        {text}
      </PopoverContent>
    </Popover>
  );
}

const SOURCE_TEXT =
  "Fonte: Portal da Transparência da CGU via API de Dados Abertos. Dados sincronizados conforme a Lei de Acesso à Informação.";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {children}
      </h2>
      <InfoPop text={SOURCE_TEXT} />
    </div>
  );
}

const FILTERS = ["Hoje", "Este Mês", "Este Ano"] as const;
type Filter = (typeof FILTERS)[number];

function Dashboard() {
  const [filter, setFilter] = useState<Filter>("Este Mês");
  const [expanded, setExpanded] = useState<string | null>(null);

  const total = transactions.reduce((s, t) => s + t.valor, 0);
  const totalDiarias = transactions
    .filter((t) => t.categoria === "Diárias e Passagens")
    .reduce((s, t) => s + t.valor, 0);
  const saldoProjetos = 250000 - total;

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    transactions.forEach((t) =>
      m.set(t.categoria, (m.get(t.categoria) ?? 0) + t.valor),
    );
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, []);

  const byCargo = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const arr = m.get(t.cargo) ?? [];
      arr.push(t);
      m.set(t.cargo, arr);
    });
    return Array.from(m, ([cargo, items]) => {
      const totalCargo = items.reduce((s, t) => s + t.valor, 0);
      const top = [...items].sort((a, b) => b.valor - a.valor)[0];
      return { cargo, total: totalCargo, top: top.categoria, items };
    });
  }, []);

  const summary = [
    {
      label: "Gasto Total Mensal",
      value: BRL(total),
      icon: Wallet,
    },
    {
      label: "Total em Diárias",
      value: BRL(totalDiarias),
      icon: Plane,
    },
    {
      label: "Saldo de Projetos",
      value: BRL(saldoProjetos),
      icon: Briefcase,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                Portal de Transparência CFN
              </h1>
              <p className="text-xs text-muted-foreground md:text-sm">
                Gestão de Recursos e Prestação de Contas para a Categoria
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <Calendar className="h-3.5 w-3.5" />
            Atualizado hoje
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Visão Geral</SectionTitle>
          <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <section className="grid gap-4 md:grid-cols-3">
          {summary.map(({ label, value, icon: Icon }) => (
            <Card
              key={label}
              className="rounded-2xl border-border/70 shadow-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Donut + Cargo */}
        <section className="grid gap-6 lg:grid-cols-5">
          <Card className="rounded-2xl border-border/70 shadow-sm lg:col-span-2">
            <CardHeader>
              <SectionTitle>Despesas por Categoria</SectionTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      stroke="var(--color-background)"
                      strokeWidth={2}
                    >
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(v: number) => BRL(v)}
                      contentStyle={{
                        backgroundColor: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        color: "var(--color-popover-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2">
                {byCategory.map((c, i) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                      />
                      <span className="text-muted-foreground">{c.name}</span>
                    </span>
                    <span className="font-medium">
                      {((c.value / total) * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-sm lg:col-span-3">
            <CardHeader>
              <SectionTitle>Detalhamento por Função/Cargo</SectionTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {byCargo.map((c) => {
                const open = expanded === c.cargo;
                return (
                  <div
                    key={c.cargo}
                    className="rounded-2xl border border-border/70 bg-card transition-shadow hover:shadow-sm"
                  >
                    <button
                      onClick={() => setExpanded(open ? null : c.cargo)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{c.cargo}</div>
                          <span className="mt-0.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            Maior gasto: {c.top}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Total
                          </div>
                          <div className="font-semibold">{BRL(c.total)}</div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            open && "rotate-180",
                          )}
                        />
                      </div>
                    </button>
                    {open && (
                      <div className="border-t border-border/70 px-4 py-3 text-sm text-muted-foreground space-y-2">
                        {c.items.map((it) => (
                          <div key={it.id} className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <div>
                              <div className="text-foreground">
                                {it.descricao}
                              </div>
                              <div className="text-xs">
                                {it.origem} · {BRL(it.valor)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Transactions extract */}
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <SectionTitle>Extrato de Transações</SectionTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/70">
              {transactions.map((t) => {
                const Icon = CATEGORY_ICONS[t.categoria] ?? Wallet;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">
                        {t.favorecido}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {t.categoria} ·{" "}
                        {new Date(t.data).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{BRL(t.valor)}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {t.cargo}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-8 border-t border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-5 md:px-8">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Este aplicativo opera em conformidade com a Lei de Acesso à
            Informação (Lei 12.527/2011) e respeita as diretrizes da LGPD (Lei
            13.709/2018). Os dados aqui apresentados são de natureza pública e
            não expõem dados sensíveis de pessoas físicas além do permitido por
            lei.
          </p>
        </div>
      </footer>
    </div>
  );
}
