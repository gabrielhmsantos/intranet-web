import { NextResponse } from "next/server";
import {
  isPlatformAdminResponse,
  requirePlatformAdmin,
} from "@/lib/platform/require-platform-admin";
import { fetchTenantSummaries } from "@/lib/platform/tenant-summary";

/** FR-013a: no search/filter/export query params on dashboard aggregation. */
export async function GET() {
  const auth = await requirePlatformAdmin();
  if (isPlatformAdminResponse(auth)) {
    return auth;
  }

  try {
    const data = await fetchTenantSummaries();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar o resumo." },
      { status: 500 },
    );
  }
}
