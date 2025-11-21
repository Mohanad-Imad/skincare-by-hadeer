import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const AdminMakeupBanner = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    image_url: "",
    background_color: "#FFC0CB",
    text_color: "#000000",
    button_text_ar: "تسوق الآن",
    button_text_en: "Shop Now",
    is_active: true,
    display_order: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-makeup-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("makeup_banner").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage.from("product-images").upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast.success("تم رفع الصورة بنجاح");
    } catch (error: any) {
      toast.error("خطأ في رفع الصورة: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("makeup_banner").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-banners"] });
      toast.success("تم إضافة البنر بنجاح");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("خطأ في إضافة البنر: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("makeup_banner").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-banners"] });
      toast.success("تم تحديث البنر بنجاح");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("خطأ في تحديث البنر: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("makeup_banner").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-banners"] });
      toast.success("تم حذف البنر بنجاح");
    },
    onError: (error: any) => {
      toast.error("خطأ في حذف البنر: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title_ar: "",
      title_en: "",
      description_ar: "",
      description_en: "",
      image_url: "",
      background_color: "#FFC0CB",
      text_color: "#000000",
      button_text_ar: "تسوق الآن",
      button_text_en: "Shop Now",
      is_active: true,
      display_order: 0,
    });
    setEditingId(null);
  };

  const handleEdit = (banner: any) => {
    setFormData(banner);
    setEditingId(banner.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto py-8">
        <div className="flex gap-6">
          <AdminSidebar />
          <div className="flex-1">
            <AdminBackButton />
            <Card>
              <CardHeader>
                <CardTitle>إدارة بنر المكياج</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>العنوان (عربي)</Label>
                      <Input
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>العنوان (إنجليزي)</Label>
                      <Input
                        value={formData.title_en}
                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الوصف (عربي)</Label>
                      <Textarea
                        value={formData.description_ar}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>الوصف (إنجليزي)</Label>
                      <Textarea
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>الصورة</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>لون الخلفية</Label>
                      <Input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>لون النص</Label>
                      <Input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نص الزر (عربي)</Label>
                      <Input
                        value={formData.button_text_ar}
                        onChange={(e) => setFormData({ ...formData, button_text_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>نص الزر (إنجليزي)</Label>
                      <Input
                        value={formData.button_text_en}
                        onChange={(e) => setFormData({ ...formData, button_text_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ترتيب العرض</Label>
                      <Input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            display_order: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>نشط</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{editingId ? "تحديث" : "إضافة"}</Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        إلغاء
                      </Button>
                    )}
                  </div>
                </form>

                <div className="space-y-4">
                  {isLoading ? (
                    <p>جاري التحميل...</p>
                  ) : (
                    banners?.map((banner) => (
                      <Card key={banner.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold">{banner.title_ar}</h3>
                              <p className="text-sm text-muted-foreground">{banner.description_ar}</p>
                              {banner.image_url && (
                                <img
                                  src={banner.image_url}
                                  alt={banner.title_ar}
                                  className="mt-2 w-32 h-32 object-cover rounded"
                                />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                                تعديل
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(banner.id)}>
                                حذف
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMakeupBanner;
