import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Truck, CheckCircle2, Sparkles } from "lucide-react";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { useLocalCart } from "@/hooks/useLocalCart";

export const FreeShippingBar = () => {
  const { localCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: shippingSettings } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: localCartItems } = useQuery({
    queryKey: ["local-cart-items", localCart],
    queryFn: async () => {
      if (!localCart || localCart.length === 0) return [];
      
      const variantIds = localCart.map((item) => item.variantId);
      const { data, error } = await supabase
        .from("product_variants")
        .select(`
          *,
          products (
            id,
            name_ar,
            image_url
          )
        `)
        .in("id", variantIds);

      if (error) throw error;
      
      return data.map((variant) => {
        const cartItem = localCart.find((item) => item.variantId === variant.id);
        return {
          ...variant,
          quantity: cartItem?.quantity || 1,
        };
      });
    },
    enabled: !session && localCart.length > 0,
  });

  const { data: cartItems } = useQuery({
    queryKey: ["cart", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product_variants (
            *,
            products (
              id,
              name_ar,
              image_url
            )
          )
        `)
        .eq("user_id", session.user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.user,
  });

  const calculateItemPrice = (productId: string, originalPrice: number) => {
    const discount = calculateDiscount(productId, originalPrice, discounts);
    return discount ? discount.discountedPrice : originalPrice;
  };

  const total = session
    ? cartItems?.reduce((sum, item) => {
        const finalPrice = calculateItemPrice(
          item.product_variants.products.id,
          item.product_variants.price
        );
        return sum + finalPrice * item.quantity;
      }, 0) || 0
    : localCartItems?.reduce((sum, item) => {
        const finalPrice = calculateItemPrice(item.products.id, item.price);
        return sum + finalPrice * item.quantity;
      }, 0) || 0;

  // يظهر الشريط فقط عندما يكون هناك حد أدنى للشحن المجاني
  if (!shippingSettings || !shippingSettings.free_delivery_threshold) {
    return null;
  }

  const threshold = Number(shippingSettings.free_delivery_threshold);
  const remaining = threshold - total;
  const progress = Math.min((total / threshold) * 100, 100);

  // لا نعرض الشريط إذا كانت السلة فارغة
  if (total === 0) {
    return null;
  }

  // المرحلة الأخيرة: حصل على شحن مجاني
  if (remaining <= 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="container py-2.5 px-4">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 animate-bounce" />
            <span>تهانينا! لقد حصلت على الشحن المجاني! 🎉</span>
          </div>
        </div>
      </div>
    );
  }

  // المرحلة الثانية: أقل من 30% متبقي
  if (progress > 70) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="container py-2.5 px-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>أحسنت! باقي لك {Math.round(remaining)} دينار فقط! لا تفوت الفرصة.</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-white/30" />
          </div>
        </div>
      </div>
    );
  }

  // المرحلة الأولى: أكثر من 30% متبقي
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="container py-2.5 px-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Truck className="h-4 w-4" />
            <span>باقي لك {Math.round(remaining)} دينار فقط للحصول على شحن مجاني! 🚀</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/30" />
        </div>
      </div>
    </div>
  );
};
