import { Navbar } from "@/components/Navbar";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { FreeShippingBar } from "@/components/FreeShippingBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ArrowRight, Tag } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { localCart, updateLocalCartQuantity, removeFromLocalCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: localCartItems } = useQuery({
    queryKey: ["local-cart-items", localCart],
    queryFn: async () => {
      if (!localCart || localCart.length === 0) return [];

      const variantIds = localCart.map((item) => item.variantId);
      const { data, error } = await supabase
        .from("product_variants")
        .select(
          `
          *,
          products (
            id,
            name_ar,
            image_url
          )
        `,
        )
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

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          *,
          product_variants (
            *,
            products (
              id,
              name_ar,
              image_url
            )
          )
        `,
        )
        .eq("user_id", session.user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["cart-count", session?.user?.id] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["cart-count", session?.user?.id] });
      toast.success("تم حذف المنتج من السلة");
    },
  });

  const calculateItemPrice = (productId: string, originalPrice: number) => {
    const discount = calculateDiscount(productId, originalPrice, discounts);
    return discount ? discount.discountedPrice : originalPrice;
  };

  const total =
    cartItems?.reduce((sum, item) => {
      const finalPrice = calculateItemPrice(item.product_variants.products.id, item.product_variants.price);
      return sum + finalPrice * item.quantity;
    }, 0) || 0;

  const localTotal =
    localCartItems?.reduce((sum, item) => {
      const finalPrice = calculateItemPrice(item.products.id, item.price);
      return sum + finalPrice * item.quantity;
    }, 0) || 0;

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <CheckoutStepper currentStep={1} />
        <FreeShippingBar />
        <div className="container py-8 pb-32">
          <h1 className="mb-8 text-3xl font-bold">سلة التسوق</h1>

          {!localCartItems || localCartItems.length === 0 ? (
            <div className="text-center">
              <p className="mb-4 text-muted-foreground">السلة فارغة</p>
              <Button onClick={() => navigate("/products")}>تسوقي الآن</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {localCartItems.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded bg-secondary">
                      {item.products.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={item.products.name_ar}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          بدون صورة
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-base leading-tight line-clamp-2">{item.products.name_ar}</h3>
                        <p className="text-sm text-muted-foreground">{item.size_ar}</p>
                      </div>

                      <div>
                        {(() => {
                          const discount = calculateDiscount(item.products.id, item.price, discounts);
                          return discount ? (
                            <div className="space-y-1.5">
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <Tag className="h-3 w-3" />
                                خصم {Math.round(discount.percentage)}%
                              </Badge>
                              <div className="flex items-baseline gap-2">
                                <p className="font-bold text-primary text-lg">
                                  {Math.round(discount.discountedPrice)} د.ع
                                </p>
                                <p className="text-sm text-muted-foreground line-through">
                                  {Math.round(item.price)} د.ع
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="font-bold text-primary text-lg">{Math.round(item.price)} د.ع</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateLocalCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateLocalCartQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        removeFromLocalCart(item.id);
                        toast.success("تم حذف المنتج من السلة");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {localCartItems && localCartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground shadow-2xl p-4 z-50">
            <div className="container flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs opacity-90">المجموع الكلي</span>
                <span className="text-xl font-bold">{Math.round(localTotal)} د.ع</span>
              </div>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  toast.info("يجب تسجيل الدخول لإتمام الطلب");
                  navigate("/auth");
                }}
                className="flex-1 max-w-[200px] font-bold"
              >
                تسجيل الدخول
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CheckoutStepper currentStep={1} />
      <div className="container py-8 pb-32">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        <h1 className="mb-8 text-3xl font-bold">سلة التسوق</h1>

        {isLoading ? (
          <div className="text-center">جاري التحميل...</div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">السلة فارغة</p>
            <Button onClick={() => navigate("/products")}>تسوقي الآن</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex gap-4">
                  <img
                    src={item.product_variants.products.image_url || "/placeholder.svg"}
                    alt={item.product_variants.products.name_ar}
                    className="h-24 w-24 rounded-md object-cover"
                    loading="lazy"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.product_variants.products.name_ar}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.product_variants.size_ar}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const productId = item.product_variants.products.id;
                        const originalPrice = item.product_variants.price;
                        const discount = calculateDiscount(productId, originalPrice, discounts);

                        if (discount) {
                          return (
                            <>
                              <Badge variant="destructive" className="text-xs">
                                خصم {discount.percentage}%
                              </Badge>
                              <p className="font-bold text-primary text-lg">
                                {Math.round(discount.discountedPrice)} د.ع
                              </p>
                              <p className="text-sm text-muted-foreground line-through">
                                {Math.round(originalPrice)} د.ع
                              </p>
                            </>
                          );
                        }

                        return (
                          <p className="font-bold text-primary text-lg">
                            {Math.round(item.product_variants.price)} د.ع
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          id: item.id,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          id: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteItemMutation.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground shadow-2xl p-4 z-50">
          <div className="container flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs opacity-90">المجموع الكلي</span>
              <span className="text-xl font-bold">{Math.round(total)} د.ع</span>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/checkout")}
              className="flex-1 max-w-[200px] font-bold"
            >
              إتمام الطلب
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
