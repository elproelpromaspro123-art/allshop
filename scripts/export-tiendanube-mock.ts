import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCTS, CATEGORIES } from "../src/data/mock";

const DEFAULT_EXPORT_PATH = "exports/tiendanube-products.csv";

function cleanEnv(value: any) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function resolveImageUrl(image: string, appUrl: string) {
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

function generateCombinations(variants: any[]) {
    if (!variants || variants.length === 0) return [[]];

    const [current, ...rest] = variants;
    const subCombinations = generateCombinations(rest);

    const result: any[] = [];
    for (const option of current.options) {
        for (const sub of subCombinations) {
            result.push([{ name: current.name, value: option }, ...sub]);
        }
    }

    return result;
}

function toCsvCell(value: any) {
    const normalized = value == null ? "" : String(value);
    const escaped = normalized.replaceAll('"', '""');
    if (/[",\n\r]/.test(escaped)) {
        return `"${escaped}"`;
    }
    return escaped;
}

function rowToCsv(values: any[]) {
    return values.map((value) => toCsvCell(value)).join(",");
}

function buildHeaders() {
    return [
        "Identificador de URL", "Nombre", "Categorías", "Precio", "Precio promocional",
        "Peso (kg)", "Alto (cm)", "Ancho (cm)", "Profundidad (cm)", "Stock", "SKU",
        "Código de barras", "Mostrar en tienda", "Envío sin cargo", "Descripción", "Tags",
        "Título para SEO", "Descripción para SEO", "Marca", "Producto Físico",
        "Nombre de propiedad 1", "Valor de propiedad 1", "Nombre de propiedad 2",
        "Valor de propiedad 2", "Nombre de propiedad 3", "Valor de propiedad 3", "Imágenes"
    ];
}

async function main() {
    const outputPath = process.env.TIENDANUBE_EXPORT_FILE || DEFAULT_EXPORT_PATH;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

    const categoryById = new Map(
        CATEGORIES.map((category) => [category.id, category.name])
    );

    const headers = buildHeaders();
    const allRows: any[] = [];
    let dropiMappedCount = 0;

    for (const product of PRODUCTS) {
        if (product.provider_api_url) dropiMappedCount++;
        const categoryName = categoryById.get(product.category_id) || "";

        const slug = cleanEnv(product.slug) ?? "";
        const name = cleanEnv(product.name) ?? slug;
        const description = cleanEnv(product.description) ?? "";
        const seoTitle = cleanEnv(product.meta_title) ?? name;
        const seoDescription = cleanEnv(product.meta_description) ?? "";
        const isShowInStore = Boolean(product.is_active);
        const freeShipping = Boolean(product.free_shipping);
        const providerApiUrl = cleanEnv(product.provider_api_url) ?? "";

        const variants = product.variants || [];
        const images = Array.isArray(product.images)
            ? product.images.map((entry) => resolveImageUrl(entry, appUrl)).filter(Boolean)
            : [];

        const compareAtPrice = Number(product.compare_at_price);
        const price = Number(product.price);
        const hasComparePrice = Number.isFinite(compareAtPrice) && compareAtPrice > 0;
        const hasSalePrice = hasComparePrice && Number.isFinite(price) && price > 0 && compareAtPrice > price;

        const salePrice = hasSalePrice ? price : "";
        const regularPrice = hasSalePrice ? compareAtPrice : price;

        const dropiTag = providerApiUrl ? `dropi_url:${providerApiUrl}` : "";
        const tags = [dropiTag, "importado-de-vortixy"].filter(Boolean).join(", ");

        const combinations = generateCombinations(variants);
        const iterations = combinations.length > 0 ? combinations : [[]];

        for (let i = 0; i < iterations.length; i++) {
            const combo = iterations[i];
            const currentRowImages = i === 0 ? images.join(", ") : "";

            const row = [
                slug, name, categoryName, regularPrice, salePrice, "", "", "", "", "", "", "",
                isShowInStore ? "SI" : "NO", freeShipping ? "SI" : "NO", description, tags,
                seoTitle, seoDescription, "", "SI",
                combo[0]?.name ?? "", combo[0]?.value ?? "",
                combo[1]?.name ?? "", combo[1]?.value ?? "",
                combo[2]?.name ?? "", combo[2]?.value ?? "",
                currentRowImages
            ];
            allRows.push(row);
        }
    }

    const csv = [rowToCsv(headers), ...allRows.map((row) => rowToCsv(row))].join("\n");
    const absoluteOutputPath = path.resolve(outputPath);
    await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await fs.writeFile(absoluteOutputPath, csv, "utf8");

    console.log(
        [
            `✅ Archivo CSV creado exitosamente desde mock.ts: ${absoluteOutputPath}`,
            `📦 Productos exportados: ${PRODUCTS.length} (Total variaciones: ${allRows.length})`,
            `🔗 Productos listos para importar a Tiendanube.`
        ].join("\n")
    );
}

main().catch((error) => {
    console.error("[Export Error]", error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
