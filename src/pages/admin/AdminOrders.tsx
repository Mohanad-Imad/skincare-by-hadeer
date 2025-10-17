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
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

const statusLabels = {
  new: "جديد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">إدارة الطلبات</h2>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>اسم العميل</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>المبلغ الإجمالي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الطلب</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
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
                    <Badge variant="secondary">
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString("ar-IQ")}
                  </TableCell>
                  <TableCell>
                    <OrderStatusSelect
                      value={order.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({ id: order.id, status: value as "new" | "processing" | "shipped" | "delivered" | "cancelled" })
                      }
                    />
                  </TableCell>
                </TableRow>
                {expandedOrders.has(order.id) && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/30 p-4">
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
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
