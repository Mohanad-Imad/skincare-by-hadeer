import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const DynamicTheme = () => {
  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      if (settings.theme_primary_color) {
        root.style.setProperty('--primary', settings.theme_primary_color);
      }
      if (settings.theme_secondary_color) {
        root.style.setProperty('--secondary', settings.theme_secondary_color);
      }
      if (settings.theme_accent_color) {
        root.style.setProperty('--accent', settings.theme_accent_color);
      }
    }
  }, [settings]);

  return null;
};
