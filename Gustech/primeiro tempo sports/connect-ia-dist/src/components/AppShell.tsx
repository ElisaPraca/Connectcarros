import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Car,
  Gauge,
  History,
  Menu,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { weekLabel } from "@/lib/week";

const NAV = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/tecnicos", label: "Técnicos", icon: Users },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/checklists", label: "Checklists", icon: ClipboardCheck },
  { to: "/historico", label: "Histórico", icon: History },
] as const;

/** Evita mismatch de hidratação: a semana depende do fuso do cliente. */
function useWeekLabel() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => setLabel(weekLabel()), []);
  return label;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1.5 px-3 py-4">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-surface hover:text-foreground"
          activeProps={{
            className: "bg-sidebar-accent !text-sidebar-accent-foreground font-semibold shadow-glow",
          }}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
      <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <ClipboardCheck className="size-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight">Connect IA</span>
        <span className="block text-[11px] text-muted-foreground">Gestão de Checklists</span>
      </span>
    </Link>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const week = useWeekLabel();

  return (
    <div className="min-h-screen bg-background p-0 sm:p-4 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1680px] gap-0 overflow-hidden rounded-none bg-sidebar sm:rounded-[2rem] lg:gap-2">
        <aside className="hidden w-[248px] shrink-0 flex-col lg:flex">
          <Brand />
          <NavList />
          <div className="mt-auto m-4 panel p-4 text-[11px] text-muted-foreground">
            Semana atual
            <div className="mt-1 text-xs text-foreground" suppressHydrationWarning>
              {week ?? "—"}
            </div>
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Fechar menu"
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative h-full w-72 bg-sidebar">
              <Brand />
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 bg-sidebar/90 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:flex sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-foreground lg:hidden"
                  onClick={() => setOpen((v) => !v)}
                  aria-label="Abrir menu"
                >
                  {open ? <X className="size-4" /> : <Menu className="size-4" />}
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
                  {description && (
                    <p className="truncate text-xs text-muted-foreground">{description}</p>
                  )}
                </div>
              </div>

              <div className="ml-auto hidden items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-muted-foreground xl:flex">
                <Search className="size-4" />
                <span className="text-xs">Busque técnico, placa ou checklist</span>
              </div>

              <div className="flex items-center gap-2">
                {actions}
                <Link
                  to="/checklists"
                  aria-label="Novo checklist"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="size-4" />
                </Link>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold">
                  OP
                </span>
              </div>
            </div>
          </header>

          <main className={cn("flex-1 px-4 pb-6 sm:px-6")}>{children}</main>
        </div>
      </div>
    </div>
  );
}
