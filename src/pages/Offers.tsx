import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart, Flame, Gift, Percent, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocalCart } from "@/hooks/useLocalCart";
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

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Offers = () => {
  const navigate = useNavigate();
  const { localCart } = useLocalCart();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [bundleTimeLeft, setBundleTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  // Fetch weekly bundle
  const { data: weeklyBundle, isLoading: isLoadingBundle } = useQuery({
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

  // Fetch product details for weekly product
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

  // Fetch bundle product details
  const { data: bundleProduct, isLoading: isLoadingBundleProduct } = useQuery({
    queryKey: ["weekly-bundle-details", weeklyBundle?.product_id],
    queryFn: async () => {
      if (!weeklyBundle?.product_id) return null;
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (*)
        `)
        .eq("id", weeklyBundle.product_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!weeklyBundle?.product_id,
  });

  // Fetch session and cart items
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ["cart-items-for-weekly", session?.user?.id],
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

  // Countdown timer for weekly product
  useEffect(() => {
    if (!weeklyProduct?.ends_at) return;

    const calculateTimeLeft = () => {
      const endDate = new Date(weeklyProduct.ends_at).getTime();
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [weeklyProduct?.ends_at]);

  // Countdown timer for weekly bundle
  useEffect(() => {
    if (!weeklyBundle?.ends_at) return;

    const calculateBundleTimeLeft = () => {
      const endDate = new Date(weeklyBundle.ends_at).getTime();
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference > 0) {
        setBundleTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateBundleTimeLeft();
    const timer = setInterval(calculateBundleTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [weeklyBundle?.ends_at]);

  // Calculate cart total for eligibility
  const calculateCartTotal = () => {
    if (session?.user?.id && cartItems.length > 0) {
      return cartItems.reduce((total: number, item: any) => {
        const price = item.product_variants?.price || 0;
        return total + (price * item.quantity);
      }, 0);
    }
    
    // For local cart, we don't have price info here, so return 0
    // Users need to log in to see eligibility
    return 0;
  };

  const cartTotal = calculateCartTotal();
  const isEligible = weeklyProduct ? cartTotal >= weeklyProduct.minimum_cart_amount : false;
  const remainingAmount = weeklyProduct ? Math.max(0, weeklyProduct.minimum_cart_amount - cartTotal) : 0;

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

  // Bundle pricing calculations
  const getBundleOriginalPrice = () => {
    if (weeklyBundle?.variant_id && bundleProduct?.product_variants) {
      const variant = bundleProduct.product_variants.find((v: any) => v.id === weeklyBundle.variant_id);
      return variant?.price || 0;
    }
    if (bundleProduct?.product_variants?.length > 0) {
      return Math.min(...bundleProduct.product_variants.map((v: any) => v.price));
    }
    return 0;
  };

  const bundleOriginalPrice = getBundleOriginalPrice();
  const bundleSavingsAmount = bundleOriginalPrice - (weeklyBundle?.special_price || 0);
  const bundleSavingsPercentage = bundleOriginalPrice > 0 ? Math.round((bundleSavingsAmount / bundleOriginalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <SEO
        title="الخصومات والعروض - أفضل العروض الحصرية"
        description="اكتشف أفضل العروض والخصومات الحصرية على منتجات العناية بالبشرة"
        keywords="خصومات، عروض، تخفيضات، منتجات العناية بالبشرة"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Percent className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">الخصومات والعروض</h1>
          </div>
          <p className="text-muted-foreground">اكتشف أفضل العروض الحصرية والخصومات المميزة</p>
        </div>

        {/* Weekly Product Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            منتج الأسبوع
          </h2>

          {isLoadingWeekly ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : !weeklyProduct || !product ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">لا يوجد عرض أسبوعي حالياً</p>
            </Card>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
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
                      <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                        <Gift className="h-7 w-7" />
                        {weeklyProduct.title_ar}
                      </h3>
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
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
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
                          <h4 
                            className="text-2xl font-bold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            {product.name_ar}
                          </h4>
                          {product.company_name_ar && (
                            <p className="text-muted-foreground">{product.company_name_ar}</p>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                          <div className="flex flex-wrap items-baseline gap-3 mb-2">
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

                        {/* Max quantity note */}
                        <p className="text-sm text-muted-foreground">
                          الحد الأقصى: {weeklyProduct.max_quantity_per_customer} قطعة للعميل
                        </p>

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
          )}
        </section>

        {/* Weekly Bundle Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            مجموعة الأسبوع
          </h2>

          {isLoadingBundle ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : !weeklyBundle || !bundleProduct ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">لا يوجد عرض مجموعة حالياً</p>
            </Card>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="overflow-hidden bg-gradient-to-br from-accent/30 via-background to-primary/10 border-2 border-accent/50 shadow-xl">
                <div className="relative">
                  {/* Header badge */}
                  <div className="absolute -top-1 right-4 z-10">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-b-xl shadow-lg flex items-center gap-2"
                    >
                      <Package className="h-5 w-5" />
                      <span className="font-bold text-sm">عرض حصري</span>
                    </motion.div>
                  </div>

                  <div className="p-6 md:p-8 pt-10 md:pt-12">
                    {/* Title */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                        <Package className="h-7 w-7" />
                        {weeklyBundle.title_ar}
                      </h3>
                      {weeklyBundle.description_ar && (
                        <p className="text-muted-foreground">{weeklyBundle.description_ar}</p>
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
                            { value: bundleTimeLeft.days, label: "يوم" },
                            { value: bundleTimeLeft.hours, label: "ساعة" },
                            { value: bundleTimeLeft.minutes, label: "دقيقة" },
                            { value: bundleTimeLeft.seconds, label: "ثانية" },
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
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
                      {/* Product Image */}
                      <div 
                        className="relative aspect-square rounded-2xl overflow-hidden bg-card shadow-lg cursor-pointer group"
                        onClick={() => navigate(`/products/${bundleProduct.id}`)}
                      >
                        <img
                          src={bundleProduct.image_url || "/placeholder.svg"}
                          alt={bundleProduct.name_ar}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {bundleSavingsPercentage > 0 && (
                          <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                            خصم {bundleSavingsPercentage}%
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-4">
                        <div>
                          <h4 
                            className="text-2xl font-bold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/products/${bundleProduct.id}`)}
                          >
                            {bundleProduct.name_ar}
                          </h4>
                          {bundleProduct.company_name_ar && (
                            <p className="text-muted-foreground">{bundleProduct.company_name_ar}</p>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                          <div className="flex flex-wrap items-baseline gap-3 mb-2">
                            <span className="text-3xl font-bold text-primary">
                              {weeklyBundle.special_price.toLocaleString()} {currency}
                            </span>
                            {bundleOriginalPrice > weeklyBundle.special_price && (
                              <span className="text-lg text-muted-foreground line-through">
                                {bundleOriginalPrice.toLocaleString()} {currency}
                              </span>
                            )}
                          </div>
                          {bundleSavingsAmount > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                توفير {bundleSavingsAmount.toLocaleString()} {currency}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                قيمة الخصم: {bundleSavingsPercentage}%
                              </p>
                            </div>
                          )}
                        </div>

                        {/* No minimum requirement notice */}
                        <div className="rounded-xl p-4 border-2 bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <ShoppingCart className="h-5 w-5" />
                            <span className="font-semibold">بدون حد أدنى للسلة!</span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                            يمكنك الحصول على هذا العرض مباشرة
                          </p>
                        </div>

                        {/* CTA Button */}
                        <Button
                          size="lg"
                          className="w-full text-lg py-6 shadow-lg"
                          onClick={() => navigate(`/products/${bundleProduct.id}`)}
                        >
                          <ShoppingCart className="h-5 w-5 ml-2" />
                          عرض المجموعة
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Offers;
