import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart, Flame, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface WeeklyProductCardProps {
  weeklyProduct: WeeklyProductData;
  product: any;
  currency: string;
  onNavigate: () => void;
}

const WeeklyProductCard = ({ weeklyProduct, product, currency, onNavigate }: WeeklyProductCardProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const getOriginalPrice = useCallback(() => {
    if (weeklyProduct?.variant_id && product?.product_variants) {
      const variant = product.product_variants.find((v: any) => v.id === weeklyProduct.variant_id);
      return variant?.price || 0;
    }
    if (product?.product_variants?.length > 0) {
      return Math.min(...product.product_variants.map((v: any) => v.price));
    }
    return 0;
  }, [weeklyProduct, product]);

  const originalPrice = getOriginalPrice();
  const savingsAmount = originalPrice - (weeklyProduct?.special_price || 0);
  const savingsPercentage = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;

  useEffect(() => {
    if (!weeklyProduct?.ends_at) return;
    const calculateTimeLeft = () => {
      const difference = new Date(weeklyProduct.ends_at).getTime() - new Date().getTime();
      if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [weeklyProduct?.ends_at]);

  const displayImage = weeklyProduct.image_url || product.image_url || "/placeholder.svg";

  return (
    <Card
      className="relative overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-md rounded-2xl md:rounded-[2rem] cursor-pointer group"
      onClick={onNavigate}
    >
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Image Section: Compact on Mobile */}
        <div className="relative w-full md:w-[38%] aspect-[16/9] md:aspect-square overflow-hidden bg-zinc-50 dark:bg-zinc-900/40">
          <img
            src={displayImage}
            alt={product.name_ar}
            className="w-full h-full object-contain p-4 md:p-10 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 md:top-6 md:right-6">
            <div className="bg-red-600 text-white px-2 py-0.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-lg font-black shadow-lg">
              %{savingsPercentage}-
            </div>
          </div>
        </div>

        {/* Content Section: Optimized Vertical Space */}
        <div className="flex-1 p-4 md:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1 md:mb-3">
            <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[9px] md:text-xs font-black flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              {weeklyProduct.title_ar}
            </span>
          </div>

          <h3 className="text-lg md:text-3xl font-black text-zinc-900 dark:text-white mb-2 md:mb-4 line-clamp-1">
            {product.name_ar}
          </h3>

          {/* Pricing & Timer Row: Flex-row on mobile to save height */}
          <div className="flex flex-row md:flex-col lg:flex-row items-center md:items-start lg:items-center justify-between gap-3 bg-zinc-50 dark:bg-white/5 p-3 md:p-5 rounded-xl mb-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-xl md:text-4xl font-black text-primary">
                  {weeklyProduct.special_price.toLocaleString()}
                </span>
                <span className="text-[10px] md:text-lg font-bold text-primary">{currency}</span>
              </div>
              <span className="text-[9px] md:text-sm text-zinc-400 line-through">
                {originalPrice.toLocaleString()} {currency}
              </span>
            </div>

            {/* Compact Timer */}
            <div className="flex gap-1 md:gap-2" dir="ltr">
              {[
                { v: timeLeft.days, l: "ي" },
                { v: timeLeft.hours, l: "س" },
                { v: timeLeft.minutes, l: "د" },
                { v: timeLeft.seconds, l: "ث" },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="bg-zinc-900 dark:bg-white text-white dark:text-black w-7 h-7 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center text-[10px] md:text-base font-black">
                    {String(t.v).padStart(2, "0")}
                  </div>
                  <span className="text-[7px] md:text-[9px] font-bold mt-0.5 text-muted-foreground uppercase">
                    {t.l}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="hidden sm:flex items-center gap-2 text-primary text-[10px] md:text-xs font-bold">
              <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
              <span>
                عند الشراء بـ {weeklyProduct.minimum_cart_amount} {currency}
              </span>
            </div>
            {/* On mobile, small requirement text above or below button isn't needed if we keep it clean */}
            <Button
              size="sm"
              className="w-full md:w-auto h-9 md:h-12 px-6 md:px-10 rounded-lg md:rounded-xl text-xs md:text-base font-bold shadow-md"
            >
              تسوق الآن
            </Button>
          </div>
        </div>
      </div>
    </Card>
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
      <div className="w-full px-4 py-4 max-w-[1400px] mx-auto">
        <Skeleton className="h-48 md:h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const weeklyProductsWithDetails = weeklyProducts
    ?.map((wp) => ({ weeklyProduct: wp, product: products?.find((p) => p.id === wp.product_id) }))
    .filter((item) => item.product);

  if (!weeklyProductsWithDetails || weeklyProductsWithDetails.length === 0) return null;

  return (
    <section id="weekly-product" className="w-full px-3 md:px-8 py-4 md:py-8 max-w-[1400px] mx-auto overflow-hidden">
      {weeklyProductsWithDetails.length === 1 ? (
        <WeeklyProductCard
          weeklyProduct={weeklyProductsWithDetails[0].weeklyProduct}
          product={weeklyProductsWithDetails[0].product}
          currency={currency}
          onNavigate={() => navigate(`/products/${weeklyProductsWithDetails[0].product.id}`)}
        />
      ) : (
        <Carousel opts={{ align: "start", loop: true, direction: "rtl" }} className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {weeklyProductsWithDetails.map(({ weeklyProduct, product }) => (
              <CarouselItem key={weeklyProduct.id} className="pl-2 md:pl-4">
                <WeeklyProductCard
                  weeklyProduct={weeklyProduct}
                  product={product}
                  currency={currency}
                  onNavigate={() => navigate(`/products/${product.id}`)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex justify-center gap-4 mt-4">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      )}
    </section>
  );
};

export default WeeklyProduct;
