import type { ChecklistType } from "./checklist-config";
import { itemsFor, normalizePlate } from "./checklist-config";
import {
  DRIVE_UPLOAD_BASE,
  SHEET_COLUMNS,
  SHEET_TABS,
  TECH_COLUMNS,
  TOOLS_COLUMNS,
  VEHICLE_COLUMNS,
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
  const normalized = normalizePlate(plate);
  const registered = await readVehicles()
    .then((list) => list.find((v) => v.plate === normalized)?.drive_folder ?? null)
    .catch(() => null);
  const folderId = registered ?? driveFolderForPlate(normalized);
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
    map[id] = `https://lh3.googleusercontent.com/d/${id}=w1000`;
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

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("duplicate key") || m.includes("vehicles_plate_key")) {
    return "Já existe um veículo cadastrado com essa placa.";
  }
  if (m.includes("placa invalida")) {
    return "Placa inválida. Use o formato ABC-1D23 ou ABC-1234.";
  }
  if (m.includes("failed to fetch") || m.includes("networkerror")) {
    return "Sem conexão com o banco de dados. Verifique a internet e tente novamente.";
  }
  return message;
}

/* -------- Cadastros na planilha (abas "Tecnicos" e "Veiculos") -------- */

function missingTabError(tab: string): Error {
  return new Error(
    `A aba "${tab}" não existe na planilha. Crie a aba com as colunas indicadas e tente novamente.`,
  );
}

async function sheetInsert(tab: string, row: SheetRow): Promise<void> {
  const res = await fetch(sheetUrl(tab), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [row] }),
  });
  const payload = (await res.json().catch(() => ({}))) as { created?: number; error?: string };
  if (res.status === 404) throw missingTabError(tab);
  if (!res.ok || payload.error || !payload.created) {
    throw new Error(payload.error ?? `Falha ao gravar na aba "${tab}" (${res.status}).`);
  }
}

