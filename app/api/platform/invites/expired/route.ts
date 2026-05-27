import { NextResponse } from "next/server";
import { fetchExpiredBootstrapInvites } from "@/lib/platform/expired-invites";
import {
  isPlatformAdminResponse,
  requirePlatformAdmin,
} from "@/lib/platform/require-platform-admin";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (isPlatformAdminResponse(auth)) {
    return auth;
  }

  try {
    const invites = await fetchExpiredBootstrapInvites();
    return NextResponse.json({ invites });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar os convites." },
      { status: 500 },
    );
  }
}
