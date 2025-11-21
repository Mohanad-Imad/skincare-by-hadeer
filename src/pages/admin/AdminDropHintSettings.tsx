import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MessageCircle, Save } from "lucide-react";

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

  const { data: settings, isLoading } = useQuery({
    queryKey: ["drop-hint-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drop_hint_settings").select("*").single();

      if (error) throw error;

      if (data) {
        setFormData({
          button_text_ar: data.button_text_ar || "",
          funny_message_ar: data.funny_message_ar || "",
          formal_message_ar: data.formal_message_ar || "",
          urgent_message_ar: data.urgent_message_ar || "",
          discount_code: data.discount_code || "",
          discount_suffix_ar: data.discount_suffix_ar || "",
          is_active: data.is_active,
        });
      }

      return data;
    },
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <AdminSidebar />
          <div className="flex-1 p-8">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessageCircle className="h-8 w-8" />
                إعدادات "لمّح للحبايب"
              </h1>
              <p className="text-muted-foreground mt-2">تحكم في نص الزر والرسائل المرسلة عبر الواتساب</p>
            </div>
            <AdminBackButton />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات عامة</CardTitle>
                <CardDescription>تحكم في نص الزر وكود الخصم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الميزة</Label>
                    <p className="text-sm text-muted-foreground">عرض زر "لمّح للحبايب" في صفحات المنتجات</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_text_ar">نص الزر</Label>
                  <Input
                    id="button_text_ar"
                    value={formData.button_text_ar}
                    onChange={(e) => setFormData({ ...formData, button_text_ar: e.target.value })}
                    placeholder="لمّح للحبايب"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_code">كود الخصم (اختياري)</Label>
                  <Input
                    id="discount_code"
                    value={formData.discount_code}
                    onChange={(e) => setFormData({ ...formData, discount_code: e.target.value })}
                    placeholder="مثال: GIFT10"
                  />
                  <p className="text-xs text-muted-foreground">إذا تم إدخال كود خصم، سيتم إضافته في نهاية الرسالة</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_suffix_ar">نص كود الخصم</Label>
                  <Input
                    id="discount_suffix_ar"
                    value={formData.discount_suffix_ar}
                    onChange={(e) => setFormData({ ...formData, discount_suffix_ar: e.target.value })}
                    placeholder="وهمين اكو كود خصم اذا نويت: {CODE}"
                  />
                  <p className="text-xs text-muted-foreground">استخدم {"{CODE}"} ليتم استبداله بكود الخصم</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">😂 نبرة المزاح (للأصدقاء)</CardTitle>
                <CardDescription>رسالة خفيفة ومرحة للأصدقاء والإخوان</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="funny_message_ar">نص الرسالة</Label>
                <Textarea
                  id="funny_message_ar"
                  value={formData.funny_message_ar}
                  onChange={(e) => setFormData({ ...formData, funny_message_ar: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">استخدم {"{URL}"} ليتم استبداله برابط المنتج</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">❤️ نبرة رسمية/لطيفة</CardTitle>
                <CardDescription>للزوج/الخطيب/الأهل - رسالة محترمة ولطيفة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="formal_message_ar">نص الرسالة</Label>
                <Textarea
                  id="formal_message_ar"
                  value={formData.formal_message_ar}
                  onChange={(e) => setFormData({ ...formData, formal_message_ar: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">استخدم {"{URL}"} ليتم استبداله برابط المنتج</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">🔥 نبرة "الفرصة لا تعوض"</CardTitle>
                <CardDescription>رسالة محفزة تخلق شعور بالاستعجال</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="urgent_message_ar">نص الرسالة</Label>
                <Textarea
                  id="urgent_message_ar"
                  value={formData.urgent_message_ar}
                  onChange={(e) => setFormData({ ...formData, urgent_message_ar: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">استخدم {"{URL}"} ليتم استبداله برابط المنتج</p>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" disabled={updateMutation.isPending} className="w-full">
              <Save className="ml-2 h-5 w-5" />
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDropHintSettings;
