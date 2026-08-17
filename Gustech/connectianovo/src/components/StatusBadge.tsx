import { cn } from "@/lib/utils";
import { STATUS_LABEL, type WeekStatus } from "@/lib/week";

const STYLES: Record<WeekStatus, string> = {
  concluido: "border-success/30 bg-success/10 text-success",
  pendente: "border-warning/30 bg-warning/10 text-warning",
  atrasado: "border-destructive/35 bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: WeekStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        active
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {active ? "ATIVO" : "INATIVO"}
    </span>
  );
}

export function Plate({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "text-mono-plate inline-flex items-center rounded border border-border bg-secondary px-2 py-0.5 text-xs text-foreground",
        className,
      )}
    >
      {value}
    </span>
  );
}
