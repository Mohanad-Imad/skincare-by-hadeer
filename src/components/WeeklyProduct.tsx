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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-6"
    >
      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 border-2 border-primary/30 shadow-xl">
        <div className="relative">
          {/* Header with flame animation */}
          <div className="absolute -top-1 right-4 z-10">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded-b-xl shadow-lg flex items-center gap-2"
            >
              <Flame className="h-5 w-5" />
              <span className="font-bold text-sm">عرض حصري</span>
            </motion.div>
          </div>

          <div className="p-6 md:p-8 pt-10 md:pt-12">
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                <Gift className="h-7 w-7" />
                {weeklyProduct.title_ar}
              </h2>
              {weeklyProduct.description_ar && (
                <p className="text-muted-foreground">{weeklyProduct.description_ar}</p>
              )}
            </div>

            {/* Countdown Timer */}
            <div className="flex justify-center mb-6">
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-inner border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2 justify-center">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">ينتهي العرض خلال</span>
                </div>
                <div className="flex gap-3 justify-center" dir="ltr">
                  {[
                    { value: timeLeft.days, label: "يوم" },
                    { value: timeLeft.hours, label: "ساعة" },
                    { value: timeLeft.minutes, label: "دقيقة" },
                    { value: timeLeft.seconds, label: "ثانية" },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <motion.div
                        key={item.value}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="bg-primary text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-md"
                      >
                        {String(item.value).padStart(2, "0")}
                      </motion.div>
                      <span className="text-xs text-muted-foreground mt-1 block">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Display */}
            <div className="grid md:grid-cols-2 gap-6 items-center">
              {/* Product Image */}
              <div 
                className="relative aspect-square rounded-2xl overflow-hidden bg-card shadow-lg cursor-pointer group"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name_ar}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {savingsPercentage > 0 && (
                  <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    خصم {savingsPercentage}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h3 
                    className="text-xl md:text-2xl font-bold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.name_ar}
                  </h3>
                  {product.company_name_ar && (
                    <p className="text-muted-foreground">{product.company_name_ar}</p>
                  )}
                </div>

                {/* Pricing */}
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      {weeklyProduct.special_price.toLocaleString()} {currency}
                    </span>
                    {originalPrice > weeklyProduct.special_price && (
                      <span className="text-lg text-muted-foreground line-through">
                        {originalPrice.toLocaleString()} {currency}
                      </span>
                    )}
                  </div>
                  {savingsAmount > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      توفير {savingsAmount.toLocaleString()} {currency}
                    </p>
                  )}
                </div>

                {/* Eligibility Status */}
                <div className={`rounded-xl p-4 border-2 ${
                  isEligible 
                    ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700" 
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                }`}>
                  {isEligible ? (
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="font-semibold">مؤهل للحصول على العرض!</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-amber-700 dark:text-amber-400 font-medium mb-1">
                        أضف منتجات بقيمة {remainingAmount.toLocaleString()} {currency} للسلة
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-500">
                        الحد الأدنى للسلة: {weeklyProduct.minimum_cart_amount.toLocaleString()} {currency}
                      </p>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  size="lg"
                  className="w-full text-lg py-6 shadow-lg"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <ShoppingCart className="h-5 w-5 ml-2" />
                  {isEligible ? "أضف للسلة بالسعر المخفض" : "عرض المنتج"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default WeeklyProduct;
