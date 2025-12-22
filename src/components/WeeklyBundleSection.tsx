import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift, Percent } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";

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

const WeeklyBundleSection = () => {
  const navigate = useNavigate();

  // Fetch weekly bundle
  const { data: weeklyBundle } = useQuery({
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

  // Fetch bundle product details
  const { data: bundleProduct } = useQuery({
    queryKey: ["weekly-bundle-product", weeklyBundle?.product_id],
    queryFn: async () => {
      if (!weeklyBundle?.product_id) return null;
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (id, price, size_ar),
          product_images (image_url, display_order)
        `)
        .eq("id", weeklyBundle.product_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!weeklyBundle?.product_id,
  });

  if (!weeklyBundle || !bundleProduct) return null;

  // Get original price from variant
  const selectedVariant = weeklyBundle.variant_id 
    ? bundleProduct.product_variants?.find((v: any) => v.id === weeklyBundle.variant_id)
    : bundleProduct.product_variants?.[0];
  
  const originalPrice = selectedVariant?.price || 0;
  const specialPrice = weeklyBundle.special_price;
  const savings = originalPrice - specialPrice;
  const discountPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  // Get product image
  const sortedImages = bundleProduct.product_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
  const productImage = sortedImages[0]?.image_url || bundleProduct.image_url;

  return (
    <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-6 md:py-8 xl:py-10 max-w-[1920px] mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
        <Gift className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        مجموعة الأسبوع
      </h2>
      
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 rounded-2xl border border-primary/20 overflow-hidden shadow-lg">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-[4/3] rounded-xl overflow-hidden bg-card">
            <img
              src={productImage}
              alt={weeklyBundle.title_ar}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => navigate(`/products/${bundleProduct.id}`)}
            />
            {discountPercentage > 0 && (
              <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
                <Percent className="h-4 w-4" />
                خصم {discountPercentage}%
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                {weeklyBundle.title_ar}
              </h3>
              {weeklyBundle.description_ar && (
                <p className="text-muted-foreground text-sm md:text-base">
                  {weeklyBundle.description_ar}
                </p>
              )}
            </div>

            {/* Countdown Timer */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">ينتهي العرض خلال:</span>
              <CountdownTimer endDate={weeklyBundle.ends_at} />
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  {specialPrice.toLocaleString()} د.ع
                </span>
                <span className="text-lg md:text-xl text-muted-foreground line-through">
                  {originalPrice.toLocaleString()} د.ع
                </span>
              </div>
              {savings > 0 && (
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium w-fit">
                  وفّر {savings.toLocaleString()} د.ع
                </div>
              )}
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full md:w-auto"
              onClick={() => navigate(`/products/${bundleProduct.id}`)}
            >
              <Gift className="h-5 w-5 ml-2" />
              اطلب الآن
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeeklyBundleSection;
