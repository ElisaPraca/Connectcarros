import { supabase } from "@/integrations/supabase/client";
import type { ChecklistType } from "./checklist-config";
import { itemsFor } from "./checklist-config";
import {
  DRIVE_UPLOAD_BASE,
  SHEETDB_URL,
  SHEET_COLUMNS,
  SHEET_TABS,
  TOOLS_COLUMNS,
  buildNotes,
  driveFolderForPlate,
  fromSheetDate,
  fromToolsDate,
  parseNotes,
  sheetUrl,
  toSheetDate,
  toSheetTime,
  toToolsDate,
  type SheetRow,
} from "./legacy-integration";

export type Technician = {
  id: string;
  full_name: string;
  active: boolean;
  created_at: string;
};

export type Vehicle = {
  id: string;
  plate: string;
  label: string | null;
  technician_id: string | null;
  active: boolean;
  created_at: string;
};

export type ChecklistItemAnswer = { item: string; answer: string };

/** `path` guarda o ID do arquivo no Google Drive. */
export type ChecklistPhoto = { path: string; name: string };

/** Envia uma imagem para a pasta do Drive da placa, usando o serviço de upload existente. */
export async function uploadChecklistPhoto(file: File, plate: string): Promise<ChecklistPhoto> {
  const folderId = driveFolderForPlate(plate);
  if (!folderId) {
    throw new Error(`A placa ${plate} não possui pasta do Drive configurada.`);
  }
  const form = new FormData();
  form.append("files", file, file.name);
  const res = await fetch(`${DRIVE_UPLOAD_BASE}/${folderId}`, { method: "POST", body: form });
  const payload = (await res.json().catch(() => ({}))) as {
    files?: { file_id: string; filename: string }[];
    error?: string;
  };
  if (!res.ok || payload.error || !payload.files?.[0]) {
    throw new Error(payload.error ?? `Falha no upload da imagem (${res.status}).`);
  }
  const uploaded = payload.files[0];
  return { path: uploaded.file_id, name: uploaded.filename || file.name };
}

/** Miniaturas das imagens salvas no Drive. */
export async function getChecklistPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const id of paths) {
    map[id] = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }
  return map;
}


export type Checklist = {
  id: string;
  type: string;
  technician_id: string | null;
  vehicle_id: string | null;
  technician_name: string | null;
  plate: string | null;
  performed_at: string;
  status: string;
  items: ChecklistItemAnswer[];
  photos: ChecklistPhoto[];
  notes: string | null;
  fuel_level: string | null;
  km: number | null;
  created_at: string;
  /** Conteúdo bruto da coluna Observacao (chave usada para excluir a linha). */
  raw_notes: string;
};

