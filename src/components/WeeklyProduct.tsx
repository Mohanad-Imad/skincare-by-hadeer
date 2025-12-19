import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    <motion.div
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card 
        className="relative overflow-hidden cursor-pointer group"
        onClick={onNavigate}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 via-primary/5 to-destructive/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-destructive/20" />
        
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-lg border-2 border-primary/30 group-hover:border-primary/50 transition-colors" />

        <div className="relative flex flex-col md:flex-row items-stretch">
          {/* Large Product Image Section */}
          <div className="relative w-full md:w-2/5 lg:w-1/3 min-h-[200px] md:min-h-[220px] overflow-hidden">
            {/* Image glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-destructive/10" />
            
            <img
              src={displayImage}
              alt={product.name_ar}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/90" />
            
            {/* Discount badge */}
            <motion.div 
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -12 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-lg font-black px-4 py-2 rounded-xl shadow-2xl"
            >
              -{savingsPercentage}%
            </motion.div>

            {/* Title badge on mobile */}
            <div className="absolute bottom-4 right-4 md:hidden flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className="h-4 w-4 text-destructive" />
              </motion.div>
              <span className="text-sm font-bold text-destructive">{weeklyProduct.title_ar}</span>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-5 md:p-6 flex flex-col justify-center gap-4">
            {/* Title badge on desktop */}
            <div className="hidden md:flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className="h-6 w-6 text-destructive" />
              </motion.div>
              <span className="text-lg font-black text-destructive">{weeklyProduct.title_ar}</span>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className="h-6 w-6 text-destructive" />
              </motion.div>
            </div>
            
            {/* Product name */}
            <h3 className="font-black text-xl md:text-2xl text-foreground line-clamp-2">
              {product.name_ar}
            </h3>
            
            {/* Description if available */}
            {weeklyProduct.description_ar && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {weeklyProduct.description_ar}
              </p>
            )}
            
            {/* Price section */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-black text-primary">
                {weeklyProduct.special_price.toLocaleString()}
              </span>
              <span className="text-xl text-muted-foreground line-through">
                {originalPrice.toLocaleString()}
              </span>
              <span className="text-base text-muted-foreground">{currency}</span>
              <span className="bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full">
                وفر {savingsAmount.toLocaleString()} {currency}
              </span>
            </div>
            
            {/* Minimum cart requirement */}
            <div className="inline-flex items-center gap-2 bg-muted/50 text-muted-foreground text-sm font-medium px-4 py-2 rounded-full w-fit">
              <ShoppingCart className="h-4 w-4" />
              <span>عند الشراء بـ {weeklyProduct.minimum_cart_amount.toLocaleString()} {currency} أو أكثر</span>
            </div>

            {/* Bottom row: Timer and CTA */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
              {/* Countdown Timer */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>ينتهي خلال</span>
                </div>
                <div className="flex gap-1.5" dir="ltr">
                  {[
                    { value: timeLeft.days, label: "ي" },
                    { value: timeLeft.hours, label: "س" },
                    { value: timeLeft.minutes, label: "د" },
                    { value: timeLeft.seconds, label: "ث" },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-sm md:text-lg font-black shadow-md">
                        {String(item.value).padStart(2, "0")}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl transition-shadow font-bold text-base px-6">
                  <ShoppingCart className="h-5 w-5" />
                  تسوق الآن
                </Button>
              </motion.div>
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
