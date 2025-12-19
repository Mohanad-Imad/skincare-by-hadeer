import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart, Flame, ZoomIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const WeeklyProductCard = ({
  weeklyProduct,
  product,
  currency,
  onNavigate,
}: WeeklyProductCardProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Get variant price
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

  const formatCountdown = (t: TimeLeft) => {
    // Keeps UI compact while still being precise
    if (t.days > 0) {
      return `${t.days}d ${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}:${String(t.seconds).padStart(2, "0")}`;
    }
    return `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}:${String(t.seconds).padStart(2, "0")}`;
  };

  // Countdown timer
  useEffect(() => {
    if (!weeklyProduct?.ends_at) return;

    const calculateTimeLeft = () => {
      const difference = new Date(weeklyProduct.ends_at).getTime() - new Date().getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [weeklyProduct?.ends_at]);

  // Get custom image or fallback to product image
  const displayImage = weeklyProduct.image_url || product.image_url || "/placeholder.svg";

  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 260 }}>
      <Card className="relative overflow-hidden cursor-pointer group" onClick={onNavigate}>
        {/* Subtle background (keeps the section premium without taking visual weight) */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/15" />
        <div className="absolute inset-0 rounded-lg border border-border/60" />

        <div className="relative flex items-stretch gap-3 p-3 sm:p-4">
          {/* Image (compact + zoom) */}
          <div className="relative shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl overflow-hidden bg-muted">
              <img
                src={displayImage}
                alt={product.name_ar}
                loading="lazy"
                className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
              />

              {/* Zoom button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-1.5 top-1.5 h-7 w-7 rounded-full bg-background/80 backdrop-blur border border-border/60"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ZoomIn className="h-4 w-4" />
                    <span className="sr-only">تكبير صورة المنتج</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-[92vw] sm:max-w-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogHeader>
                    <DialogTitle className="text-right">{product.name_ar}</DialogTitle>
                  </DialogHeader>
                  <div className="rounded-xl overflow-hidden bg-muted">
                    <img
                      src={displayImage}
                      alt={`صورة ${product.name_ar} بحجم كبير`}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Discount badge */}
              {savingsPercentage > 0 && (
                <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full shadow">
                  -{savingsPercentage}%
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 flex flex-col justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-destructive">
                <Flame className="h-4 w-4" />
                <span className="truncate">{weeklyProduct.title_ar}</span>
              </div>

              <h3 className="mt-1 text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-2">
                {product.name_ar}
              </h3>

              {weeklyProduct.description_ar && (
                <p className="mt-1 hidden md:block text-sm text-muted-foreground line-clamp-1">
                  {weeklyProduct.description_ar}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {/* Price row */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xl sm:text-2xl font-extrabold text-primary">
                  {weeklyProduct.special_price.toLocaleString()} {currency}
                </span>
                {originalPrice > 0 && (
                  <span className="text-sm text-muted-foreground line-through">
                    {originalPrice.toLocaleString()} {currency}
                  </span>
                )}
                {savingsAmount > 0 && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    وفر {savingsAmount.toLocaleString()} {currency}
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>ينتهي خلال</span>
                  <span dir="ltr" className="font-mono text-foreground">
                    {formatCountdown(timeLeft)}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span className="whitespace-nowrap">
                    حد أدنى {weeklyProduct.minimum_cart_amount.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex justify-end">
                <Button size="sm" className="gap-2 font-bold" aria-label="تسوق منتج الأسبوع">
                  <ShoppingCart className="h-4 w-4" />
                  تسوق الآن
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const WeeklyProduct = () => {
  const navigate = useNavigate();

  // Fetch store settings for currency
  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("currency")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const currency = storeSettings?.currency || "د.ع";

  // Fetch all active weekly products
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
    staleTime: 1000 * 60 * 5,
  });

  // Get all product IDs from weekly products
  const productIds = weeklyProducts?.map(wp => wp.product_id).filter(Boolean) || [];

  // Fetch all product details
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["weekly-products-details", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (*)
        `)
        .in("id", productIds);

      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0,
  });

  if (isLoadingWeekly) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!weeklyProducts || weeklyProducts.length === 0) {
    return null;
  }

  // Map products to weekly products
  const weeklyProductsWithDetails = weeklyProducts
    .map(wp => {
      const product = products?.find(p => p.id === wp.product_id);
      return { weeklyProduct: wp, product };
    })
    .filter(item => item.product);

  if (weeklyProductsWithDetails.length === 0) {
    return null;
  }

  // Single product - no carousel
  if (weeklyProductsWithDetails.length === 1) {
    const { weeklyProduct, product } = weeklyProductsWithDetails[0];
    return (
      <motion.div 
        id="weekly-product"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-3 max-w-[1920px] mx-auto"
      >
        <WeeklyProductCard
          weeklyProduct={weeklyProduct}
          product={product}
          currency={currency}
          onNavigate={() => navigate(`/products/${product.id}`)}
        />
      </motion.div>
    );
  }

  // Multiple products - use carousel
  return (
    <motion.div 
      id="weekly-product"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-3 max-w-[1920px] mx-auto"
    >
      <Carousel
        opts={{
          align: "start",
          loop: true,
          direction: "rtl",
        }}
        className="w-full relative"
      >
        <CarouselContent className="-mr-0">
          {weeklyProductsWithDetails.map(({ weeklyProduct, product }) => (
            <CarouselItem key={weeklyProduct.id} className="pr-0">
              <WeeklyProductCard
                weeklyProduct={weeklyProduct}
                product={product}
                currency={currency}
                onNavigate={() => navigate(`/products/${product.id}`)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-2 md:left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground" />
        <CarouselNext className="absolute -right-2 md:right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground" />
      </Carousel>
    </motion.div>
  );
};

export default WeeklyProduct;
