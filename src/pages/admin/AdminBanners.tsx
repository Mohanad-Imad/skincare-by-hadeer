import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
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

const AdminBanners = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    image_url_desktop: "",
    image_url_tablet: "",
    image_url_mobile: "",
    link_url: "",
    display_order: 0,
    is_active: true,
  });

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("banners").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("تم إضافة البنر بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة البنر");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("banners")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("تم تحديث البنر بنجاح");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث البنر");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("تم حذف البنر بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف البنر");
    },
  });

  const resetForm = () => {
    setFormData({
      image_url_desktop: "",
      image_url_tablet: "",
      image_url_mobile: "",
      link_url: "",
      display_order: 0,
      is_active: true,
    });
    setEditingBanner(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      image_url: formData.image_url_desktop || formData.image_url_tablet || formData.image_url_mobile || ""
    };
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, ...dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      image_url_desktop: banner.image_url_desktop || "",
      image_url_tablet: banner.image_url_tablet || "",
      image_url_mobile: banner.image_url_mobile || "",
      link_url: banner.link_url || "",
      display_order: banner.display_order,
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'desktop' | 'tablet' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setFormData({ ...formData, [`image_url_${imageType}`]: publicUrl });
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
        <h2 className="text-2xl font-bold">إدارة البنرات الإعلانية</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة بنر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "تعديل بنر" : "إضافة بنر جديد"}
              </DialogTitle>
            </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>صورة Desktop (القياس المقترح: 1920x600)</Label>
                <Input type="file" accept="image/*" onChange={(e) => { handleImageUpload(e, 'desktop'); }} />
                {formData.image_url_desktop && <img src={formData.image_url_desktop} className="mt-2 h-20 rounded" />}
              </div>
              <div className="space-y-2">
                <Label>صورة Tablet (القياس المقترح: 1024x400)</Label>
                <Input type="file" accept="image/*" onChange={(e) => { handleImageUpload(e, 'tablet'); }} />
                {formData.image_url_tablet && <img src={formData.image_url_tablet} className="mt-2 h-20 rounded" />}
              </div>
              <div className="space-y-2">
                <Label>صورة Mobile (القياس المقترح: 768x400)</Label>
                <Input type="file" accept="image/*" onChange={(e) => { handleImageUpload(e, 'mobile'); }} />
                {formData.image_url_mobile && <img src={formData.image_url_mobile} className="mt-2 h-20 rounded" />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="link_url">رابط البنر (اختياري)</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) =>
                    setFormData({ ...formData, link_url: e.target.value })
                  }
                  placeholder="/products أو https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">ترتيب العرض</Label>
                <Input
                  id="display_order"
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
                {editingBanner ? "تحديث" : "إضافة"}
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
              <TableHead>العنوان</TableHead>
              <TableHead>الترتيب</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners?.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <img
                    src={banner.image_url}
                    alt={banner.title_ar}
                    className="h-12 w-20 rounded object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{banner.title_ar}</TableCell>
                <TableCell>{banner.display_order}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      banner.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {banner.is_active ? "نشط" : "غير نشط"}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (
                          confirm("هل أنت متأكد من حذف هذا البنر؟")
                        ) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
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
  );
};

export default AdminBanners;
