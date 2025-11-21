import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";

const AdminDropHintSettings = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    button_text_ar: "",
    funny_message_ar: "",
    formal_message_ar: "",
    urgent_message_ar: "",
    discount_code: "",
    discount_suffix_ar: "",
    is_active: true,
  });

  // 📌 تحميل الإعدادات
  const {
    data: settings,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["drop-hint-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drop_hint_settings").select("*").single();

      if (error) throw error;
      return data;
    },
  });

  // 📌 تعبئة الفورم بعد وصول البيانات
  useEffect(() => {
    if (settings) {
      setFormData({
        button_text_ar: settings.button_text_ar || "",
        funny_message_ar: settings.funny_message_ar || "",
        formal_message_ar: settings.formal_message_ar || "",
        urgent_message_ar: settings.urgent_message_ar || "",
        discount_code: settings.discount_code || "",
        discount_suffix_ar: settings.discount_suffix_ar || "",
        is_active: settings.is_active,
      });
    }
  }, [settings]);

  // 📌 تحديث الإعدادات
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("drop_hint_settings").update(formData).eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drop-hint-settings"] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  // 📌 حالات التحميل والخطأ
  if (isLoading) return <div className="p-8">جاري التحميل...</div>;

  if (isError) return <div className="p-8 text-red-500">حدث خطأ أثناء تحميل الإعدادات: {error.message}</div>;

  return (
    <div className="p-6 space-y-6">
      <AdminBackButton />

      <Card>
        <CardHeader>
          <CardTitle>إعدادات Drop Hint</CardTitle>
          <CardDescription>قم بتخصيص نصوص الرسائل والزر</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* نص الزر */}
            <div>
              <Label>نص زر الإرسال</Label>
              <Input
                value={formData.button_text_ar}
                onChange={(e) => setFormData({ ...formData, button_text_ar: e.target.value })}
              />
            </div>

            {/* ملاحظات مضحكة */}
            <div>
              <Label>رسالة مضحكة</Label>
              <Textarea
                value={formData.funny_message_ar}
                onChange={(e) => setFormData({ ...formData, funny_message_ar: e.target.value })}
              />
            </div>

            {/* رسالة رسمية */}
            <div>
              <Label>رسالة رسمية</Label>
              <Textarea
                value={formData.formal_message_ar}
                onChange={(e) => setFormData({ ...formData, formal_message_ar: e.target.value })}
              />
            </div>

            {/* رسالة عاجلة */}
            <div>
              <Label>رسالة عاجلة</Label>
              <Textarea
                value={formData.urgent_message_ar}
                onChange={(e) => setFormData({ ...formData, urgent_message_ar: e.target.value })}
              />
            </div>

            {/* رمز الخصم */}
            <div>
              <Label>رمز الخصم</Label>
              <Input
                value={formData.discount_code}
                onChange={(e) => setFormData({ ...formData, discount_code: e.target.value })}
              />
            </div>

            {/* لاحقة الخصم */}
            <div>
              <Label>نص مرفق مع الخصم</Label>
              <Input
                value={formData.discount_suffix_ar}
                onChange={(e) => setFormData({ ...formData, discount_suffix_ar: e.target.value })}
              />
            </div>

            {/* التفعيل */}
            <div className="flex items-center gap-3">
              <Label>هل الميزة مفعلة؟</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(val) => setFormData({ ...formData, is_active: val })}
              />
            </div>

            <Button type="submit" className="mt-4 flex items-center gap-2">
              حفظ الإعدادات <Save className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDropHintSettings;
