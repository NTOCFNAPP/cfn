import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/busca", label: "Busca/Notas", icon: Search },
  { to: "/alertas", label: "Alertas", icon: Bell },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3 px-2 py-2">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex">
              <Link
                to={to}
                className={cn(
                  "group flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all duration-300 ease-out",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300 ease-out",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm scale-105"
                      : "bg-transparent group-hover:bg-accent",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="transition-opacity">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
