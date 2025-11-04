import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminProblemCategories() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("categories");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name_ar: "",
    name_en: "",
    slug: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  const [subProblemForm, setSubProblemForm] = useState({
    category_id: "",
    name_ar: "",
    name_en: "",
    slug: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-problem-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: subProblems } = useQuery({
    queryKey: ["admin-sub-problems", categories],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_problems")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!categories,
  });

  // ربط البيانات مع الأقسام الرئيسية
  const subProblemsWithCategories = subProblems?.map((subProblem) => {
    const category = categories?.find((cat) => cat.id === subProblem.category_id);
    return {
      ...subProblem,
      category_name_ar: category?.name_ar || "",
    };
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'category' | 'subproblem') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `problems/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      if (type === 'category') {
        setCategoryForm({ ...categoryForm, image_url: publicUrl });
      } else {
        setSubProblemForm({ ...subProblemForm, image_url: publicUrl });
      }

      toast.success("تم رفع الصورة بنجاح");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error?.message || "حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Saving category data:", data);
      if (editingItem) {
        const { error } = await supabase
          .from("problem_categories")
          .update(data)
          .eq("id", editingItem.id);
        if (error) {
          console.error("Update category error:", error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("problem_categories")
          .insert([data]);
        if (error) {
          console.error("Insert category error:", error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-problem-categories"] });
      toast.success(editingItem ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح");
      setIsDialogOpen(false);
      resetForms();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(error?.message || "حدث خطأ");
    },
  });

  const saveSubProblemMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Saving sub-problem data:", data);
      if (editingItem) {
        const { error } = await supabase
          .from("sub_problems")
          .update(data)
          .eq("id", editingItem.id);
        if (error) {
          console.error("Update sub-problem error:", error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("sub_problems")
          .insert([data]);
        if (error) {
          console.error("Insert sub-problem error:", error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-problems"] });
      toast.success(editingItem ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح");
      setIsDialogOpen(false);
      resetForms();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(error?.message || "حدث خطأ");
    },
  });

  const resetForms = () => {
    setCategoryForm({
      name_ar: "",
      name_en: "",
      slug: "",
      image_url: "",
      display_order: 0,
      is_active: true,
    });
    setSubProblemForm({
      category_id: "",
      name_ar: "",
      name_en: "",
      slug: "",
      image_url: "",
      display_order: 0,
      is_active: true,
    });
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <AdminBackButton />
      <h2 className="text-2xl font-bold">إدارة التسوق حسب المشكلة</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">الأقسام الرئيسية</TabsTrigger>
          <TabsTrigger value="subproblems">المشاكل الفرعية</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Dialog open={isDialogOpen && activeTab === "categories"} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForms(); setActiveTab("categories"); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة قسم رئيسي
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "تعديل قسم" : "إضافة قسم رئيسي"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveCategoryMutation.mutate(categoryForm); }} className="space-y-4">
                <div>
                  <Label>الاسم بالعربي</Label>
                  <Input value={categoryForm.name_ar} onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })} required />
                </div>
                <div>
                  <Label>الاسم بالإنجليزي</Label>
                  <Input value={categoryForm.name_en} onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })} required />
                </div>
                <div>
                  <Label>الرابط (slug)</Label>
                  <Input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} required />
                </div>
                <div>
                  <Label>الصورة</Label>
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/webp" 
                    onChange={(e) => handleImageUpload(e, 'category')} 
                    disabled={uploadingImage} 
                  />
                  {categoryForm.image_url && (
                    <img 
                      src={categoryForm.image_url} 
                      alt="Preview" 
                      className="mt-2 h-20 w-20 object-cover rounded" 
                    />
                  )}
                  {uploadingImage && <p className="text-sm text-muted-foreground mt-1">جاري رفع الصورة...</p>}
                </div>
                <div>
                  <Label>ترتيب العرض</Label>
                  <Input type="number" value={categoryForm.display_order} onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={categoryForm.is_active} onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })} />
                  <Label>نشط</Label>
                </div>
                <Button type="submit">حفظ</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {cat.image_url && <img src={cat.image_url} alt={cat.name_ar} className="h-12 w-12 object-cover rounded" />}
                  </TableCell>
                  <TableCell>{cat.name_ar}</TableCell>
                  <TableCell>{cat.is_active ? "نشط" : "غير نشط"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingItem(cat); setCategoryForm(cat); setIsDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="subproblems" className="space-y-4">
          <Dialog open={isDialogOpen && activeTab === "subproblems"} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForms(); setActiveTab("subproblems"); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة مشكلة فرعية
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "تعديل مشكلة" : "إضافة مشكلة فرعية"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveSubProblemMutation.mutate(subProblemForm); }} className="space-y-4">
                <div>
                  <Label>القسم الرئيسي</Label>
                  <select className="w-full border rounded p-2" value={subProblemForm.category_id} onChange={(e) => setSubProblemForm({ ...subProblemForm, category_id: e.target.value })} required>
                    <option value="">اختر قسماً</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>الاسم بالعربي</Label>
                  <Input value={subProblemForm.name_ar} onChange={(e) => setSubProblemForm({ ...subProblemForm, name_ar: e.target.value })} required />
                </div>
                <div>
                  <Label>الاسم بالإنجليزي</Label>
                  <Input value={subProblemForm.name_en} onChange={(e) => setSubProblemForm({ ...subProblemForm, name_en: e.target.value })} required />
                </div>
                <div>
                  <Label>الرابط (slug)</Label>
                  <Input value={subProblemForm.slug} onChange={(e) => setSubProblemForm({ ...subProblemForm, slug: e.target.value })} required />
                </div>
                <div>
                  <Label>الصورة</Label>
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/webp" 
                    onChange={(e) => handleImageUpload(e, 'subproblem')} 
                    disabled={uploadingImage} 
                  />
                  {subProblemForm.image_url && (
                    <img 
                      src={subProblemForm.image_url} 
                      alt="Preview" 
                      className="mt-2 h-20 w-20 object-cover rounded" 
                    />
                  )}
                  {uploadingImage && <p className="text-sm text-muted-foreground mt-1">جاري رفع الصورة...</p>}
                </div>
                <div>
                  <Label>ترتيب العرض</Label>
                  <Input type="number" value={subProblemForm.display_order} onChange={(e) => setSubProblemForm({ ...subProblemForm, display_order: parseInt(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={subProblemForm.is_active} onCheckedChange={(checked) => setSubProblemForm({ ...subProblemForm, is_active: checked })} />
                  <Label>نشط</Label>
                </div>
                <Button type="submit">حفظ</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>القسم الرئيسي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subProblemsWithCategories?.map((prob: any) => (
                <TableRow key={prob.id}>
                  <TableCell>
                    {prob.image_url && <img src={prob.image_url} alt={prob.name_ar} className="h-12 w-12 object-cover rounded" />}
                  </TableCell>
                  <TableCell>{prob.name_ar}</TableCell>
                  <TableCell>{prob.category_name_ar}</TableCell>
                  <TableCell>{prob.is_active ? "نشط" : "غير نشط"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingItem(prob); setSubProblemForm(prob); setIsDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
