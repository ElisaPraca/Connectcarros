import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SheetSetupNotice } from "@/components/SheetSetupNotice";
import { ActiveBadge, Plate, StatusBadge } from "@/components/StatusBadge";
import {
  checklistsQuery,
  createVehicle,
  deleteVehicle,
  techniciansQuery,
  updateVehicle,
  vehiclesQuery,
} from "@/lib/api";
import { isValidPlate, normalizePlate } from "@/lib/checklist-config";
import { buildWeekRows, formatDate } from "@/lib/week";

export const Route = createFileRoute("/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos e Placas — Connect IA" },
      {
        name: "description",
        content:
          "Cadastro de veículos com placa validada, sem duplicidade, e associação ao técnico responsável.",
      },
      { property: "og:title", content: "Veículos e Placas — Connect IA" },
      {
        property: "og:description",
        content: "Gerencie a frota: placas, apelidos, técnico responsável e status dos checklists.",
      },
    ],
  }),
  component: VehiclesPage,
});

type FormState = {
  id: string | null;
  plate: string;
  label: string;
  technicianId: string;
  active: boolean;
};

const EMPTY: FormState = { id: null, plate: "", label: "", technicianId: "", active: true };

function VehiclesPage() {
  const qc = useQueryClient();
  const vehicles = useQuery(vehiclesQuery);
  const technicians = useQuery(techniciansQuery);
  const checklists = useQuery(checklistsQuery);
  const [form, setForm] = useState<FormState | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: vehiclesQuery.queryKey });
    qc.invalidateQueries({ queryKey: techniciansQuery.queryKey });
  };

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const plate = normalizePlate(state.plate);
      if (!isValidPlate(plate)) {
        throw new Error("Placa inválida. Use o formato ABC-1D23 ou ABC-1234.");
      }
      const duplicate = (vehicles.data ?? []).find(
        (v) => v.plate === plate && v.id !== state.id,
      );
      if (duplicate) throw new Error("Já existe um veículo com essa placa.");

      const payload = {
        plate,
        label: state.label.trim() || null,
        technician_id: state.technicianId || null,
        active: state.active,
      };

      // Um técnico responde por um veículo: libera a associação anterior.
      if (payload.technician_id) {
        const previous = (vehicles.data ?? []).find(
          (v) => v.technician_id === payload.technician_id && v.id !== state.id,
        );
        if (previous) await updateVehicle(previous.id, { technician_id: null });
      }

      if (state.id) await updateVehicle(state.id, payload);
      else await createVehicle(payload);
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
      toast.success("Veículo salvo com sucesso.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      invalidate();
      toast.success("Veículo removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateVehicle(id, { active }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = buildWeekRows(vehicles.data ?? [], technicians.data ?? [], checklists.data ?? []);

  return (
    <AppShell
      title="Veículos"
      description="Placas, apelidos e associação com técnicos"
      actions={
        <button
          onClick={() => setForm({ ...EMPTY })}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-3.5" /> Adicionar veículo
        </button>
      }
    >
      <SheetSetupNotice error={vehicles.error} />
      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="panel mb-5 p-4"
        >
          <h2 className="text-sm font-semibold">{form.id ? "Editar veículo" : "Novo veículo"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Placa</span>
              <input
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: normalizePlate(e.target.value) })}
                placeholder="ABC-1D23"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={8}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm uppercase outline-none focus:border-primary"
              />

            </label>
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Identificação</span>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Veículo 01"
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Técnico responsável</span>
              <select
                value={form.technicianId}
                onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Sem técnico</option>
                {(technicians.data ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
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
            Veículo ativo
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
                <th className="px-4 py-2.5 font-medium">Placa</th>
                <th className="px-4 py-2.5 font-medium">Identificação</th>
                <th className="px-4 py-2.5 font-medium">Técnico responsável</th>
                <th className="px-4 py-2.5 font-medium">Último checklist</th>
                <th className="px-4 py-2.5 font-medium">Semana</th>
                <th className="px-4 py-2.5 font-medium">Cadastro</th>
                <th className="px-4 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.vehicle.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <Plate value={row.vehicle.plate} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.vehicle.label ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.technician?.full_name ?? (
                      <span className="text-xs text-muted-foreground">Sem técnico</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.lastVehicleChecklist
                      ? formatDate(row.lastVehicleChecklist.performed_at)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.vehicleStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        toggle.mutate({ id: row.vehicle.id, active: !row.vehicle.active })
                      }
                    >
                      <ActiveBadge active={row.vehicle.active} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to="/checklists/$plate/$type"
                        params={{ plate: row.vehicle.plate, type: "veiculo" }}
                        className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"
                      >
                        Checklist
                      </Link>
                      <button
                        onClick={() =>
                          setForm({
                            id: row.vehicle.id,
                            plate: row.vehicle.plate,
                            label: row.vehicle.label ?? "",
                            technicianId: row.vehicle.technician_id ?? "",
                            active: row.vehicle.active,
                          })
                        }
                        className="grid size-8 place-items-center rounded-md border border-border hover:border-primary hover:text-primary"
                        aria-label="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover o veículo ${row.vehicle.plate}?`))
                            remove.mutate(row.vehicle.id);
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
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum veículo cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: row.vehicle.id,
                      plate: row.vehicle.plate,
                      label: row.vehicle.label ?? "",
                      technicianId: row.vehicle.technician_id ?? "",
                      active: row.vehicle.active,
                    })
                  }
                  className="flex-1 rounded-md border border-border px-3 py-2 text-xs font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remover o veículo ${row.vehicle.plate}?`))
                      remove.mutate(row.vehicle.id);
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
