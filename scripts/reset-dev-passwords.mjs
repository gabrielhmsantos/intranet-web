/**
 * Repõe a password de desenvolvimento nos utilizadores seed (após E2E de perfil).
 * Uso: node scripts/reset-dev-passwords.mjs (a partir de apps/web, com .env.local)
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEV_PASSWORD = "DevSeedEP0!ChangeMe";

const USER_IDS = [
  "b0000000-0000-4000-8000-000000000010",
  "b0000000-0000-4000-8000-000000000011",
  "b0000000-0000-4000-8000-000000000012",
  "b0000000-0000-4000-8000-000000000013",
];

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const id of USER_IDS) {
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: DEV_PASSWORD,
  });
  if (error) {
    console.error(`Failed ${id}:`, error.message);
    process.exit(1);
  }
  console.log(`OK ${id}`);
}

// EP-6 E2E: convite pendente reutilizável
const EP6_PENDENTE_EMAIL = "pendente@alpha-dev.test";
const EP6_EMPLOYEE_ID = "c0000000-0000-4000-8000-000000000099";
const EP6_INVITE_ID = "f0000000-0000-4000-8000-000000000099";

const { data: userList, error: listError } =
  await admin.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
  console.error("listUsers:", listError.message);
  process.exit(1);
}

const pendingUser = userList.users.find(
  (u) => u.email?.toLowerCase() === EP6_PENDENTE_EMAIL,
);
if (pendingUser) {
  const { error: deleteError } = await admin.auth.admin.deleteUser(
    pendingUser.id,
  );
  if (deleteError) {
    console.error("deleteUser pendente:", deleteError.message);
    process.exit(1);
  }
  console.log(`OK deleted auth ${EP6_PENDENTE_EMAIL}`);
}

const { error: employeeError } = await admin
  .from("employees")
  .update({ user_id: null })
  .eq("id", EP6_EMPLOYEE_ID);
if (employeeError) {
  console.error("employees update:", employeeError.message);
  process.exit(1);
}

const { error: inviteError } = await admin
  .from("invite_tokens")
  .update({ status: "pending" })
  .eq("id", EP6_INVITE_ID);
if (inviteError) {
  console.error("invite_tokens update:", inviteError.message);
  process.exit(1);
}
console.log("OK EP-6 invite reset");
