import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalCart } from "./useLocalCart";
import { toast } from "sonner";

export const useCartMigration = () => {
  const { localCart, clearLocalCart } = useLocalCart();
  const migrationInProgress = useRef(false);

  useEffect(() => {
    const migrateCart = async (userId: string) => {
      // تجنب التنفيذ المتكرر
      if (migrationInProgress.current || localCart.length === 0) return;
      
      migrationInProgress.current = true;

      try {
        for (const item of localCart) {
          // التحقق من وجود العنصر في السلة
          const { data: existing } = await supabase
            .from("cart_items")
            .select("*")
            .eq("user_id", userId)
            .eq("product_variant_id", item.variantId)
            .maybeSingle();

          if (existing) {
            // تحديث الكمية
            await supabase
              .from("cart_items")
              .update({ quantity: existing.quantity + item.quantity })
              .eq("id", existing.id);
          } else {
            // إضافة عنصر جديد
            await supabase.from("cart_items").insert({
              user_id: userId,
              product_variant_id: item.variantId,
              quantity: item.quantity,
            });
          }
        }

        clearLocalCart();
        toast.success("تم نقل منتجات السلة بنجاح");
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error migrating cart:", error);
        }
        toast.error("حدث خطأ في نقل منتجات السلة");
      } finally {
        migrationInProgress.current = false;
      }
    };

    // مراقبة تغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await migrateCart(session.user.id);
        }
      }
    );

    // التحقق من الجلسة الحالية عند تحميل الصفحة
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && localCart.length > 0) {
        migrateCart(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [localCart, clearLocalCart]);
};
