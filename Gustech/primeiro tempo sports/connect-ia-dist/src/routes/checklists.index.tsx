import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Wrench } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Plate, StatusBadge } from "@/components/StatusBadge";
import { checklistsQuery, techniciansQuery, vehiclesQuery } from "@/lib/api";
import { buildWeekRows, formatDate } from "@/lib/week";

export const Route = createFileRoute("/checklists/")({
  head: () => ({
    meta: [
      { title: "Executar Checklists — Connect IA" },
      {
        name: "description",
        content:
          "Selecione o técnico e o veículo para executar o checklist do veículo ou o checklist de ferramentas.",
      },
      { property: "og:title", content: "Executar Checklists — Connect IA" },
      {
        property: "og:description",
        content: "Acesse o checklist pelo técnico ou pela placa e registre tudo em segundos.",
      },
    ],
  }),
  component: ChecklistsPage,
});

function ChecklistsPage() {
  const vehicles = useQuery(vehiclesQuery);
  const technicians = useQuery(techniciansQuery);
  const checklists = useQuery(checklistsQuery);
  const [search, setSearch] = useState("");

  const rows = buildWeekRows(
    vehicles.data ?? [],
    technicians.data ?? [],
    checklists.data ?? [],
  ).filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      row.vehicle.plate.toLowerCase().includes(q) ||
      (row.vehicle.label ?? "").toLowerCase().includes(q) ||
      (row.technician?.full_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppShell
      title="Checklists"
      description="Selecione o técnico/veículo para executar o checklist"
      actions={
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar técnico ou placa"
          className="w-40 rounded-md border border-input bg-surface px-3 py-2 text-xs outline-none focus:border-primary sm:w-64"
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.vehicle.id} className="panel flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold uppercase tracking-wide">
                  {row.technician?.full_name ?? "Sem técnico"}
                </h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <Plate value={row.vehicle.plate} />
                  <span className="text-xs text-muted-foreground">
                    {row.vehicle.label ?? "—"}
                  </span>
                </div>
              </div>
              <StatusBadge status={row.vehicleStatus} />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Último checklist do veículo:{" "}
              {row.lastVehicleChecklist
                ? formatDate(row.lastVehicleChecklist.performed_at)
                : "nunca realizado"}
              <br />
              Ferramentas:{" "}
              {row.lastToolsChecklist
                ? formatDate(row.lastToolsChecklist.performed_at)
                : "nunca realizado"}
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/checklists/$plate/$type"
                params={{ plate: row.vehicle.plate, type: "veiculo" }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <ClipboardCheck className="size-3.5" /> Checklist do Veículo
              </Link>
              <Link
                to="/checklists/$plate/$type"
                params={{ plate: row.vehicle.plate, type: "ferramentas" }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary"
              >
                <Wrench className="size-3.5" /> Ferramentas
              </Link>
            </div>
          </article>
        ))}
        {rows.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            Nenhum veículo encontrado.
          </p>
        )}
      </div>
    </AppShell>
  );
}
