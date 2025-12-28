import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Minus, Plus, Trash2, Save } from "lucide-react";

interface OrderItem {
  id: string;
  product_name_ar: string;
  product_name_en: string;
  variant_size_ar: string;
  variant_size_en: string;
  price: number;
  quantity: number;
  subtotal: number;
  product_variant_id: string | null;
  product_variants?: {
    product_id: string;
    products?: {
      image_url: string | null;
    };
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes: string | null;
  status: string;
  total_amount: number;
  shipping_amount: number;
  discount_amount: number | null;
  points_discount: number | null;
  order_items: OrderItem[];
}

interface OrderEditDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderEditDialog = ({ order, open, onOpenChange }: OrderEditDialogProps) => {
  const queryClient = useQueryClient();
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingAmount, setShippingAmount] = useState(0);

  useEffect(() => {
    if (order) {
      setEditedItems(order.order_items?.map(item => ({ ...item })) || []);
      setCustomerName(order.customer_name);
      setCustomerPhone(order.customer_phone);
      setCustomerAddress(order.customer_address);
      setNotes(order.notes || "");
      setShippingAmount(order.shipping_amount || 0);
    }
  }, [order]);

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;

      // Calculate new totals
      const itemsSubtotal = editedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const discountAmount = order.discount_amount || 0;
      const pointsDiscount = order.points_discount || 0;
      const newTotal = itemsSubtotal + shippingAmount - discountAmount - pointsDiscount;

      // Update order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          notes: notes || null,
          shipping_amount: shippingAmount,
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // Get current items
      const { data: currentItems } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order.id);

      const currentIds = currentItems?.map(i => i.id) || [];
      const editedIds = editedItems.map(i => i.id);

      // Delete removed items
      const idsToDelete = currentIds.filter(id => !editedIds.includes(id));
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("order_items")
          .delete()
          .in("id", idsToDelete);
        if (deleteError) throw deleteError;
      }

      // Update existing items
      for (const item of editedItems) {
        const { error: updateError } = await supabase
          .from("order_items")
          .update({
            quantity: item.quantity,
            subtotal: item.subtotal,
          })
          .eq("id", item.id);
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("تم تحديث الطلب بنجاح");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating order:", error);
      toast.error("حدث خطأ أثناء تحديث الطلب");
    },
  });

  const updateItemQuantity = (itemId: string, delta: number) => {
    setEditedItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.price,
          };
        }
        return item;
      })
    );
  };

  const setItemQuantity = (itemId: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity);
    setEditedItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.price,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    if (editedItems.length <= 1) {
      toast.error("لا يمكن حذف جميع المنتجات من الطلب");
      return;
    }
    setEditedItems(items => items.filter(item => item.id !== itemId));
  };

  const itemsSubtotal = editedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = order?.discount_amount || 0;
  const pointsDiscount = order?.points_discount || 0;
  const newTotal = itemsSubtotal + shippingAmount - discountAmount - pointsDiscount;

  const canEdit = order?.status === "new" || order?.status === "processing";

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            تعديل الطلب #{order.id.slice(0, 8)}
            {!canEdit && (
              <span className="text-sm text-destructive font-normal">
                (لا يمكن التعديل - الطلب في حالة {order.status === "shipped" ? "تم الشحن" : order.status === "delivered" ? "تم التوصيل" : "ملغي"})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-name">اسم العميل</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">رقم الهاتف</Label>
              <Input
                id="customer-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="customer-address">العنوان</Label>
              <Textarea
                id="customer-address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canEdit}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="font-semibold mb-3">المنتجات ({editedItems.length})</h4>
            <div className="space-y-3">
              {editedItems.map((item) => {
                const productImage = item.product_variants?.products?.image_url;
                return (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                    <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border bg-muted">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={item.product_name_ar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          لا توجد صورة
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product_name_ar}</p>
                      <p className="text-sm text-muted-foreground">الحجم: {item.variant_size_ar}</p>
                      <p className="text-sm text-muted-foreground">السعر: {Math.round(item.price)} د.ع</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateItemQuantity(item.id, -1)}
                        disabled={!canEdit || item.quantity <= 1}
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setItemQuantity(item.id, parseInt(e.target.value) || 1)}
                        disabled={!canEdit}
                        className="w-16 text-center h-8"
                        min={1}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateItemQuantity(item.id, 1)}
                        disabled={!canEdit}
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-left flex-shrink-0 w-24">
                      <p className="font-semibold">{Math.round(item.subtotal)} د.ع</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={!canEdit || editedItems.length <= 1}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping */}
          <div className="flex items-center gap-4">
            <Label htmlFor="shipping" className="min-w-24">رسوم التوصيل</Label>
            <Input
              id="shipping"
              type="number"
              value={shippingAmount}
              onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
              disabled={!canEdit}
              className="w-32"
              min={0}
            />
            <span className="text-muted-foreground">د.ع</span>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>المجموع الفرعي:</span>
              <span>{Math.round(itemsSubtotal)} د.ع</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>خصم الكود:</span>
                <span>-{Math.round(discountAmount)} د.ع</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>خصم النقاط:</span>
                <span>-{Math.round(pointsDiscount)} د.ع</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>التوصيل:</span>
              <span>{shippingAmount > 0 ? `${Math.round(shippingAmount)} د.ع` : "مجاني"}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>المجموع النهائي:</span>
              <span className="text-primary">{Math.round(newTotal)} د.ع</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => updateOrderMutation.mutate()}
            disabled={!canEdit || updateOrderMutation.isPending}
          >
            <Save className="h-4 w-4 ml-2" />
            {updateOrderMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};