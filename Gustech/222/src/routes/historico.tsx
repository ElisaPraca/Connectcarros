import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ChecklistPhotoGallery } from "@/components/ChecklistPhotoGallery";
import { Plate, StatusBadge } from "@/components/StatusBadge";
import {
  checklistsQuery,
  deleteChecklist,
  techniciansQuery,
  vehiclesQuery,
  type Checklist,
} from "@/lib/api";
import { formatDate, formatTime, isThisWeek } from "@/lib/week";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de Checklists — Connect IA" },
      {
        name: "description",
        content:
          "Consulte checklists realizados com filtros por técnico, placa, data, semana, tipo e status.",
      },
      { property: "og:title", content: "Histórico de Checklists — Connect IA" },
      {
        property: "og:description",
        content: "Todo o histórico operacional em um só lugar, com filtros e detalhes por registro.",
      },
    ],
  }),
  component: HistoryPage,
});

function statusOf(c: Checklist) {
  return c.status === "concluido_com_pendencias" ? "pendente" : "concluido";
}

function HistoryPage() {
  const qc = useQueryClient();
  const checklists = useQuery(checklistsQuery);
  const technicians = useQuery(techniciansQuery);
  const vehicles = useQuery(vehiclesQuery);

  const [tech, setTech] = useState("");
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [onlyWeek, setOnlyWeek] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: (c: { id: string; notesKey: string | null }) =>
      deleteChecklist(c.id, c.notesKey ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checklistsQuery.queryKey });
      toast.success("Registro removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (checklists.data ?? []).filter((c) => {
    if (tech && c.technician_name !== tech) return false;
    if (plate && c.plate !== plate) return false;
    if (type && c.type !== type) return false;
    if (status && statusOf(c) !== status) return false;
    if (date && !c.performed_at.startsWith(date)) return false;
    if (onlyWeek && !isThisWeek(c.performed_at)) return false;
    return true;
  });

  const selectClass =
    "rounded-md border border-input bg-surface px-3 py-2 text-xs outline-none focus:border-primary";

  return (
    <AppShell
      title="Histórico"
      description={`${rows.length} registro(s) encontrado(s)`}
    >
      <div className="panel mb-4 flex flex-wrap gap-2 p-3">
        <select value={tech} onChange={(e) => setTech(e.target.value)} className={selectClass}>
          <option value="">Todos os técnicos</option>
          {(technicians.data ?? []).map((t) => (
            <option key={t.id} value={t.full_name}>
              {t.full_name}
            </option>
          ))}
        </select>
        <select value={plate} onChange={(e) => setPlate(e.target.value)} className={selectClass}>
          <option value="">Todas as placas</option>
          {(vehicles.data ?? []).map((v) => (
            <option key={v.id} value={v.plate}>
              {v.plate}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
          <option value="">Todos os tipos</option>
          <option value="vehicle">Veículo</option>
          <option value="tools">Ferramentas</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">Todos os status</option>
          <option value="concluido">Concluído</option>
          <option value="pendente">Com pendências</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={selectClass}
        />
        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyWeek}
            onChange={(e) => setOnlyWeek(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Somente semana atual
        </label>
        <button
          onClick={() => {
            setTech("");
            setPlate("");
            setType("");
            setStatus("");
            setDate("");
            setOnlyWeek(false);
          }}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"
        >
          Limpar filtros
        </button>
      </div>

      <section className="panel overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Técnico</th>
                <th className="px-4 py-2.5 font-medium">Placa</th>
                <th className="px-4 py-2.5 font-medium">Tipo</th>
                <th className="px-4 py-2.5 font-medium">Data</th>
                <th className="px-4 py-2.5 font-medium">Hora</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <>
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="px-4 py-3">{c.technician_name ?? "—"}</td>
                    <td className="px-4 py-3">{c.plate ? <Plate value={c.plate} /> : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.type === "tools" ? "Ferramentas" : "Veículo"}
                    </td>
                    <td className="px-4 py-3">{formatDate(c.performed_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTime(c.performed_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={statusOf(c) as "concluido" | "pendente"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setOpen(open === c.id ? null : c.id)}
                          className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"
                        >
                          {open === c.id ? "Fechar" : "Detalhes"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Remover este registro do histórico?"))
                              remove.mutate({ id: c.id, notesKey: c.raw_notes });
                          }}
                          className="grid size-8 place-items-center rounded-md border border-border hover:border-destructive hover:text-destructive"
                          aria-label="Remover"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {open === c.id && (
                    <tr key={`${c.id}-detail`} className="border-b border-border/60 bg-surface">
                      <td colSpan={7} className="px-4 py-4">
                        <ChecklistDetail checklist={c} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum checklist encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {rows.map((c) => (
            <div key={c.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                {c.plate ? <Plate value={c.plate} /> : <span>—</span>}
                <StatusBadge status={statusOf(c) as "concluido" | "pendente"} />
              </div>
              <div className="mt-2 text-sm font-medium">{c.technician_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {c.type === "tools" ? "Ferramentas" : "Veículo"} · {formatDate(c.performed_at)} ·{" "}
                {formatTime(c.performed_at)}
              </div>
              <button
                onClick={() => setOpen(open === c.id ? null : c.id)}
                className="mt-3 w-full rounded-md border border-border px-3 py-2 text-xs font-medium"
              >
                {open === c.id ? "Fechar detalhes" : "Ver detalhes"}
              </button>
              {open === c.id && (
                <div className="mt-3">
                  <ChecklistDetail checklist={c} />
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum checklist encontrado.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function ChecklistDetail({ checklist }: { checklist: Checklist }) {
  const items = Array.isArray(checklist.items) ? checklist.items : [];
  const photos = Array.isArray(checklist.photos) ? checklist.photos : [];
  const issues = items.filter((i) => i.answer === "Não OK");
  const unchecked = items.filter((i) => i.answer === "Não Checado");

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-4">
        <span>
          <span className="text-muted-foreground">Itens: </span>
          {items.length}
        </span>
        <span>
          <span className="text-muted-foreground">Não OK: </span>
          <span className="text-destructive">{issues.length}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Não checados: </span>
          <span className="text-warning">{unchecked.length}</span>
        </span>
        {checklist.fuel_level && (
          <span>
            <span className="text-muted-foreground">Combustível: </span>
            {checklist.fuel_level}
          </span>
        )}
        {checklist.km != null && (
          <span>
            <span className="text-muted-foreground">Km: </span>
            {checklist.km}
          </span>
        )}
      </div>

      {checklist.notes && (
        <p className="rounded-md border border-border bg-card p-3">
          <span className="text-muted-foreground">Observações: </span>
          {checklist.notes}
        </p>
      )}

      <ChecklistPhotoGallery photos={photos} />

      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div
            key={i.item}
            className="flex items-center justify-between gap-2 rounded border border-border bg-card px-2.5 py-1.5"
          >
            <span className="truncate">{i.item}</span>
            <span
              className={
                i.answer === "OK"
                  ? "text-success"
                  : i.answer === "Não OK"
                    ? "text-destructive"
                    : "text-warning"
              }
            >
              {i.answer}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
