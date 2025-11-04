import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminMakeupCategories = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    slug: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-makeup-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("makeup_categories")
        .select("*")
        .order("display_order");
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
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

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
      const { error } = await supabase.from("makeup_categories").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-categories"] });
      toast.success("تم إضافة القسم بنجاح");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("خطأ في إضافة القسم: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: typeof formData;
    }) => {
      const { error } = await supabase
        .from("makeup_categories")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-categories"] });
      toast.success("تم تحديث القسم بنجاح");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("خطأ في تحديث القسم: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("makeup_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-categories"] });
      toast.success("تم حذف القسم بنجاح");
    },
    onError: (error: any) => {
      toast.error("خطأ في حذف القسم: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name_ar: "",
      name_en: "",
      slug: "",
      image_url: "",
      display_order: 0,
      is_active: true,
    });
    setEditingId(null);
  };

  const handleEdit = (category: any) => {
    setFormData(category);
    setEditingId(category.id);
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
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="flex gap-6">
          <AdminSidebar />
          <div className="flex-1">
            <AdminBackButton />
            <Card>
              <CardHeader>
                <CardTitle>إدارة أقسام المكياج</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الاسم (عربي) *</Label>
                      <Input
                        required
                        value={formData.name_ar}
                        onChange={(e) =>
                          setFormData({ ...formData, name_ar: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>الاسم (إنجليزي) *</Label>
                      <Input
                        required
                        value={formData.name_en}
                        onChange={(e) =>
                          setFormData({ ...formData, name_en: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>الرابط (Slug) *</Label>
                    <Input
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="foundation"
                    />
                  </div>

                  <div>
                    <Label>الصورة</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="mt-2 w-32 h-32 object-cover rounded"
                      />
                    )}
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
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label>نشط</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingId ? "تحديث" : "إضافة"}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        إلغاء
                      </Button>
                    )}
                  </div>
                </form>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow dir="rtl">
                        <TableHead className="text-right">الصورة</TableHead>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">الرابط</TableHead>
                        <TableHead className="text-right">الترتيب</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            جاري التحميل...
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories?.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell>
                              {category.image_url ? (
                                <img
                                  src={category.image_url}
                                  alt={category.name_ar}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                  💄
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{category.name_ar}</TableCell>
                            <TableCell>{category.slug}</TableCell>
                            <TableCell>{category.display_order}</TableCell>
                            <TableCell>
                              {category.is_active ? "نشط" : "غير نشط"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(category)}
                                >
                                  تعديل
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(category.id)}
                                >
                                  حذف
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMakeupCategories;
