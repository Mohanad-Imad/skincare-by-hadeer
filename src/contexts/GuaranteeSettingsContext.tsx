import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GuaranteeSettings {
  id: string;
  logo_url: string | null;
  page_title_ar: string;
  page_title_en: string;
  page_description_ar: string;
  page_description_en: string;
  page_subtitle_ar: string | null;
  page_subtitle_en: string | null;
  banner_title_ar: string | null;
  banner_title_en: string | null;
  banner_description_ar: string | null;
  banner_description_en: string | null;
  banner_button_text_ar: string | null;
  banner_button_text_en: string | null;
  contact_title_ar: string | null;
  contact_title_en: string | null;
  contact_description_ar: string | null;
  contact_description_en: string | null;
  terms_ar: string | null;
  terms_en: string | null;
  features: any | null;
  is_active: boolean;
}

interface GuaranteeSettingsContextType {
  settings: GuaranteeSettings | null;
  isLoading: boolean;
}

const GuaranteeSettingsContext = createContext<GuaranteeSettingsContextType | undefined>(undefined);

export const GuaranteeSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["guarantee-settings-global"],
    queryFn: async () => {
      const { data } = await supabase
        .from("guarantee_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      return data as GuaranteeSettings | null;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  return (
    <GuaranteeSettingsContext.Provider value={{ settings: settings || null, isLoading }}>
      {children}
    </GuaranteeSettingsContext.Provider>
  );
};

export const useGuaranteeSettings = () => {
  const context = useContext(GuaranteeSettingsContext);
  if (context === undefined) {
    throw new Error("useGuaranteeSettings must be used within a GuaranteeSettingsProvider");
  }
  return context;
};
