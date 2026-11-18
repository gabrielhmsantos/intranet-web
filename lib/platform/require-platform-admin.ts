import "server-only";

import { NextResponse } from "next/server";
import { getServerSession, type ServerSession } from "@/lib/session";

export type PlatformAdminContext = {
  session: ServerSession & { userId: string };
};

export async function requirePlatformAdmin(): Promise<
  PlatformAdminContext | NextResponse
> {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.userId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!session.isPlatformAdmin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  return { session: { ...session, userId: session.userId } };
}

export function isPlatformAdminResponse(
  result: PlatformAdminContext | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
