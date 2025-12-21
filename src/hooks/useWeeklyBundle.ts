import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyBundleData {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  special_price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
}

export const useWeeklyBundle = () => {
  // Fetch weekly bundle
  const { data: weeklyBundle, isLoading: isLoadingBundle } = useQuery({
    queryKey: ["weekly-bundle"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("weekly_bundle")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gt("ends_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyBundleData | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Check if a product is the weekly bundle
  const isWeeklyBundleProduct = (productId: string): boolean => {
    if (!weeklyBundle) return false;
    return weeklyBundle.product_id === productId;
  };

  // Get the special price for weekly bundle
  const getWeeklyBundleSpecialPrice = (): number | null => {
    if (!weeklyBundle) return null;
    return weeklyBundle.special_price;
  };

  return {
    weeklyBundle,
    isLoadingBundle,
    isWeeklyBundleProduct,
    getWeeklyBundleSpecialPrice,
  };
};
