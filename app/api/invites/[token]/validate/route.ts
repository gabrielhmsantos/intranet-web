import { NextResponse } from "next/server";
import { validateInviteForDisplay } from "@/lib/invite-repository";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`invite-validate:${ip}`)) {
    return NextResponse.json({ valid: false });
  }

  const { token } = await context.params;

  try {
    const result = await validateInviteForDisplay(token);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false });
  }
}
