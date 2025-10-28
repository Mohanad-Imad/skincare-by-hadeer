import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CelebrityRoutine {
  id: string;
  celebrity_name_ar: string;
  celebrity_name_en: string;
  image_url: string | null;
  country_ar: string;
  country_en: string;
  skin_type: string;
  tagline_ar: string | null;
  tagline_en: string | null;
  morning_routine_ar: string;
  morning_routine_en: string;
  evening_routine_ar: string;
  evening_routine_en: string;
  favorite_products: any;
  expert_notes_ar: string | null;
  expert_notes_en: string | null;
  tips_ar: string | null;
  tips_en: string | null;
  region: string | null;
  view_count: number;
  is_active: boolean;
  display_order: number;
}

const emptyRoutine: Partial<CelebrityRoutine> = {
  celebrity_name_ar: "",
  celebrity_name_en: "",
  country_ar: "",
  country_en: "",
  skin_type: "normal",
  morning_routine_ar: "",
  morning_routine_en: "",
  evening_routine_ar: "",
  evening_routine_en: "",
  favorite_products: null,
  is_active: true,
  display_order: 0,
};

export default function AdminCelebrityRoutines() {
  const [routines, setRoutines] = useState<CelebrityRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Partial<CelebrityRoutine>>(emptyRoutine);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from("celebrity_routines")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error fetching routines:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!editingRoutine.celebrity_name_ar || !editingRoutine.celebrity_name_en) {
        toast.error("الرجاء إدخال اسم المشهور بالعربية والإنجليزية");
        return;
      }

      const routineData: any = {
        ...editingRoutine,
        favorite_products: editingRoutine.favorite_products || null,
      };

      if (editingRoutine.id) {
        const { error } = await supabase
          .from("celebrity_routines")
          .update(routineData)
          .eq("id", editingRoutine.id);

        if (error) throw error;
        toast.success("تم تحديث الروتين بنجاح");
      } else {
        const { error } = await supabase
          .from("celebrity_routines")
          .insert([routineData]);

        if (error) throw error;
        toast.success("تم إضافة الروتين بنجاح");
      }

      setDialogOpen(false);
      setEditingRoutine(emptyRoutine);
      fetchRoutines();
    } catch (error) {
      console.error("Error saving routine:", error);
      toast.error("حدث خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الروتين؟")) return;

    try {
      const { error } = await supabase
        .from("celebrity_routines")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف الروتين بنجاح");
      fetchRoutines();
    } catch (error) {
      console.error("Error deleting routine:", error);
      toast.error("حدث خطأ في الحذف");
    }
  };

  const handleEdit = (routine: CelebrityRoutine) => {
    setEditingRoutine(routine);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRoutine(emptyRoutine);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة روتين المشاهير</h1>
          <p className="text-muted-foreground">إضافة وتعديل روتينات العناية بالبشرة للمشاهير</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة روتين جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoutine.id ? "تعديل الروتين" : "إضافة روتين جديد"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6" dir="rtl">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>المعلومات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>اسم المشهور (عربي) *</Label>
                      <Input
                        value={editingRoutine.celebrity_name_ar || ""}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, celebrity_name_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>اسم المشهور (English) *</Label>
                      <Input
                        value={editingRoutine.celebrity_name_en || ""}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, celebrity_name_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>البلد (عربي)</Label>
                      <Input
                        value={editingRoutine.country_ar || ""}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, country_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>البلد (English)</Label>
                      <Input
                        value={editingRoutine.country_en || ""}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, country_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>نوع البشرة</Label>
                    <Select
                      value={editingRoutine.skin_type || "normal"}
                      onValueChange={(value) => setEditingRoutine({ ...editingRoutine, skin_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oily">دهنية</SelectItem>
                        <SelectItem value="dry">جافة</SelectItem>
                        <SelectItem value="combination">مختلطة</SelectItem>
                        <SelectItem value="sensitive">حساسة</SelectItem>
                        <SelectItem value="normal">عادية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>رابط الصورة</Label>
                    <Input
                      value={editingRoutine.image_url || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الشعار (عربي)</Label>
                      <Input
                        value={editingRoutine.tagline_ar || ""}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, tagline_ar: e.target.value })}
                        placeholder="ملكة الإشراقة الكورية"
                      />
                    </div>
                    <div>
                      <Label>Tagline (English)</Label>
                      <Input
                        value={editingRoutine.tagline_en || ""}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, tagline_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingRoutine.is_active}
                        onCheckedChange={(checked) => setEditingRoutine({ ...editingRoutine, is_active: checked })}
                      />
                      <Label>نشط</Label>
                    </div>
                    <div>
                      <Label>ترتيب العرض</Label>
                      <Input
                        type="number"
                        value={editingRoutine.display_order || 0}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, display_order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Routines */}
              <Card>
                <CardHeader>
                  <CardTitle>الروتينات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الروتين الصباحي (عربي)</Label>
                    <Textarea
                      rows={6}
                      value={editingRoutine.morning_routine_ar || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, morning_routine_ar: e.target.value })}
                      placeholder="اكتب خطوات الروتين الصباحي..."
                    />
                  </div>

                  <div>
                    <Label>Morning Routine (English)</Label>
                    <Textarea
                      rows={6}
                      value={editingRoutine.morning_routine_en || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, morning_routine_en: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>الروتين المسائي (عربي)</Label>
                    <Textarea
                      rows={6}
                      value={editingRoutine.evening_routine_ar || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, evening_routine_ar: e.target.value })}
                      placeholder="اكتب خطوات الروتين المسائي..."
                    />
                  </div>

                  <div>
                    <Label>Evening Routine (English)</Label>
                    <Textarea
                      rows={6}
                      value={editingRoutine.evening_routine_en || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, evening_routine_en: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Expert Notes & Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>ملاحظات الخبير والنصائح</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>ملاحظات الخبير (عربي)</Label>
                    <Textarea
                      rows={4}
                      value={editingRoutine.expert_notes_ar || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, expert_notes_ar: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Expert Notes (English)</Label>
                    <Textarea
                      rows={4}
                      value={editingRoutine.expert_notes_en || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, expert_notes_en: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>النصائح (عربي)</Label>
                    <Textarea
                      rows={4}
                      value={editingRoutine.tips_ar || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, tips_ar: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Tips (English)</Label>
                    <Textarea
                      rows={4}
                      value={editingRoutine.tips_en || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, tips_en: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المشهور</TableHead>
                <TableHead className="text-right">البلد</TableHead>
                <TableHead className="text-right">نوع البشرة</TableHead>
                <TableHead className="text-right">المشاهدات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routines.map((routine) => (
                <TableRow key={routine.id}>
                  <TableCell className="font-medium">{routine.celebrity_name_ar}</TableCell>
                  <TableCell>{routine.country_ar}</TableCell>
                  <TableCell>{routine.skin_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {routine.view_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${routine.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {routine.is_active ? "نشط" : "غير نشط"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(routine)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(routine.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {routines.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد روتينات مضافة بعد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
