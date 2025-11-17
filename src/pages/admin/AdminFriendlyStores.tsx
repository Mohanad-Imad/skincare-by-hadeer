import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface FriendlyStore {
  id: string;
  title_ar: string;
  title_en: string | null;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminFriendlyStores() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<FriendlyStore | null>(null);
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    image_url: "",
    link_url: "",
    display_order: 0,
    is_active: true,
  });

  const { data: stores, isLoading } = useQuery({
    queryKey: ["admin-friendly-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendly_stores")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as FriendlyStore[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("friendly_stores").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-friendly-stores"] });
      queryClient.invalidateQueries({ queryKey: ["friendly-stores"] });
      toast.success("تم إضافة المتجر بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("فشل في إضافة المتجر: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("friendly_stores")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-friendly-stores"] });
      queryClient.invalidateQueries({ queryKey: ["friendly-stores"] });
      toast.success("تم تحديث المتجر بنجاح");
      resetForm();
    },
    onError: (error) => {
      toast.error("فشل في تحديث المتجر: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("friendly_stores")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-friendly-stores"] });
      queryClient.invalidateQueries({ queryKey: ["friendly-stores"] });
      toast.success("تم حذف المتجر بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في حذف المتجر: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: formData });
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
    setEditingStore(null);
    setOpen(false);
  };

  const handleEdit = (store: FriendlyStore) => {
    setEditingStore(store);
    setFormData({
      title_ar: store.title_ar,
      title_en: store.title_en || "",
      image_url: store.image_url,
      link_url: store.link_url,
      display_order: store.display_order,
      is_active: store.is_active,
    });
    setOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("تم رفع الصورة بنجاح");
    } catch (error: any) {
      toast.error("فشل في رفع الصورة: " + error.message);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <Navbar />
        <div className="flex-1 flex">
          <AdminSidebar />
          <main className="flex-1 p-6 overflow-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>إدارة المتاجر الصديقة</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetForm()}>
                      <Plus className="ml-2 h-4 w-4" />
                      إضافة متجر
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingStore ? "تعديل متجر صديق" : "إضافة متجر صديق"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="title_ar">الاسم بالعربي *</Label>
                        <Input
                          id="title_ar"
                          value={formData.title_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, title_ar: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="title_en">الاسم بالإنجليزي</Label>
                        <Input
                          id="title_en"
                          value={formData.title_en}
                          onChange={(e) =>
                            setFormData({ ...formData, title_en: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="image">صورة المتجر *</Label>
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
                            className="mt-2 h-32 object-contain rounded"
                          />
                        )}
                      </div>

                      <div>
                        <Label htmlFor="link_url">رابط المتجر *</Label>
                        <Input
                          id="link_url"
                          type="url"
                          value={formData.link_url}
                          onChange={(e) =>
                            setFormData({ ...formData, link_url: e.target.value })
                          }
                          placeholder="https://example.com"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="display_order">ترتيب العرض</Label>
                        <Input
                          id="display_order"
                          type="number"
                          value={formData.display_order}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              display_order: parseInt(e.target.value) || 0,
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

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={resetForm}>
                          إلغاء
                        </Button>
                        <Button type="submit">
                          {editingStore ? "تحديث" : "إضافة"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : stores && stores.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stores.map((store) => (
                      <Card key={store.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <img
                              src={store.image_url}
                              alt={store.title_ar}
                              className="w-20 h-20 object-contain rounded"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">{store.title_ar}</h3>
                              {store.title_en && (
                                <p className="text-sm text-muted-foreground">
                                  {store.title_en}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">
                                الترتيب: {store.display_order}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    store.is_active
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {store.is_active ? "نشط" : "غير نشط"}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(store)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(store.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد متاجر صديقة حالياً
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
