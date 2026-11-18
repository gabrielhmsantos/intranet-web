"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeMenuItems } from "@/components/shell/theme-menu";
import { signOut } from "@/app/actions/auth";
import { clearDevSession } from "@/app/actions/dev-session";
import { useRouter } from "next/navigation";

type UserMenuProps = {
  useSupabaseAuth?: boolean;
  displayName?: string;
  initials?: string;
};

export function UserMenu({
  useSupabaseAuth = false,
  displayName = "Utilizador",
  initials = "U",
}: UserMenuProps) {
  const router = useRouter();

  async function handleDevLogout() {
    await clearDevSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Menu do utilizador"
          data-testid="user-menu-trigger"
        >
          <Avatar className="size-8">
            <AvatarFallback data-testid="user-menu-initials">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/perfil">
            <span className="flex flex-col gap-0.5">
              <span>{displayName}</span>
              <span className="text-xs text-muted-foreground">Perfil</span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        {useSupabaseAuth ? (
          <DropdownMenuItem asChild>
            <form action={signOut} className="w-full">
              <button type="submit" className="w-full text-left">
                Terminar sessão
              </button>
            </form>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={handleDevLogout}>
            Terminar sessão
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
