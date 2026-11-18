"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { countUnread } from "@/lib/notifications/queries";

const POLL_MS = 5 * 60 * 1000;

export function useNotificationBadge(timeZone: string) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const enabled = isSupabaseConfigured();

  const refresh = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const count = await countUnread(supabase, timeZone);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [enabled, timeZone]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    void refreshRef.current();
  }, [pathname, enabled, timeZone]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      void refreshRef.current();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled]);

  return { unreadCount, loading, refresh, enabled };
}
