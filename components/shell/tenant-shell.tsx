"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
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
import { Button } from "@/components/ui/button";
import { TenantNav } from "@/components/nav/tenant-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { DevRoleSwitcher } from "@/components/dev/dev-role-switcher";
import type { ProductRole } from "@/lib/roles";

type TenantShellProps = {
  tenantName: string;
  role: ProductRole;
  children: React.ReactNode;
};

export function TenantShell({ tenantName, role, children }: TenantShellProps) {
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
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notificações"
                asChild
              >
                <Link href="/notificacoes">
                  <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} />
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
