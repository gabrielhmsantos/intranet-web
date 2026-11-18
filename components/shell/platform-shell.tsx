import Link from "next/link";
import { DevRoleSwitcher } from "@/components/dev/dev-role-switcher";
import { UserMenu } from "@/components/shell/user-menu";
import type { ProductRole } from "@/lib/roles";

type PlatformShellProps = {
  role: ProductRole;
  useSupabaseAuth?: boolean;
  children: React.ReactNode;
};

export function PlatformShell({
  role,
  useSupabaseAuth = false,
  children,
}: PlatformShellProps) {
  return (
    <div className="flex min-h-full flex-col" data-testid="platform-shell">
      <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            Administração da plataforma
          </span>
          <nav
            aria-label="Navegação da plataforma"
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              href="/plataforma/dashboard"
              className="text-sm font-medium hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/plataforma/tenants/novo"
              className="text-sm font-medium hover:underline"
            >
              Nova empresa
            </Link>
            <Link
              href="/plataforma/convites-expirados"
              className="text-sm font-medium hover:underline"
            >
              Convites expirados
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === "development" ? (
            <DevRoleSwitcher currentRole={role} />
          ) : null}
          <UserMenu useSupabaseAuth={useSupabaseAuth} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
    </div>
  );
}
