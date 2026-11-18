import { NextResponse } from "next/server";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  try {
    await assertTenantAccess(tenantId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    throw error;
  }
}
