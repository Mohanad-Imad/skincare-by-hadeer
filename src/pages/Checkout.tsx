import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { FreeShippingBar } from "@/components/FreeShippingBar";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalCart } from "@/hooks/useLocalCart";
import PointsRedemption from "@/components/PointsRedemption";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً"),
  customerPhone: z.string().regex(/^[+]?[0-9]{10,15}$/, "رقم الهاتف غير صحيح"),
  customerAddress: z.string().trim().min(10, "العنوان يجب أن يكون 10 أحرف على الأقل").max(500, "العنوان طويل جداً"),
  notes: z.string().max(1000, "الملاحظات طويلة جداً").optional(),
});

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuestCheckout = searchParams.get("guest") === "true";
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const lastDiscountAttempt = useRef<number>(0);
  const { data: discounts } = useProductDiscounts();
  const { localCart, clearLocalCart } = useLocalCart();

  const { data: shippingSettings } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_settings").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("full_name, phone, address")
        .eq("id", session.user.id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // جلب منتجات السلة المحلية للزوار
  const { data: localCartItems } = useQuery({
    queryKey: ["local-cart-items-checkout", localCart],
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
            name_en
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
          product_variant_id: variant.id,
          product_variants: {
            ...variant,
            products: variant.products,
          },
        };
      });
    },
    enabled: isGuestCheckout && localCart.length > 0,
  });

  // تلقائياً ملء الحقول من البروفايل
  useEffect(() => {
    if (profile && !useDifferentAddress) {
      if (profile.full_name) setCustomerName(profile.full_name);
      if (profile.phone) setCustomerPhone(profile.phone);
      if (profile.address) setCustomerAddress(profile.address);
    }
  }, [profile, useDifferentAddress]);

  const { data: cartItems } = useQuery({
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
              name_en
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

  // تحديد السلة المستخدمة بناءً على حالة المستخدم
  const activeCartItems = session?.user ? cartItems : localCartItems;

  const applyDiscountCode = async () => {
    const code = discountCode.trim();

    if (!code) {
      toast.error("الرجاء إدخال كود الخصم");
      return;
    }

    // Rate limiting: 2 second cooldown
    const now = Date.now();
    if (now - lastDiscountAttempt.current < 2000) {
      toast.error("الرجاء الانتظار قبل المحاولة مرة أخرى");
      return;
    }

    // Validate format and length
    if (code.length > 50) {
      toast.error("كود الخصم طويل جداً");
      return;
    }

    if (!/^[A-Z0-9]+$/i.test(code)) {
      toast.error("كود الخصم يجب أن يحتوي على أحرف وأرقام فقط");
      return;
    }

    lastDiscountAttempt.current = now;
    setIsCheckingCode(true);
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("كود الخصم غير صحيح أو منتهي الصلاحية");
        setAppliedDiscount(null);
        return;
      }

      // المقارنة باستخدام timestamps للتأكد من صحة المقارنة عبر المناطق الزمنية
      const now = Date.now();
      const validFrom = new Date(data.valid_from).getTime();
      const validUntil = new Date(data.valid_until).getTime();

      if (now < validFrom || now > validUntil) {
        toast.error("كود الخصم منتهي الصلاحية");
        setAppliedDiscount(null);
        return;
      }

      setAppliedDiscount(data);
      toast.success(`تم تطبيق الخصم ${data.discount_percentage}%`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error applying discount:", error);
      }
      toast.error("حدث خطأ أثناء تطبيق كود الخصم");
    } finally {
      setIsCheckingCode(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone: string; address: string }) => {
      if (!session?.user?.id) throw new Error("غير مسجل");

      const { error } = await (supabase as any).from("profiles").update(data).eq("id", session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!activeCartItems || activeCartItems.length === 0) {
        throw new Error("السلة فارغة");
      }

      // حفظ العنوان الجديد في البروفايل إذا اختار المستخدم ذلك
      if (session?.user && saveNewAddress && useDifferentAddress) {
        await updateProfileMutation.mutateAsync({
          full_name: customerName,
          phone: customerPhone,
          address: customerAddress,
        });
      }

      // حساب المجموع مع الخصومات
      const subtotal = activeCartItems.reduce((sum, item) => {
        const itemDiscount = calculateDiscount(
          item.product_variants.products.id,
          item.product_variants.price,
          discounts,
        );
        const finalPrice = itemDiscount ? itemDiscount.discountedPrice : item.product_variants.price;
        return sum + finalPrice * item.quantity;
      }, 0);

      // خصم كود الخصم الإضافي
      const discountCodeAmount = appliedDiscount ? (subtotal * appliedDiscount.discount_percentage) / 100 : 0;

      // حساب رسوم التوصيل
      let shippingAmount = 0;
      if (shippingSettings) {
        // إذا التوصيل مجاني لجميع الطلبات
        if (shippingSettings.is_free_delivery) {
          shippingAmount = 0;
        }
        // أو إذا كان هناك حد أدنى ووصل المستخدم إليه
        else if (shippingSettings.free_delivery_threshold && subtotal >= shippingSettings.free_delivery_threshold) {
          shippingAmount = 0;
        }
        // خلاف ذلك، يدفع رسوم التوصيل العادية
        else {
          shippingAmount = Number(shippingSettings.delivery_fee) || 0;
        }
      }

      const totalAmount = subtotal - discountCodeAmount - pointsDiscount + shippingAmount;

      // Create order - user_id يكون null للزوار
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session?.user?.id || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          notes,
          total_amount: totalAmount,
          discount_code_id: appliedDiscount?.id || null,
          discount_amount: discountCodeAmount,
          shipping_amount: shippingAmount,
          points_used: pointsUsed > 0 ? pointsUsed : null,
          points_discount: pointsDiscount > 0 ? pointsDiscount : null,
          status: "new",
        })
        .select()
        .single();

      // خصم النقاط من رصيد المستخدم إذا تم استخدامها
      if (pointsUsed > 0 && session?.user?.id) {
        // تحديث رصيد النقاط
        const { error: pointsError } = await supabase.rpc('redeem_points', {
          p_user_id: session.user.id,
          p_points: pointsUsed
        });

        if (pointsError) {
          console.error('Error redeeming points:', pointsError);
          // لا نوقف الطلب، فقط نسجل الخطأ
        }
      }

      if (orderError) throw orderError;

      // Create order items with discounted prices
      const orderItems = activeCartItems.map((item) => {
        const itemDiscount = calculateDiscount(
          item.product_variants.products.id,
          item.product_variants.price,
          discounts,
        );
        const finalPrice = itemDiscount ? itemDiscount.discountedPrice : item.product_variants.price;

        return {
          order_id: order.id,
          product_variant_id: item.product_variant_id,
          product_name_ar: item.product_variants.products.name_ar || "منتج",
          product_name_en:
            item.product_variants.products.name_en || item.product_variants.products.name_ar || "Product",
          variant_size_ar: item.product_variants.size_ar || "قياس افتراضي",
          variant_size_en: item.product_variants.size_en || item.product_variants.size_ar || "Default Size",
          price: finalPrice,
          quantity: item.quantity,
          subtotal: finalPrice * item.quantity,
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart - حسب نوع المستخدم
      if (session?.user) {
        const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", session.user.id);
        if (clearError) throw clearError;
      } else {
        // مسح السلة المحلية للزوار
        clearLocalCart();
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("تم إرسال طلبك بنجاح!");
      navigate("/order-confirmation");
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("Error creating order:", error);
      }
      toast.error("حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input data
    try {
      checkoutSchema.parse({
        customerName,
        customerPhone,
        customerAddress,
        notes: notes || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
      toast.error("يرجى التحقق من البيانات المدخلة");
      return;
    }

    createOrderMutation.mutate();
  };

  // التحقق من وجود منتجات في السلة
  if (!session && !isGuestCheckout) {
    navigate("/auth");
    return null;
  }

  // إذا كان زائر بدون منتجات في السلة
  if (isGuestCheckout && (!localCartItems || localCartItems.length === 0) && localCart.length === 0) {
    navigate("/cart");
    return null;
  }

  const subtotal =
    activeCartItems?.reduce((sum, item) => {
      const itemDiscount = calculateDiscount(item.product_variants.products.id, item.product_variants.price, discounts);
      const finalPrice = itemDiscount ? itemDiscount.discountedPrice : item.product_variants.price;
      return sum + finalPrice * item.quantity;
    }, 0) || 0;

  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.discount_percentage) / 100 : 0;

  // حساب رسوم التوصيل
  let shippingAmount = 0;
  if (shippingSettings) {
    // إذا التوصيل مجاني لجميع الطلبات
    if (shippingSettings.is_free_delivery) {
      shippingAmount = 0;
    }
    // أو إذا كان هناك حد أدنى ووصل المستخدم إليه
    else if (shippingSettings.free_delivery_threshold && subtotal >= shippingSettings.free_delivery_threshold) {
      shippingAmount = 0;
    }
    // خلاف ذلك، يدفع رسوم التوصيل العادية
    else {
      shippingAmount = Number(shippingSettings.delivery_fee) || 0;
    }
  }

  const total = subtotal - discountAmount - pointsDiscount + shippingAmount;

  const handlePointsApplied = (points: number, discount: number) => {
    setPointsUsed(points);
    setPointsDiscount(discount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FreeShippingBar />
      <CheckoutStepper currentStep={2} />
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        <h1 className="mb-8 text-3xl font-bold">إتمام الطلب</h1>

        {isGuestCheckout && !session && (
          <div className="mb-6 rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              أنت تتسوق كزائر.{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-primary underline hover:no-underline"
              >
                سجل دخولك
              </button>{" "}
              لتتمكن من تتبع طلباتك.
            </p>
          </div>
        )}

        <div className="space-y-6 pb-52">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">معلومات التوصيل</h2>

              {profile && (profile.full_name || profile.phone || profile.address) && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <Checkbox
                    id="useDifferentAddress"
                    checked={useDifferentAddress}
                    onCheckedChange={(checked) => {
                      setUseDifferentAddress(checked as boolean);
                      if (!checked && profile) {
                        // استرجاع البيانات من البروفايل
                        if (profile.full_name) setCustomerName(profile.full_name);
                        if (profile.phone) setCustomerPhone(profile.phone);
                        if (profile.address) setCustomerAddress(profile.address);
                      }
                    }}
                  />
                  <Label htmlFor="useDifferentAddress" className="cursor-pointer text-sm">
                    استخدام عنوان مختلف عن عنوان البروفايل
                  </Label>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">العنوان *</Label>
                  <Textarea
                    id="address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                {session?.user && useDifferentAddress && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                    <Checkbox
                      id="saveNewAddress"
                      checked={saveNewAddress}
                      onCheckedChange={(checked) => setSaveNewAddress(checked as boolean)}
                    />
                    <Label htmlFor="saveNewAddress" className="cursor-pointer text-sm">
                      حفظ هذه المعلومات في البروفايل
                    </Label>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">كود الخصم</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل كود الخصم"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    disabled={!!appliedDiscount}
                  />
                  {appliedDiscount ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAppliedDiscount(null);
                        setDiscountCode("");
                      }}
                    >
                      إلغاء
                    </Button>
                  ) : (
                    <Button type="button" onClick={applyDiscountCode} disabled={isCheckingCode}>
                      {isCheckingCode ? "جاري التحقق..." : "تطبيق"}
                    </Button>
                  )}
                </div>
                {appliedDiscount && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    تم تطبيق خصم {appliedDiscount.discount_percentage}%
                  </div>
                )}
              </div>
            </div>

            {/* استبدال النقاط - فقط للمستخدمين المسجلين */}
            {session?.user && (
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">نقاط الولاء</h2>
                <PointsRedemption
                  userId={session.user.id}
                  maxDiscount={subtotal - discountAmount}
                  onPointsApplied={handlePointsApplied}
                  appliedPoints={pointsUsed}
                />
              </div>
            )}

            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">طريقة الدفع</h2>
              <div className="rounded-lg bg-secondary p-4 text-center">
                <p className="font-semibold">الدفع عند الاستلام</p>
              </div>
            </div>
          </form>
        </div>

        {/* زر تأكيد الطلب العائم */}
        {activeCartItems && activeCartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground shadow-2xl p-4 z-50">
            <div className="container">
              <div className="space-y-2 mb-3 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-90">المنتجات</span>
                  <span>{Math.round(subtotal)} د.ع</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between">
                    <span className="opacity-90">الخصم ({appliedDiscount.discount_percentage}%)</span>
                    <span>-{Math.round(discountAmount)} د.ع</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-90">خصم النقاط ({pointsUsed} نقطة)</span>
                    <span>-{Math.round(pointsDiscount)} د.ع</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="opacity-90">التوصيل</span>
                  <span>{shippingAmount === 0 ? "مجاني" : `${Math.round(shippingAmount)} د.ع`}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary-foreground/20 text-base font-bold">
                  <span>المجموع الكلي</span>
                  <span>{Math.round(total)} د.ع</span>
                </div>
              </div>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending}
                className="w-full font-bold"
              >
                {createOrderMutation.isPending ? "جاري الإرسال..." : "تأكيد الطلب"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
