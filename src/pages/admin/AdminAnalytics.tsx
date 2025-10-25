import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { useState } from "react";

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState<string>("30");

  // إحصائيات عامة
  const { data: stats } = useQuery({
    queryKey: ["admin-stats", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // إجمالي المبيعات
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, discount_amount, created_at")
        .gte("created_at", daysAgo.toISOString());

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalDiscount = orders?.reduce((sum, order) => sum + Number(order.discount_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;

      // عدد المنتجات المباعة
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("quantity, created_at")
        .gte("created_at", daysAgo.toISOString());

      const totalProducts = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      return {
        totalRevenue,
        totalDiscount,
        totalOrders,
        totalProducts,
        netRevenue: totalRevenue - totalDiscount,
      };
    },
  });

  // المنتجات الأكثر مبيعاً
  const { data: topProducts } = useQuery({
    queryKey: ["top-products", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data } = await supabase
        .from("order_items")
        .select("product_name_ar, quantity, price, created_at")
        .gte("created_at", daysAgo.toISOString());

      if (!data) return [];

      // تجميع المنتجات
      const productMap = new Map();
      data.forEach((item) => {
        const existing = productMap.get(item.product_name_ar);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.quantity * Number(item.price);
        } else {
          productMap.set(item.product_name_ar, {
            name: item.product_name_ar,
            quantity: item.quantity,
            revenue: item.quantity * Number(item.price),
          });
        }
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },
  });

  // المبيعات اليومية
  const { data: dailySales } = useQuery({
    queryKey: ["daily-sales", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (!data) return [];

      // تجميع حسب اليوم
      const salesByDay = new Map();
      data.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString("ar-IQ");
        const existing = salesByDay.get(date);
        if (existing) {
          existing.amount += Number(order.total_amount);
          existing.count += 1;
        } else {
          salesByDay.set(date, {
            date,
            amount: Number(order.total_amount),
            count: 1,
          });
        }
      });

      return Array.from(salesByDay.values());
    },
  });

  // توزيع حالات الطلبات
  const { data: orderStatus } = useQuery({
    queryKey: ["order-status", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data } = await supabase
        .from("orders")
        .select("status")
        .gte("created_at", daysAgo.toISOString());

      if (!data) return [];

      const statusMap = new Map();
      data.forEach((order) => {
        const count = statusMap.get(order.status) || 0;
        statusMap.set(order.status, count + 1);
      });

      const statusLabels: Record<string, string> = {
        new: "جديد",
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        delivered: "تم التسليم",
        cancelled: "ملغي",
      };

      return Array.from(statusMap.entries()).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
      }));
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">التحليلات والإحصائيات</h1>
            <p className="text-muted-foreground">متابعة الأداء التجاري للموقع</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="90">آخر 90 يوم</SelectItem>
              <SelectItem value="365">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* إحصائيات سريعة */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats?.totalRevenue || 0).toLocaleString()} د.ع</div>
              <p className="text-xs text-muted-foreground">
                بعد الخصم: {Math.round(stats?.netRevenue || 0).toLocaleString()} د.ع
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد الطلبات</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المنتجات المباعة</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">إجمالي القطع</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats?.totalRevenue || 0) / (stats?.totalOrders || 1)).toLocaleString()} د.ع
              </div>
              <p className="text-xs text-muted-foreground">متوسط الطلب</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* المبيعات اليومية */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>المبيعات اليومية</CardTitle>
              <CardDescription>تتبع المبيعات وعدد الطلبات عبر الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8b5cf6" name="المبيعات (د.ع)" strokeWidth={2} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" name="عدد الطلبات" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* المنتجات الأكثر مبيعاً */}
          <Card>
            <CardHeader>
              <CardTitle>المنتجات الأكثر مبيعاً</CardTitle>
              <CardDescription>أفضل 5 منتجات من حيث الكمية</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#8b5cf6" name="الكمية" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* توزيع حالات الطلبات */}
          <Card>
            <CardHeader>
              <CardTitle>حالات الطلبات</CardTitle>
              <CardDescription>توزيع الطلبات حسب الحالة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatus?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* إيرادات المنتجات */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>إيرادات المنتجات الأعلى</CardTitle>
              <CardDescription>المنتجات الأكثر إيراداً</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#10b981" name="الإيرادات (د.ع)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
