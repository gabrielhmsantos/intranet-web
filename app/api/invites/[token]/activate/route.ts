import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { INTRANET_DISPLAY_NAME_KEY } from "@/lib/profile/display-name";
import { validatePassword } from "@/lib/password-policy";
import {
  findInviteByRawToken,
  isInviteTokenValid,
} from "@/lib/invite-repository";

const bodySchema = z.object({
  password: z.string(),
  passwordConfirm: z.string(),
});

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Pedido inválido." },
      { status: 400 },
    );
  }

  if (body.password !== body.passwordConfirm) {
    return NextResponse.json(
      { error: "As palavras-passe não coincidem." },
      { status: 400 },
    );
  }

  const policy = validatePassword(body.password);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.message }, { status: 400 });
  }

  const invite = await findInviteByRawToken(token);
  if (!isInviteTokenValid(invite)) {
    return NextResponse.json({ valid: false });
  }

  const admin = createAdminClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, work_email, user_id, display_name")
    .eq("id", invite!.employee_id)
    .maybeSingle();

  if (employeeError || !employee?.work_email || employee.user_id) {
    return NextResponse.json({ valid: false });
  }

  const email = employee.work_email.trim();

  const cadastroName = employee.display_name?.trim() ?? "";

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: cadastroName
        ? { [INTRANET_DISPLAY_NAME_KEY]: cadastroName }
        : undefined,
    });

  if (createError || !created.user) {
    return NextResponse.json({ valid: false });
  }

  const userId = created.user.id;

  const { error: membershipError } = await admin.from("tenant_memberships").insert({
    tenant_id: invite!.tenant_id,
    user_id: userId,
    role: "employee",
  });

  if (membershipError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ valid: false });
  }

  const { error: employeeUpdateError } = await admin
    .from("employees")
    .update({ user_id: userId })
    .eq("id", employee.id)
    .is("user_id", null);

  if (employeeUpdateError) {
    return NextResponse.json({ valid: false });
  }

  const { data: consumed, error: consumeError } = await admin
    .from("invite_tokens")
    .update({
      status: "consumed",
      consumed_at: new Date().toISOString(),
    })
    .eq("id", invite!.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (consumeError || !consumed) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ success: true });
}
