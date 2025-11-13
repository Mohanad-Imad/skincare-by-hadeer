import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { useState, useEffect } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AdminStoreSettings = () => {
  const { isAdmin, isLoading: isLoadingAdmin } = useAdminCheck();
  const queryClient = useQueryClient();
  const [storeName, setStoreName] = useState("");
  const [currency, setCurrency] = useState("");
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: priceHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["price-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_history" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setCurrency(settings.currency);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) {
        // Create new settings
        const { error } = await supabase
          .from("store_settings" as any)
          .insert({
            store_name: storeName,
            currency: currency,
          } as any);
        if (error) throw error;
      } else {
        // Update existing settings
        const { error } = await supabase
          .from("store_settings" as any)
          .update({
            store_name: storeName,
            currency: currency,
          } as any)
          .eq("id", settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ الإعدادات"),
  });

  const updatePricesMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(priceAdjustment);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("يرجى إدخال مبلغ صحيح");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("المستخدم غير مسجل");

      const adjustmentAmount = adjustmentType === "increase" ? amount : -amount;

      const { data, error } = await supabase.rpc("update_all_product_prices" as any, {
        amount_to_add: adjustmentAmount,
        p_change_type: adjustmentType,
        p_admin_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["price-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`تم تحديث أسعار ${data?.[0]?.updated_count || 0} منتج بنجاح`);
      setPriceAdjustment("");
      setShowConfirmDialog(false);
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ أثناء تحديث الأسعار"),
  });

  const handlePriceUpdate = () => {
    const amount = parseFloat(priceAdjustment);
    if (isNaN(amount) || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    setShowConfirmDialog(true);
  };

  if (isLoadingAdmin || isLoading) return <div className="p-8">جاري التحميل...</div>;
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-6">
      <AdminBackButton />
      
      {/* Store Settings Card */}
      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>إعدادات المتجر</CardTitle>
          <CardDescription>
            قم بتخصيص اسم المتجر والعملة المستخدمة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="store-name">اسم المتجر</Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="أدخل اسم المتجر"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">العملة</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="مثال: ريال، دينار، دولار"
            />
          </div>

          <Button 
            onClick={() => updateSettingsMutation.mutate()}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Price Management Card */}
      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>إدارة الأسعار الجماعية</CardTitle>
          <CardDescription>
            تحديث أسعار جميع المنتجات دفعة واحدة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="adjustment-type">نوع التعديل</Label>
            <Select value={adjustmentType} onValueChange={(value: "increase" | "decrease") => setAdjustmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">زيادة السعر</SelectItem>
                <SelectItem value="decrease">تخفيض السعر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-adjustment">المبلغ ({currency || "دينار"})</Label>
            <Input
              id="price-adjustment"
              type="number"
              value={priceAdjustment}
              onChange={(e) => setPriceAdjustment(e.target.value)}
              placeholder="مثال: 1000"
              min="0"
              step="0.01"
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>ملاحظة:</strong> سيتم تطبيق التعديل على جميع المنتجات في المتجر.
              الأسعار الجديدة ستعمل مع جميع الخصومات والكوبونات بالطريقة المعتادة.
            </p>
          </div>

          <Button 
            onClick={handlePriceUpdate}
            disabled={updatePricesMutation.isPending || !priceAdjustment}
            variant="default"
            className="w-full"
          >
            {updatePricesMutation.isPending ? "جاري التحديث..." : "تطبيق التعديل على جميع المنتجات"}
          </Button>
        </CardContent>
      </Card>

      {/* Price History Card */}
      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>سجل تغييرات الأسعار</CardTitle>
          <CardDescription>
            آخر 10 تعديلات على الأسعار
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <p className="text-center text-muted-foreground">جاري التحميل...</p>
          ) : !priceHistory || priceHistory.length === 0 ? (
            <p className="text-center text-muted-foreground">لا توجد تعديلات سابقة</p>
          ) : (
            <div className="space-y-3">
              {priceHistory.map((record: any) => (
                <div key={record.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {record.change_type === "increase" ? "زيادة" : "تخفيض"} بمقدار {record.change_amount} {currency || "دينار"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      تم تحديث {record.affected_products_count} منتج
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.created_at), "dd MMMM yyyy", { locale: ar })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(record.created_at), "hh:mm a", { locale: ar })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد التعديل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من {adjustmentType === "increase" ? "زيادة" : "تخفيض"} أسعار جميع المنتجات بمقدار {priceAdjustment} {currency || "دينار"}؟
              <br />
              <br />
              <strong>تحذير:</strong> هذا الإجراء سيؤثر على جميع المنتجات في المتجر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updatePricesMutation.mutate()}
              disabled={updatePricesMutation.isPending}
            >
              {updatePricesMutation.isPending ? "جاري التحديث..." : "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStoreSettings;
