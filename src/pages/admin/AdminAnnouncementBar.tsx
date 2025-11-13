import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

export default function AdminAnnouncementBar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    text_ar: "",
    text_en: "",
    link_url: "",
    is_active: true,
    display_order: 0,
    background_color: "#000000",
    text_color: "#FFFFFF",
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcement-bar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_bar")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("announcement_bar").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcement-bar"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-bar"] });
      toast({ title: "تم إضافة الإعلان بنجاح" });
      resetForm();
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("announcement_bar")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcement-bar"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-bar"] });
      toast({ title: "تم تحديث الإعلان بنجاح" });
      resetForm();
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcement_bar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcement-bar"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-bar"] });
      toast({ title: "تم حذف الإعلان بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      text_ar: "",
      text_en: "",
      link_url: "",
      is_active: true,
      display_order: 0,
      background_color: "#000000",
      text_color: "#FFFFFF",
    });
    setEditingId(null);
  };

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setFormData({
      text_ar: announcement.text_ar,
      text_en: announcement.text_en || "",
      link_url: announcement.link_url || "",
      is_active: announcement.is_active,
      display_order: announcement.display_order,
      background_color: announcement.background_color || "#000000",
      text_color: announcement.text_color || "#FFFFFF",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <AdminBackButton />
      
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "تعديل الإعلان" : "إضافة إعلان جديد"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="text_ar">النص بالعربية *</Label>
              <Input
                id="text_ar"
                value={formData.text_ar}
                onChange={(e) => setFormData({ ...formData, text_ar: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="text_en">النص بالإنجليزية</Label>
              <Input
                id="text_en"
                value={formData.text_en}
                onChange={(e) => setFormData({ ...formData, text_en: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="link_url">الرابط</Label>
              <Input
                id="link_url"
                type="url"
                placeholder="https://example.com أو /products"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="background_color">لون الخلفية</Label>
                <div className="flex gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="text_color">لون النص</Label>
                <div className="flex gap-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="display_order">ترتيب العرض</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">نشط</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "تحديث" : "إضافة"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإعلانات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements?.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center justify-between p-4 border rounded-lg"
                style={{ 
                  backgroundColor: announcement.background_color + '20',
                  borderColor: announcement.background_color
                }}
              >
                <div className="flex-1">
                  <p className="font-medium" style={{ color: announcement.text_color }}>
                    {announcement.text_ar}
                  </p>
                  {announcement.link_url && (
                    <p className="text-sm text-muted-foreground mt-1">
                      الرابط: {announcement.link_url}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <span>الترتيب: {announcement.display_order}</span>
                    <span>•</span>
                    <span>{announcement.is_active ? "نشط" : "غير نشط"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(announcement)}
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
