import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductDiscount {
  id: string;
  product_id: string | null;
  discount_percentage: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export const useProductDiscounts = () => {
  return useQuery({
    queryKey: ["active-product-discounts"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("product_discounts")
        .select("*")
        .eq("is_active", true)
        .lte("valid_from", now)
        .or(`valid_until.is.null,valid_until.gte.${now}`);

      if (error) throw error;
      return data as ProductDiscount[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const calculateDiscount = (
  productId: string,
  originalPrice: number,
  discounts: ProductDiscount[] | undefined
) => {
  if (!discounts || discounts.length === 0) return null;

  // البحث عن خصم خاص بالمنتج
  const productDiscount = discounts.find((d) => d.product_id === productId);
  
  // البحث عن خصم عام على جميع المنتجات
  const generalDiscount = discounts.find((d) => d.product_id === null);

  // إذا وجد كلا الخصمين، نختار الأعلى
  let activeDiscount: ProductDiscount | undefined;
  
  if (productDiscount && generalDiscount) {
    // اختيار الخصم الأعلى نسبة
    activeDiscount = productDiscount.discount_percentage >= generalDiscount.discount_percentage 
      ? productDiscount 
      : generalDiscount;
  } else {
    // استخدام الخصم المتوفر
    activeDiscount = productDiscount || generalDiscount;
  }

  if (!activeDiscount) return null;

  const discountAmount = (originalPrice * activeDiscount.discount_percentage) / 100;
  const discountedPrice = originalPrice - discountAmount;

  return {
    percentage: activeDiscount.discount_percentage,
    discountedPrice: Math.max(0, discountedPrice),
  };
};
