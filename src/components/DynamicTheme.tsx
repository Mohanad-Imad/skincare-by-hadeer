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
      
      // Apply light mode colors
      if (settings.light_background) root.style.setProperty('--light-background', settings.light_background);
      if (settings.light_foreground) root.style.setProperty('--light-foreground', settings.light_foreground);
      if (settings.light_card) root.style.setProperty('--light-card', settings.light_card);
      if (settings.light_primary) root.style.setProperty('--light-primary', settings.light_primary);
      if (settings.light_secondary) root.style.setProperty('--light-secondary', settings.light_secondary);
      if (settings.light_accent) root.style.setProperty('--light-accent', settings.light_accent);
      if (settings.light_muted) root.style.setProperty('--light-muted', settings.light_muted);
      if (settings.light_border) root.style.setProperty('--light-border', settings.light_border);
      
      // Apply dark mode colors
      if (settings.dark_background) root.style.setProperty('--dark-background', settings.dark_background);
      if (settings.dark_foreground) root.style.setProperty('--dark-foreground', settings.dark_foreground);
      if (settings.dark_card) root.style.setProperty('--dark-card', settings.dark_card);
      if (settings.dark_primary) root.style.setProperty('--dark-primary', settings.dark_primary);
      if (settings.dark_secondary) root.style.setProperty('--dark-secondary', settings.dark_secondary);
      if (settings.dark_accent) root.style.setProperty('--dark-accent', settings.dark_accent);
      if (settings.dark_muted) root.style.setProperty('--dark-muted', settings.dark_muted);
      if (settings.dark_border) root.style.setProperty('--dark-border', settings.dark_border);
    }
  }, [settings]);

  return null;
};
