import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";

const AdminDiscountCodes = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  const { data: discountCodes, isLoading } = useQuery({
    queryKey: ["admin-discount-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("discount_codes").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast.success("تم إنشاء كود الخصم بنجاح");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء كود الخصم");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("discount_codes")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast.success("تم تحديث كود الخصم بنجاح");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث كود الخصم");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast.success("تم حذف كود الخصم بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حذف كود الخصم");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discount_percentage: "",
      valid_from: "",
      valid_until: "",
      is_active: true,
    });
    setEditingCode(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.discount_percentage || !formData.valid_until) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    const percentage = parseFloat(formData.discount_percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error("نسبة الخصم يجب أن تكون بين 1 و 100");
      return;
    }

    // تحويل التواريخ من المنطقة الزمنية المحلية إلى ISO
    const validFromDate = formData.valid_from 
      ? new Date(formData.valid_from).toISOString()
      : new Date().toISOString();
    
    const validUntilDate = new Date(formData.valid_until).toISOString();

    const data = {
      code: formData.code.toUpperCase(),
      discount_percentage: percentage,
      valid_from: validFromDate,
      valid_until: validUntilDate,
      is_active: formData.is_active,
    };

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (code: any) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_percentage: code.discount_percentage.toString(),
      valid_from: new Date(code.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(code.valid_until).toISOString().slice(0, 16),
      is_active: code.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف كود الخصم؟")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6">
      <AdminBackButton />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">أكواد الخصم</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة كود خصم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? "تعديل كود الخصم" : "إضافة كود خصم جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">الكود *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="مثال: SUMMER2025"
                  required
                />
              </div>

              <div>
                <Label htmlFor="discount_percentage">نسبة الخصم (%) *</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_percentage: e.target.value })
                  }
                  placeholder="مثال: 20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="valid_from">يبدأ من</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="valid_until">ينتهي في *</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">نشط</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              <Button type="submit" className="w-full">
                {editingCode ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>نسبة الخصم</TableHead>
              <TableHead>يبدأ من</TableHead>
              <TableHead>ينتهي في</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discountCodes?.map((code) => (
              <TableRow key={code.id}>
                <TableCell className="font-mono font-bold">{code.code}</TableCell>
                <TableCell>{code.discount_percentage}%</TableCell>
                <TableCell>
                  {new Date(code.valid_from).toLocaleDateString("ar-IQ")}
                </TableCell>
                <TableCell>
                  {new Date(code.valid_until).toLocaleDateString("ar-IQ")}
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      code.is_active && new Date(code.valid_until) > new Date()
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {code.is_active && new Date(code.valid_until) > new Date()
                      ? "نشط"
                      : "غير نشط"}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(code)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(code.id)}
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

export default AdminDiscountCodes;
