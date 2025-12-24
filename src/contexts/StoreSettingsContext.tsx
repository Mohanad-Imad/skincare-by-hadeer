import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StoreSettings {
  id: string;
  store_name: string;
  currency: string;
  logo_url: string | null;
  about_ar: string | null;
  about_en: string | null;
  phone: string | null;
  email: string | null;
  address_ar: string | null;
  address_en: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  whatsapp_url: string | null;
  footer_text_ar: string | null;
  footer_text_en: string | null;
  show_live_activity_feed: boolean | null;
  festive_theme_enabled: boolean | null;
  theme_primary_color: string | null;
  theme_secondary_color: string | null;
  theme_accent_color: string | null;
  light_background: string | null;
  light_foreground: string | null;
  light_card: string | null;
  light_primary: string | null;
  light_secondary: string | null;
  light_accent: string | null;
  light_muted: string | null;
  light_border: string | null;
  dark_background: string | null;
  dark_foreground: string | null;
  dark_card: string | null;
  dark_primary: string | null;
  dark_secondary: string | null;
  dark_accent: string | null;
  dark_muted: string | null;
  dark_border: string | null;
}

interface StoreSettingsContextType {
  settings: StoreSettings | null;
  isLoading: boolean;
  error: Error | null;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["store-settings-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as StoreSettings;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  return (
    <StoreSettingsContext.Provider value={{ settings: settings || null, isLoading, error: error as Error | null }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
  }
  return context;
};
