import { createFileRoute } from "@tanstack/react-router";
import { Bell, Lightbulb, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { alerts } from "@/lib/alerts";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alertas")({
  component: AlertsPage,
  head: () => ({
    meta: [
      { title: "Alertas de Gestão — Portal CFN" },
      {
        name: "description",
        content:
          "Variações atípicas e análises automáticas de gastos mensais do Conselho Federal de Nutrição.",
      },
    ],
  }),
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function MiniBars({
  anterior,
  atual,
  alta,
}: {
  anterior: number;
  atual: number;
  alta: boolean;
}) {
  const max = Math.max(anterior, atual);
  const hPrev = (anterior / max) * 100;
  const hCurr = (atual / max) * 100;
  const currColor = alta
    ? "bg-[oklch(0.72_0.13_25)]"
    : "bg-[oklch(0.65_0.15_155)]";
  return (
    <div className="flex items-end gap-2 h-16 w-24 shrink-0">
      <div className="flex flex-1 flex-col items-center gap-1">
        <div
          className="w-full rounded-md bg-muted transition-all duration-500 ease-out"
          style={{ height: `${hPrev}%` }}
        />
        <span className="text-[9px] text-muted-foreground">Anterior</span>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1">
        <div
          className={cn(
            "w-full rounded-md transition-all duration-500 ease-out",
            currColor,
          )}
          style={{ height: `${hCurr}%` }}
        />
        <span className="text-[9px] text-muted-foreground">Atual</span>
      </div>
    </div>
  );
}

function AlertsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-28 animate-in fade-in duration-300">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 md:px-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Alertas de Gestão
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Variações atípicas e análises automáticas de gastos mensais
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 md:px-8">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-accent/40 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lightbulb className="h-5 w-5" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Estes alertas mostram variações de orçamento. Um aumento não
            significa irregularidade, mas indica onde a gestão está focando os
            recursos no momento.
          </p>
        </div>

        <ul className="space-y-3">
          {alerts.map((a, i) => {
            const alta = a.tendencia === "alta";
            return (
              <li
                key={a.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <Card className="rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <MiniBars
                      anterior={a.valor_anterior}
                      atual={a.valor_atual}
                      alta={alta}
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {a.categoria}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            alta
                              ? "bg-[oklch(0.95_0.04_25)] text-[oklch(0.45_0.18_25)]"
                              : "bg-[oklch(0.95_0.05_155)] text-[oklch(0.38_0.13_155)]",
                          )}
                        >
                          {alta ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {a.variacao_percentual}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {a.mensagem}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{BRL(a.valor_anterior)}</span>
                        <span>→</span>
                        <span className="font-medium text-foreground">
                          {BRL(a.valor_atual)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>

        <div className="flex items-start gap-2 pt-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Análises geradas a partir de dados públicos sob a Lei de Acesso à
            Informação (Lei 12.527/2011).
          </span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
