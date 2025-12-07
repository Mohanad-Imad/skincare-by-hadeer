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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";

interface Announcement {
  id: string;
  message_ar: string;
  message_en: string | null;
  link_url: string | null;
  background_color: string | null;
  text_color: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminAnnouncementBar = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    message_ar: "",
    message_en: "",
    link_url: "",
    background_color: "#ec4899",
    text_color: "#ffffff",
    is_active: true,
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_bar")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Announcement[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("announcement_bar")
          .update({
            message_ar: data.message_ar,
            message_en: data.message_en || null,
            link_url: data.link_url || null,
            background_color: data.background_color,
            text_color: data.text_color,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const maxOrder = announcements?.reduce((max, a) => Math.max(max, a.display_order), -1) ?? -1;
        const { error } = await supabase.from("announcement_bar").insert({
          message_ar: data.message_ar,
          message_en: data.message_en || null,
          link_url: data.link_url || null,
          background_color: data.background_color,
          text_color: data.text_color,
          is_active: data.is_active,
          display_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-bar"] });
      toast.success(editingItem ? "تم تحديث الإعلان" : "تم إضافة الإعلان");
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcement_bar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-bar"] });
      toast.success("تم حذف الإعلان");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("announcement_bar")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-bar"] });
    },
  });

  const resetForm = () => {
    setFormData({
      message_ar: "",
      message_en: "",
      link_url: "",
      background_color: "#ec4899",
      text_color: "#ffffff",
      is_active: true,
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      message_ar: item.message_ar,
      message_en: item.message_en || "",
      link_url: item.link_url || "",
      background_color: item.background_color || "#ec4899",
      text_color: item.text_color || "#ffffff",
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || !announcements) return;
    const current = announcements[index];
    const prev = announcements[index - 1];
    reorderMutation.mutate({ id: current.id, newOrder: prev.display_order });
    reorderMutation.mutate({ id: prev.id, newOrder: current.display_order });
  };

  const handleMoveDown = (index: number) => {
    if (!announcements || index === announcements.length - 1) return;
    const current = announcements[index];
    const next = announcements[index + 1];
    reorderMutation.mutate({ id: current.id, newOrder: next.display_order });
    reorderMutation.mutate({ id: next.id, newOrder: current.display_order });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message_ar.trim()) {
      toast.error("الرجاء إدخال نص الإعلان");
      return;
    }
    saveMutation.mutate({ ...formData, id: editingItem?.id });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminBackButton />

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">شريط الإعلانات</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة إعلان
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "تعديل الإعلان" : "إضافة إعلان جديد"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>نص الإعلان (عربي) *</Label>
                  <Input
                    value={formData.message_ar}
                    onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
                    placeholder="مثال: خصم 20% على جميع المنتجات!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نص الإعلان (إنجليزي)</Label>
                  <Input
                    value={formData.message_en}
                    onChange={(e) => setFormData({ ...formData, message_en: e.target.value })}
                    placeholder="Optional English text"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط (اختياري)</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/products أو https://..."
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>لون الخلفية</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="flex-1"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>لون النص</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="flex-1"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg text-center text-sm font-medium"
                  style={{
                    backgroundColor: formData.background_color,
                    color: formData.text_color,
                  }}
                >
                  {formData.message_ar || "معاينة الإعلان"}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>نشط</Label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                    {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الإعلانات الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>
            ) : !announcements || announcements.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">لا توجد إعلانات</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الترتيب</TableHead>
                    <TableHead className="text-right">النص</TableHead>
                    <TableHead className="text-right">الرابط</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === announcements.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="inline-block px-3 py-1 rounded text-sm"
                          style={{
                            backgroundColor: item.background_color || "#ec4899",
                            color: item.text_color || "#ffffff",
                          }}
                        >
                          {item.message_ar.length > 40
                            ? item.message_ar.substring(0, 40) + "..."
                            : item.message_ar}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.link_url ? (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <ExternalLink className="h-3 w-3" />
                            <span className="max-w-[150px] truncate">{item.link_url}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {item.is_active ? "نشط" : "غير نشط"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnnouncementBar;
