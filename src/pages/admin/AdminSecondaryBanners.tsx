import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SEO } from "@/components/SEO";

interface SecondaryBanner {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_url: string;
  link_url: string | null;
  button_text_ar: string | null;
  button_text_en: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminSecondaryBanners = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SecondaryBanner | null>(null);
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    image_url: "",
    link_url: "",
    button_text_ar: "تسوق الآن",
    button_text_en: "Shop Now",
    display_order: 0,
    is_active: true,
  });

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-secondary-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secondary_banners")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as SecondaryBanner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("secondary_banners")
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-secondary-banners"] });
      queryClient.invalidateQueries({ queryKey: ["secondary-banners"] });
      toast.success("تم إضافة البانر بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة البانر");
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("secondary_banners")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-secondary-banners"] });
      queryClient.invalidateQueries({ queryKey: ["secondary-banners"] });
      toast.success("تم تحديث البانر بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث البانر");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("secondary_banners")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-secondary-banners"] });
      queryClient.invalidateQueries({ queryKey: ["secondary-banners"] });
      toast.success("تم حذف البانر بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف البانر");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      title_ar: "",
      title_en: "",
      description_ar: "",
      description_en: "",
      image_url: "",
      link_url: "",
      button_text_ar: "تسوق الآن",
      button_text_en: "Shop Now",
      display_order: 0,
      is_active: true,
    });
    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: SecondaryBanner) => {
    setEditingBanner(banner);
    setFormData({
      title_ar: banner.title_ar || "",
      title_en: banner.title_en || "",
      description_ar: banner.description_ar || "",
      description_en: banner.description_en || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      button_text_ar: banner.button_text_ar || "تسوق الآن",
      button_text_en: banner.button_text_en || "Shop Now",
      display_order: banner.display_order,
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الصورة");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="إدارة البانرات الثانوية"
        description="إدارة البانرات الثانوية"
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>إدارة البانرات الثانوية</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة بانر
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBanner ? "تعديل البانر" : "إضافة بانر جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title_ar">العنوان (عربي)</Label>
                        <Input
                          id="title_ar"
                          value={formData.title_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, title_ar: e.target.value })
                          }
                        />
                      </div>
                      <div>
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
                      <div>
                        <Label htmlFor="description_ar">الوصف (عربي)</Label>
                        <Textarea
                          id="description_ar"
                          value={formData.description_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, description_ar: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
                        <Textarea
                          id="description_en"
                          value={formData.description_en}
                          onChange={(e) =>
                            setFormData({ ...formData, description_en: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="image">الصورة</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      {formData.image_url && (
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="mt-2 h-32 w-full object-cover rounded"
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="link_url">رابط URL</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) =>
                          setFormData({ ...formData, link_url: e.target.value })
                        }
                        placeholder="/products أو https://example.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="button_text_ar">نص الزر (عربي)</Label>
                        <Input
                          id="button_text_ar"
                          value={formData.button_text_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, button_text_ar: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="button_text_en">نص الزر (إنجليزي)</Label>
                        <Input
                          id="button_text_en"
                          value={formData.button_text_en}
                          onChange={(e) =>
                            setFormData({ ...formData, button_text_en: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="display_order">ترتيب العرض</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            display_order: parseInt(e.target.value) || 0,
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

                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingBanner ? "تحديث" : "إضافة"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>جاري التحميل...</p>
              ) : banners && banners.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الصورة</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الرابط</TableHead>
                      <TableHead>الترتيب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell>
                          <img
                            src={banner.image_url}
                            alt={banner.title_ar || ""}
                            className="h-16 w-24 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell>{banner.title_ar}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {banner.link_url}
                        </TableCell>
                        <TableCell>{banner.display_order}</TableCell>
                        <TableCell>
                          {banner.is_active ? "نشط" : "غير نشط"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(banner)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteMutation.mutate(banner.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد بانرات حالياً
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminSecondaryBanners;
