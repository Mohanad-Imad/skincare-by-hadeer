import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, ChevronsUpDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Discount {
  id: string;
  product_id: string | null;
  discount_percentage: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  products?: {
    name_ar: string;
    name_en: string;
  } | null;
}

const AdminProductDiscounts = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const [productId, setProductId] = useState<string>("");
  const [percentage, setPercentage] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [openProductSelect, setOpenProductSelect] = useState(false);

  const { data: discounts, isLoading } = useQuery({
    queryKey: ["product-discounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_discounts")
        .select(`
          *,
          products (
            name_ar,
            name_en
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Discount[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name_ar, name_en")
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      return data;
    },
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (newDiscount: any) => {
      const { error } = await supabase
        .from("product_discounts")
        .insert([newDiscount]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-discounts"] });
      toast.success("تم إضافة الخصم بنجاح");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة الخصم");
      console.error(error);
    },
  });

  const updateDiscountMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("product_discounts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-discounts"] });
      toast.success("تم تحديث الخصم بنجاح");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث الخصم");
      console.error(error);
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_discounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-discounts"] });
      toast.success("تم حذف الخصم بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف الخصم");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!percentage || !validFrom || !validUntil) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const discountData = {
      product_id: productId === "all" ? null : productId || null,
      discount_percentage: parseFloat(percentage),
      valid_from: validFrom,
      valid_until: validUntil,
      is_active: isActive,
    };

    if (editingDiscount) {
      updateDiscountMutation.mutate({
        id: editingDiscount.id,
        updates: discountData,
      });
    } else {
      createDiscountMutation.mutate(discountData);
    }
  };

  const resetForm = () => {
    setProductId("");
    setPercentage("");
    setValidFrom("");
    setValidUntil("");
    setIsActive(true);
    setEditingDiscount(null);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setProductId(discount.product_id || "all");
    setPercentage(discount.discount_percentage.toString());
    setValidFrom(discount.valid_from.split("T")[0]);
    setValidUntil(discount.valid_until.split("T")[0]);
    setIsActive(discount.is_active);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الخصم؟")) {
      deleteDiscountMutation.mutate(id);
    }
  };

  if (adminLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">إدارة خصومات المنتجات</h1>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة خصم جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDiscount ? "تعديل الخصم" : "إضافة خصم جديد"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="product">المنتج</Label>
                    <Popover open={openProductSelect} onOpenChange={setOpenProductSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProductSelect}
                          className="w-full justify-between"
                        >
                          {productId === "all" 
                            ? "جميع المنتجات"
                            : productId
                            ? products?.find((product) => product.id === productId)?.name_ar
                            : "اختر المنتج..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="ابحث عن منتج..." />
                          <CommandList>
                            <CommandEmpty>لم يتم العثور على منتجات.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  setProductId("all");
                                  setOpenProductSelect(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    productId === "all" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                جميع المنتجات
                              </CommandItem>
                              {products?.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name_ar}
                                  onSelect={() => {
                                    setProductId(product.id);
                                    setOpenProductSelect(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "ml-2 h-4 w-4",
                                      productId === product.id ? "opacity-100" : "opacity-0"
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

                  <div>
                    <Label htmlFor="percentage">نسبة الخصم (%)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const current = parseFloat(percentage) || 0;
                          if (current > 1) {
                            setPercentage(Math.max(1, current - 1).toString());
                          }
                        }}
                        disabled={!percentage || parseFloat(percentage) <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="percentage"
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={percentage}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (parseFloat(val) >= 1 && parseFloat(val) <= 100)) {
                            setPercentage(val);
                          }
                        }}
                        className="text-center"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const current = parseFloat(percentage) || 0;
                          if (current < 100) {
                            setPercentage(Math.min(100, current + 1).toString());
                          }
                        }}
                        disabled={!percentage || parseFloat(percentage) >= 100}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="validFrom">من تاريخ</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="validUntil">إلى تاريخ</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">تفعيل الخصم</Label>
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit">
                      {editingDiscount ? "تحديث" : "إضافة"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>نسبة الخصم</TableHead>
                  <TableHead>من تاريخ</TableHead>
                  <TableHead>إلى تاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts?.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      {discount.product_id 
                        ? discount.products?.name_ar || "منتج محذوف"
                        : "جميع المنتجات"}
                    </TableCell>
                    <TableCell>{discount.discount_percentage}%</TableCell>
                    <TableCell>
                      {new Date(discount.valid_from).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell>
                      {new Date(discount.valid_until).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          discount.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {discount.is_active ? "مفعل" : "غير مفعل"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(discount)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(discount.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProductDiscounts;