async function sheetPatch(tab: string, id: string, row: SheetRow): Promise<void> {
  const res = await fetch(sheetUrl(tab, `/id/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: row }),
  });
  if (res.status === 404) throw missingTabError(tab);
  if (!res.ok) throw new Error(`Falha ao atualizar na aba "${tab}" (${res.status}).`);
}

async function sheetDelete(tab: string, id: string): Promise<void> {
  const res = await fetch(sheetUrl(tab, `/id/${encodeURIComponent(id)}`), { method: "DELETE" });
  if (res.status === 404) throw missingTabError(tab);
  if (!res.ok) throw new Error(`Falha ao excluir na aba "${tab}" (${res.status}).`);
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function toBool(value: string | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v !== "nao" && v !== "não" && v !== "false" && v !== "0" && v !== "inativo";
}

function fromBool(value: boolean): string {
  return value ? "sim" : "nao";
}

/* ------------------------------ Técnicos ------------------------------ */

function rowToTechnician(row: SheetRow): Technician {
  return {
    id: (row[TECH_COLUMNS.id] ?? "").trim(),
    full_name: (row[TECH_COLUMNS.name] ?? "").trim(),
    active: toBool(row[TECH_COLUMNS.active]),
    created_at: (row[TECH_COLUMNS.createdAt] ?? "").trim() || new Date(0).toISOString(),
  };
}

export const techniciansQuery = {
  queryKey: ["technicians"] as const,
  queryFn: async (): Promise<Technician[]> => {
    const rows = await readSheet(SHEET_TABS.technicians);
    return rows
      .map(rowToTechnician)
      .filter((t) => t.id && t.full_name)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  },
};

export async function createTechnician(input: {
  full_name: string;
  active: boolean;
}): Promise<Technician> {
  const name = input.full_name.trim();
  if (!name) throw new Error("Informe o nome completo do técnico.");
  const existing = await techniciansQuery.queryFn();
  if (existing.some((t) => t.full_name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Já existe um técnico cadastrado com esse nome.");
  }
  const technician: Technician = {
    id: newId(),
    full_name: name,
    active: input.active,
    created_at: new Date().toISOString(),
  };
  await sheetInsert(SHEET_TABS.technicians, {
    [TECH_COLUMNS.id]: technician.id,
    [TECH_COLUMNS.name]: technician.full_name,
    [TECH_COLUMNS.active]: fromBool(technician.active),
    [TECH_COLUMNS.createdAt]: technician.created_at,
  });
  return technician;
}

export async function updateTechnician(
  id: string,
  input: Partial<Pick<Technician, "full_name" | "active">>,
): Promise<Technician> {
  const current = (await techniciansQuery.queryFn()).find((t) => t.id === id);
  if (!current) throw new Error("Técnico não encontrado na planilha.");
  const next: Technician = {
    ...current,
    ...(input.full_name != null ? { full_name: input.full_name.trim() } : {}),
    ...(input.active != null ? { active: input.active } : {}),
  };
  await sheetPatch(SHEET_TABS.technicians, id, {
    [TECH_COLUMNS.name]: next.full_name,
    [TECH_COLUMNS.active]: fromBool(next.active),
  });
  return next;
}

export async function deleteTechnician(id: string) {
  await sheetDelete(SHEET_TABS.technicians, id);
}

/* ------------------------------ Veículos ------------------------------ */

function rowToVehicle(row: SheetRow): Vehicle & { drive_folder: string | null } {
  return {
    id: (row[VEHICLE_COLUMNS.id] ?? "").trim(),
    plate: normalizePlate(row[VEHICLE_COLUMNS.plate] ?? ""),
    label: (row[VEHICLE_COLUMNS.label] ?? "").trim() || null,
    technician_id: (row[VEHICLE_COLUMNS.technicianId] ?? "").trim() || null,
    active: toBool(row[VEHICLE_COLUMNS.active]),
    created_at: (row[VEHICLE_COLUMNS.createdAt] ?? "").trim() || new Date(0).toISOString(),
    drive_folder: (row[VEHICLE_COLUMNS.driveFolder] ?? "").trim() || null,
  };
}

async function readVehicles() {
  const rows = await readSheet(SHEET_TABS.vehicles);
  return rows
    .map(rowToVehicle)
    .filter((v) => v.id && v.plate)
    .sort((a, b) => a.plate.localeCompare(b.plate));
}

export const vehiclesQuery = {
  queryKey: ["vehicles"] as const,
  queryFn: async (): Promise<Vehicle[]> => readVehicles(),
};

export async function createVehicle(input: {
  plate: string;
  label: string | null;
  technician_id: string | null;
  active: boolean;
}): Promise<Vehicle> {
  const plate = normalizePlate(input.plate);
  const existing = await readVehicles();
  if (existing.some((v) => v.plate === plate)) {
    throw new Error("Já existe um veículo cadastrado com essa placa.");
  }
  const vehicle: Vehicle = {
    id: newId(),
    plate,
    label: input.label?.trim() || null,
    technician_id: input.technician_id,
    active: input.active,
    created_at: new Date().toISOString(),
  };
  await sheetInsert(SHEET_TABS.vehicles, {
    [VEHICLE_COLUMNS.id]: vehicle.id,
    [VEHICLE_COLUMNS.plate]: vehicle.plate,
    [VEHICLE_COLUMNS.label]: vehicle.label ?? "",
    [VEHICLE_COLUMNS.technicianId]: vehicle.technician_id ?? "",
    [VEHICLE_COLUMNS.driveFolder]: driveFolderForPlate(vehicle.plate) ?? "",
    [VEHICLE_COLUMNS.active]: fromBool(vehicle.active),
    [VEHICLE_COLUMNS.createdAt]: vehicle.created_at,
  });
  return vehicle;
}

export async function updateVehicle(
  id: string,
  input: Partial<Pick<Vehicle, "plate" | "label" | "technician_id" | "active">>,
): Promise<Vehicle> {
  const all = await readVehicles();
  const current = all.find((v) => v.id === id);
  if (!current) throw new Error("Veículo não encontrado na planilha.");
  const plate = input.plate != null ? normalizePlate(input.plate) : current.plate;
  if (plate !== current.plate && all.some((v) => v.plate === plate && v.id !== id)) {
    throw new Error("Já existe um veículo cadastrado com essa placa.");
  }
  const next: Vehicle = {
    id: current.id,
    plate,
    label: input.label !== undefined ? input.label?.trim() || null : current.label,
    technician_id:
      input.technician_id !== undefined ? input.technician_id : current.technician_id,
    active: input.active != null ? input.active : current.active,
    created_at: current.created_at,
  };
  await sheetPatch(SHEET_TABS.vehicles, id, {
    [VEHICLE_COLUMNS.plate]: next.plate,
    [VEHICLE_COLUMNS.label]: next.label ?? "",
    [VEHICLE_COLUMNS.technicianId]: next.technician_id ?? "",
    [VEHICLE_COLUMNS.driveFolder]:
      current.drive_folder ?? driveFolderForPlate(next.plate) ?? "",
    [VEHICLE_COLUMNS.active]: fromBool(next.active),
  });
  return next;
}

export async function deleteVehicle(id: string) {
  await sheetDelete(SHEET_TABS.vehicles, id);
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
  if (res.status === 404) throw missingTabError(tab);
  if (!res.ok) throw new Error(`Não foi possível ler a planilha (${res.status}).`);
  const data = (await res.json().catch(() => [])) as SheetRow[] | { error?: string };
  if (!Array.isArray(data)) throw new Error(data.error ?? "Resposta inválida da planilha.");
  return data;
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

