import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, StickyNote, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRealTransactions } from "../hooks/useRealTransactions";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/busca")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Busca e Notas — Portal CFN" },
      {
        name: "description",
        content: "Busque transações e consulte notas explicativas do Portal de Transparência CFN.",
      },
    ],
  }),
});

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function SearchPage() {
  const [q, setQ] = useState("");
  const { allTransactions, loading } = useRealTransactions();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allTransactions;
    return allTransactions.filter((t) =>
      [t.favorecido, t.categoria, t.cargo, t.descricao, t.origem].some((f) =>
        f.toLowerCase().includes(term),
      ),
    );
  }, [q, allTransactions]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-28 animate-in fade-in duration-300">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 md:px-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <StickyNote className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Busca e Notas
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Encontre transações e consulte explicações
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 md:px-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por favorecido, categoria, cargo..."
            className="pl-9 rounded-2xl h-11"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Sincronizando Base de Dados...</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {results.map((t) => (
              <li key={t.id}>
                <Card className="rounded-2xl border-border/70 shadow-sm transition-all hover:bg-accent/5">
                  <CardContent className="flex gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent ring-1 ring-accent/30">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-foreground truncate">
                          {t.favorecido}
                        </div>
                        <div className="font-semibold whitespace-nowrap text-primary">
                          {BRL(t.valor)}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                        {t.categoria} · {t.cargo}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {t.descricao}
                      </p>
                      <div className="mt-2 font-mono text-[9px] text-muted-foreground/60 uppercase">
                        Origem: {t.origem} · {new Date(t.data).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
            {results.length === 0 && (
              <li className="text-center text-sm text-muted-foreground py-8 font-mono uppercase tracking-widest">
                Nenhum resultado encontrado para "{q}".
              </li>
            )}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
