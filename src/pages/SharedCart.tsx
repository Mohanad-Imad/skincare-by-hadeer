import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowRight, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocalCart } from "@/hooks/useLocalCart";

interface SharedCartItem {
  productId: string;
  productName: string;
  variantId: string;
  variantSize: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

const SharedCart = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToLocalCart } = useLocalCart();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: sharedCart, isLoading, error } = useQuery({
    queryKey: ["shared-cart", shareCode],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("shared_carts") as any)
        .select("*")
        .eq("share_code", shareCode)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!shareCode,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (items: SharedCartItem[]) => {
      if (!session?.user) {
        // Add to local cart for non-authenticated users
        for (const item of items) {
          addToLocalCart(item.variantId, item.quantity);
        }
        return;
      }

      // Add to database cart for authenticated users
      for (const item of items) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("product_variant_id", item.variantId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + item.quantity })
            .eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: session.user.id,
            product_variant_id: item.variantId,
            quantity: item.quantity,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("تمت إضافة المنتجات إلى سلتك");
      navigate("/cart");
    },
    onError: () => {
      toast.error("حدث خطأ في إضافة المنتجات");
    },
  });

  const cartItems = sharedCart?.cart_items as unknown as SharedCartItem[] | undefined;
  const total = cartItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <div className="animate-pulse">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error || !sharedCart) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">السلة غير موجودة</h1>
            <p className="text-muted-foreground">
              هذا الرابط غير صالح أو منتهي الصلاحية
            </p>
            <Button onClick={() => navigate("/products")}>
              تصفح المنتجات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 pb-32">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">سلة مشاركة</h1>
            <p className="text-sm text-muted-foreground">
              تم مشاركة هذه السلة معك
            </p>
          </div>
        </div>

        {!cartItems || cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">السلة فارغة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={`${item.variantId}-${index}`} className="rounded-lg border p-4">
                <div className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-secondary">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        بدون صورة
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold line-clamp-2">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground">{item.variantSize}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-primary">
                        {Math.round(item.price)} د.ع
                      </p>
                      <Badge variant="secondary">الكمية: {item.quantity}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-2xl p-4 z-50">
          <div className="container space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المجموع</span>
              <span className="text-xl font-bold">{Math.round(total)} د.ع</span>
            </div>
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => addToCartMutation.mutate(cartItems)}
              disabled={addToCartMutation.isPending}
            >
              <ShoppingCart className="h-5 w-5" />
              {addToCartMutation.isPending ? "جاري الإضافة..." : "إضافة الكل إلى سلتي"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedCart;
