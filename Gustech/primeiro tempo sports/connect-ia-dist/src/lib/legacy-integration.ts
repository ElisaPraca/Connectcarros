/**
 * Integração com a estrutura antiga: planilha (SheetDB) + upload no Google Drive
 * pelo serviço já existente. Toda a persistência dos checklists usa estes destinos.
 */

export const SHEETDB_URL = "https://sheetdb.io/api/v1/llqcpswuv52nn";
export const DRIVE_UPLOAD_BASE = "https://checklist-dwvs.onrender.com/upload";

/** Pasta do Drive de cada placa (mesma associação usada no sistema antigo). */
export const DRIVE_FOLDER_BY_PLATE: Record<string, string> = {
  "DWK-8C09": "1e68exuC5cfmIg__lJTTK_qoQP8iNtEOt",
  "DVD-2E60": "1W4Lv4VM8H98WULkgVtUgHhGSBNsduGV8",
  "EFQ-1E05": "1V8F8EuyCoHPmpM7PEcvGklkDCFOSlvOa",
  "FCO-6H53": "1EMY0nCR4VzP7bQQxcqS4eEkcFyFHtSR6",
  "FNY-2382": "1rvq8HtgG0iyoE0tYWrdbpUBuicV6HBVN",
  "FPV-1G27": "1FKuMPXt2YOcUkcbiitD3pTurlwclhjrG",
  "FWZ-0I62": "1pDaqFRYG4-EQ4OBatJHZpjhh7npp0yze",
  "FZC-7G15": "15JGn_c1TuvibmjI5xJft33ibREgUs-EY",
  "ITY-3I95": "1i8KdY20FXlYB_owPpAHiqP6MqDh6cexd",
  "PBT-3H71": "1SwZlsrKsMzxhE9jco9GCDKzdwAb6LQJ3",
  "RMF-0F96": "114YUA5A2BniT0E9q-cS9wp5KZzlOCDGj",
  "SSX-5B37": "160JFWanKMPkeApxoVnm8oLa8R4_E3HUv",
  "STF-8E45": "1IBI_-BSjF-vbVjZUXNRJyLqdHf01hio6",
  "SWQ-8G95": "1zUX3RCKm_nFWkHaq2K_MU9wtFvjdUZsg",
};

export function driveFolderForPlate(plate: string): string | null {
  return DRIVE_FOLDER_BY_PLATE[plate.trim().toUpperCase()] ?? null;
}

/** Abas da planilha. */
export const SHEET_TABS = {
  vehicle: "Check List Carros",
  tools: "Check List Ferramentas",
  technicians: "Tecnicos",
  vehicles: "Veiculos",
} as const;

/** Colunas da aba "Tecnicos" (cadastro dinâmico de técnicos). */
export const TECH_COLUMNS = {
  id: "id",
  name: "nome",
  active: "ativo",
  createdAt: "criado_em",
} as const;

/** Colunas da aba "Veiculos" (cadastro dinâmico de veículos). */
export const VEHICLE_COLUMNS = {
  id: "id",
  plate: "placa",
  label: "apelido",
  technicianId: "tecnico_id",
  driveFolder: "pasta_drive",
  active: "ativo",
  createdAt: "criado_em",
} as const;


/** Colunas fixas da aba de carros (as demais colunas são os itens do checklist). */
export const SHEET_COLUMNS = {
  date: "Data",
  technician: "Nome do Cliente",
  plate: "Veículo ",
  notes: "Observacao",
  fuel: "Nivel de Combustivel",
  km: "Km",
} as const;

/** Colunas fixas da aba de ferramentas. */
export const TOOLS_COLUMNS = {
  date: "Data da Conferência",
  technician: "Nome do Técnico",
} as const;

/** aaaa-mm-dd usado na aba de ferramentas. */
export function toToolsDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromToolsDate(date: string): string {
  const [y, m, d] = (date || "").split("-").map((v) => Number(v));
  if (!y || !m || !d) return new Date(0).toISOString();
  return new Date(y, m - 1, d).toISOString();
}

export function sheetUrl(tab: string, path = ""): string {
  return `${SHEETDB_URL}${path}?sheet=${encodeURIComponent(tab)}`;
}

export type SheetRow = Record<string, string>;

/** dd/mm/aaaa usado na planilha. */
export function toSheetDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function toSheetTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Metadados que a planilha antiga não possui em colunas próprias. */
export type SheetMeta = {
  type: "vehicle" | "tools";
  time: string;
  status: string;
  photoIds: { id: string; name: string }[];
  toolsAnswers: { item: string; answer: string }[];
};

const META_SEP = "\n---\n";

export function buildNotes(notes: string | null, meta: SheetMeta): string {
  const parts = [
    `Tipo: ${meta.type === "vehicle" ? "Veículo" : "Ferramentas"}`,
    `Hora: ${meta.time}`,
    `Status: ${meta.status}`,
  ];
  if (meta.photoIds.length > 0) {
    parts.push(`Fotos: ${meta.photoIds.map((p) => `${p.name}=${p.id}`).join(", ")}`);
  }
  if (meta.toolsAnswers.length > 0) {
    parts.push(
      `Itens: ${meta.toolsAnswers.map((a) => `${a.item}=${a.answer}`).join("; ")}`,
    );
  }
  return `${notes?.trim() ?? ""}${META_SEP}${parts.join(" | ")}`.trim();
}

export function parseNotes(raw: string | undefined): {
  notes: string | null;
  meta: SheetMeta;
} {
  const value = raw ?? "";
  // Quando não há observação do usuário, a linha começa direto com "---".
  const normalized = value.startsWith("---") ? `\n${value}` : value;
  const [userPart, metaPart = ""] = normalized.split(META_SEP);
  const pick = (label: string) => {
    const m = metaPart.match(new RegExp(`${label}: ([^|]*)`));
    return m?.[1] ? m[1].trim() : "";
  };
  const photosRaw = pick("Fotos");
  const itemsRaw = pick("Itens");
  return {
    notes: userPart?.trim() ? userPart.trim() : null,
    meta: {
      type: pick("Tipo") === "Ferramentas" ? "tools" : "vehicle",
      time: pick("Hora") || "00:00",
      status: pick("Status") || "concluido",
      photoIds: photosRaw
        ? photosRaw
            .split(",")
            .map((chunk) => {
              const [name, id] = chunk.split("=").map((s) => s.trim());
              return { name: name ?? "", id: id ?? "" };
            })
            .filter((p) => p.id)
        : [],
      toolsAnswers: itemsRaw
        ? itemsRaw
            .split(";")
            .map((chunk) => {
              const [item, answer] = chunk.split("=").map((s) => s.trim());
              return { item: item ?? "", answer: answer ?? "" };
            })
            .filter((a) => a.item)
        : [],
    },
  };
}

/** Converte dd/mm/aaaa + hh:mm em ISO local. */
export function fromSheetDate(date: string, time: string): string {
  const [d, m, y] = (date || "").split("/").map((v) => Number(v));
  const [hh, mm] = (time || "00:00").split(":").map((v) => Number(v));
  if (!d || !m || !y) return new Date(0).toISOString();
  return new Date(y, m - 1, d, hh || 0, mm || 0).toISOString();
}
