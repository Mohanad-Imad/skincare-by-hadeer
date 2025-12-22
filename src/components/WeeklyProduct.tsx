import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Flame, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import CountdownTimer from "@/components/CountdownTimer";

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
  image_url: string | null;
}

interface WeeklyProductCardProps {
  weeklyProduct: WeeklyProductData;
  product: any;
  currency: string;
  onNavigate: () => void;
}

const WeeklyProductCard = ({ weeklyProduct, product, currency, onNavigate }: WeeklyProductCardProps) => {
  const getOriginalPrice = () => {
    if (weeklyProduct?.variant_id && product?.product_variants) {
      const variant = product.product_variants.find((v: any) => v.id === weeklyProduct.variant_id);
      return variant?.price || 0;
    }
    return product?.product_variants?.length > 0 ? Math.min(...product.product_variants.map((v: any) => v.price)) : 0;
  };

  const originalPrice = getOriginalPrice();
  const savingsAmount = originalPrice - (weeklyProduct?.special_price || 0);
  const savingsPercentage = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;
  const displayImage = weeklyProduct.image_url || product.image_url || "/placeholder.svg";

  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 rounded-2xl border border-primary/20 overflow-hidden shadow-lg">
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
        {/* Product Image */}
        <div className="relative aspect-square md:aspect-[4/3] rounded-xl overflow-hidden bg-card cursor-pointer" onClick={onNavigate}>
          <img
            src={displayImage}
            alt={product.name_ar}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          {savingsPercentage > 0 && (
            <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
              <Percent className="h-4 w-4" />
              خصم {savingsPercentage}%
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-center space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> {weeklyProduct.title_ar}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 line-clamp-2">
              {product.name_ar}
            </h3>
            {weeklyProduct.description_ar && (
              <p className="text-muted-foreground text-sm md:text-base line-clamp-2">
                {weeklyProduct.description_ar}
              </p>
            )}
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">ينتهي العرض خلال:</span>
            <CountdownTimer endDate={weeklyProduct.ends_at} />
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                {weeklyProduct.special_price.toLocaleString()} {currency}
              </span>
              <span className="text-lg md:text-xl text-muted-foreground line-through">
                {originalPrice.toLocaleString()} {currency}
              </span>
            </div>
            {savingsAmount > 0 && (
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium w-fit">
                وفّر {savingsAmount.toLocaleString()} {currency}
              </div>
            )}
          </div>

          {/* Minimum Cart Amount */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 px-3 py-2 rounded-lg w-fit">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span>أقل طلب للاستفادة: {weeklyProduct.minimum_cart_amount.toLocaleString()} {currency}</span>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={onNavigate}
          >
            <ShoppingCart className="h-5 w-5 ml-2" />
            تسوق الآن
          </Button>
        </div>
      </div>
    </div>
  );
};

const WeeklyProduct = () => {
  const navigate = useNavigate();

  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("currency").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const currency = storeSettings?.currency || "د.ع";

  const { data: weeklyProducts, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ["weekly-products-all"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("weekly_product")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gt("ends_at", now)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WeeklyProductData[];
    },
  });

  const productIds = weeklyProducts?.map((wp) => wp.product_id).filter(Boolean) || [];

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["weekly-products-details", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase.from("products").select("*, product_variants (*)").in("id", productIds);
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0,
  });

  if (isLoadingWeekly || isLoadingProducts) {
    return (
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-6 md:py-8 xl:py-10 max-w-[1920px] mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          <Flame className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          منتج الأسبوع
        </h2>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </section>
    );
  }

  const weeklyProductsWithDetails = weeklyProducts
    ?.map((wp) => ({ weeklyProduct: wp, product: products?.find((p) => p.id === wp.product_id) }))
    .filter((item) => item.product);

  if (!weeklyProductsWithDetails || weeklyProductsWithDetails.length === 0) return null;

  return (
    <section id="weekly-product" className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-6 md:py-8 xl:py-10 max-w-[1920px] mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
        <Flame className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        منتج الأسبوع
      </h2>
      
      {weeklyProductsWithDetails.length === 1 ? (
        <WeeklyProductCard
          weeklyProduct={weeklyProductsWithDetails[0].weeklyProduct}
          product={weeklyProductsWithDetails[0].product}
          currency={currency}
          onNavigate={() => navigate(`/products/${weeklyProductsWithDetails[0].product.id}`)}
        />
      ) : (
        <Carousel opts={{ align: "start", loop: true, direction: "rtl" }} className="w-full">
          <CarouselContent className="-ml-4">
            {weeklyProductsWithDetails.map(({ weeklyProduct, product }) => (
              <CarouselItem key={weeklyProduct.id} className="pl-4">
                <WeeklyProductCard
                  weeklyProduct={weeklyProduct}
                  product={product}
                  currency={currency}
                  onNavigate={() => navigate(`/products/${product.id}`)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex justify-center gap-2 mt-4">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      )}
    </section>
  );
};

export default WeeklyProduct;
