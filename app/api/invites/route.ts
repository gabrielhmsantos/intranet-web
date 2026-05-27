import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  generateInviteToken,
  inviteExpiresAt,
} from "@/lib/invites";

const bodySchema = z.object({
  employeeId: z.string().uuid(),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    !["tenant_admin", "hr"].includes(membership.role as string)
  ) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, tenant_id, work_email, user_id, status")
    .eq("id", body.employeeId)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (employeeError || !employee) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  if (employee.status === "inactive") {
    return NextResponse.json(
      { error: "Colaborador desactivado." },
      { status: 409 },
    );
  }

  if (employee.user_id) {
    return NextResponse.json(
      { error: "Colaborador já tem conta." },
      { status: 409 },
    );
  }

  if (!employee.work_email?.trim()) {
    return NextResponse.json(
      { error: "Colaborador sem e-mail de trabalho." },
      { status: 400 },
    );
  }

  await admin
    .from("invite_tokens")
    .update({ status: "revoked" })
    .eq("employee_id", employee.id)
    .eq("tenant_id", membership.tenant_id)
    .eq("status", "pending");

  const { raw, hash } = generateInviteToken();
  const expiresAt = inviteExpiresAt();

  const { error: insertError } = await admin.from("invite_tokens").insert({
    tenant_id: membership.tenant_id,
    kind: "employee",
    employee_id: employee.id,
    bootstrap_email: null,
    token_hash: hash,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    created_by_user_id: user.id,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Não foi possível gerar o convite." },
      { status: 500 },
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return NextResponse.json(
    {
      inviteUrl: `${origin}/convite/${raw}`,
      expiresAt: expiresAt.toISOString(),
    },
    { status: 201 },
  );
}
