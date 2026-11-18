"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TenantNav } from "@/components/nav/tenant-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { DevRoleSwitcher } from "@/components/dev/dev-role-switcher";
import type { ProductRole } from "@/lib/roles";

type TenantShellProps = {
  tenantName: string;
  role: ProductRole;
  displayName?: string;
  timeZone?: string;
  useSupabaseAuth?: boolean;
  children: React.ReactNode;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function TenantShell({
  tenantName,
  role,
  displayName = "Utilizador",
  timeZone = "Europe/Lisbon",
  useSupabaseAuth = false,
  children,
}: TenantShellProps) {
  return (
    <SidebarProvider data-testid="tenant-shell">
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <span className="truncate text-sm font-semibold">{tenantName}</span>
        </SidebarHeader>
        <SidebarContent>
          <TenantNav role={role} />
        </SidebarContent>
        <SidebarFooter className="p-2">
          <p className="px-2 text-xs text-muted-foreground">Intranet</p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between gap-4">
            <span className="truncate text-sm font-medium">{tenantName}</span>
            <div className="flex items-center gap-2">
              {process.env.NODE_ENV === "development" ? (
                <DevRoleSwitcher currentRole={role} />
              ) : null}
              <NotificationBell timeZone={timeZone} />
              <UserMenu
                useSupabaseAuth={useSupabaseAuth}
                displayName={displayName}
                initials={initialsFromName(displayName)}
              />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
