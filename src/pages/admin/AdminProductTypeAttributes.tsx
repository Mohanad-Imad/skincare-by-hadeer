import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { useParams } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const fieldTypes = [
  { value: "text", label: "نص" },
  { value: "number", label: "رقم" },
  { value: "textarea", label: "نص طويل" },
  { value: "select", label: "قائمة منسدلة" },
  { value: "multi-select", label: "اختيار متعدد" },
  { value: "checkbox", label: "مربع اختيار" },
];

const AdminProductTypeAttributes = () => {
  const { typeId } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<any>(null);
  const [optionsText, setOptionsText] = useState("");

  const [formData, setFormData] = useState({
    attribute_key: "",
    attribute_name_ar: "",
    attribute_name_en: "",
    field_type: "text",
    options: [] as any[],
    placeholder_ar: "",
    placeholder_en: "",
    is_required: false,
    show_in_filters: false,
    show_in_product_card: false,
    display_order: 0,
    is_active: true,
  });

  const { data: productType } = useQuery({
    queryKey: ["product-type", typeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_types")
        .select("*")
        .eq("id", typeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: attributes, isLoading } = useQuery({
    queryKey: ["product-type-attributes", typeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_type_attributes")
        .select("*")
        .eq("product_type_id", typeId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("product_type_attributes").insert([{
        ...data,
        product_type_id: typeId,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-type-attributes", typeId] });
      toast.success("تم إضافة الخاصية بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة الخاصية"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("product_type_attributes")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-type-attributes", typeId] });
      toast.success("تم تحديث الخاصية بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الخاصية"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_type_attributes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-type-attributes", typeId] });
      toast.success("تم حذف الخاصية بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الخاصية"),
  });

  const resetForm = () => {
    setFormData({
      attribute_key: "",
      attribute_name_ar: "",
      attribute_name_en: "",
      field_type: "text",
      options: [],
      placeholder_ar: "",
      placeholder_en: "",
      is_required: false,
      show_in_filters: false,
      show_in_product_card: false,
      display_order: 0,
      is_active: true,
    });
    setOptionsText("");
    setEditingAttribute(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse options from text
    let parsedOptions: any[] = [];
    if (formData.field_type === "select" || formData.field_type === "multi-select") {
      parsedOptions = optionsText.split("\n").filter(line => line.trim()).map(line => {
        const parts = line.split("|").map(p => p.trim());
        return {
          value: parts[0] || "",
          label_ar: parts[1] || parts[0] || "",
          label_en: parts[2] || parts[0] || "",
        };
      });
    }

    const dataToSubmit = {
      ...formData,
      options: parsedOptions,
    };

    if (editingAttribute) {
      updateMutation.mutate({ id: editingAttribute.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = (attribute: any) => {
    setEditingAttribute(attribute);
    setFormData({
      attribute_key: attribute.attribute_key,
      attribute_name_ar: attribute.attribute_name_ar,
      attribute_name_en: attribute.attribute_name_en,
      field_type: attribute.field_type,
      options: attribute.options || [],
      placeholder_ar: attribute.placeholder_ar || "",
      placeholder_en: attribute.placeholder_en || "",
      is_required: attribute.is_required,
      show_in_filters: attribute.show_in_filters,
      show_in_product_card: attribute.show_in_product_card,
      display_order: attribute.display_order,
      is_active: attribute.is_active,
    });
    
    // Convert options to text format
    if (attribute.options && attribute.options.length > 0) {
      const optText = attribute.options.map((opt: any) => 
        `${opt.value}|${opt.label_ar}|${opt.label_en}`
      ).join("\n");
      setOptionsText(optText);
    } else {
      setOptionsText("");
    }
    
    setIsDialogOpen(true);
  };

  const generateKey = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "_")
      .trim();
  };

  return (
    <div className="p-4 md:p-8">
      <AdminBackButton />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">خصائص: {productType?.name_ar}</h1>
          <p className="text-muted-foreground mt-1">إدارة الخصائص الديناميكية لهذا النوع من المنتجات</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة خاصية
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? "تعديل الخاصية" : "إضافة خاصية جديدة"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="attribute_name_ar">الاسم بالعربي *</Label>
                  <Input
                    id="attribute_name_ar"
                    value={formData.attribute_name_ar}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        attribute_name_ar: newName,
                        attribute_key: editingAttribute ? prev.attribute_key : generateKey(newName)
                      }));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attribute_name_en">الاسم بالإنجليزي *</Label>
                  <Input
                    id="attribute_name_en"
                    value={formData.attribute_name_en}
                    onChange={(e) => setFormData({ ...formData, attribute_name_en: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="attribute_key">المفتاح (Key) *</Label>
                  <Input
                    id="attribute_key"
                    value={formData.attribute_key}
                    onChange={(e) => setFormData({ ...formData, attribute_key: e.target.value })}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_type">نوع الحقل *</Label>
                  <Select
                    value={formData.field_type}
                    onValueChange={(value) => setFormData({ ...formData, field_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(formData.field_type === "select" || formData.field_type === "multi-select") && (
                <div className="space-y-2">
                  <Label htmlFor="options">الخيارات</Label>
                  <Textarea
                    id="options"
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="القيمة|الاسم بالعربي|الاسم بالإنجليزي&#10;مثال:&#10;red|أحمر|Red&#10;blue|أزرق|Blue"
                    rows={5}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    كل خيار في سطر منفصل بالصيغة: القيمة|الاسم بالعربي|الاسم بالإنجليزي
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="placeholder_ar">نص توضيحي بالعربي</Label>
                  <Input
                    id="placeholder_ar"
                    value={formData.placeholder_ar}
                    onChange={(e) => setFormData({ ...formData, placeholder_ar: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeholder_en">نص توضيحي بالإنجليزي</Label>
                  <Input
                    id="placeholder_en"
                    value={formData.placeholder_en}
                    onChange={(e) => setFormData({ ...formData, placeholder_en: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">ترتيب العرض</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                  />
                  <Label htmlFor="is_required">حقل إجباري</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show_in_filters"
                    checked={formData.show_in_filters}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_in_filters: checked })}
                  />
                  <Label htmlFor="show_in_filters">إظهار في الفلاتر</Label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show_in_product_card"
                    checked={formData.show_in_product_card}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_in_product_card: checked })}
                  />
                  <Label htmlFor="show_in_product_card">إظهار في بطاقة المنتج</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">نشط</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingAttribute ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : attributes?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">لا توجد خصائص لهذا النوع بعد</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة أول خاصية
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-12"></TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">المفتاح</TableHead>
                <TableHead className="text-right">نوع الحقل</TableHead>
                <TableHead className="text-right">إجباري</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes?.map((attr) => (
                <TableRow key={attr.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{attr.attribute_name_ar}</TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">{attr.attribute_key}</TableCell>
                  <TableCell>
                    {fieldTypes.find(t => t.value === attr.field_type)?.label || attr.field_type}
                  </TableCell>
                  <TableCell>
                    {attr.is_required ? "نعم" : "لا"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      attr.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {attr.is_active ? "نشط" : "غير نشط"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(attr)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          if (confirm("هل أنت متأكد من حذف هذه الخاصية؟")) {
                            deleteMutation.mutate(attr.id);
                          }
                        }}
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
      )}
    </div>
  );
};

export default AdminProductTypeAttributes;
