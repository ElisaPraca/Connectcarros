export type ChecklistType = "vehicle" | "tools";

export type AnswerValue = "OK" | "Não OK" | "Não Checado";

export const ANSWER_OPTIONS: AnswerValue[] = ["OK", "Não OK", "Não Checado"];

export type ChecklistSection = {
  title: string;
  items: string[];
};

/** Itens do checklist de veículo — preservados do sistema anterior, agora agrupados. */
export const VEHICLE_SECTIONS: ChecklistSection[] = [
  {
    title: "Itens internos e acessórios",
    items: [
      "Antena",
      "GPS",
      "Carregador Celular",
      "Rádio",
      "Documentos",
      "Calotas",
      "Tapetes",
      "Manual",
      "Estepe",
      "Pertences",
    ],
  },
  {
    title: "Painel, elétrica e conforto",
    items: [
      "Instrumentos do painel e lâmpadas de controle",
      "Iluminação dos instrumentos do painel",
      "Lâmpadas internas",
      "Setas de direção e luzes de sinalização",
      "Jato d'água dos limpadores de para-brisa",
      "Ar-condicionado / ar-quente / ventilação",
      "Buzina",
      "Etiqueta de óleo",
      "Vidro elétrico",
    ],
  },
  {
    title: "Segurança",
    items: [
      "Freio de estacionamento",
      "Cinto de segurança e fixação",
      "Palhetas dos limpadores de para-brisa e vidro traseiro",
      "Sistema de iluminação (Ex: faróis, setas, freio, placa, ré)",
      "Condições dos pneus / pressão (inclusive estepe)",
      "Chave de roda, macaco e triângulo de segurança",
    ],
  },
  {
    title: "Fluidos e motor",
    items: [
      "Líquido de arrefecimento (vazamento, nível, aditivo)",
      "Fluido de freio: nível, qualidade (cor, contaminação)",
      "Nível do óleo do motor",
      "Nível do óleo hidráulico (óleo de direção)",
      "Sistema de limpa-vidros / completar reservatório",
      "Reservatório de partida a frio",
      "Vazamentos gerais",
      "Correia dentada",
    ],
  },
  {
    title: "Suspensão e mecânica",
    items: [
      "Coxim motor",
      "Coxim câmbio inferior",
      "Com câmbio inferior",
      "Amortecedor dianteiro",
      "Batente dianteiro",
      "Boletas",
      "Bandeja",
      "Pivô",
      "Braço da caixa",
      "Amortecedor traseiro",
      "Kit amortecedor traseiro",
      "Partilha disco de freio",
      "Trambo de freio traseiro",
      "Lona de freio traseira",
    ],
  },
  {
    title: "Lataria e iluminação externa",
    items: [
      "Lateral direita",
      "Lateral esquerda",
      "Farol direito",
      "Farol esquerda",
      "Milha esquerda",
      "Milha direita",
      "Lanterna traseira direita",
      "Lanterna traseira esquerda",
      "Pára-choque dianteiro",
      "Pára-choque traseiro",
      "Cabo",
      "Tento",
      "Tampa do porta vala",
    ],
  },
];

/**
 * Itens do checklist de ferramentas do técnico — exatamente as colunas da aba
 * "Check List Ferramentas" da planilha.
 */
export const TOOLS_SECTIONS: ChecklistSection[] = [
  {
    title: "Fibra e rede",
    items: [
      "Clivador",
      "Alicate de acrilato",
      "Alicate decapador de cabo",
      "Alicate de Corte",
      "Alicate de RJ",
      "Teste de Cabo",
    ],
  },
  {
    title: "Medição e testes",
    items: [
      "Caneta de luz optica",
      "Power mitter Pon",
      "Power Mitter Normal",
      "Zumbidor",
    ],
  },
  {
    title: "Ferramentas manuais",
    items: ["Martelo", "Chave Phillips", "Chave Fenda", "Furadeira"],
  },
  {
    title: "EPI e segurança",
    items: ["Cinto", "Talabate", "Capacete"],
  },
  {
    title: "Escadas e apoio",
    items: [
      "Escada grande",
      "Escada Pequena",
      "Nivelador de Escada",
      "Carrinho de Fibra",
      "Galão de Agua",
    ],
  },
];

export function sectionsFor(type: ChecklistType): ChecklistSection[] {
  return type === "vehicle" ? VEHICLE_SECTIONS : TOOLS_SECTIONS;
}

export function itemsFor(type: ChecklistType): string[] {
  return sectionsFor(type).flatMap((section) => section.items);
}

export const TYPE_LABEL: Record<ChecklistType, string> = {
  vehicle: "Checklist do Veículo",
  tools: "Checklist de Ferramentas",
};

export const TYPE_SLUG: Record<ChecklistType, string> = {
  vehicle: "veiculo",
  tools: "ferramentas",
};

export function typeFromSlug(slug: string): ChecklistType {
  return slug === "ferramentas" ? "tools" : "vehicle";
}

export const PLATE_REGEX = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/;

export function normalizePlate(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidPlate(value: string): boolean {
  return PLATE_REGEX.test(normalizePlate(value));
}
