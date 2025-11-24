import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";

const statusLabels = {
  new: "طلب جديد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const statusColors = {
  new: "bg-blue-500",
  processing: "bg-yellow-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

const MyOrders = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!user?.id) throw new Error("يجب تسجيل الدخول");
      
      const order = orders?.find(o => o.id === orderId);
      if (!order || !order.order_items) throw new Error("الطلب غير موجود");

      // إضافة كل منتج إلى السلة
      for (const item of order.order_items) {
        if (!item.product_variant_id) continue;

        // التحقق من وجود المنتج في السلة
        const { data: existingItem } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("product_variant_id", item.product_variant_id)
          .single();

        if (existingItem) {
          // تحديث الكمية
          await supabase
            .from("cart_items")
            .update({ quantity: existingItem.quantity + item.quantity })
            .eq("id", existingItem.id);
        } else {
          // إضافة منتج جديد
          await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_variant_id: item.product_variant_id,
              quantity: item.quantity,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("تم إضافة المنتجات إلى السلة بنجاح! 🛒");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إعادة الطلب");
      console.error(error);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex items-center justify-center py-16">
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">طلباتي</h1>
        </div>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-4">لا توجد طلبات حتى الآن</p>
              <Button onClick={() => navigate("/products")}>
                تسوقي الآن
                <ArrowRight className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        طلب رقم: {order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleDateString("ar-IQ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                      <span className="text-lg font-bold">{Math.round(order.total_amount)} د.ع</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4" />
                  <h3 className="font-semibold mb-3">المنتجات:</h3>
                  <div className="space-y-3">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name_ar}</p>
                          <p className="text-sm text-muted-foreground">
                            الحجم: {item.variant_size_ar} • الكمية: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">{Math.round(item.subtotal)} د.ع</p>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-semibold mb-2">ملخص المبالغ:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">المجموع الفرعي:</span>
                          <span className="font-medium">
                            {Math.round(
                              order.order_items?.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) || 0
                            )} د.ع
                          </span>
                        </div>
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>الخصم:</span>
                            <span className="font-medium">-{Math.round(order.discount_amount)} د.ع</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">التوصيل:</span>
                          <span className="font-medium">
                            {order.shipping_amount && order.shipping_amount > 0 
                              ? `${Math.round(order.shipping_amount)} د.ع` 
                              : 'مجاني'}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span className="font-semibold">المجموع النهائي:</span>
                          <span className="font-bold text-primary">
                            {Math.round(order.total_amount)} د.ع
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">العنوان:</p>
                      <p className="text-sm">{order.customer_address}</p>
                    </div>
                    {order.notes && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">ملاحظات:</p>
                        <p className="text-sm">{order.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <Button
                    onClick={() => reorderMutation.mutate(order.id)}
                    disabled={reorderMutation.isPending}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 ${reorderMutation.isPending ? 'animate-spin' : ''}`} />
                    {reorderMutation.isPending ? "جاري الإضافة..." : "إعادة الطلب"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
