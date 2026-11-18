import { NextResponse } from "next/server";
import {
  isPlatformAdminResponse,
  requirePlatformAdmin,
} from "@/lib/platform/require-platform-admin";
import {
  RenewBootstrapError,
  renewBootstrapInvite,
} from "@/lib/platform/renew-bootstrap";

type RouteContext = {
  params: Promise<{ inviteId: string }>;
};

function requestOrigin(request: Request): string {
  return (
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (isPlatformAdminResponse(auth)) {
    return auth;
  }

  const { inviteId } = await context.params;

  try {
    const result = await renewBootstrapInvite(
      inviteId,
      auth.session.userId,
      requestOrigin(request),
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RenewBootstrapError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Não foi possível renovar o convite." },
      { status: 500 },
    );
  }
}
