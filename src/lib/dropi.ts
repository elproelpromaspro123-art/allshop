import type { OrderItem } from "@/types/database";

const DEFAULT_DROPI_API_BASE_URL = "https://api.dropi.co";
const DEFAULT_DROPI_WHITE_BRAND_ID = "1";
const DEFAULT_DROPI_COUNTRY = "Colombia";
const DEFAULT_DROPI_RATE_TYPE = "NACIONAL";
const DEFAULT_DROPI_TYPE_SERVICE = "ESTANDAR";

export interface DropiProviderProductConfig {
  supplierId: number;
  productId: number;
  warehouseId: number;
  variationId?: number | null;
  distributionCompany?: string;
  typeService?: string;
  rateType?: string;
}

export type DropiProviderParseResult =
  | { kind: "not_dropi" }
  | { kind: "invalid"; reason: string }
  | { kind: "ok"; config: DropiProviderProductConfig };

export interface DropiOrderGroupItem {
  orderItem: OrderItem;
  config: DropiProviderProductConfig;
}

export interface DropiStockByVariation {
  variationId: number | null;
  label: string | null;
  quantity: number;
}

export interface DropiStockSnapshot {
  totalStock: number | null;
  byVariation: DropiStockByVariation[];
  sourceEndpoint: string;
  fetchedAt: string;
}

interface DropiOrderRecord {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_zip: string | null;
  shipping_cost: number;
  total: number;
}

export interface DropiOrderRequestInput {
  order: DropiOrderRecord;
  items: DropiOrderGroupItem[];
}

interface DropiRuntimeConfig {
  apiBaseUrl: string;
  email: string | null;
  password: string | null;
  integrationToken: string | null;
  whiteBrandId: string;
  userId: number | null;
  defaultCountry: string;
  defaultRateType: string;
  defaultTypeService: string;
}

type JsonRecord = Record<string, unknown>;

function toPositiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : null;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function getStringFromParams(params: URLSearchParams, keys: string[]): string | null {
  for (const key of keys) {
    const value = cleanString(params.get(key));
    if (value) return value;
  }
  return null;
}

function getNumberFromParams(params: URLSearchParams, keys: string[]): number | null {
  const value = getStringFromParams(params, keys);
  return toPositiveInteger(value);
}

