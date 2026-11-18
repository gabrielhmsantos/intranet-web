import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getGatewayRedirect } from "@/lib/redirects";

export default async function GatewayPage() {
  const session = await getServerSession();
  redirect(getGatewayRedirect(session));
}
