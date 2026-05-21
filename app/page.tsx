import { redirect } from "next/navigation";
import { getDevSession } from "@/lib/dev-session";
import { getGatewayRedirect } from "@/lib/redirects";

export default async function GatewayPage() {
  const session = await getDevSession();
  redirect(getGatewayRedirect(session));
}