function getNumberFromObject(
  source: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const value = source[key];
    const parsed = toPositiveInteger(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function getStringFromObject(
  source: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = cleanString(source[key]);
    if (value) return value;
  }
  return null;
}

function buildDropiProviderConfig(
  supplierId: number | null,
  productId: number | null,
  warehouseId: number | null,
  variationId: number | null,
  distributionCompany: string | null,
  typeService: string | null,
  rateType: string | null
): DropiProviderParseResult {
  if (supplierId === null || productId === null || warehouseId === null) {
    return {
      kind: "invalid",
      reason:
        "dropi:// config must include supplier_id, product_id and warehouse_id",
    };
  }

  return {
    kind: "ok",
    config: {
      supplierId,
      productId,
      warehouseId,
      variationId,
      distributionCompany: distributionCompany ?? undefined,
      typeService: typeService ?? undefined,
      rateType: rateType ?? undefined,
    },
  };
}

export function parseDropiProviderConfig(
  providerApiUrl: string | null | undefined
): DropiProviderParseResult {
  if (!providerApiUrl) return { kind: "not_dropi" };

  const raw = providerApiUrl.trim();
  if (!raw.toLowerCase().startsWith("dropi://")) {
    return { kind: "not_dropi" };
  }

  const configRaw = raw.slice("dropi://".length).trim();
  if (!configRaw) {
    return {
      kind: "invalid",
      reason: "dropi:// config is empty",
    };
  }

  const supplierKeys = ["supplier_id", "supplier", "supplierId"];
  const productKeys = ["product_id", "product", "id"];
  const warehouseKeys = ["warehouse_id", "warehouse", "warehouseId"];
  const variationKeys = ["variation_id", "variation", "variationId"];
  const distributionKeys = [
    "distribution_company",
    "distributionCompany",
    "carrier",
    "transportadora",
  ];
  const typeServiceKeys = ["type_service", "typeService", "service_type"];
  const rateTypeKeys = ["rate_type", "rateType"];

  if (configRaw.startsWith("{")) {
    try {
      const parsed = JSON.parse(configRaw) as Record<string, unknown>;
      return buildDropiProviderConfig(
        getNumberFromObject(parsed, supplierKeys),
        getNumberFromObject(parsed, productKeys),
        getNumberFromObject(parsed, warehouseKeys),
        getNumberFromObject(parsed, variationKeys),
        getStringFromObject(parsed, distributionKeys),
        getStringFromObject(parsed, typeServiceKeys),
        getStringFromObject(parsed, rateTypeKeys)
      );
    } catch {
      return {
        kind: "invalid",
        reason:
          "dropi:// JSON config is not valid. Example: dropi://{\"supplier_id\":1,\"product_id\":2,\"warehouse_id\":3}",
      };
    }
  }

  const queryLike = configRaw.startsWith("?") ? configRaw.slice(1) : configRaw;
  const params = new URLSearchParams(queryLike);

  return buildDropiProviderConfig(
    getNumberFromParams(params, supplierKeys),
    getNumberFromParams(params, productKeys),
    getNumberFromParams(params, warehouseKeys),
    getNumberFromParams(params, variationKeys),
    getStringFromParams(params, distributionKeys),
    getStringFromParams(params, typeServiceKeys),
    getStringFromParams(params, rateTypeKeys)
  );
}

function normalizeApiBaseUrl(url: string | null): string {
  if (!url) return DEFAULT_DROPI_API_BASE_URL;
  return url.replace(/\/+$/, "");
}

function getDropiIntegrationToken(): string | null {
  return (
    cleanString(process.env.DROPI_INTEGRATION_TOKEN) ??
    cleanString(process.env.DROPI_INTEGRATIONS_TOKEN) ??
    cleanString(process.env.DROPI_TOKEN_INTEGRATIONS) ??
    cleanString(process.env.DROPI_INTEGRACION_KEY)
  );
}

function buildDropiAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "dropi-integracion-key": token,
    "dropi-integration-key": token,
  };
}

function getDropiRuntimeConfig(): DropiRuntimeConfig | null {
  const integrationToken = getDropiIntegrationToken();
  const email = cleanString(process.env.DROPI_EMAIL);
  const password = cleanString(process.env.DROPI_PASSWORD);
  const hasLoginCredentials = Boolean(email && password);
  if (!integrationToken && !hasLoginCredentials) return null;

  const whiteBrandId =
    cleanString(process.env.DROPI_WHITE_BRAND_ID) ?? DEFAULT_DROPI_WHITE_BRAND_ID;

  return {
    apiBaseUrl: normalizeApiBaseUrl(cleanString(process.env.DROPI_API_BASE_URL)),
    email,
    password,
    integrationToken,
    whiteBrandId,
    userId: toPositiveInteger(process.env.DROPI_USER_ID),
    defaultCountry:
      cleanString(process.env.DROPI_COUNTRY) ?? DEFAULT_DROPI_COUNTRY,
    defaultRateType:
      cleanString(process.env.DROPI_RATE_TYPE) ?? DEFAULT_DROPI_RATE_TYPE,
    defaultTypeService:
      cleanString(process.env.DROPI_TYPE_SERVICE) ?? DEFAULT_DROPI_TYPE_SERVICE,
  };
}

export function isDropiConfigured(): boolean {
  return getDropiRuntimeConfig() !== null;
}

async function parseJsonSafe(response: Response): Promise<JsonRecord | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed as JsonRecord;
    }
    return { raw: text };
  } catch {
    return { raw: text };
  }
}

