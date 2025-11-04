import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";

interface ShippingSettings {
  id: string;
  delivery_fee: number;
  is_free_delivery: boolean;
  free_delivery_threshold: number | null;
}

const AdminShippingSettings = () => {
  const queryClient = useQueryClient();
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState<boolean>(false);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as ShippingSettings;
    },
  });

  useEffect(() => {
    if (settings) {
      setDeliveryFee(Number(settings.delivery_fee));
      setIsFreeDelivery(settings.is_free_delivery);
      setFreeDeliveryThreshold(settings.free_delivery_threshold ? Number(settings.free_delivery_threshold) : null);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shipping_settings")
        .upsert({
          id: settings?.id || crypto.randomUUID(),
          delivery_fee: deliveryFee,
          is_free_delivery: isFreeDelivery,
          free_delivery_threshold: freeDeliveryThreshold,
        }, {
          onConflict: 'id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-settings"] });
      toast.success("تم تحديث إعدادات التوصيل بنجاح");
    },
    onError: (error) => {
      console.error("Error updating shipping settings:", error);
      toast.error("حدث خطأ أثناء تحديث الإعدادات");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFreeDelivery && deliveryFee < 0) {
      toast.error("قيمة التوصيل يجب أن تكون موجبة");
      return;
    }

    if (freeDeliveryThreshold && freeDeliveryThreshold < 0) {
      toast.error("حد التوصيل المجاني يجب أن يكون موجباً");
      return;
    }

    updateSettingsMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBackButton />
      <div>
        <h1 className="text-3xl font-bold">إعدادات التوصيل</h1>
        <p className="text-muted-foreground">إدارة رسوم وإعدادات التوصيل</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات رسوم التوصيل</CardTitle>
          <CardDescription>قم بتحديد رسوم التوصيل وخيارات التوصيل المجاني</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="free-delivery" className="text-base font-semibold">
                  التوصيل المجاني
                </Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل التوصيل المجاني لجميع الطلبات
                </p>
              </div>
              <Switch
                id="free-delivery"
                checked={isFreeDelivery}
                onCheckedChange={setIsFreeDelivery}
              />
            </div>

            {!isFreeDelivery && (
              <div className="space-y-2">
                <Label htmlFor="delivery-fee">رسوم التوصيل (د.ع)</Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  placeholder="أدخل رسوم التوصيل"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="threshold">حد التوصيل المجاني (اختياري - د.ع)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                step="0.01"
                value={freeDeliveryThreshold || ""}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value ? Number(e.target.value) : null)}
                placeholder="مثال: 50000 - التوصيل مجاني عند تجاوز هذا المبلغ"
              />
              <p className="text-sm text-muted-foreground">
                إذا كان مجموع الطلب أكبر من هذا المبلغ، سيكون التوصيل مجانياً
              </p>
            </div>

            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="w-full"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShippingSettings;
