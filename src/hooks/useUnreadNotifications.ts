import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
