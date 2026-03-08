import { NextRequest, NextResponse } from "next/server";
import {
  COLOMBIA_DEPARTMENTS,
  estimateColombiaDelivery,
  normalizeDepartment,
  resolveDepartmentFromCity,
  resolveDepartmentFromRegionCode,
} from "@/lib/delivery";

type LocationSource =
  | "query_department"
  | "query_region"
  | "query_city"
  | "vercel_region"
  | "vercel_city"
  | "fallback";

function toCanonicalDepartment(value: string | null | undefined): string | null {
  const normalized = normalizeDepartment(value || "");
  if (!normalized) return null;

  return (
    COLOMBIA_DEPARTMENTS.find(
      (department) => normalizeDepartment(department) === normalized
    ) || null
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const departmentQuery = searchParams.get("department");
  const cityQuery = searchParams.get("city");
  const regionQuery = searchParams.get("region");
  const carrierQuery = searchParams.get("carrier");
  const auto = searchParams.get("auto") === "1";

  const vercelCountryCode = String(request.headers.get("x-vercel-ip-country") || "")
    .trim()
    .toUpperCase();
  const vercelRegionCode = String(
    request.headers.get("x-vercel-ip-country-region") || ""
  ).trim();
  const vercelCity = String(request.headers.get("x-vercel-ip-city") || "").trim();

  let source: LocationSource = "fallback";
  const directDepartment = toCanonicalDepartment(departmentQuery);
  const queryRegionDepartment = toCanonicalDepartment(
    resolveDepartmentFromRegionCode(regionQuery)
  );
  const queryCityDepartment = toCanonicalDepartment(resolveDepartmentFromCity(cityQuery));
  const headerRegionDepartment = toCanonicalDepartment(
    resolveDepartmentFromRegionCode(vercelRegionCode)
  );
  const headerCityDepartment = toCanonicalDepartment(resolveDepartmentFromCity(vercelCity));

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

  const selectedCity = String(cityQuery || vercelCity || "").trim() || null;
  const estimate = estimateColombiaDelivery({
    department: selectedDepartment,
    city: selectedCity,
    preferredCarrierCode: carrierQuery,
  });

  return NextResponse.json({
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
    calculated_at: new Date().toISOString(),
  });
}
