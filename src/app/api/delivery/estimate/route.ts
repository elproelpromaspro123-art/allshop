import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import {
  COLOMBIA_DEPARTMENTS,
  estimateColombiaDelivery,
  normalizeDepartment,
  resolveDepartmentFromCity,
  resolveDepartmentFromRegionCode,
} from "@/lib/delivery";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";

type LocationSource =
  | "query_department"
  | "query_region"
  | "query_city"
  | "vercel_region"
  | "vercel_city"
  | "fallback";

function decodeLocationValue(value: string | null | undefined): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalizePluses = raw.replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalizePluses).trim();
  } catch {
    return normalizePluses.trim();
  }
}

function toCanonicalDepartment(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeDepartment(decodeLocationValue(value));
  if (!normalized) return null;

  return (
    COLOMBIA_DEPARTMENTS.find(
      (department) => normalizeDepartment(department) === normalized,
  ) || null
  );
}

function getEstimateCacheHeaders(auto: boolean): Headers {
  return new Headers({
    "Cache-Control": auto
      ? "public, s-maxage=180, stale-while-revalidate=600"
      : "public, s-maxage=300, stale-while-revalidate=900",
    Vary: "X-Vercel-IP-Country, X-Vercel-IP-Country-Region, X-Vercel-IP-City",
  });
}

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `delivery:${clientIp}`,
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return apiError("Demasiadas solicitudes. Intenta de nuevo en un momento.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: noStoreHeaders({
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    });
  }

  const { searchParams } = new URL(request.url);

  const departmentQuery = decodeLocationValue(searchParams.get("department"));
  const cityQuery = decodeLocationValue(searchParams.get("city"));
  const regionQuery = decodeLocationValue(searchParams.get("region"));
  const carrierQuery = decodeLocationValue(searchParams.get("carrier"));
  const auto = searchParams.get("auto") === "1";

  const vercelCountryCode = String(
    request.headers.get("x-vercel-ip-country") || "",
  )
    .trim()
    .toUpperCase();
  const vercelRegionCode = String(
    request.headers.get("x-vercel-ip-country-region") || "",
  ).trim();
  const vercelCity = decodeLocationValue(
    String(request.headers.get("x-vercel-ip-city") || "").trim(),
  );

  let source: LocationSource = "fallback";
  const directDepartment = toCanonicalDepartment(departmentQuery);
  const queryRegionDepartment = toCanonicalDepartment(
    resolveDepartmentFromRegionCode(regionQuery),
  );
  const queryCityDepartment = toCanonicalDepartment(
    resolveDepartmentFromCity(cityQuery),
  );
  const headerRegionDepartment = toCanonicalDepartment(
    resolveDepartmentFromRegionCode(vercelRegionCode),
  );
  const headerCityDepartment = toCanonicalDepartment(
    resolveDepartmentFromCity(vercelCity),
  );

  let selectedDepartment: string;

  if (directDepartment) {
    selectedDepartment = directDepartment;
    source = "query_department";
  } else if (queryRegionDepartment) {
    selectedDepartment = queryRegionDepartment;
    source = "query_region";
  } else if (queryCityDepartment) {
    selectedDepartment = queryCityDepartment;
    source = "query_city";
  } else if (auto && headerRegionDepartment) {
    selectedDepartment = headerRegionDepartment;
    source = "vercel_region";
  } else if (auto && headerCityDepartment) {
    selectedDepartment = headerCityDepartment;
    source = "vercel_city";
  } else {
    selectedDepartment = "Bogota D.C.";
    source = "fallback";
  }

  const selectedCity =
    decodeLocationValue(cityQuery || vercelCity || "") || null;
  const estimate = estimateColombiaDelivery({
    department: selectedDepartment,
    city: selectedCity,
    preferredCarrierCode: carrierQuery,
  });

  return apiOkFields(
    {
      estimate,
      location: {
        source,
        country_code: vercelCountryCode || null,
        region_code: regionQuery || vercelRegionCode || null,
        city: selectedCity,
        department: estimate.department,
        inferred_from_headers:
          auto && (source === "vercel_region" || source === "vercel_city"),
      },
      meta: {
        availableDepartmentsCount: COLOMBIA_DEPARTMENTS.length,
        requestedCarrier: carrierQuery || null,
        availableCarrierCount: estimate.availableCarriers.length,
      },
      calculated_at: new Date().toISOString(),
    },
    { headers: getEstimateCacheHeaders(auto) },
  );
}
