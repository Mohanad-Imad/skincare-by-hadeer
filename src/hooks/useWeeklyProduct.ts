import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";

interface WeeklyProductData {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  special_price: number;
  minimum_cart_amount: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  max_quantity_per_customer: number;
}

export const useWeeklyProduct = () => {
  const { localCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();

  // Fetch weekly product
  const { data: weeklyProduct, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ["weekly-product"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("weekly_product")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gt("ends_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyProductData | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Check if a variant is the weekly product variant
  const isWeeklyProductVariant = (variantId: string): boolean => {
    if (!weeklyProduct) return false;
    return weeklyProduct.variant_id === variantId;
  };

  // Check if a product is the weekly product
  const isWeeklyProductById = (productId: string): boolean => {
    if (!weeklyProduct) return false;
    return weeklyProduct.product_id === productId;
  };

  // Get the special price for weekly product
  const getWeeklyProductSpecialPrice = (): number | null => {
    if (!weeklyProduct) return null;
    return weeklyProduct.special_price;
  };

  // Calculate if user is eligible based on cart total
  const calculateEligibility = (cartTotal: number): boolean => {
    if (!weeklyProduct) return false;
    return cartTotal >= weeklyProduct.minimum_cart_amount;
  };

  // Get the price for an item considering weekly product discount
  const getWeeklyAdjustedPrice = (
    productId: string,
    variantId: string,
    originalPrice: number,
    cartTotal: number
  ): { price: number; isWeeklyDeal: boolean; originalPrice: number } => {
    // Check if this is the weekly product variant
    if (weeklyProduct && 
        weeklyProduct.product_id === productId && 
        (weeklyProduct.variant_id === variantId || !weeklyProduct.variant_id)) {
      
      // Check eligibility
      const isEligible = cartTotal >= weeklyProduct.minimum_cart_amount;
      
      if (isEligible) {
        return {
          price: weeklyProduct.special_price,
          isWeeklyDeal: true,
          originalPrice: originalPrice
        };
      }
    }
    
    return {
      price: originalPrice,
      isWeeklyDeal: false,
      originalPrice: originalPrice
    };
  };

  return {
    weeklyProduct,
    isLoadingWeekly,
    isWeeklyProductVariant,
    isWeeklyProductById,
    getWeeklyProductSpecialPrice,
    calculateEligibility,
    getWeeklyAdjustedPrice,
  };
};
