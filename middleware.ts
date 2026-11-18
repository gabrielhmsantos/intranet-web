import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessPath,
  isPlatformAreaPath,
  isPublicAuthPath,
  isTenantAreaPath,
} from "@/lib/route-access";
import { normalizeDevRole } from "@/lib/dev-session";
import type { ProductRole } from "@/lib/roles";

function isSupabaseConfigured(request: NextRequest): boolean {
  return Boolean(
    request.cookies.getAll().length >= 0 &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured(request)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: ProductRole = "employee";
  let isAuthenticated = Boolean(user);

  if (user) {
    const { data: membership } = await supabase
      .from("tenant_memberships")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.role) {
      role = normalizeDevRole(membership.role as string);
    } else {
      isAuthenticated = false;
    }
  }

  if (isPublicAuthPath(pathname)) {
    if (pathname.startsWith("/login") && isAuthenticated) {
      const dest =
        role === "platform_admin" ? "/plataforma/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return response;
  }

  const requiresAuth =
    isTenantAreaPath(pathname) || isPlatformAreaPath(pathname) || pathname === "/";

  if (requiresAuth && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    loginUrl.searchParams.set("sessao", "expirada");
    return NextResponse.redirect(loginUrl);
  }

  if (!isAuthenticated) {
    return response;
  }

  const access = canAccessPath(role, pathname, true);

  if (access.allowed === false) {
    if (access.reason === "platform_redirect") {
      return NextResponse.redirect(
        new URL("/plataforma/dashboard", request.url),
      );
    }
    if (access.reason === "forbidden") {
      return NextResponse.redirect(new URL("/sem-permissao", request.url));
    }
  }

  if (pathname === "/" && isAuthenticated) {
    const dest =
      role === "platform_admin" ? "/plataforma/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
