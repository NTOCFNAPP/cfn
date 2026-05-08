import { useState } from "react";
import { MessageSquare, User, Send, Timestamp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  author: string;
  text: string;
  date: Date;
}

export function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Dra. Ana Silva",
      text: "Achei o valor desse evento em Brasília muito acima da média para 2 dias de diária. Alguém sabe se incluiu hospedagem?",
      date: new Date(2026, 4, 7, 14, 30),
    },
    {
      id: "2",
      author: "Nutri Carlos",
      text: "É importante verificarmos a prestação de contas anexa a essa nota. Transparência sempre em primeiro lugar!",
      date: new Date(2026, 4, 8, 10, 15),
    },
  ]);

  const [newName, setNewName] = useState("");
  const [newText, setNewText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newText) return;

    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      author: newName,
      text: newText,
      date: new Date(),
    };

    setComments([comment, ...comments]);
    setNewText("");
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase ml-1">Seu Nome / CRN</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Nutricionista João..."
                  className="w-full rounded-2xl border border-border/40 bg-background/40 px-11 py-3 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
             <label className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase ml-1">Sua Observação ou Dúvida</label>
             <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Escreva aqui seu comentário sobre os gastos..."
                rows={3}
                className="w-full rounded-2xl border border-border/40 bg-background/40 px-6 py-4 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 resize-none"
             />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3 font-display text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            Publicar no Fórum
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Lista de Comentarios */}
        <div className="space-y-6 pt-4">
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
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-black uppercase tracking-tight">{comment.author}</span>
                    <span className="font-mono text-[9px] text-muted-foreground uppercase">
                      {comment.date.toLocaleDateString()} · {comment.date.getHours()}:{comment.date.getMinutes()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">{comment.text}</p>
                </div>
                <div className="absolute top-6 right-6 opacity-0 transition-opacity group-hover:opacity-100">
                   <div className="h-1 w-1 rounded-full bg-primary" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
