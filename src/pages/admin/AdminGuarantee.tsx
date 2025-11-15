import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminGuarantee = () => {
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState<any[]>([]);

  const { data: guaranteeSettings, isLoading } = useQuery({
    queryKey: ["admin-guarantee-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guarantee_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFeatures((data.features as any[]) || []);
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("guarantee_settings")
        .update(values)
        .eq("id", guaranteeSettings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guarantee-settings"] });
      queryClient.invalidateQueries({ queryKey: ["guarantee-settings"] });
      toast.success("تم تحديث إعدادات الضمان بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء التحديث");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const values = {
      is_active: formData.get("is_active") === "true",
      banner_title_ar: formData.get("banner_title_ar"),
      banner_description_ar: formData.get("banner_description_ar"),
      page_title_ar: formData.get("page_title_ar"),
      page_subtitle_ar: formData.get("page_subtitle_ar"),
      page_description_ar: formData.get("page_description_ar"),
      terms_ar: formData.get("terms_ar"),
      contact_title_ar: formData.get("contact_title_ar"),
      contact_description_ar: formData.get("contact_description_ar"),
      features: features,
    };

    updateMutation.mutate(values);
  };

  const addFeature = () => {
    setFeatures([
      ...features,
      {
        icon: "check",
        title_ar: "",
        description_ar: "",
      },
    ]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <AdminBackButton />
        <div className="flex items-center justify-center h-64">
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <AdminBackButton />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-lg bg-primary/10">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">إدارة صفحة الضمان</h1>
          <p className="text-muted-foreground">تعديل محتوى صفحة الضمان والبنر</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>حالة العرض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                name="is_active"
                defaultChecked={guaranteeSettings?.is_active}
                value={guaranteeSettings?.is_active ? "true" : "false"}
              />
              <Label>عرض صفحة الضمان والبنر</Label>
            </div>
          </CardContent>
        </Card>

        {/* Banner Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات البنر</CardTitle>
            <CardDescription>النص الذي يظهر في بنر الضمان بالصفحة الرئيسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="banner_title_ar">عنوان البنر</Label>
              <Input
                id="banner_title_ar"
                name="banner_title_ar"
                defaultValue={guaranteeSettings?.banner_title_ar || ""}
                placeholder="منتجات أصلية ومضمونة"
              />
            </div>
            <div>
              <Label htmlFor="banner_description_ar">وصف البنر</Label>
              <Input
                id="banner_description_ar"
                name="banner_description_ar"
                defaultValue={guaranteeSettings?.banner_description_ar || ""}
                placeholder="تعرفي أكثر على ضمان هدير"
              />
            </div>
          </CardContent>
        </Card>

        {/* Page Content */}
        <Card>
          <CardHeader>
            <CardTitle>محتوى الصفحة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="page_title_ar">عنوان الصفحة الرئيسي</Label>
              <Input
                id="page_title_ar"
                name="page_title_ar"
                defaultValue={guaranteeSettings?.page_title_ar || ""}
                placeholder="ضمان الاسترجاع"
              />
            </div>
            <div>
              <Label htmlFor="page_subtitle_ar">العنوان الفرعي</Label>
              <Input
                id="page_subtitle_ar"
                name="page_subtitle_ar"
                defaultValue={guaranteeSettings?.page_subtitle_ar || ""}
                placeholder="نضمن لك حقك في الاسترجاع بكل سهولة"
              />
            </div>
            <div>
              <Label htmlFor="page_description_ar">الوصف الرئيسي</Label>
              <Textarea
                id="page_description_ar"
                name="page_description_ar"
                defaultValue={guaranteeSettings?.page_description_ar || ""}
                placeholder="نحن نضمن لك حقك في استرجاع المنتج"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>مميزات الضمان</CardTitle>
                <CardDescription>الخصائص التي تظهر في صفحة الضمان</CardDescription>
              </div>
              <Button type="button" onClick={addFeature} size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة ميزة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>الميزة {index + 1}</Label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Label>الأيقونة</Label>
                    <Select
                      value={feature.icon}
                      onValueChange={(value) => updateFeature(index, "icon", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shield">درع (Shield)</SelectItem>
                        <SelectItem value="refresh">تحديث (Refresh)</SelectItem>
                        <SelectItem value="check">علامة صح (Check)</SelectItem>
                        <SelectItem value="coins">عملات (Coins)</SelectItem>
                        <SelectItem value="package">صندوق (Package)</SelectItem>
                        <SelectItem value="truck">شاحنة (Truck)</SelectItem>
                        <SelectItem value="headphones">سماعات (Headphones)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>العنوان</Label>
                    <Input
                      value={feature.title_ar}
                      onChange={(e) => updateFeature(index, "title_ar", e.target.value)}
                      placeholder="ضمان 30 يوم"
                    />
                  </div>
                  <div>
                    <Label>الوصف</Label>
                    <Textarea
                      value={feature.description_ar}
                      onChange={(e) => updateFeature(index, "description_ar", e.target.value)}
                      placeholder="يمكنك استرجاع المنتج خلال 30 يوم"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle>الشروط والأحكام</CardTitle>
            <CardDescription>ضع كل شرط في سطر منفصل</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="terms_ar"
              name="terms_ar"
              defaultValue={guaranteeSettings?.terms_ar || ""}
              placeholder="• يجب أن يكون المنتج في حالته الأصلية&#10;• يتم الاسترجاع خلال 30 يوم"
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>قسم التواصل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact_title_ar">عنوان قسم التواصل</Label>
              <Input
                id="contact_title_ar"
                name="contact_title_ar"
                defaultValue={guaranteeSettings?.contact_title_ar || ""}
                placeholder="تواصل معنا"
              />
            </div>
            <div>
              <Label htmlFor="contact_description_ar">وصف قسم التواصل</Label>
              <Textarea
                id="contact_description_ar"
                name="contact_description_ar"
                defaultValue={guaranteeSettings?.contact_description_ar || ""}
                placeholder="فريقنا جاهز لمساعدتك في أي استفسار"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminGuarantee;
