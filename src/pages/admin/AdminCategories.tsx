import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    image_url: "",
    display_order: 0,
    is_active: true,
    parent_category_id: "none",
  });
  const [uploading, setUploading] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("categories").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم إضافة التصنيف بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة التصنيف"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم تحديث التصنيف بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث التصنيف"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("تم حذف التصنيف بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حذف التصنيف"),
  });

  const resetForm = () => {
    setFormData({
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      image_url: "",
      display_order: 0,
      is_active: true,
      parent_category_id: "none",
    });
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      parent_category_id: formData.parent_category_id === "none" ? null : formData.parent_category_id,
    };
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      description_ar: category.description_ar || "",
      description_en: category.description_en || "",
      image_url: category.image_url || "",
      display_order: category.display_order || 0,
      is_active: category.is_active ?? true,
      parent_category_id: category.parent_category_id || "none",
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <AdminBackButton />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">إدارة التصنيفات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة تصنيف جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "تعديل تصنيف" : "إضافة تصنيف جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_ar">الاسم بالعربية</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) =>
                    setFormData({ ...formData, name_en: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description_ar">الوصف بالعربية</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, description_ar: e.target.value })
                  }
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description_en">الوصف بالإنجليزية</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData({ ...formData, description_en: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">صورة القسم</Label>
                {formData.image_url && (
                  <div className="mb-2">
                    <img src={formData.image_url} alt="Category" className="h-32 w-32 object-cover rounded" />
                  </div>
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">ترتيب العرض</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
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
                <Label htmlFor="is_active" className="cursor-pointer">
                  {formData.is_active ? "نشط" : "غير نشط"}
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_category_id">القسم الرئيسي (اختياري)</Label>
                <Select
                  value={formData.parent_category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent_category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم الرئيسي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">لا يوجد (قسم رئيسي)</SelectItem>
                    {categories
                      ?.filter((cat) => !cat.parent_category_id && cat.id !== editingCategory?.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_ar}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingCategory ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الصورة</TableHead>
              <TableHead>الاسم بالعربية</TableHead>
              <TableHead>الاسم بالإنجليزية</TableHead>
              <TableHead>الترتيب</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories
              ?.filter((cat) => !cat.parent_category_id)
              .map((mainCategory) => (
                <>
                  <TableRow key={mainCategory.id} className="bg-muted/50">
                    <TableCell>
                      {mainCategory.image_url ? (
                        <img src={mainCategory.image_url} alt={mainCategory.name_ar} className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          لا صورة
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">{mainCategory.name_ar}</TableCell>
                    <TableCell className="font-bold">{mainCategory.name_en}</TableCell>
                    <TableCell>{(mainCategory as any).display_order || 0}</TableCell>
                    <TableCell>
                      {(mainCategory as any).is_active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Eye className="h-4 w-4" />
                          نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <EyeOff className="h-4 w-4" />
                          غير نشط
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">قسم رئيسي</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(mainCategory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(mainCategory.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {categories
                    ?.filter((cat) => cat.parent_category_id === mainCategory.id)
                    .map((subCategory) => (
                      <TableRow key={subCategory.id}>
                        <TableCell>
                          {subCategory.image_url ? (
                            <img src={subCategory.image_url} alt={subCategory.name_ar} className="h-10 w-10 object-cover rounded mr-8" />
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground mr-8">
                              لا صورة
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="pr-8">↳ {subCategory.name_ar}</TableCell>
                        <TableCell>↳ {subCategory.name_en}</TableCell>
                        <TableCell>{(subCategory as any).display_order || 0}</TableCell>
                        <TableCell>
                          {(subCategory as any).is_active ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Eye className="h-4 w-4" />
                              نشط
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400">
                              <EyeOff className="h-4 w-4" />
                              غير نشط
                            </span>
                          )}
                        </TableCell>
                        <TableCell>قسم فرعي</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(subCategory)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(subCategory.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCategories;
