import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface QuickLink {
  id: string;
  title_ar: string;
  title_en: string | null;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

const AdminQuickLinks = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    image_url: "",
    link_url: "",
    display_order: 0,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: quickLinks, isLoading } = useQuery({
    queryKey: ["admin-quick-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_links")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as QuickLink[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("quick_links").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quick-links"] });
      queryClient.invalidateQueries({ queryKey: ["quick-links"] });
      toast.success("تم إضافة الرابط بنجاح");
      resetForm();
    },
    onError: () => {
      toast.error("فشل في إضافة الرابط");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("quick_links")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quick-links"] });
      queryClient.invalidateQueries({ queryKey: ["quick-links"] });
      toast.success("تم تحديث الرابط بنجاح");
      resetForm();
    },
    onError: () => {
      toast.error("فشل في تحديث الرابط");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quick_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quick-links"] });
      queryClient.invalidateQueries({ queryKey: ["quick-links"] });
      toast.success("تم حذف الرابط بنجاح");
    },
    onError: () => {
      toast.error("فشل في حذف الرابط");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      title_ar: "",
      title_en: "",
      image_url: "",
      link_url: "",
      display_order: 0,
      is_active: true,
    });
    setEditingLink(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (link: QuickLink) => {
    setEditingLink(link);
    setFormData({
      title_ar: link.title_ar,
      title_en: link.title_en || "",
      image_url: link.image_url,
      link_url: link.link_url,
      display_order: link.display_order,
      is_active: link.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      toast.error("فشل في رفع الصورة");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="إدارة الروابط السريعة - لوحة التحكم"
        description="إدارة وتنظيم الروابط السريعة في الصفحة الرئيسية"
      />
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>إدارة الروابط السريعة</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetForm()}>
                      <Plus className="ml-2 h-4 w-4" />
                      إضافة رابط جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLink ? "تعديل رابط" : "إضافة رابط جديد"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_ar">العنوان بالعربي *</Label>
                        <Input
                          id="title_ar"
                          value={formData.title_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, title_ar: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title_en">العنوان بالإنجليزي</Label>
                        <Input
                          id="title_en"
                          value={formData.title_en}
                          onChange={(e) =>
                            setFormData({ ...formData, title_en: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="image">صورة الرابط *</Label>
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        {formData.image_url && (
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="mt-2 w-20 h-20 object-cover rounded-full"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="link_url">رابط التوجيه *</Label>
                        <Input
                          id="link_url"
                          value={formData.link_url}
                          onChange={(e) =>
                            setFormData({ ...formData, link_url: e.target.value })
                          }
                          placeholder="/products?category=xxx أو https://..."
                          required
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

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetForm}
                        >
                          إلغاء
                        </Button>
                        <Button type="submit">
                          {editingLink ? "تحديث" : "إضافة"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : quickLinks && quickLinks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>الصورة</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>الرابط</TableHead>
                        <TableHead>الترتيب</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quickLinks.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <img
                              src={link.image_url}
                              alt={link.title_ar}
                              className="w-12 h-12 object-cover rounded-full"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {link.title_ar}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {link.link_url}
                          </TableCell>
                          <TableCell>{link.display_order}</TableCell>
                          <TableCell>
                            {link.is_active ? (
                              <span className="text-green-600">نشط</span>
                            ) : (
                              <span className="text-red-600">غير نشط</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(link)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (
                                    confirm("هل أنت متأكد من حذف هذا الرابط؟")
                                  ) {
                                    deleteMutation.mutate(link.id);
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد روابط سريعة. ابدأ بإضافة رابط جديد!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuickLinks;