function getApiErrorMessage(payload: JsonRecord | null): string | null {
  if (!payload) return null;

  const message = cleanString(payload.message);
  if (message) return message;

  const error = cleanString(payload.error);
  if (error) return error;

  const raw = cleanString(payload.raw);
  if (raw) return raw;

  return null;
}

async function requestDropiToken(config: DropiRuntimeConfig): Promise<string> {
  if (config.integrationToken) {
    return config.integrationToken;
  }

  if (!config.email || !config.password) {
    throw new Error(
      "Dropi auth is not configured. Set DROPI_INTEGRATION_TOKEN or DROPI_EMAIL and DROPI_PASSWORD."
    );
  }

  const loginUrl = `${config.apiBaseUrl}/integrations/login`;
  const formBody = new URLSearchParams({
    email: config.email,
    password: config.password,
    white_brand_id: config.whiteBrandId,
  });

  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  const payload = await parseJsonSafe(response);
  const token = cleanString(payload?.token);
  const isSuccess = payload?.isSuccess === true || typeof token === "string";

  if (!response.ok || !isSuccess || !token) {
    const apiMessage =
      getApiErrorMessage(payload) || `${response.status} ${response.statusText}`;
    throw new Error(`Dropi login failed: ${apiMessage}`);
  }

  return token;
}

