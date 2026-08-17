import {
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Checklist, Technician, Vehicle } from "./api";

export type WeekStatus = "concluido" | "pendente" | "atrasado";

export const STATUS_LABEL: Record<WeekStatus, string> = {
  concluido: "CONCLUÍDO",
  pendente: "PENDENTE",
  atrasado: "ATRASADO",
};

export function weekInterval(reference = new Date()) {
  return {
    start: startOfWeek(reference, { weekStartsOn: 1 }),
    end: endOfWeek(reference, { weekStartsOn: 1 }),
  };
}

export function weekLabel(reference = new Date()) {
  const { start, end } = weekInterval(reference);
  return `${format(start, "dd/MM", { locale: ptBR })} — ${format(end, "dd/MM/yyyy", { locale: ptBR })}`;
}

export function isThisWeek(iso: string, reference = new Date()) {
  return isWithinInterval(parseISO(iso), weekInterval(reference));
}

export function isToday(iso: string, reference = new Date()) {
  return isSameDay(parseISO(iso), reference);
}

export function formatDateTime(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDate(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
}

export function formatTime(iso: string) {
  return format(parseISO(iso), "HH:mm", { locale: ptBR });
}

export type WeekRow = {
  vehicle: Vehicle;
  technician: Technician | null;
  vehicleStatus: WeekStatus;
  toolsStatus: WeekStatus;
  lastVehicleChecklist: Checklist | null;
  lastToolsChecklist: Checklist | null;
};

function statusFor(hasThisWeek: boolean, reference: Date): WeekStatus {
  if (hasThisWeek) return "concluido";
  // A partir de quinta-feira, uma semana sem checklist é considerada atrasada.
  return reference.getDay() === 0 || reference.getDay() >= 4 ? "atrasado" : "pendente";
}

export function buildWeekRows(
  vehicles: Vehicle[],
  technicians: Technician[],
  checklists: Checklist[],
  reference = new Date(),
): WeekRow[] {
  const techById = new Map(technicians.map((t) => [t.id, t]));

  return vehicles.map((vehicle) => {
    const forVehicle = checklists.filter(
      (c) => c.vehicle_id === vehicle.id || (!c.vehicle_id && c.plate === vehicle.plate),
    );
    const vehicleChecks = forVehicle.filter((c) => c.type === "vehicle");
    const toolsChecks = forVehicle.filter((c) => c.type === "tools");

    return {
      vehicle,
      technician: vehicle.technician_id ? techById.get(vehicle.technician_id) ?? null : null,
      vehicleStatus: statusFor(
        vehicleChecks.some((c) => isThisWeek(c.performed_at, reference)),
        reference,
      ),
      toolsStatus: statusFor(
        toolsChecks.some((c) => isThisWeek(c.performed_at, reference)),
        reference,
      ),
      lastVehicleChecklist: vehicleChecks[0] ?? null,
      lastToolsChecklist: toolsChecks[0] ?? null,
    };
  });
}
