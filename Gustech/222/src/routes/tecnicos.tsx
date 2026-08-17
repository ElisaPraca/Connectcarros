import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ActiveBadge, Plate } from "@/components/StatusBadge";
import {
  createTechnician,
  deleteTechnician,
  techniciansQuery,
  updateTechnician,
  updateVehicle,
  vehiclesQuery,
  type Technician,
} from "@/lib/api";
import { formatDate } from "@/lib/week";
import { checklistsQuery } from "@/lib/api";

export const Route = createFileRoute("/tecnicos")({
  head: () => ({
    meta: [
      { title: "Técnicos — Connect IA" },
      {
        name: "description",
        content:
          "Cadastre, edite, ative ou remova técnicos e defina o veículo associado a cada um deles.",
      },
      { property: "og:title", content: "Técnicos — Connect IA" },
      {
        property: "og:description",
        content: "Gerenciamento completo de técnicos e associação com veículos da frota.",
      },
    ],
  }),
  component: TechniciansPage,
});

type FormState = {
  id: string | null;
  full_name: string;
  active: boolean;
  vehicleId: string;
};

const EMPTY: FormState = { id: null, full_name: "", active: true, vehicleId: "" };

function TechniciansPage() {
  const qc = useQueryClient();
  const technicians = useQuery(techniciansQuery);
  const vehicles = useQuery(vehiclesQuery);
  const checklists = useQuery(checklistsQuery);
  const [form, setForm] = useState<FormState | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: techniciansQuery.queryKey });
    qc.invalidateQueries({ queryKey: vehiclesQuery.queryKey });
  };

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const name = state.full_name.trim();
      if (!name) throw new Error("Informe o nome completo do técnico.");

      const tech = state.id
        ? ((await updateTechnician(state.id, { full_name: name, active: state.active })) as Technician)
        : ((await createTechnician({ full_name: name, active: state.active })) as Technician);

      const current = (vehicles.data ?? []).find((v) => v.technician_id === tech.id);
      if (current && current.id !== state.vehicleId) {
        await updateVehicle(current.id, { technician_id: null });
      }
      if (state.vehicleId) {
        await updateVehicle(state.vehicleId, { technician_id: tech.id });
      }
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
      toast.success("Técnico salvo com sucesso.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTechnician(id),
    onSuccess: () => {
      invalidate();
      toast.success("Técnico removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateTechnician(id, { active }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (technicians.data ?? []).map((tech) => {
    const vehicle = (vehicles.data ?? []).find((v) => v.technician_id === tech.id) ?? null;
    const last = (checklists.data ?? []).find((c) => c.technician_id === tech.id) ?? null;
    return { tech, vehicle, last };
  });

  return (
    <AppShell
      title="Técnicos"
      description="Cadastro dinâmico de técnicos e associação com veículos"
      actions={
        <button
          onClick={() => setForm({ ...EMPTY })}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-3.5" /> Adicionar técnico
        </button>
      }
    >
      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="panel mb-5 p-4"
        >
          <h2 className="text-sm font-semibold">
            {form.id ? "Editar técnico" : "Novo técnico"}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-xs sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">Nome completo</span>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Ex: João Silva"
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Veículo associado</span>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Sem veículo</option>
                {(vehicles.data ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate}
                    {v.technician_id && v.technician_id !== form.id ? " (ocupado)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="size-4 accent-[var(--primary)]"
            />
            Técnico ativo
          </label>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {save.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="panel overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-4 py-2.5 font-medium">Placa</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Último checklist</th>
                <th className="px-4 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ tech, vehicle, last }) => (
                <tr key={tech.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{tech.full_name}</td>
                  <td className="px-4 py-3">
                    {vehicle ? (
                      <Plate value={vehicle.plate} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem veículo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle.mutate({ id: tech.id, active: !tech.active })}>
                      <ActiveBadge active={tech.active} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {last ? formatDate(last.performed_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {vehicle && (
                        <Link
                          to="/checklists/$plate/$type"
                          params={{ plate: vehicle.plate, type: "veiculo" }}
                          className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"
                        >
                          Checklist
                        </Link>
                      )}
                      <button
                        onClick={() =>
                          setForm({
                            id: tech.id,
                            full_name: tech.full_name,
                            active: tech.active,
                            vehicleId: vehicle?.id ?? "",
                          })
                        }
                        className="grid size-8 place-items-center rounded-md border border-border hover:border-primary hover:text-primary"
                        aria-label="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover ${tech.full_name}?`)) remove.mutate(tech.id);
                        }}
                        className="grid size-8 place-items-center rounded-md border border-border hover:border-destructive hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum técnico cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {rows.map(({ tech, vehicle, last }) => (
            <div key={tech.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{tech.full_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {last ? `Último: ${formatDate(last.performed_at)}` : "Sem checklist"}
                  </div>
                </div>
                <ActiveBadge active={tech.active} />
              </div>
              <div className="mt-2">
                {vehicle ? (
                  <Plate value={vehicle.plate} />
                ) : (
                  <span className="text-xs text-muted-foreground">Sem veículo</span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: tech.id,
                      full_name: tech.full_name,
                      active: tech.active,
                      vehicleId: vehicle?.id ?? "",
                    })
                  }
                  className="flex-1 rounded-md border border-border px-3 py-2 text-xs font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remover ${tech.full_name}?`)) remove.mutate(tech.id);
                  }}
                  className="flex-1 rounded-md border border-border px-3 py-2 text-xs font-medium text-destructive"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
