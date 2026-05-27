import { NextResponse } from "next/server";
import {
  DeleteBootstrapError,
  deleteBootstrapInvite,
} from "@/lib/platform/delete-bootstrap";
import {
  isPlatformAdminResponse,
  requirePlatformAdmin,
} from "@/lib/platform/require-platform-admin";

type RouteContext = {
  params: Promise<{ inviteId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (isPlatformAdminResponse(auth)) {
    return auth;
  }

  const { inviteId } = await context.params;

  try {
    await deleteBootstrapInvite(inviteId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof DeleteBootstrapError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Não foi possível excluir o convite." },
      { status: 500 },
    );
  }
}
