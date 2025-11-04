import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, X, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productImages, setProductImages] = useState<Array<{ url: string; id?: string; display_order: number }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [parentCategoryFilter, setParentCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [newArrivalFilter, setNewArrivalFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [parentCategoryId, setParentCategoryId] = useState("");
  
  const [formData, setFormData] = useState({
    name_ar: "",
    company_name_ar: "",
    description_ar: "",
    image_url: "",
    category_id: "",
    skin_type: [] as string[],
    is_featured: false,
    is_new_arrival: false,
    is_active: true,
  });

  const [selectedSubProblems, setSelectedSubProblems] = useState<string[]>([]);

  const [variants, setVariants] = useState<any[]>([]);
  const [newVariant, setNewVariant] = useState({
    size_ar: "",
    price: "",
    stock_quantity: "",
  });

  // جلب جميع الأقسام
  const { data: allCategories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  // الأقسام الرئيسية
  const parentCategories = allCategories?.filter(cat => !cat.parent_category_id) || [];
  
  // الأقسام الفرعية للقسم الرئيسي المختار
  const subCategories = allCategories?.filter(cat => cat.parent_category_id === parentCategoryId) || [];
  
  // للعرض في الفلتر - جلب الأقسام الفرعية فقط
  const { data: categories } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, parent:parent_category_id(name_ar)")
        .not("parent_category_id", "is", null)
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

  // جلب أقسام المشاكل
  const { data: problemCategories } = useQuery({
    queryKey: ["problem-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_categories")
        .select(`
          *,
          sub_problems (*)
        `)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

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
      // تعيين الصورة الأولى كصورة غلاف
      const productData = {
        ...data,
        image_url: productImages.length > 0 ? productImages[0].url : data.image_url,
      };

      const { data: product, error } = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();
      if (error) throw error;

      // إضافة الصور
      if (productImages.length > 0) {
        const imagesData = productImages.map((img, index) => ({
          product_id: product.id,
          image_url: img.url,
          display_order: index,
        }));
        const { error: imagesError } = await supabase
          .from("product_images")
          .insert(imagesData);
        if (imagesError) throw imagesError;
      }

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

      // إضافة المشاكل المرتبطة بالمنتج
      if (selectedSubProblems.length > 0) {
        const problemsData = selectedSubProblems.map((subProblemId) => ({
          product_id: product.id,
          sub_problem_id: subProblemId,
        }));
        const { error: problemsError } = await supabase
          .from("product_sub_problems")
          .insert(problemsData);
        if (problemsError) throw problemsError;
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
      // تعيين الصورة الأولى كصورة غلاف
      const productData = {
        ...data,
        image_url: productImages.length > 0 ? productImages[0].url : data.image_url,
      };

      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", id);
      if (error) throw error;

      // حذف الصور القديمة من قاعدة البيانات
      const { data: oldImages } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id);

      if (oldImages) {
        // حذف الملفات من storage
        const filesToDelete = oldImages
          .map((img) => {
            const url = new URL(img.image_url);
            const path = url.pathname.split('/').pop();
            return `${id}/${path}`;
          })
          .filter(Boolean);

        if (filesToDelete.length > 0) {
          await supabase.storage
            .from("product-images")
            .remove(filesToDelete);
        }
      }

      await supabase.from("product_images").delete().eq("product_id", id);

      // إضافة الصور الجديدة
      if (productImages.length > 0) {
        const imagesData = productImages.map((img, index) => ({
          product_id: id,
          image_url: img.url,
          display_order: index,
        }));
        const { error: imagesError } = await supabase
          .from("product_images")
          .insert(imagesData);
        if (imagesError) throw imagesError;
      }

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

      // حذف المشاكل القديمة
      await supabase.from("product_sub_problems").delete().eq("product_id", id);

      // إضافة المشاكل الجديدة
      if (selectedSubProblems.length > 0) {
        const problemsData = selectedSubProblems.map((subProblemId) => ({
          product_id: id,
          sub_problem_id: subProblemId,
        }));
        const { error: problemsError } = await supabase
          .from("product_sub_problems")
          .insert(problemsData);
        if (problemsError) throw problemsError;
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
      is_new_arrival: false,
      is_active: true,
    });
    setParentCategoryId("");
    setVariants([]);
    setProductImages([]);
    setSelectedSubProblems([]);
    setNewVariant({
      size_ar: "",
      price: "",
      stock_quantity: "",
    });
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      name_en: formData.name_ar, // استخدام القيمة العربية كقيمة افتراضية
      company_name_en: formData.company_name_ar || null,
      description_en: formData.description_ar || null,
    };
    
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = async (product: any) => {
    setEditingProduct(product);
    
    // إيجاد القسم الرئيسي من القسم الفرعي
    const selectedCategory = allCategories?.find(cat => cat.id === product.category_id);
    if (selectedCategory?.parent_category_id) {
      setParentCategoryId(selectedCategory.parent_category_id);
    }
    
    setFormData({
      name_ar: product.name_ar,
      company_name_ar: product.company_name_ar || "",
      description_ar: product.description_ar || "",
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      skin_type: product.skin_type || [],
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival || false,
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

    // جلب الصور
    const { data: imagesData } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("display_order");

    if (imagesData && imagesData.length > 0) {
      setProductImages(imagesData.map((img) => ({
        url: img.image_url,
        id: img.id,
        display_order: img.display_order,
      })));
    }

    // جلب المشاكل المرتبطة بالمنتج
    const { data: problemsData } = await supabase
      .from("product_sub_problems")
      .select("sub_problem_id")
      .eq("product_id", product.id);

    if (problemsData) {
      setSelectedSubProblems(problemsData.map((p) => p.sub_problem_id));
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - productImages.length;
    if (files.length > remainingSlots) {
      toast.error(`يمكنك رفع ${remainingSlots} صورة فقط`);
      return;
    }

    setUploadingImages(true);

    try {
      const uploadedUrls: Array<{ url: string; display_order: number }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const productId = editingProduct?.id || `temp-${Date.now()}`;
        const filePath = `${productId}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        uploadedUrls.push({
          url: publicUrl,
          display_order: productImages.length + i,
        });
      }

      setProductImages([...productImages, ...uploadedUrls]);
      toast.success("تم رفع الصور بنجاح");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("حدث خطأ أثناء رفع الصور");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.company_name_ar?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // منطق فلترة التصنيف
    let matchesCategory = true;
    if (subCategoryFilter !== "all") {
      // إذا تم اختيار تصنيف فرعي محدد
      matchesCategory = product.category_id === subCategoryFilter;
    } else if (parentCategoryFilter !== "all") {
      // إذا تم اختيار تصنيف رئيسي فقط، نعرض جميع منتجات هذا التصنيف وفرعياته
      const subCategoryIds = allCategories
        ?.filter(cat => cat.parent_category_id === parentCategoryFilter)
        .map(cat => cat.id) || [];
      matchesCategory = product.category_id === parentCategoryFilter || 
                       subCategoryIds.includes(product.category_id);
    }
    
    const matchesFeatured = featuredFilter === "all" || 
      (featuredFilter === "featured" && product.is_featured) ||
      (featuredFilter === "not_featured" && !product.is_featured);
    const matchesNewArrival = newArrivalFilter === "all" ||
      (newArrivalFilter === "new" && product.is_new_arrival) ||
      (newArrivalFilter === "not_new" && !product.is_new_arrival);
    const matchesActive = activeFilter === "all" ||
      (activeFilter === "active" && product.is_active) ||
      (activeFilter === "inactive" && !product.is_active);
    
    return matchesSearch && matchesCategory && matchesFeatured && matchesNewArrival && matchesActive;
  });

  // Pagination calculations
  const totalPages = Math.ceil((filteredProducts?.length || 0) / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts?.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const copyProductId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success("تم نسخ معرّف المنتج");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("فشل نسخ المعرّف");
    }
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <AdminBackButton />
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
                <Label>صور المنتج (حد أقصى 5 صور)</Label>
                <div className="space-y-3">
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {productImages.map((img, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={img.url}
                            alt={`صورة ${index + 1}`}
                            className="h-full w-full rounded object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute left-1 top-1 h-6 w-6"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <span className="absolute bottom-1 right-1 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {productImages.length < 5 && (
                    <div>
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                      />
                      <p className="mt-1 text-sm text-muted-foreground">
                        تم رفع {productImages.length} من 5 صور
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_category">القسم الرئيسي</Label>
                <Select
                  value={parentCategoryId}
                  onValueChange={(value) => {
                    setParentCategoryId(value);
                    setFormData({ ...formData, category_id: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم الرئيسي" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {parentCategoryId && (
                <div className="space-y-2">
                  <Label htmlFor="category_id">القسم الفرعي</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم الفرعي" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.length > 0 ? (
                        subCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name_ar}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          لا توجد أقسام فرعية لهذا القسم
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              
              {/* المشاكل */}
              {problemCategories && problemCategories.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-lg font-semibold">مناسب لعلاج المشاكل التالية</Label>
                  {problemCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <Label className="font-medium text-base">{category.name_ar}</Label>
                      <div className="space-y-2 pr-4">
                        {category.sub_problems?.map((subProblem: any) => (
                          <div key={subProblem.id} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id={`problem-${subProblem.id}`}
                              checked={selectedSubProblems.includes(subProblem.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubProblems([...selectedSubProblems, subProblem.id]);
                                } else {
                                  setSelectedSubProblems(selectedSubProblems.filter((id) => id !== subProblem.id));
                                }
                              }}
                            />
                            <Label htmlFor={`problem-${subProblem.id}`} className="cursor-pointer text-sm">
                              {subProblem.name_ar}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
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
                  id="is_new_arrival"
                  checked={formData.is_new_arrival}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_new_arrival: checked })
                  }
                />
                <Label htmlFor="is_new_arrival">وصل حديثاً</Label>
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

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div>
            <Label htmlFor="search">البحث</Label>
            <Input
              id="search"
              placeholder="ابحث بالاسم أو الشركة..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div>
            <Label htmlFor="parentCategory">التصنيف الرئيسي</Label>
            <Select 
              value={parentCategoryFilter} 
              onValueChange={(value) => {
                setParentCategoryFilter(value);
                setSubCategoryFilter("all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger id="parentCategory">
                <SelectValue placeholder="جميع التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {parentCategoryFilter !== "all" && (
            <div>
              <Label htmlFor="subCategory">التصنيف الفرعي</Label>
              <Select 
                value={subCategoryFilter} 
                onValueChange={(value) => handleFilterChange(setSubCategoryFilter, value)}
              >
                <SelectTrigger id="subCategory">
                  <SelectValue placeholder="جميع الفرعيات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفرعيات</SelectItem>
                  {allCategories
                    ?.filter(cat => cat.parent_category_id === parentCategoryFilter)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_ar}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="featured">المميزة</Label>
            <Select value={featuredFilter} onValueChange={(value) => handleFilterChange(setFeaturedFilter, value)}>
              <SelectTrigger id="featured">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="featured">مميزة فقط</SelectItem>
                <SelectItem value="not_featured">غير مميزة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="newArrival">الوصول الحديث</Label>
            <Select value={newArrivalFilter} onValueChange={(value) => handleFilterChange(setNewArrivalFilter, value)}>
              <SelectTrigger id="newArrival">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="new">وصلت حديثاً</SelectItem>
                <SelectItem value="not_new">قديمة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="active">الحالة</Label>
            <Select value={activeFilter} onValueChange={(value) => handleFilterChange(setActiveFilter, value)}>
              <SelectTrigger id="active">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشطة فقط</SelectItem>
                <SelectItem value="inactive">غير نشطة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            عرض {filteredProducts?.length || 0} من {products?.length || 0} منتج
            {totalPages > 0 && ` - الصفحة ${currentPage} من ${totalPages}`}
          </span>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>معرّف المنتج (ID)</TableHead>
              <TableHead>مميز</TableHead>
              <TableHead>وصل حديثاً</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name_ar}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {product.id.substring(0, 8)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyProductId(product.id)}
                      title="نسخ المعرّف الكامل"
                    >
                      {copiedId === product.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{product.is_featured ? "نعم" : "لا"}</TableCell>
                <TableCell>{product.is_new_arrival ? "نعم" : "لا"}</TableCell>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2">...</span>;
              }
              return null;
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
