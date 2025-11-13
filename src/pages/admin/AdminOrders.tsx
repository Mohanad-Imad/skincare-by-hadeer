import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2, Printer, FileDown, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const statusLabels = {
  new: "جديد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const statusColors = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const ITEMS_PER_PAGE = 10;

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "new" | "processing" | "shipped" | "delivered" | "cancelled" }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("تم تحديث حالة الطلب بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث حالة الطلب"),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Delete order items first (cascade should handle this, but being explicit)
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;

      // Delete the order
      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("تم حذف الطلب بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الطلب"),
  });

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      
      // Date range filter
      const orderDate = new Date(order.created_at);
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) {
          return false;
        }
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [orders, statusFilter, dateFrom, dateTo]);

  // Print thermal label for an order
  const printThermalLabel = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderItems = order.order_items || [];
    const itemsList = orderItems.map((item: any) => 
      `${item.product_name_ar} - ${item.variant_size_ar} × ${item.quantity}`
    ).join('<br>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>طلب #${order.id.slice(0, 8)}</title>
        <style>
          @media print {
            @page {
              size: 100mm 150mm;
              margin: 5mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: 'Arial', sans-serif;
            width: 100mm;
            padding: 5mm;
            font-size: 12pt;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
          }
          .order-id {
            font-size: 14pt;
            margin: 10px 0;
            font-weight: bold;
          }
          .section {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            margin-top: 5px;
          }
          .value {
            margin-right: 5px;
          }
          .items {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
          }
          .total {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
            font-size: 14pt;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">ملصق شحن</div>
        <div class="order-id">طلب #${order.id.slice(0, 8)}</div>
        
        <div class="section">
          <div class="label">العميل:</div>
          <div class="value">${order.customer_name}</div>
        </div>
        
        <div class="section">
          <div class="label">الهاتف:</div>
          <div class="value">${order.customer_phone}</div>
        </div>
        
        <div class="section">
          <div class="label">العنوان:</div>
          <div class="value">${order.customer_address}</div>
        </div>
        
        <div class="items">
          <div class="label">المنتجات:</div>
          <div class="value">${itemsList}</div>
        </div>
        
        <div class="total">
          الإجمالي: ${Number(order.total_amount).toFixed(2)} ريال
        </div>
        
        ${order.notes ? `
          <div class="section">
            <div class="label">ملاحظات:</div>
            <div class="value">${order.notes}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast.error("لا توجد طلبات للتصدير");
      return;
    }

    const excelData = filteredOrders.map((order) => ({
      "رقم الطلب": order.id.slice(0, 8),
      "اسم العميل": order.customer_name,
      "الهاتف": order.customer_phone,
      "العنوان": order.customer_address,
      "الحالة": statusLabels[order.status as keyof typeof statusLabels],
      "المبلغ الإجمالي": Math.round(Number(order.total_amount)),
      "مبلغ الشحن": Math.round(Number(order.shipping_amount)),
      "الخصم": Math.round(Number(order.discount_amount || 0)),
      "التاريخ": format(new Date(order.created_at), "yyyy-MM-dd HH:mm"),
      "ملاحظات": order.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلبات");
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // رقم الطلب
      { wch: 20 }, // اسم العميل
      { wch: 15 }, // الهاتف
      { wch: 30 }, // العنوان
      { wch: 15 }, // الحالة
      { wch: 12 }, // المبلغ
      { wch: 12 }, // الشحن
      { wch: 12 }, // الخصم
      { wch: 18 }, // التاريخ
      { wch: 30 }, // ملاحظات
    ];

    XLSX.writeFile(wb, `orders_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("تم تصدير البيانات بنجاح");
  };

  if (isLoading) return <div className="p-8">جاري التحميل...</div>;

  // Calculate pagination
  const totalPages = Math.ceil((filteredOrders?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = filteredOrders?.slice(startIndex, endIndex) || [];

  return (
    <div className="container mx-auto p-6">
      <AdminBackButton />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="text-lg font-semibold">فلترة الطلبات</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status-filter">الحالة</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="processing">قيد المعالجة</SelectItem>
                <SelectItem value="shipped">تم الشحن</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-from">من تاريخ</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date-to">إلى تاريخ</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        {(statusFilter !== "all" || dateFrom || dateTo) && (
          <div className="mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setStatusFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        عرض {currentOrders.length} من أصل {filteredOrders?.length || 0} طلب
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>اسم العميل</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>المبلغ الإجمالي</TableHead>
              <TableHead>الخصم</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الطلب</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => (
              <>
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="flex items-center gap-2"
                    >
                      {expandedOrders.has(order.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {order.id.slice(0, 8)}
                    </Button>
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.customer_phone}</TableCell>
                  <TableCell>{Math.round(order.total_amount)} د.ع</TableCell>
                  <TableCell>
                    {order.discount_amount && order.discount_amount > 0 ? (
                      <span className="text-green-600 font-medium">
                        -{Math.round(order.discount_amount)} د.ع
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={statusColors[order.status as keyof typeof statusColors]}
                    >
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString("ar-IQ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printThermalLabel(order)}
                        title="طباعة ملصق حراري"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <OrderStatusSelect
                        value={order.status}
                        onValueChange={(value) =>
                          updateStatusMutation.mutate({ id: order.id, status: value as "new" | "processing" | "shipped" | "delivered" | "cancelled" })
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد حذف الطلب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteOrderMutation.mutate(order.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedOrders.has(order.id) && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-muted/30 p-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">المنتجات المطلوبة:</h4>
                        {order.order_items && order.order_items.length > 0 ? (
                          <div className="space-y-2">
                            {order.order_items.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center p-3 bg-background rounded-md border">
                                <div className="flex-1">
                                  <p className="font-medium">{item.product_name_ar}</p>
                                  <p className="text-sm text-muted-foreground">
                                    الحجم: {item.variant_size_ar}
                                  </p>
                                </div>
                                <div className="text-left">
                                  <p className="text-sm">الكمية: {item.quantity}</p>
                                  <p className="font-medium">{Math.round(item.subtotal)} د.ع</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">لا توجد منتجات</p>
                        )}
                        {order.notes && (
                          <div className="mt-3 p-3 bg-background rounded-md border">
                            <p className="text-sm font-semibold mb-1">ملاحظات العميل:</p>
                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                          </div>
                        )}
                        <div className="mt-3 p-3 bg-background rounded-md border">
                          <p className="text-sm font-semibold mb-1">العنوان:</p>
                          <p className="text-sm text-muted-foreground">{order.customer_address}</p>
                        </div>
                        <div className="mt-3 p-3 bg-background rounded-md border">
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
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination dir="rtl">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default AdminOrders;
