import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, 
  DollarSign, 
  Percent, 
  TrendingUp,
  Calendar,
  Package,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { SEO } from "@/components/SEO";

interface DiscountCodeStats {
  code: string;
  discount_percentage: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  totalOrders: number;
  totalSales: number;
  totalDiscount: number;
  orders: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    discount_amount: number;
    status: string;
  }>;
}

const InfluencerStats = () => {
  const { codeId } = useParams<{ codeId: string }>();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["influencer-stats", codeId],
    queryFn: async () => {
      if (!codeId) throw new Error("معرف الكود غير موجود");

      // Get discount code details
      const { data: codeData, error: codeError } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("id", codeId)
        .single();

      if (codeError) throw new Error("كود الخصم غير موجود");

      // Get orders that used this discount code
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, discount_amount, status")
        .eq("discount_code_id", codeId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const orders = ordersData || [];
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalDiscount = orders.reduce((sum, order) => sum + (order.discount_amount || 0), 0);

      return {
        ...codeData,
        totalOrders,
        totalSales,
        totalDiscount,
        orders,
      } as DiscountCodeStats;
    },
    enabled: !!codeId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">الرابط غير صالح</h2>
            <p className="text-muted-foreground">
              كود الخصم المطلوب غير موجود أو تم حذفه
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCodeActive = stats.is_active && new Date(stats.valid_until) > new Date();
  const deliveredOrders = stats.orders.filter(o => o.status === 'delivered');
  const pendingOrders = stats.orders.filter(o => o.status === 'pending');

  return (
    <>
      <SEO 
        title={`إحصائيات كود ${stats.code}`}
        description={`إحصائيات استخدام كود الخصم ${stats.code}`}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 sm:p-6" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">كود الخصم</p>
                  <CardTitle className="text-3xl sm:text-4xl font-bold tracking-wider">
                    {stats.code}
                  </CardTitle>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    variant={isCodeActive ? "default" : "secondary"}
                    className="text-sm px-3 py-1"
                  >
                    {isCodeActive ? "نشط" : "غير نشط"}
                  </Badge>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    <Percent className="h-4 w-4 ml-1" />
                    {stats.discount_percentage}% خصم
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>يبدأ: {format(new Date(stats.valid_from), "dd MMM yyyy", { locale: ar })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>ينتهي: {format(new Date(stats.valid_until), "dd MMM yyyy", { locale: ar })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-full bg-blue-500/20">
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">إجمالي الطلبات</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-full bg-green-500/20">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">إجمالي المبيعات</p>
                    <p className="text-xl sm:text-2xl font-bold">{Math.round(stats.totalSales).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">د.ع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-full bg-orange-500/20">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">إجمالي الخصومات</p>
                    <p className="text-xl sm:text-2xl font-bold">{Math.round(stats.totalDiscount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">د.ع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-full bg-purple-500/20">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">طلبات مكتملة</p>
                    <p className="text-xl sm:text-2xl font-bold">{deliveredOrders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ملخص حالة الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
                  <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.orders.filter(o => o.status === 'processing').length}
                  </p>
                  <p className="text-sm text-muted-foreground">قيد المعالجة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/10">
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.orders.filter(o => o.status === 'shipped').length}
                  </p>
                  <p className="text-sm text-muted-foreground">تم الشحن</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{deliveredOrders.length}</p>
                  <p className="text-sm text-muted-foreground">تم التوصيل</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                آخر الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد طلبات حتى الآن</p>
                  <p className="text-sm">ستظهر الطلبات هنا عند استخدام الكود</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.orders.slice(0, 10).map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <p className="font-medium">
                            طلب #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{Math.round(order.total_amount).toLocaleString()} د.ع</p>
                        {order.discount_amount > 0 && (
                          <p className="text-xs text-green-600">
                            خصم: {Math.round(order.discount_amount).toLocaleString()} د.ع
                          </p>
                        )}
                        <Badge 
                          variant={
                            order.status === 'delivered' ? 'default' : 
                            order.status === 'cancelled' ? 'destructive' : 
                            'secondary'
                          }
                          className="text-[10px] mt-1"
                        >
                          {order.status === 'pending' && 'قيد الانتظار'}
                          {order.status === 'processing' && 'قيد المعالجة'}
                          {order.status === 'shipped' && 'تم الشحن'}
                          {order.status === 'delivered' && 'تم التوصيل'}
                          {order.status === 'cancelled' && 'ملغي'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {stats.orders.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      و {stats.orders.length - 10} طلبات أخرى...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pb-6">
            <p>آخر تحديث: {format(new Date(), "dd MMM yyyy - HH:mm", { locale: ar })}</p>
            <p className="mt-1">يتم تحديث الإحصائيات تلقائياً عند تحميل الصفحة</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InfluencerStats;
