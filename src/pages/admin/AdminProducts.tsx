import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name_ar: "",
    company_name_ar: "",
    description_ar: "",
    image_url: "",
    category_id: "",
    skin_type: [] as string[],
    is_featured: false,
    is_active: true,
  });

  const [variants, setVariants] = useState<any[]>([]);
  const [newVariant, setNewVariant] = useState({
    size_ar: "",
    price: "",
    stock_quantity: "",
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const skinTypes = [
    { value: "oily", label_ar: "دهنية", label_en: "Oily" },
    { value: "dry", label_ar: "جافة", label_en: "Dry" },
    { value: "combination", label_ar: "مختلطة", label_en: "Combination" },
    { value: "sensitive", label_ar: "حساسة", label_en: "Sensitive" },
    { value: "normal", label_ar: "عادية", label_en: "Normal" },
  ];

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: product, error } = await supabase
        .from("products")
        .insert([data])
        .select()
        .single();
      if (error) throw error;

      // إضافة المتغيرات
      if (variants.length > 0) {
        const variantsData = variants.map((v) => ({
          size_ar: v.size_ar,
          size_en: v.size_ar,
          price: v.price,
          stock_quantity: v.stock_quantity,
          product_id: product.id,
        }));
        const { error: variantsError } = await supabase
          .from("product_variants")
          .insert(variantsData);
        if (variantsError) throw variantsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "product" });
      toast.success("تم إضافة المنتج بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة المنتج"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("products")
        .update(data)
        .eq("id", id);
      if (error) throw error;

      // حذف المتغيرات القديمة
      await supabase.from("product_variants").delete().eq("product_id", id);

      // إضافة المتغيرات الجديدة
      if (variants.length > 0) {
        const variantsData = variants.map((v) => ({
          size_ar: v.size_ar,
          size_en: v.size_ar,
          price: v.price,
          stock_quantity: v.stock_quantity,
          product_id: id,
        }));
        const { error: variantsError } = await supabase
          .from("product_variants")
          .insert(variantsData);
        if (variantsError) throw variantsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "product" });
      toast.success("تم تحديث المنتج بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث المنتج"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "product" });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حذف المنتج"),
  });

  const resetForm = () => {
    setFormData({
      name_ar: "",
      company_name_ar: "",
      description_ar: "",
      image_url: "",
      category_id: "",
      skin_type: [],
      is_featured: false,
      is_active: true,
    });
    setVariants([]);
    setNewVariant({
      size_ar: "",
      price: "",
      stock_quantity: "",
    });
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = async (product: any) => {
    setEditingProduct(product);
    setFormData({
      name_ar: product.name_ar,
      company_name_ar: product.company_name_ar || "",
      description_ar: product.description_ar || "",
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      skin_type: product.skin_type || [],
      is_featured: product.is_featured,
      is_active: product.is_active,
    });

    // جلب المتغيرات
    const { data: variantsData } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);
    
    if (variantsData) {
      setVariants(variantsData);
    }

    setIsDialogOpen(true);
  };

  const handleAddVariant = () => {
    if (!newVariant.size_ar || !newVariant.price) {
      toast.error("يرجى ملء جميع حقول المتغير");
      return;
    }
    setVariants([...variants, { ...newVariant, price: parseFloat(newVariant.price), stock_quantity: parseInt(newVariant.stock_quantity) || 0 }]);
    setNewVariant({
      size_ar: "",
      price: "",
      stock_quantity: "",
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const toggleSkinType = (type: string) => {
    if (formData.skin_type.includes(type)) {
      setFormData({
        ...formData,
        skin_type: formData.skin_type.filter((t) => t !== type),
      });
    } else {
      setFormData({
        ...formData,
        skin_type: [...formData.skin_type, type],
      });
    }
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">إدارة المنتجات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة منتج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_ar">اسم المنتج</Label>
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
                <Label htmlFor="company_name_ar">اسم الشركة</Label>
                <Input
                  id="company_name_ar"
                  value={formData.company_name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name_ar: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ar">الوصف</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, description_ar: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">رابط الصورة</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">التصنيف</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مناسب لنوع البشرة</Label>
                <div className="space-y-2">
                  {skinTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={type.value}
                        checked={formData.skin_type.includes(type.value)}
                        onCheckedChange={() => toggleSkinType(type.value)}
                      />
                      <Label htmlFor={type.value} className="cursor-pointer">
                        {type.label_ar}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 border-t pt-4">
                <Label className="text-lg font-semibold">الأحجام والأسعار</Label>
                {variants.length > 0 && (
                  <div className="space-y-2">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1">
                          {variant.size_ar} - {Math.round(variant.price)} د.ع - المخزون: {variant.stock_quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariant(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="الحجم"
                    value={newVariant.size_ar}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, size_ar: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="السعر"
                    value={newVariant.price}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, price: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="الكمية في المخزون"
                    value={newVariant.stock_quantity}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, stock_quantity: e.target.value })
                    }
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleAddVariant} className="w-full">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة حجم وسعر
                </Button>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
                <Label htmlFor="is_featured">منتج مميز</Label>
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
              <Button type="submit" className="w-full">
                {editingProduct ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>مميز</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name_ar}</TableCell>
                <TableCell>{product.is_featured ? "نعم" : "لا"}</TableCell>
                <TableCell>{product.is_active ? "نشط" : "غير نشط"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProducts;
