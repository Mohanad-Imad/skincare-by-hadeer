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

// الواجهات (Interfaces) تبقى كما هي دون تغيير
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
    return product?.product_variants?.length > 0 ? Math.min(...product.product_variants.map((v: any) => v.price)) : 0;
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
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [weeklyProduct?.ends_at]);

  const displayImage = weeklyProduct.image_url || product.image_url || "/placeholder.svg";

  return (
    <Card
      className="relative overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-xl rounded-2xl md:rounded-3xl cursor-pointer group"
      onClick={onNavigate}
    >
      <div className="flex flex-col md:flex-row items-stretch min-h-fit md:min-h-[320px]">
        {/* قسم الصورة: أصغر في الجوال وأكثر وضوحاً */}
        <div className="relative w-full md:w-[35%] aspect-[16/10] md:aspect-square overflow-hidden bg-zinc-50 dark:bg-zinc-900/40">
          <img
            src={displayImage}
            alt={product.name_ar}
            className="w-full h-full object-contain p-4 md:p-8 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3">
            <div className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-sm md:text-base font-black shadow-lg">
              %{savingsPercentage}-
            </div>
          </div>
        </div>

        {/* قسم التفاصيل: مدمج ومرتب */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col justify-between bg-gradient-to-br from-transparent to-primary/5">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                <Flame className="w-3 h-3 fill-current" /> {weeklyProduct.title_ar}
              </span>
            </div>

            <h3 className="text-lg md:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white line-clamp-1 md:line-clamp-2">
              {product.name_ar}
            </h3>

            {/* السعر والعداد في سطر واحد للجوال لتوفير المساحة */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-zinc-100 dark:border-white/5">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-3xl font-black text-primary">
                    {weeklyProduct.special_price.toLocaleString()}
                  </span>
                  <span className="text-[10px] md:text-sm font-bold text-primary">{currency}</span>
                </div>
                <span className="text-[10px] md:text-xs text-zinc-400 line-through">
                  {originalPrice.toLocaleString()} {currency}
                </span>
              </div>

              {/* عداد مدمج */}
              <div className="flex gap-1.5 md:gap-2" dir="ltr">
                {[
                  { v: timeLeft.days, l: "ي" },
                  { v: timeLeft.hours, l: "س" },
                  { v: timeLeft.minutes, l: "د" },
                  { v: timeLeft.seconds, l: "ث" },
                ].map((t, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-zinc-900 dark:bg-white text-white dark:text-black w-7 h-7 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center text-[10px] md:text-sm font-black shadow">
                      {String(t.v).padStart(2, "0")}
                    </div>
                    <span className="text-[7px] md:text-[9px] font-bold mt-0.5 text-zinc-500 uppercase">{t.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-500 font-bold flex-1">
              <ShoppingCart className="w-3.5 h-3.5 text-primary" />
              <span>
                أقل طلب للاستفادة: {weeklyProduct.minimum_cart_amount} {currency}
              </span>
            </div>
            <Button
              size="sm"
              className="w-full sm:w-auto h-10 md:h-12 px-6 md:px-10 rounded-xl text-sm md:text-base font-bold shadow-lg shadow-primary/20"
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
      <div className="w-full px-4 py-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-[200px] md:h-[300px] w-full rounded-2xl md:rounded-3xl" />
      </div>
    );
  }

  const weeklyProductsWithDetails = weeklyProducts
    ?.map((wp) => ({ weeklyProduct: wp, product: products?.find((p) => p.id === wp.product_id) }))
    .filter((item) => item.product);

  if (!weeklyProductsWithDetails || weeklyProductsWithDetails.length === 0) return null;

  return (
    <section id="weekly-product" className="w-full px-4 md:px-8 py-6 md:py-10 max-w-[1400px] mx-auto overflow-hidden">
      {weeklyProductsWithDetails.length === 1 ? (
        <WeeklyProductCard
          weeklyProduct={weeklyProductsWithDetails[0].weeklyProduct}
          product={weeklyProductsWithDetails[0].product}
          currency={currency}
          onNavigate={() => navigate(`/products/${weeklyProductsWithDetails[0].product.id}`)}
        />
      ) : (
        <Carousel opts={{ align: "start", loop: true, direction: "rtl" }} className="w-full">
          <CarouselContent className="-ml-3">
            {weeklyProductsWithDetails.map(({ weeklyProduct, product }) => (
              <CarouselItem key={weeklyProduct.id} className="pl-3">
                <WeeklyProductCard
                  weeklyProduct={weeklyProduct}
                  product={product}
                  currency={currency}
                  onNavigate={() => navigate(`/products/${product.id}`)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex justify-end gap-2 mt-4">
            <CarouselPrevious className="static translate-y-0 h-9 w-9" />
            <CarouselNext className="static translate-y-0 h-9 w-9" />
          </div>
        </Carousel>
      )}
    </section>
  );
};

export default WeeklyProduct;
