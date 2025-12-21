import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Package, Save, Trash2, Plus, Check, ChevronsUpDown } from "lucide-react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyBundleForm {
  id?: string;
  product_id: string;
  variant_id: string;
  special_price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
}

const AdminWeeklyBundle = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  
  const defaultForm: WeeklyBundleForm = {
    product_id: "",
    variant_id: "",
    special_price: 0,
    starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    ends_at: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    is_active: true,
    title_ar: "مجموعة الأسبوع",
    title_en: "Bundle of the Week",
    description_ar: "",
    description_en: "",
  };

  const [form, setForm] = useState<WeeklyBundleForm>(defaultForm);

  // Fetch all products (filter for bundles/sets if needed)
  const { data: products } = useQuery({
    queryKey: ["admin-products-for-bundle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name_ar,
          name_en,
          image_url,
          product_variants (
            id,
            size_ar,
            size_en,
            price
          )
        `)
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      return data;
    },
  });

  // Fetch existing weekly bundles
  const { data: weeklyBundles, isLoading } = useQuery({
    queryKey: ["admin-weekly-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_bundle")
        .select(`
          *,
          products:product_id (
            id,
            name_ar,
            image_url,
            product_variants (
              id,
              price
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Get variants for selected product
  const selectedProduct = products?.find(p => p.id === form.product_id);
  const variants = selectedProduct?.product_variants || [];

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: WeeklyBundleForm) => {
      const payload = {
        product_id: data.product_id,
        variant_id: data.variant_id || null,
        special_price: data.special_price,
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
        is_active: data.is_active,
        title_ar: data.title_ar,
        title_en: data.title_en,
        description_ar: data.description_ar,
        description_en: data.description_en,
      };

      if (data.id) {
        const { error } = await supabase
          .from("weekly_bundle")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("weekly_bundle")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-bundles"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-bundle"] });
      toast.success("تم حفظ مجموعة الأسبوع بنجاح");
      setIsCreating(false);
      setForm(defaultForm);
    },
    onError: (error) => {
      console.error("Error saving weekly bundle:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("weekly_bundle")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-bundles"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-bundle"] });
      toast.success("تم الحذف بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحذف");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) {
      toast.error("يرجى اختيار منتج");
      return;
    }
    saveMutation.mutate(form);
  };

  const handleEdit = (item: any) => {
    setForm({
      id: item.id,
      product_id: item.product_id || "",
      variant_id: item.variant_id || "",
      special_price: item.special_price,
      starts_at: format(new Date(item.starts_at), "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(new Date(item.ends_at), "yyyy-MM-dd'T'HH:mm"),
      is_active: item.is_active,
      title_ar: item.title_ar,
      title_en: item.title_en || "",
      description_ar: item.description_ar || "",
      description_en: item.description_en || "",
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setForm(defaultForm);
  };

  const getOriginalPrice = (item: any) => {
    if (item.variant_id && item.products?.product_variants) {
      const variant = item.products.product_variants.find((v: any) => v.id === item.variant_id);
      return variant?.price || 0;
    }
    if (item.products?.product_variants?.length > 0) {
      return Math.min(...item.products.product_variants.map((v: any) => v.price));
    }
    return 0;
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <AdminBackButton />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">مجموعة الأسبوع</h1>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مجموعة أسبوع جديدة
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? "تعديل مجموعة الأسبوع" : "إضافة مجموعة أسبوع جديدة"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Product Selection with Search */}
                <div className="space-y-2">
                  <Label>اختر المنتج (المجموعة) *</Label>
                  <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={productSearchOpen}
                        className="w-full justify-between"
                      >
                        {form.product_id
                          ? products?.find((p) => p.id === form.product_id)?.name_ar || "اختر منتج"
                          : "اختر منتج..."}
                        <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="ابحث عن منتج..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>لا يوجد منتجات</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {products?.map((product) => (
                              <CommandItem
                                key={product.id}
                                value={product.name_ar}
                                onSelect={() => {
                                  setForm({ ...form, product_id: product.id, variant_id: "" });
                                  setProductSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    form.product_id === product.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {product.name_ar}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Variant Selection */}
                <div className="space-y-2">
                  <Label>اختر الحجم (اختياري)</Label>
                  <Select
                    value={form.variant_id || "all"}
                    onValueChange={(value) => setForm({ ...form, variant_id: value === "all" ? "" : value })}
                    disabled={!form.product_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الأحجام" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأحجام</SelectItem>
                      {variants.map((variant: any) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.size_ar} - {variant.price.toLocaleString()} ريال
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Special Price */}
                <div className="space-y-2">
                  <Label>سعر العرض (ريال) *</Label>
                  <Input
                    type="number"
                    value={form.special_price}
                    onChange={(e) => setForm({ ...form, special_price: Number(e.target.value) })}
                    min={0}
                    required
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>تاريخ البداية *</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>تاريخ النهاية *</Label>
                  <Input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    required
                  />
                </div>

                {/* Title AR */}
                <div className="space-y-2">
                  <Label>العنوان بالعربي *</Label>
                  <Input
                    value={form.title_ar}
                    onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                    required
                  />
                </div>

                {/* Title EN */}
                <div className="space-y-2">
                  <Label>العنوان بالإنجليزي</Label>
                  <Input
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  />
                </div>

                {/* Active Switch */}
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label>تفعيل العرض</Label>
                </div>
              </div>

              {/* Description AR */}
              <div className="space-y-2">
                <Label>الوصف بالعربي</Label>
                <Textarea
                  value={form.description_ar}
                  onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                  placeholder="وصف اختياري للعرض..."
                />
              </div>

              {/* Description EN */}
              <div className="space-y-2">
                <Label>الوصف بالإنجليزي</Label>
                <Textarea
                  value={form.description_en}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 ml-2" />
                  {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : weeklyBundles?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا يوجد مجموعات أسبوع حالياً</p>
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  أضف مجموعة الأسبوع الأولى
                </Button>
              </CardContent>
            </Card>
          ) : (
            weeklyBundles?.map((item: any) => {
              const originalPrice = getOriginalPrice(item);
              const savings = originalPrice - item.special_price;
              const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
              
              return (
                <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.products?.image_url || "/placeholder.svg"}
                        alt={item.products?.name_ar}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.products?.name_ar || "منتج محذوف"}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>سعر العرض: <span className="text-primary font-bold">{item.special_price.toLocaleString()}</span> ريال</p>
                          {originalPrice > 0 && (
                            <p>السعر الأصلي: <span className="line-through">{originalPrice.toLocaleString()}</span> ريال | توفير: {savings.toLocaleString()} ريال ({savingsPercent}%)</p>
                          )}
                          <p>
                            الفترة: {format(new Date(item.starts_at), "yyyy/MM/dd")} - {format(new Date(item.ends_at), "yyyy/MM/dd")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.is_active && new Date(item.ends_at) > new Date() && new Date(item.starts_at) <= new Date()
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {item.is_active && new Date(item.ends_at) > new Date() && new Date(item.starts_at) <= new Date()
                              ? "نشط الآن"
                              : item.is_active
                              ? "غير نشط (خارج الفترة)"
                              : "معطل"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          تعديل
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من الحذف؟")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWeeklyBundle;
