import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart, Flame, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { motion } from "framer-motion";

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

const WeeklyProduct = () => {
  const navigate = useNavigate();
  const { localCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["weekly-product-details", weeklyProduct?.product_id],
    queryFn: async () => {
      if (!weeklyProduct?.product_id) return null;
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (*)
        `)
        .eq("id", weeklyProduct.product_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!weeklyProduct?.product_id,
  });

  // Fetch session and cart items
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: authCartItems } = useQuery({
    queryKey: ["cart-items", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product_variants (
            *,
            products (*)
          )
        `)
        .eq("user_id", session.user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  // Calculate cart total
  const calculateCartTotal = () => {
    if (session?.user?.id && authCartItems) {
      return authCartItems.reduce((total, item) => {
        const originalPrice = item.product_variants?.price || 0;
        const productId = item.product_variants?.products?.id;
        const discount = productId ? calculateDiscount(productId, originalPrice, discounts) : null;
        const finalPrice = discount ? discount.discountedPrice : originalPrice;
        return total + (finalPrice * item.quantity);
      }, 0);
    } else {
      // For local cart, we just sum up quantities - actual prices would need variant lookup
      return localCart.reduce((total, item) => {
        return total + item.quantity;
      }, 0) * 10000; // Placeholder - real implementation would need variant prices
    }
  };

  const cartTotal = calculateCartTotal();
  const isEligible = weeklyProduct ? cartTotal >= weeklyProduct.minimum_cart_amount : false;
  const remainingAmount = weeklyProduct ? Math.max(0, weeklyProduct.minimum_cart_amount - cartTotal) : 0;

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

  // Get variant price
  const getOriginalPrice = () => {
    if (weeklyProduct?.variant_id && product?.product_variants) {
      const variant = product.product_variants.find((v: any) => v.id === weeklyProduct.variant_id);
      return variant?.price || 0;
    }
    if (product?.product_variants?.length > 0) {
      return Math.min(...product.product_variants.map((v: any) => v.price));
    }
    return 0;
  };

  const originalPrice = getOriginalPrice();
  const savingsAmount = originalPrice - (weeklyProduct?.special_price || 0);
  const savingsPercentage = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;

  if (isLoadingWeekly) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!weeklyProduct || !product) {
    return null;
  }

  return (
    <motion.div 
      id="weekly-product"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-3 max-w-[1920px] mx-auto"
    >
      <Card 
        className="overflow-hidden bg-gradient-to-r from-primary/5 via-background to-primary/5 border border-primary/20 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Product Image */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name_ar}
              className="w-full h-full object-contain p-2"
            />
            <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{savingsPercentage}%
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-destructive flex-shrink-0" />
              <span className="text-xs font-medium text-destructive">{weeklyProduct.title_ar}</span>
            </div>
            <h3 className="font-bold text-sm md:text-base text-foreground truncate">{product.name_ar}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-primary">
                {weeklyProduct.special_price} {currency}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {originalPrice} {currency}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              عند الشراء بـ {weeklyProduct.minimum_cart_amount} {currency}+
            </p>
          </div>

          {/* Countdown */}
          <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>ينتهي خلال</span>
            </div>
            <div className="flex gap-1" dir="ltr">
              {[
                { value: timeLeft.days, label: "ي" },
                { value: timeLeft.hours, label: "س" },
                { value: timeLeft.minutes, label: "د" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <span className="text-[8px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button size="sm" className="hidden md:flex gap-1 flex-shrink-0">
            <ShoppingCart className="h-4 w-4" />
            تسوق
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default WeeklyProduct;