function unwrap<T>(result: { data: unknown; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/* ------------------------------ Técnicos ------------------------------ */

export const techniciansQuery = {
  queryKey: ["technicians"] as const,
  queryFn: async (): Promise<Technician[]> =>
    unwrap(
      await supabase
        .from("technicians")
        .select("id, full_name, active, created_at")
        .order("full_name", { ascending: true }),
    ) as Technician[],
};

export async function createTechnician(input: {
  full_name: string;
  active: boolean;
}): Promise<Technician> {
  return unwrap<Technician>(await supabase.from("technicians").insert(input).select().single());
}

export async function updateTechnician(
  id: string,
  input: Partial<Pick<Technician, "full_name" | "active">>,
): Promise<Technician> {
  return unwrap<Technician>(
    await supabase.from("technicians").update(input).eq("id", id).select().single(),
  );
}

export async function deleteTechnician(id: string) {
  const { error } = await supabase.from("technicians").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------ Veículos ------------------------------ */

export const vehiclesQuery = {
  queryKey: ["vehicles"] as const,
  queryFn: async (): Promise<Vehicle[]> =>
    unwrap(
      await supabase
        .from("vehicles")
        .select("id, plate, label, technician_id, active, created_at")
        .order("plate", { ascending: true }),
    ) as Vehicle[],
};

export async function createVehicle(input: {
  plate: string;
  label: string | null;
  technician_id: string | null;
  active: boolean;
}): Promise<Vehicle> {
  return unwrap<Vehicle>(await supabase.from("vehicles").insert(input).select().single());
}

export async function updateVehicle(
  id: string,
  input: Partial<Pick<Vehicle, "plate" | "label" | "technician_id" | "active">>,
): Promise<Vehicle> {
  return unwrap<Vehicle>(
    await supabase.from("vehicles").update(input).eq("id", id).select().single(),
  );
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* --------------------- Checklists (planilha + Drive) --------------------- */

const VEHICLE_ITEMS = itemsFor("vehicle");
const TOOLS_ITEMS = itemsFor("tools");

/** Linha da aba "Check List Ferramentas". */
function toolsRowToChecklist(row: SheetRow, index: number): Checklist {
  const performed_at = fromToolsDate(row[TOOLS_COLUMNS.date] ?? "");
  const items: ChecklistItemAnswer[] = TOOLS_ITEMS.filter(
    (item) => (row[item] ?? "") !== "",
  ).map((item) => ({ item, answer: row[item] as string }));
  const hasIssue = items.some((i) => i.answer === "Não OK");
  return {
    id: `tools-${performed_at}-${index}`,
    type: "tools",
    technician_id: null,
    vehicle_id: null,
    technician_name: row[TOOLS_COLUMNS.technician]?.trim() || null,
    plate: null,
    performed_at,
    status: hasIssue ? "concluido_com_pendencias" : "concluido",
    items,
    photos: [],
    notes: null,
    fuel_level: null,
    km: null,
    created_at: performed_at,
    raw_notes: "",
  };
}

function rowToChecklist(row: SheetRow, index: number): Checklist {
  const { notes, meta } = parseNotes(row[SHEET_COLUMNS.notes]);
  const performed_at = fromSheetDate(row[SHEET_COLUMNS.date] ?? "", meta.time);
  const items: ChecklistItemAnswer[] =
    meta.type === "tools"
      ? meta.toolsAnswers
      : VEHICLE_ITEMS.filter((item) => (row[item] ?? "") !== "").map((item) => ({
          item,
          answer: row[item] as string,
        }));
  const kmRaw = (row[SHEET_COLUMNS.km] ?? "").replace(/\D/g, "");
  return {
    id: `${performed_at}-${index}`,
    type: meta.type,
    technician_id: null,
    vehicle_id: null,
    technician_name: row[SHEET_COLUMNS.technician]?.trim() || null,
    plate: row[SHEET_COLUMNS.plate]?.trim() || null,
    performed_at,
    status: meta.status,
    items,
    photos: meta.photoIds.map((p) => ({ path: p.id, name: p.name })),
    notes,
    fuel_level: row[SHEET_COLUMNS.fuel]?.trim() || null,
    km: kmRaw ? Number(kmRaw) : null,
    created_at: performed_at,
    raw_notes: row[SHEET_COLUMNS.notes] ?? "",
  };
}

async function readSheet(tab: string): Promise<SheetRow[]> {
  const res = await fetch(sheetUrl(tab), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Não foi possível ler a planilha (${res.status}).`);
  return (await res.json()) as SheetRow[];
}

export const checklistsQuery = {
  queryKey: ["checklists"] as const,
  queryFn: async (): Promise<Checklist[]> => {
    const [vehicleRows, toolsRows] = await Promise.all([
      readSheet(SHEET_TABS.vehicle),
      readSheet(SHEET_TABS.tools),
    ]);
    return [...vehicleRows.map(rowToChecklist), ...toolsRows.map(toolsRowToChecklist)].sort(
      (a, b) => b.performed_at.localeCompare(a.performed_at),
    );
  },
};

export async function createChecklist(input: {
  type: ChecklistType;
  technician_id: string | null;
  vehicle_id: string | null;
  technician_name: string | null;
  plate: string | null;
  performed_at: string;
  status: string;
  items: ChecklistItemAnswer[];
  photos: ChecklistPhoto[];
  notes: string | null;
  fuel_level: string | null;
  km: number | null;
}): Promise<Checklist> {
  const tab = input.type === "tools" ? SHEET_TABS.tools : SHEET_TABS.vehicle;
  let row: SheetRow;

  if (input.type === "tools") {
    row = {
      [TOOLS_COLUMNS.date]: toToolsDate(input.performed_at),
      [TOOLS_COLUMNS.technician]: input.technician_name ?? "",
    };
    for (const answer of input.items) row[answer.item] = answer.answer;
  } else {
    row = {
      [SHEET_COLUMNS.date]: toSheetDate(input.performed_at),
      [SHEET_COLUMNS.technician]: input.technician_name ?? "",
      [SHEET_COLUMNS.plate]: input.plate ?? "",
      [SHEET_COLUMNS.fuel]: input.fuel_level ?? "",
      [SHEET_COLUMNS.km]: input.km != null ? String(input.km) : "",
      [SHEET_COLUMNS.notes]: buildNotes(input.notes, {
        type: input.type,
        time: toSheetTime(input.performed_at),
        status: input.status,
        photoIds: input.photos.map((p) => ({ id: p.path, name: p.name })),
        toolsAnswers: [],
      }),
    };
    for (const answer of input.items) row[answer.item] = answer.answer;
  }

  const res = await fetch(sheetUrl(tab), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [row] }),
  });
  const payload = (await res.json().catch(() => ({}))) as { created?: number; error?: string };
  if (!res.ok || payload.error || !payload.created) {
    throw new Error(payload.error ?? `Falha ao gravar na planilha (${res.status}).`);
  }
  return input.type === "tools" ? toolsRowToChecklist(row, 0) : rowToChecklist(row, 0);
}

/** Remove a linha correspondente na planilha (usa a observação como chave). */
export async function deleteChecklist(id: string, notesKey?: string) {
  if (!notesKey) throw new Error("Não é possível excluir este registro da planilha.");
  const res = await fetch(
    sheetUrl(SHEET_TABS.vehicle, `/${SHEET_COLUMNS.notes}/${encodeURIComponent(notesKey)}`),
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`Falha ao excluir na planilha (${res.status}).`);
}

