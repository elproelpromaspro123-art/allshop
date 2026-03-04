import { NextRequest, NextResponse } from "next/server";
import {
  COLOMBIA_DEPARTMENTS,
  estimateColombiaDelivery,
  normalizeDepartment,
} from "@/lib/delivery";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const departmentQuery = searchParams.get("department") || "Bogota D.C.";
  const carrierQuery = searchParams.get("carrier");

  const department =
    COLOMBIA_DEPARTMENTS.find(
      (item) => normalizeDepartment(item) === normalizeDepartment(departmentQuery)
    ) || "Bogota D.C.";

  const estimate = estimateColombiaDelivery({
    department,
    preferredCarrierCode: carrierQuery,
  });

  return NextResponse.json({
    estimate,
    calculated_at: new Date().toISOString(),
  });
}
