import { useState, useEffect } from "react";
import { MessageSquare, User, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface Comment {
  id: string;
  author: string;
  crn: string;
  text: string;
  created_at: string;
}

export function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCRN, setNewCRN] = useState("");
  const [newText, setNewText] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("public_comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Inscrição em tempo real para novos comentários
    const channel = supabase
      .channel("public_comments_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "public_comments" },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCRN || !newText || !acceptedTerms || isSubmitting) {
      if (!acceptedTerms) alert("Você precisa aceitar os termos de responsabilidade.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("public_comments")
        .insert([{ 
          author: newName, 
          crn: newCRN, 
          text: newText,
          accepted_terms: true
        }]);

      if (error) throw error;
      
      setNewText("");
      setAcceptedTerms(false);
      // O comentário aparecerá automaticamente via canal Realtime
    } catch (error) {
      console.error("Erro ao publicar comentário:", error);
      alert("Erro ao publicar comentário. Verifique sua conexão ou se o CRN foi preenchido corretamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[2.5rem] border-border/40 bg-card/60 shadow-2xl backdrop-blur-md overflow-hidden">
      <CardHeader className="p-8 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="font-display text-xl font-bold tracking-tight uppercase">Auditoria Social</CardTitle>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Fórum de Transparência e Discussão</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase ml-1">Seu Nome Completo *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Seu nome aqui..."
                  className="w-full rounded-2xl border border-border/40 bg-background/40 px-11 py-3 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase ml-1">Região / CRN *</label>
              <div className="relative">
                <input
                  type="text"
                  value={newCRN}
                  onChange={(e) => setNewCRN(e.target.value)}
                  placeholder="Ex: CRN-3 123456"
                  className="w-full rounded-2xl border border-border/40 bg-background/40 px-6 py-3 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
             <label className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase ml-1">Sua Observação ou Dúvida *</label>
             <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Escreva aqui seu comentário sobre os gastos..."
                rows={3}
                className="w-full rounded-2xl border border-border/40 bg-background/40 px-6 py-4 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 resize-none"
                required
             />
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded-md border-primary/20 text-primary focus:ring-primary"
              required
            />
            <label htmlFor="terms" className="text-[10px] leading-tight text-muted-foreground uppercase font-mono tracking-wider cursor-pointer">
              Declaro que possuo registro ativo no conselho regional de nutricionistas (CRN), que as informações prestadas são verdadeiras e assumo inteira responsabilidade cível e criminal pelo conteúdo desta publicação e por quaisquer danos causados à imagem da instituição ou de terceiros.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Publicar Comentário Auditado"
            )}
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Lista de Comentarios */}
        <div className="space-y-6 pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-mono text-[10px] uppercase tracking-widest">Carregando Auditoria...</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative flex gap-4 rounded-3xl border border-border/10 bg-muted/20 p-6 transition-all hover:bg-muted/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/10">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-base font-black uppercase tracking-tight">{comment.author}</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[9px] font-bold">
                          {comment.crn}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground uppercase">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{comment.text}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="h-1 w-1 rounded-full bg-green-500" />
                      <span className="font-mono text-[8px] text-green-500 uppercase font-bold tracking-tighter">Identidade e Vínculo Declarados</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!loading && comments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-40 border-2 border-dashed border-border/20 rounded-3xl">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <p className="font-mono text-[10px] uppercase tracking-widest">Nenhuma observação ainda. Seja o primeiro!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
