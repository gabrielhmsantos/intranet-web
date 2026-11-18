"use client";

import { useTheme } from "next-themes";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeMenuItems() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <DropdownMenuLabel>Tema</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="light" data-testid="theme-light">
          Claro
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark" data-testid="theme-dark">
          Escuro
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system" data-testid="theme-system">
          Sistema
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}
