import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowRight, Package, AlertCircle, Tag } from "lucide-react";
import { toast } from "sonner";
import { useLocalCart } from "@/hooks/useLocalCart";

interface SharedCartItem {
  productId: string;
  productName: string;
  variantId: string;
  variantSize: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
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
  const totalBeforeDiscount = cartItems?.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0) || 0;
  const hasDiscount = totalBeforeDiscount > total;

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
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div key={`${item.variantId}-${index}`} className="rounded-lg border p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  {/* Product Image - smaller on mobile */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
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

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    {/* Product Name */}
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-1 sm:line-clamp-2">
                      {item.productName}
                    </h3>
                    
                    {/* Size & Quantity - same row on mobile */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs sm:text-sm text-muted-foreground truncate">
                        {item.variantSize}
                      </span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                        ×{item.quantity}
                      </Badge>
                    </div>
                    
                    {/* Prices - stacked on mobile */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2">
                      <span className="font-bold text-primary text-sm sm:text-base">
                        {Math.round(item.price * item.quantity)} د.ع
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            {Math.round(item.originalPrice * item.quantity)} د.ع
                          </span>
                          {item.discountPercentage && (
                            <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0 h-5 gap-0.5">
                              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {item.discountPercentage}%-
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-2xl p-3 sm:p-4 z-50">
          <div className="container">
            {/* Summary Row - compact on mobile */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {cartItems.length} منتجات
                </span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    {Math.round(totalBeforeDiscount)} د.ع
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl font-bold">{Math.round(total)} د.ع</span>
                  {hasDiscount && (
                    <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0.5 h-auto gap-0.5">
                      <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">وفرت</span> {Math.round(totalBeforeDiscount - total)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              size="default"
              className="w-full gap-2 h-11 sm:h-12"
              onClick={() => addToCartMutation.mutate(cartItems)}
              disabled={addToCartMutation.isPending}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {addToCartMutation.isPending ? "جاري الإضافة..." : "إضافة الكل إلى سلتي"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedCart;
