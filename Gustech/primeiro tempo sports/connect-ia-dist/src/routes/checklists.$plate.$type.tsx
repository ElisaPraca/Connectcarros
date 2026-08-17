import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ClipboardCheck, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ChecklistPhotoUploader } from "@/components/ChecklistPhotoUploader";
import { Plate } from "@/components/StatusBadge";
import {
  checklistsQuery,
  createChecklist,
  techniciansQuery,
  vehiclesQuery,
  type ChecklistItemAnswer,
  type ChecklistPhoto,
} from "@/lib/api";
import {
  ANSWER_OPTIONS,
  TYPE_LABEL,
  itemsFor,
  sectionsFor,
  typeFromSlug,
} from "@/lib/checklist-config";
import { formatDateTime } from "@/lib/week";

export const Route = createFileRoute("/checklists/$plate/$type")({
  head: ({ params }) => ({
    meta: [
      { title: `Checklist ${params.plate} — Connect IA` },
      {
        name: "description",
        content: `Execução do checklist do veículo ${params.plate} com registro de técnico, data, horário, itens e observações.`,
      },
      { property: "og:title", content: `Checklist ${params.plate} — Connect IA` },
      {
        property: "og:description",
        content: `Registre o checklist do veículo ${params.plate} de forma rápida e rastreável.`,
      },
    ],
  }),
  component: ChecklistRunner,
  errorComponent: ({ error }) => (
    <AppShell title="Checklist">
      <p role="alert" className="panel p-6 text-sm text-destructive">
        {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Checklist">
      <p className="panel p-6 text-sm text-muted-foreground">Veículo não encontrado.</p>
    </AppShell>
  ),
});

function ChecklistRunner() {
  const { plate, type: typeSlug } = Route.useParams();
  const type = typeFromSlug(typeSlug);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const vehicles = useQuery(vehiclesQuery);
  const technicians = useQuery(techniciansQuery);
  const checklists = useQuery(checklistsQuery);

  const vehicle = (vehicles.data ?? []).find((v) => v.plate === plate) ?? null;
  const defaultTech = vehicle?.technician_id ?? "";

  const [technicianId, setTechnicianId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<ChecklistPhoto[]>([]);
  const [fuel, setFuel] = useState("");
  const [km, setKm] = useState("");

  const selectedTech = technicianId || defaultTech;
  const sections = sectionsFor(type);
  const allItems = useMemo(() => itemsFor(type), [type]);
  const answeredCount = allItems.filter((i) => answers[i]).length;
  const progress = Math.round((answeredCount / allItems.length) * 100);

  const history = (checklists.data ?? []).filter(
    (c) => c.type === type && (c.vehicle_id === vehicle?.id || c.plate === plate),
  );

  const submit = useMutation({
    mutationFn: async () => {
      if (!selectedTech) throw new Error("Selecione o técnico responsável.");
      const missing = allItems.filter((i) => !answers[i]);
      if (missing.length > 0) {
        throw new Error(`Responda todos os itens. Faltam ${missing.length}.`);
      }
      const tech = (technicians.data ?? []).find((t) => t.id === selectedTech) ?? null;
      const items: ChecklistItemAnswer[] = allItems.map((item) => ({
        item,
        answer: answers[item] as string,
      }));
      const hasIssue = items.some((i) => i.answer === "Não OK");

      await createChecklist({
        type,
        technician_id: selectedTech,
        vehicle_id: vehicle?.id ?? null,
        technician_name: tech?.full_name ?? null,
        plate,
        performed_at: new Date().toISOString(),
        status: hasIssue ? "concluido_com_pendencias" : "concluido",
        items,
        photos,
        notes: notes.trim() || null,
        fuel_level: type === "vehicle" ? fuel.trim() || null : null,
        km: type === "vehicle" && km ? Number(km) : null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: checklistsQuery.queryKey });
      toast.success("Checklist registrado com sucesso.");
      navigate({ to: "/historico" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!vehicles.isLoading && !vehicle) {
    return (
      <AppShell title="Checklist" description={plate}>
        <div className="panel p-6 text-sm">
          <p className="text-muted-foreground">
            Nenhum veículo cadastrado com a placa {plate}.
          </p>
          <Link to="/veiculos" className="mt-3 inline-block text-xs font-medium text-primary">
            Cadastrar veículo
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={TYPE_LABEL[type]}
      description={`${plate}${vehicle?.label ? ` · ${vehicle.label}` : ""}`}
      actions={
        <Link
          to="/checklists"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="min-w-0 space-y-4"
        >
          <section className="panel p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                {type === "vehicle" ? (
                  <ClipboardCheck className="size-4" />
                ) : (
                  <Wrench className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{TYPE_LABEL[type]}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <Plate value={plate} />
                  <span className="text-xs text-muted-foreground">
                    {answeredCount}/{allItems.length} itens respondidos
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/checklists/$plate/$type"
                  params={{ plate, type: "veiculo" }}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                    type === "vehicle"
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Veículo
                </Link>
                <Link
                  to="/checklists/$plate/$type"
                  params={{ plate, type: "ferramentas" }}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                    type === "tools"
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Ferramentas
                </Link>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs sm:col-span-3">
                <span className="mb-1 block text-muted-foreground">Técnico responsável</span>
                <select
                  value={selectedTech}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">Selecione o técnico...</option>
                  {(technicians.data ?? [])
                    .filter((t) => t.active)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                </select>
              </label>
              {type === "vehicle" && (
                <>
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Nível de combustível</span>
                    <input
                      value={fuel}
                      onChange={(e) => setFuel(e.target.value)}
                      placeholder="Ex: 3/4"
                      className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Km atual</span>
                    <input
                      type="number"
                      value={km}
                      onChange={(e) => setKm(e.target.value)}
                      placeholder="Ex: 84200"
                      className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </>
              )}
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.title} className="panel overflow-hidden">
              <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {section.items.filter((i) => answers[i]).length}/{section.items.length}
                </span>
              </header>
              <div className="divide-y divide-border/60">
                {section.items.map((item) => (
                  <div
                    key={item}
                    className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm">{item}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {ANSWER_OPTIONS.map((option) => {
                        const active = answers[item] === option;
                        const tone =
                          option === "OK"
                            ? "border-success text-success bg-success/10"
                            : option === "Não OK"
                              ? "border-destructive text-destructive bg-destructive/10"
                              : "border-warning text-warning bg-warning/10";
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setAnswers((a) => ({ ...a, [item]: option }))}
                            className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              active
                                ? tone
                                : "border-border text-muted-foreground hover:border-foreground/30"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="panel p-4">
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Observações</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Registre qualquer ocorrência relevante..."
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            {type === "vehicle" && (
              <div className="mt-4 border-t border-border pt-4">
                <ChecklistPhotoUploader photos={photos} onChange={setPhotos} plate={plate} />
              </div>
            )}

            <button
              type="submit"
              disabled={submit.isPending}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto"
            >
              <Check className="size-4" />
              {submit.isPending ? "Enviando..." : "Finalizar checklist"}
            </button>
          </section>
        </form>

        <aside className="panel h-fit p-4">
          <h2 className="text-sm font-semibold">Histórico deste veículo</h2>
          <p className="text-xs text-muted-foreground">{TYPE_LABEL[type]}</p>
          <ul className="mt-3 space-y-2">
            {history.slice(0, 10).map((c) => (
              <li key={c.id} className="rounded-md border border-border bg-surface px-3 py-2 text-xs">
                <div className="font-medium">{c.technician_name ?? "—"}</div>
                <div className="text-muted-foreground">{formatDateTime(c.performed_at)}</div>
              </li>
            ))}
            {history.length === 0 && (
              <li className="rounded-md border border-border bg-surface px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhum registro anterior.
              </li>
            )}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
