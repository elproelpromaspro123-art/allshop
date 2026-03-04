export type CarrierCode = "veloces" | "asegura_express" | "proteccion_total";

export interface CarrierOption {
  code: CarrierCode;
  name: string;
  insured: boolean;
}

export interface DeliveryEstimate {
  department: string;
  carrier: CarrierOption;
  availableCarriers: CarrierOption[];
  minBusinessDays: number;
  maxBusinessDays: number;
  estimatedStartDate: string;
  estimatedEndDate: string;
  formattedRange: string;
  freeShipping: boolean;
  cutOffApplied: boolean;
  modelVersion: string;
}

interface CarrierDefinition extends CarrierOption {
  priority: number;
  baseMinDays: number;
  baseMaxDays: number;
  unavailableIn: Set<string>;
}

export const COLOMBIA_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlantico",
  "Bolivar",
  "Boyaca",
  "Caldas",
  "Caqueta",
  "Casanare",
  "Cauca",
  "Cesar",
  "Choco",
  "Cordoba",
  "Cundinamarca",
  "Guainia",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Narino",
  "Norte de Santander",
  "Putumayo",
  "Quindio",
  "Risaralda",
  "San Andres",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupes",
  "Vichada",
  "Bogota D.C.",
] as const;

const FAST_ZONE = new Set(
  [
    "Bogota D.C.",
    "Cundinamarca",
    "Antioquia",
    "Risaralda",
    "Caldas",
    "Quindio",
    "Santander",
    "Valle del Cauca",
    "Boyaca",
    "Tolima",
  ].map(normalizeDepartment)
);

const REMOTE_ZONE = new Set(
  [
    "Amazonas",
    "Caqueta",
    "Choco",
    "Guainia",
    "Guaviare",
    "Putumayo",
    "San Andres",
    "Vaupes",
    "Vichada",
  ].map(normalizeDepartment)
);

const CARRIERS: CarrierDefinition[] = [
  {
    code: "veloces",
    name: "Veloces",
    insured: false,
    priority: 1,
    baseMinDays: 1,
    baseMaxDays: 2,
    unavailableIn: new Set(
      ["Amazonas", "Guainia", "Vaupes", "Vichada", "San Andres"].map(
        normalizeDepartment
      )
    ),
  },
  {
    code: "asegura_express",
    name: "Asegura Express",
    insured: true,
    priority: 2,
    baseMinDays: 2,
    baseMaxDays: 3,
    unavailableIn: new Set(),
  },
  {
    code: "proteccion_total",
    name: "Proteccion Total",
    insured: true,
    priority: 3,
    baseMinDays: 3,
    baseMaxDays: 4,
    unavailableIn: new Set(),
  },
];

export function normalizeDepartment(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getZoneOffsets(department: string): { min: number; max: number } {
  const key = normalizeDepartment(department);
  if (FAST_ZONE.has(key)) {
    return { min: 0, max: 0 };
  }

  if (REMOTE_ZONE.has(key)) {
    return { min: 2, max: 3 };
  }

  return { min: 1, max: 2 };
}

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function addBusinessDays(date: Date, businessDays: number): Date {
  const result = new Date(date);
  let remaining = Math.max(0, businessDays);

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      remaining -= 1;
    }
  }

  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRange(startDate: Date, endDate: Date): string {
  const formatter = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  });
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

export function getAvailableCarriers(department: string): CarrierOption[] {
  const departmentKey = normalizeDepartment(department);

  return CARRIERS.filter((carrier) => !carrier.unavailableIn.has(departmentKey))
    .sort((a, b) => a.priority - b.priority)
    .map(({ code, name, insured }) => ({ code, name, insured }));
}

function pickCarrier(
  department: string,
  preferredCarrierCode?: string | null
): CarrierDefinition {
  const available = CARRIERS.filter(
    (carrier) => !carrier.unavailableIn.has(normalizeDepartment(department))
  ).sort((a, b) => a.priority - b.priority);

  const preferred = available.find((carrier) => carrier.code === preferredCarrierCode);
  if (preferred) {
    return preferred;
  }

  const veloces = available.find((carrier) => carrier.code === "veloces");
  if (veloces) {
    return veloces;
  }

  const insured = available.find((carrier) => carrier.insured);
  if (insured) {
    return insured;
  }

  return CARRIERS[0];
}

export function estimateColombiaDelivery(input: {
  department: string;
  preferredCarrierCode?: string | null;
  now?: Date;
}): DeliveryEstimate {
  const department =
    COLOMBIA_DEPARTMENTS.find(
      (dep) => normalizeDepartment(dep) === normalizeDepartment(input.department)
    ) || input.department || "Bogota D.C.";

  const carrier = pickCarrier(department, input.preferredCarrierCode);
  const availableCarriers = getAvailableCarriers(department);
  const zoneOffsets = getZoneOffsets(department);
  const now = input.now || new Date();
  const cutOffApplied = now.getHours() >= 15;
  const cutOffOffset = cutOffApplied ? 1 : 0;

  const minBusinessDays =
    carrier.baseMinDays + zoneOffsets.min + cutOffOffset;
  const maxBusinessDays =
    carrier.baseMaxDays + zoneOffsets.max + cutOffOffset;

  const startDate = addBusinessDays(now, minBusinessDays);
  const endDate = addBusinessDays(now, maxBusinessDays);

  return {
    department,
    carrier: {
      code: carrier.code,
      name: carrier.name,
      insured: carrier.insured,
    },
    availableCarriers,
    minBusinessDays,
    maxBusinessDays,
    estimatedStartDate: toIsoDate(startDate),
    estimatedEndDate: toIsoDate(endDate),
    formattedRange: formatRange(startDate, endDate),
    freeShipping: true,
    cutOffApplied,
    modelVersion: "co-estimate-v1",
  };
}
