import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  INTRANET_DISPLAY_NAME_KEY,
  resolveEmployeeListDisplayName,
} from "@/lib/profile/display-name";
import type { EmployeeListItem } from "@/lib/employees/types";

export async function enrichEmployeeListDisplayNames(
  items: EmployeeListItem[],
): Promise<EmployeeListItem[]> {
  const withAccount = items.filter((item) => item.hasAccount === true);
  if (withAccount.length === 0) {
    return items;
  }

  const admin = createAdminClient();
  const employeeIds = withAccount.map((item) => item.id);

  const { data: employeeRows, error } = await admin
    .from("employees")
    .select("id, user_id")
    .in("id", employeeIds);

  if (error) {
    return items;
  }

  const userIdByEmployeeId = new Map<string, string>();
  for (const row of employeeRows ?? []) {
    if (row.user_id) {
      userIdByEmployeeId.set(row.id as string, row.user_id as string);
    }
  }

  const metadataByEmployeeId = new Map<string, string | null>();

  await Promise.all(
    withAccount.map(async (item) => {
      const userId = userIdByEmployeeId.get(item.id);
      if (!userId) {
        metadataByEmployeeId.set(item.id, null);
        return;
      }

      const { data: userData, error: userError } =
        await admin.auth.admin.getUserById(userId);

      if (userError || !userData.user) {
        metadataByEmployeeId.set(item.id, null);
        return;
      }

      const meta = userData.user.user_metadata?.[INTRANET_DISPLAY_NAME_KEY];
      metadataByEmployeeId.set(
        item.id,
        typeof meta === "string" ? meta : null,
      );
    }),
  );

  return items.map((item) => {
    if (!item.hasAccount) {
      return item;
    }
    const meta = metadataByEmployeeId.get(item.id) ?? null;
    return {
      ...item,
      displayName: resolveEmployeeListDisplayName(
        true,
        meta,
        item.displayName,
      ),
    };
  });
}
