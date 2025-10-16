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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const statusLabels = {
  new: "جديد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const AdminOrders = () => {
  const queryClient = useQueryClient();

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
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  {order.id.slice(0, 8)}
                </TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.customer_phone}</TableCell>
                <TableCell>{order.total_amount} ر.س</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString("ar-SA")}
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      updateStatusMutation.mutate({ id: order.id, status: value as "new" | "processing" | "shipped" | "delivered" | "cancelled" })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
