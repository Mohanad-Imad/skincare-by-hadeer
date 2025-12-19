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

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card 
        className="relative overflow-hidden cursor-pointer group"
        onClick={onNavigate}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 via-primary/5 to-destructive/10 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-destructive/20" />
        
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-lg border-2 border-primary/30 group-hover:border-primary/50 transition-colors" />
        
        {/* Fire decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-destructive/30 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/30 to-transparent rounded-tr-full" />

        <div className="relative flex flex-col sm:flex-row items-center gap-4 p-4 md:p-5">
          {/* Product Image with glow */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110" />
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-background/80 backdrop-blur-sm border border-primary/20 shadow-lg">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name_ar}
                className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            {/* Discount badge */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg"
            >
              -{savingsPercentage}%
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className="h-5 w-5 text-destructive" />
              </motion.div>
              <span className="text-sm font-bold text-destructive">{weeklyProduct.title_ar}</span>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className="h-5 w-5 text-destructive" />
              </motion.div>
            </div>
            
            <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-1 mb-2">
              {product.name_ar}
            </h3>
            
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
              <span className="text-2xl md:text-3xl font-black text-primary">
                {weeklyProduct.special_price.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {originalPrice.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">{currency}</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
              <ShoppingCart className="h-3 w-3" />
              <span>عند الشراء بـ {weeklyProduct.minimum_cart_amount.toLocaleString()} {currency}+</span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span>ينتهي خلال</span>
            </div>
            <div className="flex gap-2" dir="ltr">
              {[
                { value: timeLeft.days, label: "يوم" },
                { value: timeLeft.hours, label: "ساعة" },
                { value: timeLeft.minutes, label: "دقيقة" },
              ].map((item, index) => (
                <motion.div 
                  key={index} 
                  className="text-center"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-lg md:text-xl font-black shadow-lg">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden lg:block"
          >
            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl transition-shadow font-bold">
              <ShoppingCart className="h-5 w-5" />
              تسوق الآن
            </Button>
          </motion.div>
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
