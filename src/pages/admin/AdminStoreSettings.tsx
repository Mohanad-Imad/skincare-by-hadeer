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

const AdminStoreSettings = () => {
  const { isAdmin, isLoading: isLoadingAdmin } = useAdminCheck();
  const queryClient = useQueryClient();
  const [storeName, setStoreName] = useState("");
  const [currency, setCurrency] = useState("");

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

  if (isLoadingAdmin || isLoading) return <div className="p-8">جاري التحميل...</div>;
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-6">
      <AdminBackButton />
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
    </div>
  );
};

export default AdminStoreSettings;
