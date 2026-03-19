export type CarrierCode = "veloces" | "asegura_express" | "proteccion_total";

export interface CarrierOption {
  code: CarrierCode;
  name: string;
  insured: boolean;
}

export interface DeliveryEstimate {
  department: string;
  city: string | null;
  carrier: CarrierOption;
  availableCarriers: CarrierOption[];
  minBusinessDays: number;
  maxBusinessDays: number;
  estimatedStartDate: string;
  estimatedEndDate: string;
  formattedRange: string;
  freeShipping: boolean;
  cutOffApplied: boolean;
  confidence: "high" | "medium";
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

const REGION_CODE_TO_DEPARTMENT: Record<string, string> = {
  AMA: "Amazonas",
  ANT: "Antioquia",
  ARA: "Arauca",
  ATL: "Atlantico",
  BOL: "Bolivar",
  BOY: "Boyaca",
  CAL: "Caldas",
  CAQ: "Caqueta",
  CAS: "Casanare",
  CAU: "Cauca",
  CES: "Cesar",
  CHO: "Choco",
  COR: "Cordoba",
  CUN: "Cundinamarca",
  GUA: "Guainia",
  GUV: "Guaviare",
  HUI: "Huila",
  LAG: "La Guajira",
  MAG: "Magdalena",
  MET: "Meta",
  NAR: "Narino",
  NSA: "Norte de Santander",
  PUT: "Putumayo",
  QUI: "Quindio",
  RIS: "Risaralda",
  SAP: "San Andres",
  SAN: "Santander",
  SUC: "Sucre",
  TOL: "Tolima",
  VAC: "Valle del Cauca",
  VAU: "Vaupes",
  VID: "Vichada",
  DC: "Bogota D.C.",
  BOG: "Bogota D.C.",
};

const CITY_TO_DEPARTMENT: Record<string, string> = {
  bogota: "Bogota D.C.",
  medellin: "Antioquia",
  envigado: "Antioquia",
  bello: "Antioquia",
  itagui: "Antioquia",
  cali: "Valle del Cauca",
  palmira: "Valle del Cauca",
  barranquilla: "Atlantico",
  soledad: "Atlantico",
  cartagena: "Bolivar",
  bucaramanga: "Santander",
  cucuta: "Norte de Santander",
  pereira: "Risaralda",
  dosquebradas: "Risaralda",
  manizales: "Caldas",
  armenia: "Quindio",
  ibague: "Tolima",
  neiva: "Huila",
  villavicencio: "Meta",
  "santa marta": "Magdalena",
  monteria: "Cordoba",
  sincelejo: "Sucre",
  pasto: "Narino",
  tunja: "Boyaca",
  valledupar: "Cesar",
  riohacha: "La Guajira",
  yopal: "Casanare",
  quibdo: "Choco",
  leticia: "Amazonas",
};

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

const METRO_DEPARTMENTS = new Set(
  [
    "Bogota D.C.",
    "Antioquia",
    "Atlantico",
    "Cundinamarca",
    "Risaralda",
    "Caldas",
    "Quindio",
    "Valle del Cauca",
    "Santander",
  ].map(normalizeDepartment)
);

const EXPRESS_HUB_CITIES = new Set(
  [
    "bogota",
    "medellin",
    "cali",
    "barranquilla",
    "bucaramanga",
    "pereira",
    "manizales",
    "armenia",
    "cucuta",
    "ibague",
    "cartagena",
  ].map(normalizeDepartment)
);

const HARD_REMOTE_CITIES = new Set(
  [
    "mitu",
    "inirida",
    "puerto carreno",
    "puerto asis",
    "puerto leguizamo",
    "leticia",
    "bahia solano",
    "nuqui",
    "san andres",
  ].map(normalizeDepartment)
);

const CARRIERS: CarrierDefinition[] = [
  {
    code: "veloces",
    name: "Veloces",
    insured: false,
    priority: 1,
    baseMinDays: 1,
    baseMaxDays: 3,
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
    baseMaxDays: 4,
    unavailableIn: new Set(),
  },
  {
    code: "proteccion_total",
    name: "Proteccion Total",
    insured: true,
    priority: 3,
    baseMinDays: 3,
    baseMaxDays: 5,
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

export function normalizeCity(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toCanonicalDepartment(value: string): string | null {
  const key = normalizeDepartment(value);
  if (!key) return null;
  const match = COLOMBIA_DEPARTMENTS.find(
    (department) => normalizeDepartment(department) === key
  );
  return match || null;
}

export function resolveDepartmentFromRegionCode(
  regionCode: string | null | undefined
): string | null {
  const raw = String(regionCode || "").trim().toUpperCase();
  if (!raw) return null;
  const normalized = raw.replace(/^CO-/, "");
  return REGION_CODE_TO_DEPARTMENT[normalized] || null;
}

export function resolveDepartmentFromCity(city: string | null | undefined): string | null {
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) return null;
  return CITY_TO_DEPARTMENT[normalizedCity] || null;
}

function getZoneOffsets(department: string, city?: string | null): { min: number; max: number } {
  const departmentKey = normalizeDepartment(department);
  const cityKey = normalizeCity(city);

  if (HARD_REMOTE_CITIES.has(cityKey)) {
    return { min: 4, max: 6 };
  }

  if (EXPRESS_HUB_CITIES.has(cityKey) && METRO_DEPARTMENTS.has(departmentKey)) {
    return { min: 0, max: 0 };
  }

  if (FAST_ZONE.has(departmentKey)) {
    return { min: 0, max: 1 };
  }

  if (REMOTE_ZONE.has(departmentKey)) {
    return { min: 3, max: 5 };
  }

  if (METRO_DEPARTMENTS.has(departmentKey)) {
    return { min: 1, max: 2 };
  }

  return { min: 2, max: 3 };
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
  const departmentKey = normalizeDepartment(department);
  const available = CARRIERS.filter(
    (carrier) => !carrier.unavailableIn.has(departmentKey)
  ).sort((a, b) => a.priority - b.priority);

  const preferred = available.find((carrier) => carrier.code === preferredCarrierCode);
  if (preferred) {
    return preferred;
  }

  const veloces = available.find((carrier) => carrier.code === "veloces");
  if (veloces && (FAST_ZONE.has(departmentKey) || METRO_DEPARTMENTS.has(departmentKey))) {
    return veloces;
  }

  const insured = available.find((carrier) => carrier.insured);
  if (insured && REMOTE_ZONE.has(departmentKey)) {
    return insured;
  }

  if (veloces) return veloces;
  if (insured) return insured;

  return CARRIERS[0];
}

function getCarrierOperationalOffset(
  carrierCode: CarrierCode,
  department: string
): { min: number; max: number } {
  const isRemote = REMOTE_ZONE.has(normalizeDepartment(department));
  if (!isRemote) return { min: 0, max: 0 };

  if (carrierCode === "veloces") return { min: 1, max: 1 };
  if (carrierCode === "asegura_express") return { min: 0, max: 1 };
  return { min: 0, max: 0 };
}

function getCutOffOffset(now: Date, department: string): number {
  const hour = now.getHours();
  const day = now.getDay();
  const isRemote = REMOTE_ZONE.has(normalizeDepartment(department));

  if (day === 6) return isRemote ? 2 : 1;
  if (day === 0) return isRemote ? 2 : 1;
  if (hour >= 15) return isRemote ? 2 : 1;
  if (isRemote && hour >= 12) return 1;

  return 0;
}

function getEstimateConfidence(department: string, city?: string | null): "high" | "medium" {
  if (normalizeCity(city)) return "high";
  if (METRO_DEPARTMENTS.has(normalizeDepartment(department))) return "high";
  return "medium";
}

export function resolveBestDepartmentCandidate(input: {
  department?: string | null;
  city?: string | null;
  regionCode?: string | null;
}): string {
  const fromDepartment = toCanonicalDepartment(input.department || "");
  if (fromDepartment) return fromDepartment;

  const fromRegion = toCanonicalDepartment(resolveDepartmentFromRegionCode(input.regionCode) || "");
  if (fromRegion) return fromRegion;

  const fromCity = toCanonicalDepartment(resolveDepartmentFromCity(input.city) || "");
  if (fromCity) return fromCity;

  return "Bogota D.C.";
}

export function estimateColombiaDelivery(input: {
  department: string;
  city?: string | null;
  preferredCarrierCode?: string | null;
  now?: Date;
}): DeliveryEstimate {
  const department = resolveBestDepartmentCandidate({
    department: input.department,
    city: input.city || null,
  });
  const normalizedCity = normalizeCity(input.city);
  const city = normalizedCity ? String(input.city).trim() : null;
  const carrier = pickCarrier(department, input.preferredCarrierCode);
  const availableCarriers = getAvailableCarriers(department);
  const zoneOffsets = getZoneOffsets(department, city);
  const operationalOffsets = getCarrierOperationalOffset(carrier.code, department);
  const now = input.now || new Date();
  const cutOffOffset = getCutOffOffset(now, department);
  const cutOffApplied = cutOffOffset > 0;

  const minBusinessDays =
    carrier.baseMinDays + zoneOffsets.min + operationalOffsets.min + cutOffOffset;
  const maxBusinessDays = Math.max(
    minBusinessDays,
    carrier.baseMaxDays + zoneOffsets.max + operationalOffsets.max + cutOffOffset
  );

  const startDate = addBusinessDays(now, minBusinessDays);
  const endDate = addBusinessDays(now, maxBusinessDays);

  return {
    department,
    city,
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
    freeShipping: false,
    cutOffApplied,
    confidence: getEstimateConfidence(department, city),
    modelVersion: "co-estimate-v2",
  };
}
