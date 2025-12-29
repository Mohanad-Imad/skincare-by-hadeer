import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { DollarSign, ShoppingCart, Package, TrendingUp, Ticket, Download, Users, Eye, Star, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState<string>("30");

  // إحصائيات عامة
  const { data: stats } = useQuery({
    queryKey: ["admin-stats", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // إجمالي المبيعات (باستثناء الطلبات الملغية)
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, discount_amount, shipping_amount, points_discount, created_at")
        .gte("created_at", daysAgo.toISOString())
        .neq("status", "cancelled");

      // حساب الإجماليات
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalDiscount = orders?.reduce((sum, order) => sum + Number(order.discount_amount || 0), 0) || 0;
      const totalPointsDiscount = orders?.reduce((sum, order) => sum + Number(order.points_discount || 0), 0) || 0;
      const totalShipping = orders?.reduce((sum, order) => sum + Number(order.shipping_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;

      // صافي المبيعات = إجمالي الإيرادات - رسوم التوصيل (لأن التوصيل يذهب لشركات التوصيل)
      const netSales = totalRevenue - totalShipping;
      
      // صافي الأرباح = صافي المبيعات (بعد استثناء التوصيل)
      // ملاحظة: الخصومات تم خصمها مسبقاً من total_amount
      const netProfit = netSales;

      // عدد المنتجات المباعة (من الطلبات غير الملغية فقط)
      // جلب الطلبات غير الملغية أولاً
      const { data: validOrders } = await supabase
        .from("orders")
        .select("id")
        .gte("created_at", daysAgo.toISOString())
        .neq("status", "cancelled");

      const validOrderIds = validOrders?.map(o => o.id) || [];
      
      let orderItems: any[] = [];
      if (validOrderIds.length > 0) {
        const { data } = await supabase
          .from("order_items")
          .select("quantity")
          .in("order_id", validOrderIds);
        orderItems = data || [];
      }

      const totalProducts = orderItems.reduce((sum, item) => sum + item.quantity, 0) || 0;

      return {
        totalRevenue,
        totalDiscount,
        totalPointsDiscount,
        totalShipping,
        totalOrders,
        totalProducts,
        netSales,
        netProfit,
      };
    },
  });

  // المنتجات الأكثر مبيعاً
  const { data: topProducts } = useQuery({
    queryKey: ["top-products", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // جلب الطلبات غير الملغية أولاً
      const { data: validOrders } = await supabase
        .from("orders")
        .select("id")
        .gte("created_at", daysAgo.toISOString())
        .neq("status", "cancelled");

      const validOrderIds = validOrders?.map(o => o.id) || [];
      
      let data: any[] = [];
      if (validOrderIds.length > 0) {
        const { data: items } = await supabase
          .from("order_items")
          .select("product_name_ar, quantity, price")
          .in("order_id", validOrderIds);
        data = items || [];
      }

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
        .select("total_amount, shipping_amount, created_at")
        .gte("created_at", daysAgo.toISOString())
        .neq("status", "cancelled")
        .order("created_at", { ascending: true });

      if (!data) return [];

      // تجميع حسب اليوم
      const salesByDay = new Map();
      data.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString("ar-IQ");
        const netAmount = Number(order.total_amount) - Number(order.shipping_amount || 0);
        const existing = salesByDay.get(date);
        if (existing) {
          existing.amount += netAmount;
          existing.grossAmount += Number(order.total_amount);
          existing.count += 1;
        } else {
          salesByDay.set(date, {
            date,
            amount: netAmount,
            grossAmount: Number(order.total_amount),
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

  // إحصائيات أكواد الخصم
  const { data: discountStats } = useQuery({
    queryKey: ["discount-stats", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // جلب الطلبات مع أكواد الخصم (باستثناء الطلبات الملغية)
      const { data: orders } = await supabase
        .from("orders")
        .select("discount_code_id, discount_amount, total_amount, created_at")
        .gte("created_at", daysAgo.toISOString())
        .neq("status", "cancelled")
        .not("discount_code_id", "is", null);

      if (!orders || orders.length === 0) return [];

      // جلب معلومات أكواد الخصم
      const discountCodeIds = [...new Set(orders.map(o => o.discount_code_id))];
      const { data: discountCodes } = await supabase
        .from("discount_codes")
        .select("id, code, discount_percentage")
        .in("id", discountCodeIds);

      if (!discountCodes) return [];

      // تجميع الإحصائيات لكل كود
      const statsMap = new Map();
      orders.forEach((order) => {
        const code = discountCodes.find(dc => dc.id === order.discount_code_id);
        if (!code) return;

        const totalAmount = Number(order.total_amount);
        const discountAmount = Number(order.discount_amount || 0);
        const amountBeforeDiscount = totalAmount + discountAmount;

        const existing = statsMap.get(code.id);
        if (existing) {
          existing.usageCount += 1;
          existing.totalDiscount += discountAmount;
          existing.totalSalesBeforeDiscount += amountBeforeDiscount;
          existing.totalSalesAfterDiscount += totalAmount;
        } else {
          statsMap.set(code.id, {
            id: code.id,
            code: code.code,
            percentage: code.discount_percentage,
            usageCount: 1,
            totalDiscount: discountAmount,
            totalSalesBeforeDiscount: amountBeforeDiscount,
            totalSalesAfterDiscount: totalAmount,
          });
        }
      });

      return Array.from(statsMap.values())
        .sort((a, b) => b.usageCount - a.usageCount);
    },
  });

  // إحصائيات المستخدمين
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // عدد المستخدمين الجدد
      const { count: newUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", daysAgo.toISOString());

      // إجمالي المستخدمين
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // المستخدمين النشطين (لديهم طلبات)
      const { data: activeUserOrders } = await supabase
        .from("orders")
        .select("user_id")
        .gte("created_at", daysAgo.toISOString())
        .not("user_id", "is", null);

      const uniqueActiveUsers = new Set(activeUserOrders?.map(o => o.user_id) || []).size;

      return {
        newUsers: newUsers || 0,
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers,
      };
    },
  });

  // إحصائيات المنتجات
  const { data: productStats } = useQuery({
    queryKey: ["product-stats"],
    queryFn: async () => {
      // إجمالي المنتجات
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // المنتجات بدون مخزون
      const { data: outOfStock } = await supabase
        .from("product_variants")
        .select("product_id")
        .eq("stock_quantity", 0);

      const uniqueOutOfStock = new Set(outOfStock?.map(v => v.product_id) || []).size;

      // المنتجات المميزة
      const { count: featuredProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_featured", true)
        .eq("is_active", true);

      return {
        totalProducts: totalProducts || 0,
        outOfStock: uniqueOutOfStock,
        featuredProducts: featuredProducts || 0,
      };
    },
  });

  // إحصائيات التقييمات
  const { data: reviewStats } = useQuery({
    queryKey: ["review-stats", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // تقييمات المنتجات
      const { data: productReviews } = await supabase
        .from("product_reviews")
        .select("rating")
        .gte("created_at", daysAgo.toISOString());

      const avgProductRating = productReviews?.length
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        : 0;

      // آراء العملاء
      const { data: customerReviews } = await supabase
        .from("customer_reviews")
        .select("rating, status")
        .gte("created_at", daysAgo.toISOString());

      const pendingReviews = customerReviews?.filter(r => r.status === "pending").length || 0;

      return {
        totalProductReviews: productReviews?.length || 0,
        avgProductRating: avgProductRating.toFixed(1),
        totalCustomerReviews: customerReviews?.length || 0,
        pendingReviews,
      };
    },
  });

  // إحصائيات الاستشارات
  const { data: consultationStats } = useQuery({
    queryKey: ["consultation-stats", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data } = await supabase
        .from("consultations")
        .select("status")
        .gte("created_at", daysAgo.toISOString());

      const pending = data?.filter(c => c.status === "pending").length || 0;
      const responded = data?.filter(c => c.status === "responded").length || 0;

      return {
        total: data?.length || 0,
        pending,
        responded,
      };
    },
  });

  // بيانات المبيعات الشهرية للمقارنة
  const { data: monthlySales } = useQuery({
    queryKey: ["monthly-sales"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data } = await supabase
        .from("orders")
        .select("total_amount, shipping_amount, created_at")
        .gte("created_at", sixMonthsAgo.toISOString())
        .neq("status", "cancelled")
        .order("created_at", { ascending: true });

      if (!data) return [];

      const salesByMonth = new Map();
      data.forEach((order) => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("ar-IQ", { month: "short", year: "numeric" });
        const netAmount = Number(order.total_amount) - Number(order.shipping_amount || 0);
        
        const existing = salesByMonth.get(monthKey);
        if (existing) {
          existing.amount += netAmount;
          existing.count += 1;
        } else {
          salesByMonth.set(monthKey, {
            month: monthName,
            amount: netAmount,
            count: 1,
          });
        }
      });

      return Array.from(salesByMonth.values());
    },
  });

  // حساب متوسط قيمة الطلب
  const averageOrderValue = useMemo(() => {
    if (!stats?.totalOrders || stats.totalOrders === 0) return 0;
    return Math.round(stats.netSales / stats.totalOrders);
  }, [stats]);

  // دالة تصدير التقرير إلى Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // ورقة الملخص العام
    const summaryData = [
      ["التقرير", `آخر ${timeRange} يوم`],
      ["تاريخ التصدير", new Date().toLocaleDateString("ar-IQ")],
      [""],
      ["البيان", "القيمة"],
      ["إجمالي الإيرادات", `${Math.round(stats?.totalRevenue || 0)} د.ع`],
      ["صافي المبيعات", `${Math.round(stats?.netSales || 0)} د.ع`],
      ["رسوم التوصيل", `${Math.round(stats?.totalShipping || 0)} د.ع`],
      ["إجمالي الخصومات", `${Math.round((stats?.totalDiscount || 0) + (stats?.totalPointsDiscount || 0))} د.ع`],
      ["عدد الطلبات", stats?.totalOrders || 0],
      ["المنتجات المباعة", stats?.totalProducts || 0],
      ["متوسط قيمة الطلب", `${averageOrderValue} د.ع`],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "الملخص");

    // ورقة المبيعات اليومية
    if (dailySales && dailySales.length > 0) {
      const dailyData = [
        ["التاريخ", "صافي المبيعات (د.ع)", "الإجمالي (د.ع)", "عدد الطلبات"],
        ...dailySales.map((day: any) => [day.date, Math.round(day.amount), Math.round(day.grossAmount), day.count]),
      ];
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, "المبيعات اليومية");
    }

    // ورقة المنتجات الأكثر مبيعاً
    if (topProducts && topProducts.length > 0) {
      const productsData = [
        ["المنتج", "الكمية المباعة", "الإيرادات (د.ع)"],
        ...topProducts.map((p: any) => [p.name, p.quantity, Math.round(p.revenue)]),
      ];
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, "المنتجات الأكثر مبيعاً");
    }

    // ورقة أكواد الخصم
    if (discountStats && discountStats.length > 0) {
      const discountData = [
        ["الكود", "نسبة الخصم", "عدد الاستخدامات", "المبيعات الأصلية (د.ع)", "إجمالي الخصومات (د.ع)", "المبيعات الفعلية (د.ع)"],
        ...discountStats.map((d: any) => [
          d.code,
          `${d.percentage}%`,
          d.usageCount,
          Math.round(d.totalSalesBeforeDiscount),
          Math.round(d.totalDiscount),
          Math.round(d.totalSalesAfterDiscount),
        ]),
      ];
      const discountSheet = XLSX.utils.aoa_to_sheet(discountData);
      XLSX.utils.book_append_sheet(workbook, discountSheet, "أكواد الخصم");
    }

    // ورقة حالات الطلبات
    if (orderStatus && orderStatus.length > 0) {
      const statusData = [
        ["الحالة", "العدد"],
        ...orderStatus.map((s: any) => [s.name, s.value]),
      ];
      const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusSheet, "حالات الطلبات");
    }

    // تحميل الملف
    const fileName = `تقرير_التحليلات_${new Date().toLocaleDateString("ar-IQ").replace(/\//g, "-")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("تم تحميل التقرير بنجاح");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <AdminBackButton />
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">التحليلات والإحصائيات</h1>
            <p className="text-muted-foreground">متابعة الأداء التجاري للموقع</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تحميل التقرير
            </Button>
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
        </div>

        {/* إحصائيات إضافية */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{averageOrderValue.toLocaleString()} د.ع</div>
              <p className="text-xs text-muted-foreground">لكل طلب</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                جدد: {userStats?.newUsers || 0} | نشطين: {userStats?.activeUsers || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productStats?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">
                نفذ: <span className="text-red-500">{productStats?.outOfStock || 0}</span> | مميز: {productStats?.featuredProducts || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التقييمات</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {reviewStats?.avgProductRating || 0}
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                تقييمات: {reviewStats?.totalProductReviews || 0} | بانتظار: <span className="text-orange-500">{reviewStats?.pendingReviews || 0}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاستشارات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultationStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                بانتظار: <span className="text-orange-500">{consultationStats?.pending || 0}</span> | تمت: {consultationStats?.responded || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* إحصائيات سريعة */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats?.totalRevenue || 0).toLocaleString()} د.ع</div>
              <p className="text-xs text-muted-foreground">
                شامل التوصيل والخصومات
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">صافي المبيعات</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{Math.round(stats?.netSales || 0).toLocaleString()} د.ع</div>
              <p className="text-xs text-muted-foreground">
                بدون رسوم التوصيل
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رسوم التوصيل</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats?.totalShipping || 0).toLocaleString()} د.ع</div>
              <p className="text-xs text-muted-foreground">
                تذهب لشركات التوصيل
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
              <CardTitle className="text-sm font-medium">إجمالي الخصومات</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{Math.round((stats?.totalDiscount || 0) + (stats?.totalPointsDiscount || 0)).toLocaleString()} د.ع</div>
              <p className="text-xs text-muted-foreground">
                أكواد: {Math.round(stats?.totalDiscount || 0).toLocaleString()} | نقاط: {Math.round(stats?.totalPointsDiscount || 0).toLocaleString()}
              </p>
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
                  <Line type="monotone" dataKey="amount" stroke="#10b981" name="صافي المبيعات (د.ع)" strokeWidth={2} />
                  <Line type="monotone" dataKey="grossAmount" stroke="#8b5cf6" name="الإجمالي (د.ع)" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" name="عدد الطلبات" strokeWidth={2} />
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

        {/* مقارنة المبيعات الشهرية */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>المبيعات الشهرية</CardTitle>
              <CardDescription>مقارنة المبيعات خلال آخر 6 أشهر</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="صافي المبيعات (د.ع)" />
                  <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="عدد الطلبات" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">إحصائيات أكواد الخصم</h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* أكثر أكواد الخصم استخداماً */}
            <Card>
              <CardHeader>
                <CardTitle>أكثر الأكواد استخداماً</CardTitle>
                <CardDescription>أكواد الخصم الأكثر طلباً</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={discountStats?.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usageCount" fill="#f59e0b" name="عدد الاستخدامات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* إجمالي الخصومات لكل كود */}
            <Card>
              <CardHeader>
                <CardTitle>إجمالي الخصومات</CardTitle>
                <CardDescription>قيمة الخصومات حسب الكود</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={discountStats?.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalDiscount" fill="#ef4444" name="الخصومات (د.ع)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* مقارنة المبيعات قبل وبعد الخصم */}
            <Card>
              <CardHeader>
                <CardTitle>تأثير الخصومات</CardTitle>
                <CardDescription>مقارنة المبيعات قبل وبعد الخصم</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={discountStats?.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalSalesBeforeDiscount" fill="#94a3b8" name="قبل الخصم (د.ع)" />
                    <Bar dataKey="totalSalesAfterDiscount" fill="#10b981" name="بعد الخصم (د.ع)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* جدول تفصيلي لأكواد الخصم */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>تفاصيل أكواد الخصم</CardTitle>
                <CardDescription>معلومات شاملة عن أداء كل كود خصم</CardDescription>
              </CardHeader>
              <CardContent>
                {discountStats && discountStats.length > 0 ? (
                  <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="text-right">الكود</TableHead>
                         <TableHead className="text-right">نسبة الخصم</TableHead>
                         <TableHead className="text-right">عدد الاستخدامات</TableHead>
                         <TableHead className="text-right">المبيعات الأصلية</TableHead>
                         <TableHead className="text-right text-red-600">إجمالي الخصومات</TableHead>
                         <TableHead className="text-right text-green-600">المبيعات الفعلية</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {discountStats.map((stat) => (
                         <TableRow key={stat.id}>
                           <TableCell className="font-medium">{stat.code}</TableCell>
                           <TableCell>{stat.percentage}%</TableCell>
                           <TableCell>{stat.usageCount}</TableCell>
                           <TableCell className="text-muted-foreground">
                             {Math.round(stat.totalSalesBeforeDiscount).toLocaleString()} د.ع
                           </TableCell>
                           <TableCell className="text-red-600">
                             - {Math.round(stat.totalDiscount).toLocaleString()} د.ع
                           </TableCell>
                           <TableCell className="font-medium text-green-600">
                             = {Math.round(stat.totalSalesAfterDiscount).toLocaleString()} د.ع
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بيانات لأكواد الخصم في الفترة المحددة
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
