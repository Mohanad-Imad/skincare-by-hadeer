import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

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

const WeeklyProductPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Fetch store settings for currency
  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("currency")
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch weekly product
  const { data: weeklyProduct } = useQuery({
    queryKey: ["weekly-product-popup"],
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
  });

  // Fetch product details
  const { data: product } = useQuery({
    queryKey: ["weekly-product-details-popup", weeklyProduct?.product_id],
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

  // Check if popup was already shown in this session
  useEffect(() => {
    if (weeklyProduct && product) {
      const popupShownKey = `weekly_popup_shown_${weeklyProduct.id}`;
      const wasShown = sessionStorage.getItem(popupShownKey);
      
      if (!wasShown) {
        // Delay showing popup for better UX
        const timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem(popupShownKey, "true");
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [weeklyProduct, product]);

  // Countdown timer
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

  if (!weeklyProduct || !product) return null;

  const variant = weeklyProduct.variant_id
    ? product.product_variants?.find((v: any) => v.id === weeklyProduct.variant_id)
    : product.product_variants?.[0];

  const originalPrice = variant?.price || 0;
  const discountPercentage = Math.round(((originalPrice - weeklyProduct.special_price) / originalPrice) * 100);
  const currency = storeSettings?.currency || "ر.س";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-background rounded-3xl shadow-2xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative bg-background rounded-3xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Discount badge */}
          <div className="flex justify-center -mt-3">
            <Badge className="bg-destructive text-destructive-foreground text-base font-bold px-5 py-2 rounded-full shadow-lg animate-pulse">
              خصم {discountPercentage}%
            </Badge>
          </div>

          {/* Title */}
          <div className="pt-4 pb-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">عرض حصري</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{weeklyProduct.title_ar}</h2>
          </div>

          {/* Product image */}
          <div className="relative px-6 py-4">
            <div className="relative mx-auto w-44 h-44 rounded-2xl overflow-hidden bg-muted shadow-lg">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name_ar}
                className="w-full h-full object-contain p-3"
              />
            </div>
          </div>

          {/* Product info */}
          <div className="px-6 pb-2 text-center">
            <h3 className="font-bold text-lg text-foreground mb-1">{product.name_ar}</h3>
            {product.company_name_ar && (
              <p className="text-sm text-muted-foreground">{product.company_name_ar}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="px-6 pb-3">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-bold text-primary">
                {weeklyProduct.special_price} {currency}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {originalPrice} {currency}
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-1">
              عند الشراء بـ {weeklyProduct.minimum_cart_amount} {currency} أو أكثر
            </p>
          </div>

          {/* Countdown */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span>ينتهي العرض خلال</span>
            </div>
            <div className="flex justify-center gap-2 rtl:flex-row-reverse">
              {[
                { value: timeLeft.days, label: "يوم" },
                { value: timeLeft.hours, label: "ساعة" },
                { value: timeLeft.minutes, label: "دقيقة" },
                { value: timeLeft.seconds, label: "ثانية" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-primary/10 rounded-lg px-2 py-1 min-w-[40px]">
                    <span className="text-lg font-bold text-primary">{item.value}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="px-6 pb-4">
            <Link to={`/products/${product.id}`} onClick={() => setIsOpen(false)}>
              <Button className="w-full text-lg py-6 font-bold shadow-lg rounded-xl">
                تسوق الآن
              </Button>
            </Link>
          </div>

          {/* Footer note */}
          <div className="bg-muted px-6 py-3 text-center rounded-b-3xl">
            <p className="text-xs text-muted-foreground">
              الحد الأقصى: {weeklyProduct.max_quantity_per_customer} قطعة للعميل
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyProductPopup;
