import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, X, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const [expertChoiceFilter, setExpertChoiceFilter] = useState("all");
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
    product_type: "skincare",
    skin_type: [] as string[],
    is_featured: false,
    is_new_arrival: false,
    is_expert_choice: false,
    is_active: true,
  });

  // خصائص الساعات
  const [watchAttributes, setWatchAttributes] = useState({
    movement_type: "",
    case_material: "",
    case_diameter: "",
    water_resistance: "",
    strap_type: "",
    strap_color: "",
    dial_color: "",
    warranty_years: "",
  });

  // خصائص الملابس
  const [clothingAttributes, setClothingAttributes] = useState({
    available_sizes: [] as string[],
    available_colors: [] as string[],
    material: "",
    fit_type: "",
    season: "",
    care_instructions: "",
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

      // إضافة خصائص الساعات إن وجدت
      if (data.product_type === "watches" && Object.values(watchAttributes).some(v => v)) {
        const { error: watchError } = await supabase
          .from("product_watch_attributes")
          .insert([{
            product_id: product.id,
            ...watchAttributes,
            warranty_years: watchAttributes.warranty_years ? parseInt(watchAttributes.warranty_years) : null,
          }]);
        if (watchError) throw watchError;
      }

      // إضافة خصائص الملابس إن وجدت
      if (data.product_type === "clothing" && Object.values(clothingAttributes).some(v => v && (Array.isArray(v) ? v.length > 0 : true))) {
        const { error: clothingError } = await supabase
          .from("product_clothing_attributes")
          .insert([{
            product_id: product.id,
            ...clothingAttributes,
          }]);
        if (clothingError) throw clothingError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "products" });
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

      // تحديث/إضافة خصائص الساعات
      if (data.product_type === "watches") {
        await supabase.from("product_watch_attributes").delete().eq("product_id", id);
        if (Object.values(watchAttributes).some(v => v)) {
          const { error: watchError } = await supabase
            .from("product_watch_attributes")
            .insert([{
              product_id: id,
              ...watchAttributes,
              warranty_years: watchAttributes.warranty_years ? parseInt(watchAttributes.warranty_years) : null,
            }]);
          if (watchError) throw watchError;
        }
      }

      // تحديث/إضافة خصائص الملابس
      if (data.product_type === "clothing") {
        await supabase.from("product_clothing_attributes").delete().eq("product_id", id);
        if (Object.values(clothingAttributes).some(v => v && (Array.isArray(v) ? v.length > 0 : true))) {
          const { error: clothingError } = await supabase
            .from("product_clothing_attributes")
            .insert([{
              product_id: id,
              ...clothingAttributes,
            }]);
          if (clothingError) throw clothingError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "products" });
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
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "products" });
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
      product_type: "skincare",
      skin_type: [],
      is_featured: false,
      is_new_arrival: false,
      is_expert_choice: false,
      is_active: true,
    });
    setParentCategoryId("");
    setVariants([]);
    setProductImages([]);
    setSelectedSubProblems([]);
    setWatchAttributes({
      movement_type: "",
      case_material: "",
      case_diameter: "",
      water_resistance: "",
      strap_type: "",
      strap_color: "",
      dial_color: "",
      warranty_years: "",
    });
    setClothingAttributes({
      available_sizes: [],
      available_colors: [],
      material: "",
      fit_type: "",
      season: "",
      care_instructions: "",
    });
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
      product_type: product.product_type || "skincare",
      skin_type: product.skin_type || [],
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival || false,
      is_expert_choice: product.is_expert_choice || false,
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

    // جلب خصائص الساعات إن وجدت
    if (product.product_type === "watches") {
      const { data: watchData } = await supabase
        .from("product_watch_attributes")
        .select("*")
        .eq("product_id", product.id)
        .single();
      
      if (watchData) {
        setWatchAttributes({
          movement_type: watchData.movement_type || "",
          case_material: watchData.case_material || "",
          case_diameter: watchData.case_diameter || "",
          water_resistance: watchData.water_resistance || "",
          strap_type: watchData.strap_type || "",
          strap_color: watchData.strap_color || "",
          dial_color: watchData.dial_color || "",
          warranty_years: watchData.warranty_years?.toString() || "",
        });
      }
    }

    // جلب خصائص الملابس إن وجدت
    if (product.product_type === "clothing") {
      const { data: clothingData } = await supabase
        .from("product_clothing_attributes")
        .select("*")
        .eq("product_id", product.id)
        .single();
      
      if (clothingData) {
        setClothingAttributes({
          available_sizes: clothingData.available_sizes || [],
          available_colors: clothingData.available_colors || [],
          material: clothingData.material || "",
          fit_type: clothingData.fit_type || "",
          season: clothingData.season || "",
          care_instructions: clothingData.care_instructions || "",
        });
      }
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

    // التحقق من حجم كل صورة (500 KB كحد أقصى)
    const MAX_SIZE = 500 * 1024; // 500 KB
    const oversizedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_SIZE) {
        const sizeInKB = Math.round(file.size / 1024);
        oversizedFiles.push(`${file.name} (${sizeInKB} KB)`);
      }
    }

    if (oversizedFiles.length > 0) {
      toast.error(
        `الصور التالية تتجاوز الحد المسموح (500 KB):\n${oversizedFiles.join('\n')}`,
        { duration: 5000 }
      );
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
      if (import.meta.env.DEV) {
        console.error("Error uploading images:", error);
      }
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
    const matchesExpertChoice = expertChoiceFilter === "all" ||
      (expertChoiceFilter === "expert" && product.is_expert_choice) ||
      (expertChoiceFilter === "not_expert" && !product.is_expert_choice);
    const matchesActive = activeFilter === "all" ||
      (activeFilter === "active" && product.is_active) ||
      (activeFilter === "inactive" && !product.is_active);
    
    return matchesSearch && matchesCategory && matchesFeatured && matchesNewArrival && matchesExpertChoice && matchesActive;
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
                <Label htmlFor="product_type">نوع المنتج</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, product_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skincare">العناية بالبشرة</SelectItem>
                    <SelectItem value="watches">ساعات</SelectItem>
                    <SelectItem value="clothing">ملابس</SelectItem>
                  </SelectContent>
                </Select>
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
                        تم رفع {productImages.length} من 5 صور • حجم كل صورة: 500 KB كحد أقصى
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
              
              {formData.product_type === "skincare" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>مناسب لنوع البشرة</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allSelected = skinTypes.every(t => formData.skin_type.includes(t.value));
                        if (allSelected) {
                          setFormData({ ...formData, skin_type: [] });
                        } else {
                          setFormData({ ...formData, skin_type: skinTypes.map(t => t.value) });
                        }
                      }}
                    >
                      {skinTypes.every(t => formData.skin_type.includes(t.value)) ? "إلغاء الكل" : "تحديد الكل"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
              )}
              
              {formData.product_type === "watches" && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-lg font-semibold">مواصفات الساعة</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>نوع الحركة</Label>
                      <Input
                        value={watchAttributes.movement_type}
                        onChange={(e) => setWatchAttributes({...watchAttributes, movement_type: e.target.value})}
                        placeholder="مثال: أوتوماتيك، كوارتز"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>مادة العلبة</Label>
                      <Input
                        value={watchAttributes.case_material}
                        onChange={(e) => setWatchAttributes({...watchAttributes, case_material: e.target.value})}
                        placeholder="مثال: ستانلس ستيل، ذهب"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>قطر العلبة</Label>
                      <Input
                        value={watchAttributes.case_diameter}
                        onChange={(e) => setWatchAttributes({...watchAttributes, case_diameter: e.target.value})}
                        placeholder="مثال: 42mm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>مقاومة الماء</Label>
                      <Input
                        value={watchAttributes.water_resistance}
                        onChange={(e) => setWatchAttributes({...watchAttributes, water_resistance: e.target.value})}
                        placeholder="مثال: 50 متر"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع السوار</Label>
                      <Input
                        value={watchAttributes.strap_type}
                        onChange={(e) => setWatchAttributes({...watchAttributes, strap_type: e.target.value})}
                        placeholder="مثال: جلد، معدني"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>لون السوار</Label>
                      <Input
                        value={watchAttributes.strap_color}
                        onChange={(e) => setWatchAttributes({...watchAttributes, strap_color: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>لون القرص</Label>
                      <Input
                        value={watchAttributes.dial_color}
                        onChange={(e) => setWatchAttributes({...watchAttributes, dial_color: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>فترة الضمان (بالسنوات)</Label>
                      <Input
                        type="number"
                        value={watchAttributes.warranty_years}
                        onChange={(e) => setWatchAttributes({...watchAttributes, warranty_years: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {formData.product_type === "clothing" && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-lg font-semibold">مواصفات الملابس</Label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>المقاسات المتوفرة</Label>
                      <Input
                        value={clothingAttributes.available_sizes.join(", ")}
                        onChange={(e) => setClothingAttributes({
                          ...clothingAttributes, 
                          available_sizes: e.target.value.split(",").map(s => s.trim()).filter(s => s)
                        })}
                        placeholder="مثال: S, M, L, XL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الألوان المتوفرة</Label>
                      <Input
                        value={clothingAttributes.available_colors.join(", ")}
                        onChange={(e) => setClothingAttributes({
                          ...clothingAttributes, 
                          available_colors: e.target.value.split(",").map(s => s.trim()).filter(s => s)
                        })}
                        placeholder="مثال: أسود, أبيض, أزرق"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المادة</Label>
                      <Input
                        value={clothingAttributes.material}
                        onChange={(e) => setClothingAttributes({...clothingAttributes, material: e.target.value})}
                        placeholder="مثال: قطن، بوليستر"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع القصة</Label>
                      <Input
                        value={clothingAttributes.fit_type}
                        onChange={(e) => setClothingAttributes({...clothingAttributes, fit_type: e.target.value})}
                        placeholder="مثال: slim fit, regular"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الموسم</Label>
                      <Input
                        value={clothingAttributes.season}
                        onChange={(e) => setClothingAttributes({...clothingAttributes, season: e.target.value})}
                        placeholder="مثال: صيفي، شتوي"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تعليمات العناية</Label>
                      <Textarea
                        value={clothingAttributes.care_instructions}
                        onChange={(e) => setClothingAttributes({...clothingAttributes, care_instructions: e.target.value})}
                        placeholder="مثال: غسيل يدوي، لا يوضع في المجفف"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {problemCategories && problemCategories.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">مناسب لعلاج المشاكل التالية</Label>
                    {selectedSubProblems.length > 0 && (
                      <span className="text-sm text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                        {selectedSubProblems.length} مشكلة مختارة
                      </span>
                    )}
                  </div>
                  <Accordion type="multiple" className="w-full">
                    {problemCategories.map((category) => {
                      const selectedInCategory = category.sub_problems?.filter(
                        (sp: any) => selectedSubProblems.includes(sp.id)
                      ).length || 0;
                      
                      return (
                        <AccordionItem key={category.id} value={category.id} className="border rounded-lg mb-2 px-3">
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{category.name_ar}</span>
                              {selectedInCategory > 0 && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  {selectedInCategory}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-2 py-2">
                              {category.sub_problems?.map((subProblem: any) => (
                                <div key={subProblem.id} className="flex items-center space-x-2 space-x-reverse">
                                  <Checkbox
                                    id={subProblem.id}
                                    checked={selectedSubProblems.includes(subProblem.id)}
                                    onCheckedChange={() => {
                                      setSelectedSubProblems(prev =>
                                        prev.includes(subProblem.id)
                                          ? prev.filter(id => id !== subProblem.id)
                                          : [...prev, subProblem.id]
                                      );
                                    }}
                                  />
                                  <Label htmlFor={subProblem.id} className="cursor-pointer text-sm">
                                    {subProblem.name_ar}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
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
                  id="is_expert_choice"
                  checked={formData.is_expert_choice}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_expert_choice: checked })
                  }
                />
                <Label htmlFor="is_expert_choice">اختيار خبراءنا</Label>
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
            <Label htmlFor="expertChoice">اختيار خبراءنا</Label>
            <Select value={expertChoiceFilter} onValueChange={(value) => handleFilterChange(setExpertChoiceFilter, value)}>
              <SelectTrigger id="expertChoice">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="expert">اختيار خبراءنا</SelectItem>
                <SelectItem value="not_expert">ليس اختيار خبراءنا</SelectItem>
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
            <TableRow dir="rtl">
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">معرّف المنتج (ID)</TableHead>
              <TableHead className="text-right">مميز</TableHead>
              <TableHead className="text-right">وصل حديثاً</TableHead>
              <TableHead className="text-right">اختيار خبراءنا</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
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
                <TableCell>{product.is_expert_choice ? "نعم" : "لا"}</TableCell>
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
