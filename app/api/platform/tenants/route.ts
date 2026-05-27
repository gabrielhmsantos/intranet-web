import { NextResponse } from "next/server";
import { z } from "zod";
import {
  EmailAlreadyRegisteredError,
  ProvisionValidationError,
  provisionTenant,
} from "@/lib/platform/provision-tenant";
import {
  isPlatformAdminResponse,
  requirePlatformAdmin,
} from "@/lib/platform/require-platform-admin";

const bodySchema = z.object({
  companyName: z.string(),
  adminEmail: z.string(),
});

function requestOrigin(request: Request): string {
  return (
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export async function POST(request: Request) {
  const auth = await requirePlatformAdmin();
  if (isPlatformAdminResponse(auth)) {
    return auth;
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const result = await provisionTenant(
      {
        companyName: body.companyName,
        adminEmail: body.adminEmail,
        createdByUserId: auth.session.userId,
      },
      requestOrigin(request),
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ProvisionValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof EmailAlreadyRegisteredError) {
      return NextResponse.json(
        {
          error:
            "Este e-mail já está registado. Consulte Convites expirados para renovar ou excluir o convite anterior.",
          code: "EMAIL_ALREADY_REGISTERED",
          manageUrl: "/plataforma/convites-expirados",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível criar a empresa." },
      { status: 500 },
    );
  }
}
