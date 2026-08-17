import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Plate, StatusBadge } from "@/components/StatusBadge";
import { checklistsQuery, techniciansQuery, vehiclesQuery } from "@/lib/api";
import { buildWeekRows, formatDate, isThisWeek, isToday } from "@/lib/week";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Operacional — Connect IA" },
      {
        name: "description",
        content:
          "Painel de controle de checklists de veículos e ferramentas: técnicos, frota, pendências e conclusões da semana.",
      },
      { property: "og:title", content: "Dashboard Operacional — Connect IA" },
      {
        property: "og:description",
        content: "Acompanhe checklists de veículos e ferramentas por técnico, placa e semana.",
      },
    ],
  }),
  component: Dashboard,
});

function Metric({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Car;
  label: string;
  value: number | string;
  tone?: "default" | "primary" | "success" | "warning" | "destructive";
}) {
  const tones = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  } as const;

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`size-4 ${tones[tone]}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Dashboard() {
  const technicians = useQuery(techniciansQuery);
  const vehicles = useQuery(vehiclesQuery);
  const checklists = useQuery(checklistsQuery);

  const techs = technicians.data ?? [];
  const vhcs = vehicles.data ?? [];
  const checks = checklists.data ?? [];
  const rows = buildWeekRows(vhcs, techs, checks);

  const doneWeek = checks.filter((c) => isThisWeek(c.performed_at)).length;
  const doneToday = checks.filter((c) => isToday(c.performed_at)).length;
  const pending = rows.filter((r) => r.vehicleStatus === "pendente").length;
  const late = rows.filter((r) => r.vehicleStatus === "atrasado").length;

  return (
    <AppShell
      title="Dashboard operacional"
      description="Resumo da operação e checklists da semana"
      actions={
        <Link
          to="/checklists"
          className="hidden rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
        >
          Executar checklist
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Metric icon={Users} label="Técnicos" value={techs.filter((t) => t.active).length} />
        <Metric icon={Car} label="Veículos" value={vhcs.filter((v) => v.active).length} />
        <Metric
          icon={ClipboardCheck}
          label="Checklists na semana"
          value={doneWeek}
          tone="primary"
        />
        <Metric icon={CheckCircle2} label="Realizados hoje" value={doneToday} tone="success" />
        <Metric icon={Clock} label="Pendentes" value={pending} tone="warning" />
        <Metric icon={AlertTriangle} label="Atrasados" value={late} tone="destructive" />
      </div>

      <section className="panel mt-5 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Checklists da semana</h2>
            <p className="text-xs text-muted-foreground">
              Situação de cada veículo e técnico responsável
            </p>
          </div>
          <Link to="/historico" className="text-xs font-medium text-primary hover:underline">
            Ver histórico
          </Link>
        </header>

        {/* Tabela — desktop */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Técnico</th>
                <th className="px-4 py-2.5 font-medium">Placa</th>
                <th className="px-4 py-2.5 font-medium">Veículo</th>
                <th className="px-4 py-2.5 font-medium">Veículo (status)</th>
                <th className="px-4 py-2.5 font-medium">Ferramentas</th>
                <th className="px-4 py-2.5 font-medium">Último checklist</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.vehicle.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    {row.technician?.full_name ?? (
                      <span className="text-muted-foreground">Sem técnico</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Plate value={row.vehicle.plate} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.vehicle.label ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.vehicleStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.toolsStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.lastVehicleChecklist
                      ? formatDate(row.lastVehicleChecklist.performed_at)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/checklists/$plate/$type"
                      params={{ plate: row.vehicle.plate, type: "veiculo" }}
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                    >
                      Executar
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum veículo cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="divide-y divide-border md:hidden">
          {rows.map((row) => (
            <div key={row.vehicle.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Plate value={row.vehicle.plate} />
                <StatusBadge status={row.vehicleStatus} />
              </div>
              <div className="mt-2 text-sm font-medium">
                {row.technician?.full_name ?? "Sem técnico"}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.vehicle.label ?? "—"} ·{" "}
                {row.lastVehicleChecklist
                  ? formatDate(row.lastVehicleChecklist.performed_at)
                  : "sem registro"}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to="/checklists/$plate/$type"
                  params={{ plate: row.vehicle.plate, type: "veiculo" }}
                  className="flex-1 rounded-md border border-border px-3 py-2 text-center text-xs font-medium"
                >
                  Veículo
                </Link>
                <Link
                  to="/checklists/$plate/$type"
                  params={{ plate: row.vehicle.plate, type: "ferramentas" }}
                  className="flex-1 rounded-md border border-border px-3 py-2 text-center text-xs font-medium"
                >
                  Ferramentas
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Ainda precisam realizar o checklist</h2>
          <p className="text-xs text-muted-foreground">Veículos sem registro nesta semana</p>
          <ul className="mt-3 space-y-2">
            {rows
              .filter((r) => r.vehicleStatus !== "concluido")
              .map((r) => (
                <li
                  key={r.vehicle.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Plate value={r.vehicle.plate} />
                    <span className="truncate text-xs text-muted-foreground">
                      {r.technician?.full_name ?? "Sem técnico"}
                    </span>
                  </span>
                  <StatusBadge status={r.vehicleStatus} />
                </li>
              ))}
            {rows.every((r) => r.vehicleStatus === "concluido") && (
              <li className="rounded-md border border-border bg-surface px-3 py-6 text-center text-xs text-muted-foreground">
                Todos os veículos com checklist em dia.
              </li>
            )}
          </ul>
        </div>

        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Últimos registros</h2>
          <p className="text-xs text-muted-foreground">Checklists enviados recentemente</p>
          <ul className="mt-3 space-y-2">
            {checks.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {c.technician_name ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {c.type === "tools" ? "Ferramentas" : "Veículo"} ·{" "}
                    {formatDate(c.performed_at)}
                  </span>
                </span>
                {c.plate && <Plate value={c.plate} />}
              </li>
            ))}
            {checks.length === 0 && (
              <li className="rounded-md border border-border bg-surface px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhum checklist registrado ainda.
              </li>
            )}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
