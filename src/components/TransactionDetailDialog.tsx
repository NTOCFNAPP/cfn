import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  User,
  Tag,
  MapPin,
  FileText,
  CreditCard,
  Info,
} from "lucide-react";
import { useState } from "react";
import { type Transaction } from "@/lib/transactions";

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export function TransactionDetailDialog({
  transaction,
  onClose,
}: TransactionDetailDialogProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <Dialog
      open={!!transaction}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setShowRaw(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl overflow-hidden border-primary/20 bg-card/95 p-0 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-display text-2xl font-black italic tracking-tight uppercase">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              Dossiê de Movimentação
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="font-mono text-[9px] min-w-24 uppercase tracking-widest text-muted-foreground"
            >
              {showRaw ? "Ver Resumo" : "Dados Brutos"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        {transaction && (
          <div className="custom-scrollbar max-h-[80vh] space-y-6 overflow-y-auto p-8 pt-4">
            {showRaw ? (
              <div className="rounded-2xl border border-border/40 bg-black/20 p-4 font-mono text-[10px] leading-relaxed">
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {JSON.stringify(transaction.raw, null, 2)}
                </pre>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 rounded-2xl border border-border/40 bg-muted/30 p-4">
                    <p className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                      Valor Auditado
                    </p>
                    <p className="font-display text-2xl font-black text-primary">
                      {BRL(transaction.valor)}
                    </p>
                  </div>
                  <div className="space-y-1.5 rounded-2xl border border-border/40 bg-muted/30 p-4 text-right">
                    <p className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                      Data da Operação
                    </p>
                    <p className="font-display text-lg font-bold">
                      {new Date(transaction.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <User className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                        Favorecido / Cargo
                      </p>
                      <p className="font-display text-lg font-black leading-tight uppercase">
                        {transaction.favorecido}
                      </p>
                      <p className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                        {transaction.cargo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Tag className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                        Categoria / Evento
                      </p>
                      <p className="text-sm font-bold uppercase">
                        {transaction.categoria}
                      </p>
                      <p className="text-sm text-foreground/80">
                        {transaction.descricao}
                      </p>
                    </div>
                  </div>

                  {transaction.origemDestino && (
                    <div className="flex items-start gap-4">
                      <MapPin className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                          Roteiro / Trecho
                        </p>
                        <p className="text-sm font-bold uppercase">
                          {transaction.origemDestino}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <FileText className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                        Documento de Origem
                      </p>
                      <p className="text-sm font-bold uppercase underline underline-offset-4 decoration-primary/30">
                        {transaction.origem}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <p className="font-mono text-[10px] font-bold tracking-widest text-primary uppercase">
                      Detalhamento de Custos
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">
                        Total de Tarifas:
                      </span>
                      <span className="font-bold">
                        {BRL(transaction.totalTarifas || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">
                        Outras Despesas:
                      </span>
                      <span className="font-bold">
                        {BRL(
                          (transaction.valorTotalDespesas || 0) -
                            (transaction.totalTarifas || 0),
                        )}
                      </span>
                    </div>
                    <div className="my-1 h-px bg-primary/10" />
                    <div className="flex justify-between text-sm font-black">
                      <span className="text-primary">VALOR TOTAL:</span>
                      <span className="text-primary">
                        {BRL(transaction.valor)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-4 opacity-30">
              <p className="font-mono text-[8px] tracking-widest text-muted-foreground uppercase">
                ID Auditoria: {transaction.id}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-3 w-3" />
                <p className="font-mono text-[8px] tracking-widest uppercase">
                  Dados verificados via API Pública
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
