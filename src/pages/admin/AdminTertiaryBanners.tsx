import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { SEO } from "@/components/SEO";

interface TertiaryBanner {
  id: string;
  image_url_desktop?: string;
  image_url_tablet?: string;
  image_url_mobile?: string;
  image_url?: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminTertiaryBanners = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<TertiaryBanner | null>(null);
  const [formData, setFormData] = useState({
    image_url_desktop: "",
    image_url_tablet: "",
    image_url_mobile: "",
    image_url: "", // fallback for backward compatibility
    link_url: "",
    display_order: 0,
    is_active: true,
  });

  const { data: banners, isLoading } = useQuery({
    queryKey: ["tertiary-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tertiary_banners")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as TertiaryBanner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newBanner: typeof formData) => {
      const { data, error } = await supabase
        .from("tertiary_banners")
        .insert([newBanner])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tertiary-banners"] });
      toast.success("تم إضافة البنر بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة البنر");
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: typeof formData;
    }) => {
      const { data, error } = await supabase
        .from("tertiary_banners")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tertiary-banners"] });
      toast.success("تم تحديث البنر بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث البنر");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tertiary_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tertiary-banners"] });
      toast.success("تم حذف البنر بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف البنر");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      image_url_desktop: "",
      image_url_tablet: "",
      image_url_mobile: "",
      link_url: "",
      display_order: 0,
      is_active: true,
    });
    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: TertiaryBanner) => {
    setEditingBanner(banner);
    setFormData({
      image_url_desktop: banner.image_url_desktop || "",
      image_url_tablet: banner.image_url_tablet || "",
      image_url_mobile: banner.image_url_mobile || "",
      link_url: banner.link_url || "",
      display_order: banner.display_order,
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'desktop' | 'tablet' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setFormData({ ...formData, [`image_url_${imageType}`]: publicUrl });
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الصورة");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="إدارة البنرات العلوية"
        description="إدارة البنرات العلوية"
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <AdminBackButton />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>البنرات العلوية</CardTitle>
                <CardDescription>إدارة البنرات الإعلانية العلوية</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة بنر جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBanner ? "تعديل البنر" : "إضافة بنر جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_ar">العنوان (عربي)</Label>
                        <Input
                          id="title_ar"
                          value={formData.title_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, title_ar: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title_en">العنوان (إنجليزي)</Label>
                        <Input
                          id="title_en"
                          value={formData.title_en}
                          onChange={(e) =>
                            setFormData({ ...formData, title_en: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="description_ar">الوصف (عربي)</Label>
                        <Textarea
                          id="description_ar"
                          value={formData.description_ar}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description_ar: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
                        <Textarea
                          id="description_en"
                          value={formData.description_en}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description_en: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>صورة Desktop</Label>
                      <Input type="file" accept="image/*" onChange={(e) => { handleImageUpload(e, 'desktop'); }} />
                      {formData.image_url_desktop && <img src={formData.image_url_desktop} className="mt-2 h-20 rounded" />}
                    </div>
                    <div className="space-y-2">
                      <Label>صورة Tablet</Label>
                      <Input type="file" accept="image/*" onChange={(e) => { handleImageUpload(e, 'tablet'); }} />
                      {formData.image_url_tablet && <img src={formData.image_url_tablet} className="mt-2 h-20 rounded" />}
                    </div>
                    <div className="space-y-2">
                      <Label>صورة Mobile</Label>
                      <Input type="file" accept="image/*" onChange={(e) => { handleImageUpload(e, 'mobile'); }} />
                      {formData.image_url_mobile && <img src={formData.image_url_mobile} className="mt-2 h-20 rounded" />}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link_url">رابط البنر</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) =>
                          setFormData({ ...formData, link_url: e.target.value })
                        }
                        placeholder="/products أو رابط خارجي"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="button_text_ar">نص الزر (عربي)</Label>
                        <Input
                          id="button_text_ar"
                          value={formData.button_text_ar}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              button_text_ar: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="button_text_en">نص الزر (إنجليزي)</Label>
                        <Input
                          id="button_text_en"
                          value={formData.button_text_en}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              button_text_en: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_order">ترتيب العرض</Label>
                      <Input
                        id="display_order"
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

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label htmlFor="is_active">نشط</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        إلغاء
                      </Button>
                      <Button type="submit">
                        {editingBanner ? "تحديث" : "إضافة"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>جاري التحميل...</div>
              ) : banners && banners.length > 0 ? (
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <img
                        src={banner.image_url}
                        alt={banner.title_ar || ""}
                        className="h-20 w-40 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{banner.title_ar}</h3>
                        <p className="text-sm text-muted-foreground">
                          {banner.description_ar}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs">
                            الترتيب: {banner.display_order}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              banner.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {banner.is_active ? "نشط" : "غير نشط"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  لا توجد بنرات. قم بإضافة بنر جديد للبدء.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminTertiaryBanners;
