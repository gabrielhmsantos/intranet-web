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
};

export function UserMenu({ useSupabaseAuth = false }: UserMenuProps) {
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
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/perfil">Perfil</Link>
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