async function requestDropiUserId(
  config: DropiRuntimeConfig,
  token: string
): Promise<number> {
  if (config.userId !== null) {
    return config.userId;
  }

  const whoAmIUrl = `${config.apiBaseUrl}/integrations/whoiam`;
  const response = await fetch(whoAmIUrl, {
    method: "POST",
    headers: {
      ...buildDropiAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const payload = await parseJsonSafe(response);
  const userId = toPositiveInteger(payload?.id);

  if (!response.ok || userId === null) {
    const apiMessage =
      getApiErrorMessage(payload) || `${response.status} ${response.statusText}`;
    throw new Error(
      `Dropi whoiam failed: ${apiMessage}. Configure DROPI_USER_ID as fallback.`
    );
  }

  return userId;
}

function splitCustomerName(fullName: string): { name: string; surname: string } {
  const normalized = cleanString(fullName) ?? "Cliente Vortixy";
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { name: "Cliente", surname: "Vortixy" };
  }

  const name = parts.shift() ?? "Cliente";
  const surname = parts.join(" ") || "Vortixy";
  return { name, surname };
}

function normalizePhone(phone: string): string {
  const digits = String(phone || "").replace(/\D+/g, "");
  if (!digits) return "3000000000";
  return digits.slice(0, 15);
}

function buildDropiProducts(items: DropiOrderGroupItem[]): Record<string, unknown>[] {
  const merged = new Map<
    string,
    { id: number; product_id: number; quantity: number; variation_id?: number }
  >();

  for (const { orderItem, config } of items) {
    const quantity = Math.max(1, Math.floor(Number(orderItem.quantity) || 1));
    const variationKey = config.variationId ?? "no-variation";
    const mergeKey = `${config.productId}:${variationKey}`;
    const existing = merged.get(mergeKey);

    if (existing) {
      existing.quantity += quantity;
      merged.set(mergeKey, existing);
      continue;
    }

    const payload: {
      id: number;
      product_id: number;
      quantity: number;
      variation_id?: number;
    } = {
      id: config.productId,
      product_id: config.productId,
      quantity,
    };

    if (typeof config.variationId === "number") {
      payload.variation_id = config.variationId;
    }

    merged.set(mergeKey, payload);
  }

  return Array.from(merged.values());
}

function buildDropiOrderPayload(
  config: DropiRuntimeConfig,
  input: DropiOrderRequestInput,
  userId: number
): JsonRecord {
  if (!input.items.length) {
    throw new Error("Dropi order payload needs at least one item");
  }

  const firstConfig = input.items[0].config;
  const { name, surname } = splitCustomerName(input.order.customer_name);
  const typeService = firstConfig.typeService ?? config.defaultTypeService;
  const rateType = firstConfig.rateType ?? config.defaultRateType;

  const payload: JsonRecord = {
    name,
    surname,
    dir: input.order.shipping_address,
    country: config.defaultCountry,
    state: input.order.shipping_department,
    city: input.order.shipping_city,
    phone: normalizePhone(input.order.customer_phone),
    client_email: input.order.customer_email,
    dni: input.order.customer_document,
    zip_code: input.order.shipping_zip ?? undefined,
    user_id: userId,
    supplier_id: firstConfig.supplierId,
    type: "FINAL_ORDER",
    rate_type: rateType,
    products: buildDropiProducts(input.items),
    type_service: typeService,
    warehouses_selected_id: firstConfig.warehouseId,
    notes: `Vortixy order ${input.order.id}`,
    total_order: Math.max(0, Number(input.order.total) || 0),
    shipping_amount: Math.max(0, Number(input.order.shipping_cost) || 0),
  };
  return payload;
}

export function buildDropiGroupKey(config: DropiProviderProductConfig): string {
  return [
    config.supplierId,
    config.warehouseId,
    (config.typeService || "").toUpperCase(),
    (config.rateType || "").toUpperCase(),
  ].join(":");
}

const STOCK_TOTAL_KEYS = [
  "total_stock",
  "stock_total",
  "totalStock",
  "totalQuantity",
  "existencia_total",
  "existencia",
  "stock",
];

const STOCK_VALUE_KEYS = [
  "stock",
  "existencia",
  "quantity",
  "qty",
  "available",
  "available_stock",
  "stock_available",
  "total_stock",
];

const STOCK_VARIATION_ID_KEYS = [
  "variation_id",
  "variationId",
  "id_variation",
  "id_variant",
  "variant_id",
];

const STOCK_VARIATION_LABEL_KEYS = [
  "variation_name",
  "variation",
  "name",
  "color",
  "option_name",
];

function toNonNegativeInteger(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  return rounded >= 0 ? rounded : null;
}

function getNonNegativeIntegerFromObject(
  source: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const parsed = toNonNegativeInteger(source[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function walkJsonObjects(
  value: unknown,
  visitor: (node: Record<string, unknown>) => void
): void {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      walkJsonObjects(item, visitor);
    }
    return;
  }

  if (typeof value === "object") {
    const node = value as Record<string, unknown>;
    visitor(node);

    for (const child of Object.values(node)) {
      walkJsonObjects(child, visitor);
    }
  }
}

function extractStockRows(payload: JsonRecord): DropiStockByVariation[] {
  const merged = new Map<string, DropiStockByVariation>();

  walkJsonObjects(payload, (node) => {
    const quantity = getNonNegativeIntegerFromObject(node, STOCK_VALUE_KEYS);
    if (quantity === null) return;

    const variationId = getNumberFromObject(node, STOCK_VARIATION_ID_KEYS);
    const label = getStringFromObject(node, STOCK_VARIATION_LABEL_KEYS);
    if (variationId === null && !label) return;

    const mapKey = `${variationId ?? "na"}:${(label || "na").toLowerCase()}`;
    const existing = merged.get(mapKey);
    if (existing) {
      existing.quantity += quantity;
      merged.set(mapKey, existing);
      return;
    }

    merged.set(mapKey, {
      variationId,
      label: label ?? null,
      quantity,
    });
  });

  return Array.from(merged.values()).sort((a, b) => b.quantity - a.quantity);
}

function extractTotalStock(
  payload: JsonRecord,
  stockRows: DropiStockByVariation[]
): number | null {
  const totalFromRoot = getNonNegativeIntegerFromObject(payload, STOCK_TOTAL_KEYS);
  if (totalFromRoot !== null) return totalFromRoot;

  if (stockRows.length) {
    return stockRows.reduce((sum, row) => sum + row.quantity, 0);
  }

  return null;
}

async function requestDropiStockEndpoint(
  runtimeConfig: DropiRuntimeConfig,
  token: string,
  path: string,
  body: Record<string, unknown>
): Promise<{ response: Response; payload: JsonRecord | null }> {
  const url = `${runtimeConfig.apiBaseUrl}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...buildDropiAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await parseJsonSafe(response);
  return { response, payload };
}

export async function fetchDropiStockSnapshot(
  config: DropiProviderProductConfig
): Promise<DropiStockSnapshot> {
  const runtimeConfig = getDropiRuntimeConfig();
  if (!runtimeConfig) {
    throw new Error(
      "Dropi is not configured. Set DROPI_INTEGRATION_TOKEN or DROPI_EMAIL and DROPI_PASSWORD in environment."
    );
  }

  const token = await requestDropiToken(runtimeConfig);
  const attempts = [
    {
      endpoint: "/api/products/get_total_stock",
      body: {
        id_product: config.productId,
        supplier_id: config.supplierId,
        warehouse_id: config.warehouseId,
      },
    },
    {
      endpoint: "/api/products/get_total_stock",
      body: {
        product_id: config.productId,
        supplier_id: config.supplierId,
        warehouse_id: config.warehouseId,
      },
    },
    {
      endpoint: "/api/products/get_total_stock",
      body: {
        id: config.productId,
        supplier_id: config.supplierId,
        warehouse_id: config.warehouseId,
      },
    },
  ];

  let lastError = "No stock response received from Dropi";

  for (const attempt of attempts) {
    const { response, payload } = await requestDropiStockEndpoint(
      runtimeConfig,
      token,
      attempt.endpoint,
      attempt.body
    );

    if (!response.ok) {
      lastError =
        getApiErrorMessage(payload) || `${response.status} ${response.statusText}`;
      continue;
    }

    if (!payload) {
      lastError = "Dropi stock response is empty";
      continue;
    }

    const isSuccess = payload.isSuccess !== false;
    if (!isSuccess) {
      lastError = getApiErrorMessage(payload) || "Dropi stock request failed";
      continue;
    }

    const stockRows = extractStockRows(payload);
    const totalStock = extractTotalStock(payload, stockRows);
    if (totalStock === null && stockRows.length === 0) {
      lastError = "Could not parse stock payload from Dropi";
      continue;
    }

    return {
      totalStock,
      byVariation: stockRows,
      sourceEndpoint: attempt.endpoint,
      fetchedAt: new Date().toISOString(),
    };
  }

  throw new Error(`Dropi stock fetch failed: ${lastError}`);
}

export async function createDropiOrder(
  input: DropiOrderRequestInput
): Promise<{ payload: JsonRecord; response: JsonRecord | null }> {
  const runtimeConfig = getDropiRuntimeConfig();
  if (!runtimeConfig) {
    throw new Error(
      "Dropi is not configured. Set DROPI_INTEGRATION_TOKEN or DROPI_EMAIL and DROPI_PASSWORD in environment."
    );
  }

  const token = await requestDropiToken(runtimeConfig);
  const userId = await requestDropiUserId(runtimeConfig, token);
  const payload = buildDropiOrderPayload(runtimeConfig, input, userId);

  const createOrderUrl = `${runtimeConfig.apiBaseUrl}/api/orders/myorders`;
  const response = await fetch(createOrderUrl, {
    method: "POST",
    headers: {
      ...buildDropiAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const parsed = await parseJsonSafe(response);
  const isSuccess = parsed?.isSuccess !== false;

  if (!response.ok || !isSuccess) {
    const apiMessage =
      getApiErrorMessage(parsed) || `${response.status} ${response.statusText}`;
    throw new Error(`Dropi order creation failed: ${apiMessage}`);
  }

  return {
    payload,
    response: parsed,
  };
}
