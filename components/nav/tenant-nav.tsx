"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { canSeeMenuItem, type MenuItemId, type ProductRole } from "@/lib/roles";

const NAV_ITEMS: { id: MenuItemId; label: string; href: string }[] = [
  { id: "dashboard", label: "Início", href: "/dashboard" },
  { id: "colaboradores", label: "Colaboradores", href: "/colaboradores" },
  { id: "organograma", label: "Organograma", href: "/organograma" },
  { id: "eventos", label: "Eventos", href: "/eventos" },
  { id: "notificacoes", label: "Notificações", href: "/notificacoes" },
  { id: "configuracao", label: "Configuração", href: "/configuracao" },
];

type TenantNavProps = {
  role: ProductRole;
};

export function TenantNav({ role }: TenantNavProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) =>
    canSeeMenuItem(role, item.id),
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={item.href}
                    data-testid={
                      isActive ? "tenant-nav-active" : undefined
                    }
                  >
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
