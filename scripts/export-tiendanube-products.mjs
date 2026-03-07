#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_EXPORT_PATH = "exports/tiendanube-products.csv";
const PAGE_SIZE = 500;

function cleanEnv(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function requireEnv(name) {
    const value = cleanEnv(process.env[name]);
    if (!value) {
        throw new Error(`Falta variable de entorno requerida: ${name}`);
    }
    return value;
}

function normalizeAppUrl(raw) {
    const value = cleanEnv(raw);
    if (!value) return null;

    try {
        const parsed = new URL(value);
        return parsed.origin;
    } catch {
        return null;
    }
}

function toCsvCell(value) {
    const normalized = value == null ? "" : String(value);
    const escaped = normalized.replaceAll('"', '""');
    // En Tiendanube normalmente separan múltiples imágenes o valores por comas, pero al estar entre comillas se toman literal.
    if (/[",\n\r]/.test(escaped)) {
        return `"${escaped}"`;
    }
    return escaped;
}

function rowToCsv(values) {
    return values.map((value) => toCsvCell(value)).join(",");
}

function buildSupabaseHeaders(serviceRoleKey) {
    return {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
    };
}

async function fetchTableRows({
    baseUrl,
    serviceRoleKey,
    table,
    select,
    orderBy = null,
    filters = [],
}) {
    const rows = [];
    let offset = 0;

    for (; ;) {
        const query = new URLSearchParams();
        query.set("select", select);
        query.set("limit", String(PAGE_SIZE));
        query.set("offset", String(offset));

        if (orderBy) {
            query.set("order", orderBy);
        }

        for (const [key, value] of filters) {
            query.set(key, value);
        }

        const endpoint = `${baseUrl}/rest/v1/${table}?${query.toString()}`;
        const response = await fetch(endpoint, {
            headers: buildSupabaseHeaders(serviceRoleKey),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(
                `Error consultando Supabase para ${table}: ${response.status} ${response.statusText} - ${body}`
            );
        }

        const page = await response.json();
        if (!Array.isArray(page)) {
            throw new Error(`Respuesta inesperada en tabla "${table}"`);
        }

        rows.push(...page);

        if (page.length < PAGE_SIZE) {
            break;
        }

        offset += PAGE_SIZE;
    }

    return rows;
}

function resolveImageUrl(image, appUrl) {
    if (!image || typeof image !== "string") return "";
    const trimmed = image.trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    if (!appUrl) return trimmed;
    const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${appUrl}${normalizedPath}`;
}

function normalizeVariants(rawVariants) {
    if (!Array.isArray(rawVariants)) return [];

    return rawVariants
        .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const name = cleanEnv(entry.name);
            const options = Array.isArray(entry.options)
                ? entry.options
                    .map((option) => cleanEnv(option))
                    .filter((option) => Boolean(option))
                : [];

            if (!name || options.length === 0) return null;
            return { name, options };
        })
        .filter((entry) => Boolean(entry));
}

function generateCombinations(variants) {
    if (!variants || variants.length === 0) return [[]];

    const [current, ...rest] = variants;
    const subCombinations = generateCombinations(rest);

    const result = [];
    for (const option of current.options) {
        for (const sub of subCombinations) {
            result.push([{ name: current.name, value: option }, ...sub]);
        }
    }

    return result;
}

function buildHeaders() {
    return [
        "Identificador de URL",
        "Nombre",
        "Categorías",
        "Precio",
        "Precio promocional",
        "Peso (kg)",
        "Alto (cm)",
        "Ancho (cm)",
        "Profundidad (cm)",
        "Stock",
        "SKU",
        "Código de barras",
        "Mostrar en tienda",
        "Envío sin cargo",
        "Descripción",
        "Tags",
        "Título para SEO",
        "Descripción para SEO",
        "Marca",
        "Producto Físico",
        "Nombre de propiedad 1",
        "Valor de propiedad 1",
        "Nombre de propiedad 2",
        "Valor de propiedad 2",
        "Nombre de propiedad 3",
        "Valor de propiedad 3",
        "Imágenes"
    ];
}

function toTiendanubeRows({ product, categoryName, appUrl }) {
    const slug = cleanEnv(product.slug) ?? "";
    const name = cleanEnv(product.name) ?? slug;
    // Tiendanube accepts HTML descriptions, our mock/setup relies on rich descriptions if any
    const description = cleanEnv(product.description) ?? "";
    const seoTitle = cleanEnv(product.meta_title) ?? name;
    const seoDescription = cleanEnv(product.meta_description) ?? "";
    const isShowInStore = Boolean(product.is_active);
    const freeShipping = Boolean(product.free_shipping);
    const providerApiUrl = cleanEnv(product.provider_api_url) ?? "";

    const variants = normalizeVariants(product.variants);
    const images = Array.isArray(product.images)
        ? product.images
            .map((entry) => resolveImageUrl(entry, appUrl))
            .filter((entry) => Boolean(entry))
        : [];

    const compareAtPrice = Number(product.compare_at_price);
    const price = Number(product.price);
    const hasComparePrice = Number.isFinite(compareAtPrice) && compareAtPrice > 0;
    const hasSalePrice =
        hasComparePrice && Number.isFinite(price) && price > 0 && compareAtPrice > price;

    const salePrice = hasSalePrice ? price : "";
    const regularPrice = hasSalePrice ? compareAtPrice : price;

    // Guardaremos la referencia de dropi en los tags para no perderla
    const dropiTag = providerApiUrl ? `dropi_url:${providerApiUrl}` : "";
    const tags = [dropiTag, "importado-de-vortixy"].filter(Boolean).join(", ");

    const combinations = generateCombinations(variants);
    const generatedRows = [];

    // En Tiendanube, si hay variantes, cada combinación es una fila.
    // Si no hay, es al menos 1 fila base.
    const iterations = combinations.length > 0 ? combinations : [[]];

    for (let i = 0; i < iterations.length; i++) {
        const combo = iterations[i];

        // Si es la primera fila de un producto, enviamos las imágenes y la descripción
        // Si son las filas extra para otras variantes, Tiendanube lo entiende dejando esos campos o repitiendo URL Identifier
        const currentRowImages = i === 0 ? images.join(", ") : "";

        const row = [
            slug,                    // Identificador de URL
            name,                    // Nombre
            categoryName ?? "",      // Categorías
            regularPrice,            // Precio
            salePrice,               // Precio promocional
            "",                      // Peso (kg)
            "",                      // Alto (cm)
            "",                      // Ancho (cm)
            "",                      // Profundidad (cm)
            "",                      // Stock (vacío = infinito en ciertos casos o se maneja a mano)
            "",                      // SKU
            "",                      // Código de barras
            isShowInStore ? "SI" : "NO", // Mostrar en tienda
            freeShipping ? "SI" : "NO",  // Envío sin cargo
            description,             // Descripción
            tags,                    // Tags
            seoTitle,                // Título para SEO
            seoDescription,          // Descripción para SEO
            "",                      // Marca
            "SI",                    // Producto Físico
        ];

        // Propiedad 1
        row.push(combo[0]?.name ?? "");
        row.push(combo[0]?.value ?? "");
        // Propiedad 2
        row.push(combo[1]?.name ?? "");
        row.push(combo[1]?.value ?? "");
        // Propiedad 3
        row.push(combo[2]?.name ?? "");
        row.push(combo[2]?.value ?? "");

        row.push(currentRowImages); // Imágenes

        generatedRows.push(row);
    }

    return generatedRows;
}

async function main() {
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const outputPath = cleanEnv(process.env.TIENDANUBE_EXPORT_FILE) ?? DEFAULT_EXPORT_PATH;
    const onlyActive = (cleanEnv(process.env.TIENDANUBE_ONLY_ACTIVE) ?? "true").toLowerCase();
    const appUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);

    const filters = [];
    if (onlyActive !== "false") {
        filters.push(["is_active", "eq.true"]);
    }

    const [products, categories] = await Promise.all([
        fetchTableRows({
            baseUrl: supabaseUrl,
            serviceRoleKey,
            table: "products",
            select:
                "id,name,slug,description,price,compare_at_price,category_id,images,variants,stock_location,free_shipping,provider_api_url,is_featured,is_active,meta_title,meta_description",
            orderBy: "created_at.asc",
            filters,
        }),
        fetchTableRows({
            baseUrl: supabaseUrl,
            serviceRoleKey,
            table: "categories",
            select: "id,name,slug",
            orderBy: "name.asc",
        }),
    ]);

    const categoryById = new Map(
        categories.map((category) => [cleanEnv(category.id), cleanEnv(category.name) ?? ""])
    );

    const headers = buildHeaders();

    const allRows = [];
    let dropiMappedCount = 0;

    for (const product of products) {
        if (product.provider_api_url) dropiMappedCount++;
        const rows = toTiendanubeRows({
            product,
            categoryName: categoryById.get(cleanEnv(product.category_id)) ?? "",
            appUrl
        });
        allRows.push(...rows);
    }

    const csv = [rowToCsv(headers), ...allRows.map((row) => rowToCsv(row))].join("\n");

    const absoluteOutputPath = path.resolve(outputPath);
    await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await fs.writeFile(absoluteOutputPath, csv, "utf8");

    // Opcional: Crear un mapping de referencia Dropi en JSON aparte
    const dropiMappingFile = path.resolve("exports/tiendanube-dropi-mapping.json");
    const mappingJson = products.filter(p => p.provider_api_url).map(p => ({
        slug: p.slug,
        name: p.name,
        dropi_url: p.provider_api_url
    }));
    await fs.writeFile(dropiMappingFile, JSON.stringify(mappingJson, null, 2), "utf8");

    console.log(
        [
            `✅ Archivo CSV creado: ${absoluteOutputPath}`,
            `✅ Archivo JSON de mapeo Dropi creado: ${dropiMappingFile}`,
            `📦 Productos exportados: ${products.length} (Total variaciones filas: ${allRows.length})`,
            `🔗 Productos con enlace Dropi mapeado: ${dropiMappedCount}`,
            appUrl
                ? `🌍 Imágenes relativas convertidas a URLs absolutas usando: ${appUrl}`
                : "⚠️ NEXT_PUBLIC_APP_URL falta en tus variables de entorno. Las URLs de las imágenes se irán relativas si no incluyen http://.",
        ].join("\n")
    );
}

main().catch((error) => {
    console.error("[Export Tiendanube Error]", error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
