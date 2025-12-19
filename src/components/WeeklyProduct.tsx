import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart, Flame, Tag, ChevronRight, ChevronLeft } from "lucide-react";
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
    <div>
      <H1>منتج الاسبوع</H1>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }} className="w-full">
        <Card
          className="relative overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2rem] cursor-pointer group"
          onClick={onNavigate}
        >
          <div className="flex flex-col lg:flex-row items-stretch min-h-[400px]">
            {/* قسم الصورة - تم تحسينه للوضوح العالي */}
            <div className="relative w-full lg:w-[45%] aspect-square lg:aspect-auto overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
              <img
                src={displayImage}
                alt={product.name_ar}
                className="w-full h-full object-contain p-8 lg:p-12 group-hover:scale-110 transition-transform duration-700 ease-in-out"
              />

              {/* شارة الخصم الطائرة */}
              <div className="absolute top-6 right-6">
                <div className="bg-red-600 text-white px-5 py-2 rounded-2xl text-xl font-black shadow-xl flex items-center gap-1 animate-pulse">
                  <Tag className="w-5 h-5" />%{savingsPercentage}-
                </div>
              </div>

              {/* شارة العنوان للجوال */}
              <div className="absolute bottom-6 left-6 lg:hidden">
                <div className="bg-orange-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                  <Flame className="w-4 h-4 fill-current" />
                  {weeklyProduct.title_ar}
                </div>
              </div>
            </div>

            {/* قسم التفاصيل */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-between bg-gradient-to-br from-transparent to-primary/5">
              <div>
                <div className="hidden lg:flex items-center gap-3 mb-6">
                  <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Flame className="w-4 h-4 fill-current" />
                    {weeklyProduct.title_ar}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-zinc-300" />
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">عرض حصري</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4 leading-[1.2]">
                  {product.name_ar}
                </h3>

                {weeklyProduct.description_ar && (
                  <p className="text-muted-foreground text-base md:text-lg mb-8 line-clamp-2 font-medium leading-relaxed">
                    {weeklyProduct.description_ar}
                  </p>
                )}

                {/* عرض السعر المطور */}
                <div className="flex flex-wrap items-center gap-6 mb-8 bg-zinc-50 dark:bg-white/5 p-6 rounded-[1.5rem] border border-zinc-100 dark:border-white/10">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase">السعر الجديد</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-primary tracking-tighter">
                        {weeklyProduct.special_price.toLocaleString()}
                      </span>
                      <span className="text-xl font-bold text-primary">{currency}</span>
                    </div>
                  </div>

                  <div className="h-12 w-[1px] bg-zinc-200 dark:bg-white/10 hidden sm:block" />

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase">بدلاً من</p>
                    <span className="text-2xl text-zinc-400 line-through decoration-red-500/50 decoration-2">
                      {originalPrice.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* شريط المعلومات والعداد */}
                <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between border-t border-zinc-100 dark:border-white/10 pt-8">
                  {/* العداد الزمني */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">ينتهي خلال:</span>
                    </div>
                    <div className="flex gap-3" dir="ltr">
                      {[
                        { v: timeLeft.days, l: "يوم" },
                        { v: timeLeft.hours, l: "ساعة" },
                        { v: timeLeft.minutes, l: "دقيقة" },
                        { v: timeLeft.seconds, l: "ثانية" },
                      ].map((t, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="bg-zinc-900 dark:bg-white text-white dark:text-black w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                            {String(t.v).padStart(2, "0")}
                          </div>
                          <span className="text-[10px] font-bold mt-2 text-muted-foreground uppercase">{t.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* زر الشراء والمعلومات */}
                  <div className="flex flex-col gap-4 w-full xl:w-auto min-w-[280px]">
                    <div className="flex items-center gap-3 bg-primary/10 text-primary p-3 rounded-xl border border-primary/20">
                      <ShoppingCart className="w-5 h-5" />
                      <span className="text-xs font-bold leading-none">
                        عند تسوقك بـ {weeklyProduct.minimum_cart_amount} {currency}
                      </span>
                    </div>
                    <Button
                      size="lg"
                      className="h-16 rounded-2xl text-xl font-black gap-3 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.02]"
                    >
                      تسوق العرض الآن
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
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
      <div className="w-full px-6 py-12 max-w-[1400px] mx-auto">
        <Skeleton className="h-[500px] w-full rounded-[3rem]" />
      </div>
    );
  }

  const weeklyProductsWithDetails = weeklyProducts
    ?.map((wp) => ({ weeklyProduct: wp, product: products?.find((p) => p.id === wp.product_id) }))
    .filter((item) => item.product);

  if (!weeklyProductsWithDetails || weeklyProductsWithDetails.length === 0) return null;

  return (
    <section id="weekly-product" className="w-full px-4 md:px-8 py-12 max-w-[1600px] mx-auto overflow-hidden">
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
          <div className="flex justify-center gap-4 mt-8">
            <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 hover:bg-primary hover:text-white transition-all" />
            <CarouselNext className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 hover:bg-primary hover:text-white transition-all" />
          </div>
        </Carousel>
      )}
    </section>
  );
};

export default WeeklyProduct;
