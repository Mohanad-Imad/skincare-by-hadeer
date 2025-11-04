import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface BrandLink {
  id: string;
  title_ar: string;
  title_en: string | null;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

const AdminBrandsLinks = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandLink | null>(null);
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    image_url: "",
    link_url: "",
    display_order: 0,
    is_active: true,
  });

  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands_links")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as BrandLink[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newBrand: typeof formData) => {
      const { data, error } = await supabase
        .from("brands_links")
        .insert([newBrand])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-links"] });
      toast.success("تم إضافة الماركة بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة الماركة");
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
        .from("brands_links")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-links"] });
      toast.success("تم تحديث الماركة بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث الماركة");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("brands_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-links"] });
      toast.success("تم حذف الماركة بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف الماركة");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      title_ar: "",
      title_en: "",
      image_url: "",
      link_url: "",
      display_order: 0,
      is_active: true,
    });
    setEditingBrand(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (brand: BrandLink) => {
    setEditingBrand(brand);
    setFormData({
      title_ar: brand.title_ar,
      title_en: brand.title_en || "",
      image_url: brand.image_url,
      link_url: brand.link_url,
      display_order: brand.display_order,
      is_active: brand.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

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
        title="إدارة ماركاتنا"
        description="إدارة روابط الماركات السريعة"
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <AdminBackButton />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ماركاتنا</CardTitle>
                <CardDescription>إدارة روابط الماركات السريعة</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة ماركة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBrand ? "تعديل الماركة" : "إضافة ماركة جديدة"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_ar">الاسم (عربي) *</Label>
                        <Input
                          id="title_ar"
                          value={formData.title_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, title_ar: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title_en">الاسم (إنجليزي)</Label>
                        <Input
                          id="title_en"
                          value={formData.title_en}
                          onChange={(e) =>
                            setFormData({ ...formData, title_en: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">صورة الماركة *</Label>
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
                          className="mt-2 h-32 w-32 object-contain rounded border"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link_url">رابط الماركة *</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) =>
                          setFormData({ ...formData, link_url: e.target.value })
                        }
                        placeholder="/products?company=BrandName"
                        required
                      />
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
                        {editingBrand ? "تحديث" : "إضافة"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>جاري التحميل...</div>
              ) : brands && brands.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="relative group border rounded-lg p-4 hover:shadow-lg transition-all"
                    >
                      <img
                        src={brand.image_url}
                        alt={brand.title_ar}
                        className="w-full h-24 object-contain mb-2"
                      />
                      <p className="text-sm font-medium text-center truncate">
                        {brand.title_ar}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            brand.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {brand.is_active ? "نشط" : "غير نشط"}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(brand)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(brand.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  لا توجد ماركات. قم بإضافة ماركة جديدة للبدء.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminBrandsLinks;
