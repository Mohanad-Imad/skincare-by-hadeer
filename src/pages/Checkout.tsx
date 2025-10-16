import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
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
              name_ar,
              name_en
            )
          )
        `)
        .eq("user_id", session.user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.user,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user || !cartItems || cartItems.length === 0) {
        throw new Error("السلة فارغة");
      }

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product_variants.price * item.quantity,
        0
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          notes,
          total_amount: totalAmount,
          status: "new",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_variant_id: item.product_variant_id,
        product_name_ar: item.product_variants.products.name_ar,
        product_name_en: item.product_variants.products.name_en,
        variant_size_ar: item.product_variants.size_ar,
        variant_size_en: item.product_variants.size_en,
        price: item.product_variants.price,
        quantity: item.quantity,
        subtotal: item.product_variants.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", session.user.id);

      if (clearError) throw clearError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("تم إرسال طلبك بنجاح!");
      navigate("/order-confirmation");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إرسال الطلب");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate();
  };

  if (!session) {
    navigate("/auth");
    return null;
  }

  const total = cartItems?.reduce(
    (sum, item) => sum + item.product_variants.price * item.quantity,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold">إتمام الطلب</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">معلومات التوصيل</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">الاسم الكامل *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
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

                  <div>
                    <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">طريقة الدفع</h2>
                <div className="rounded-lg bg-secondary p-4 text-center">
                  <p className="font-semibold">الدفع عند الاستلام</p>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? "جاري إرسال الطلب..." : "تأكيد الطلب"}
              </Button>
            </form>
          </div>

          <div className="h-fit rounded-lg border p-6">
            <h3 className="mb-4 text-xl font-bold">ملخص الطلب</h3>
            <div className="mb-4 space-y-2">
              {cartItems?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.product_variants.products.name_ar} ({item.quantity}×)
                  </span>
                  <span>
                    {Math.round(item.product_variants.price * item.quantity)} د.ع
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>المجموع:</span>
                <span className="text-primary">{Math.round(total)} د.ع</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;