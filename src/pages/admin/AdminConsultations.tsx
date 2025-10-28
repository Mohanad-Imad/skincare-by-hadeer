import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Consultation {
  id: string;
  full_name: string;
  gender: string;
  age: number;
  phone: string;
  location: string;
  skin_type: string;
  main_concerns: string[];
  status: string;
  created_at: string;
  [key: string]: any;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  in_progress: "قيد المعالجة",
  completed: "مكتملة",
  cancelled: "ملغية",
};

const concernLabels: Record<string, string> = {
  acne: "حب الشباب",
  pigmentation: "التصبغات أو الكلف",
  freckles: "النمش",
  wrinkles: "التجاعيد",
  dryness: "الجفاف الشديد",
  large_pores: "المسامات الواسعة",
  redness: "الاحمرار أو الحساسية",
  brightening: "تفتيح البشرة",
  other: "أخرى",
};

export default function AdminConsultations() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchConsultations();
    }
  }, [isAdmin]);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      toast.error("حدث خطأ في جلب الاستشارات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsDetailOpen(true);
  };

  const handleRespond = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setAdminResponse(consultation.admin_response || "");
    setAdminNotes(consultation.admin_notes || "");
    setNewStatus(consultation.status);
    setIsRespondOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedConsultation) return;

    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("consultations")
        .update({
          admin_response: adminResponse,
          admin_notes: adminNotes,
          status: newStatus,
          responded_at: new Date().toISOString(),
          responded_by: session?.user.id,
        })
        .eq("id", selectedConsultation.id);

      if (error) throw error;

      toast.success("تم حفظ الرد بنجاح");
      setIsRespondOpen(false);
      fetchConsultations();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("حدث خطأ في حفظ الرد");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (adminLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة الاستشارات</h1>
        <p className="text-muted-foreground">
          عرض وإدارة طلبات الاستشارة من العملاء
        </p>
      </div>

      <div className="grid gap-4">
        {consultations.map((consultation) => (
          <Card key={consultation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{consultation.full_name}</CardTitle>
                  <CardDescription>
                    {format(new Date(consultation.created_at), "dd MMMM yyyy - hh:mm a", {
                      locale: ar,
                    })}
                  </CardDescription>
                </div>
                <Badge className={statusColors[consultation.status]}>
                  {statusLabels[consultation.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">العمر</p>
                  <p className="font-medium">{consultation.age} سنة</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium" dir="ltr">{consultation.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الموقع</p>
                  <p className="font-medium">{consultation.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نوع البشرة</p>
                  <p className="font-medium">{consultation.skin_type || "غير محدد"}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">المشاكل الرئيسية</p>
                <div className="flex flex-wrap gap-2">
                  {consultation.main_concerns?.map((concern: string) => (
                    <Badge key={concern} variant="outline">
                      {concernLabels[concern] || concern}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleViewDetails(consultation)} variant="outline">
                  <Eye className="ml-2 h-4 w-4" />
                  عرض التفاصيل الكاملة
                </Button>
                <Button onClick={() => handleRespond(consultation)}>
                  <MessageSquare className="ml-2 h-4 w-4" />
                  الرد على الاستشارة
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {consultations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">لا توجد استشارات حتى الآن</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog للتفاصيل الكاملة */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الاستشارة الكاملة</DialogTitle>
          </DialogHeader>
          {selectedConsultation && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">المعلومات الشخصية</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">الاسم:</span> {selectedConsultation.full_name}</p>
                    <p><span className="text-muted-foreground">الجنس:</span> {selectedConsultation.gender === "female" ? "أنثى" : "ذكر"}</p>
                    <p><span className="text-muted-foreground">العمر:</span> {selectedConsultation.age}</p>
                    <p><span className="text-muted-foreground">الهاتف:</span> {selectedConsultation.phone}</p>
                    <p><span className="text-muted-foreground">الموقع:</span> {selectedConsultation.location}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">روتين العناية</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">غسل الوجه:</span> {selectedConsultation.face_wash_frequency}</p>
                    <p><span className="text-muted-foreground">الغسول:</span> {selectedConsultation.cleanser_type || "غير محدد"}</p>
                    <p><span className="text-muted-foreground">المرطب:</span> {selectedConsultation.uses_moisturizer ? "نعم" : "لا"}</p>
                    <p><span className="text-muted-foreground">واقي الشمس:</span> {selectedConsultation.uses_sunscreen ? "نعم" : "لا"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">المشاكل الرئيسية</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedConsultation.main_concerns?.map((concern: string) => (
                    <Badge key={concern} variant="secondary">
                      {concernLabels[concern] || concern}
                    </Badge>
                  ))}
                </div>
                {selectedConsultation.other_concern && (
                  <p className="text-sm"><span className="text-muted-foreground">مشكلة أخرى:</span> {selectedConsultation.other_concern}</p>
                )}
                <p className="text-sm mt-2"><span className="text-muted-foreground">مدة المشكلة:</span> {selectedConsultation.problem_duration}</p>
                {selectedConsultation.previous_treatment && (
                  <p className="text-sm"><span className="text-muted-foreground">علاج سابق:</span> {selectedConsultation.previous_treatment_details || "نعم"}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">نمط الحياة</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <p><span className="text-muted-foreground">التعرض للشمس:</span> {selectedConsultation.sun_exposure}</p>
                  <p><span className="text-muted-foreground">شرب الماء:</span> {selectedConsultation.daily_water_intake}</p>
                  <p><span className="text-muted-foreground">نظام غذائي متوازن:</span> {selectedConsultation.balanced_diet ? "نعم" : "لا"}</p>
                  <p><span className="text-muted-foreground">ضغط نفسي:</span> {selectedConsultation.stress_levels ? "نعم" : "لا"}</p>
                  <p><span className="text-muted-foreground">التدخين/الكحول:</span> {selectedConsultation.smoking_alcohol ? "نعم" : "لا"}</p>
                  {selectedConsultation.work_environment && (
                    <p><span className="text-muted-foreground">بيئة العمل:</span> {selectedConsultation.work_environment}</p>
                  )}
                </div>
              </div>

              {selectedConsultation.gender === "female" && (
                <div>
                  <h3 className="font-semibold mb-2">معلومات صحية (للنساء)</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">حبوب منع الحمل:</span> {selectedConsultation.uses_contraceptives ? "نعم" : "لا"}</p>
                    <p><span className="text-muted-foreground">حامل أو مرضع:</span> {selectedConsultation.is_pregnant_nursing ? "نعم" : "لا"}</p>
                  </div>
                </div>
              )}

              {selectedConsultation.chronic_diseases && (
                <div>
                  <h3 className="font-semibold mb-2">الأمراض المزمنة</h3>
                  <p className="text-sm">{selectedConsultation.chronic_diseases}</p>
                </div>
              )}

              {selectedConsultation.current_medications && (
                <div>
                  <h3 className="font-semibold mb-2">الأدوية الحالية</h3>
                  <p className="text-sm">{selectedConsultation.current_medications}</p>
                </div>
              )}

              {selectedConsultation.allergies && (
                <div>
                  <h3 className="font-semibold mb-2">الحساسية</h3>
                  <p className="text-sm">{selectedConsultation.allergies}</p>
                </div>
              )}

              {selectedConsultation.additional_notes && (
                <div>
                  <h3 className="font-semibold mb-2">ملاحظات إضافية</h3>
                  <p className="text-sm">{selectedConsultation.additional_notes}</p>
                </div>
              )}

              {selectedConsultation.image_urls && selectedConsultation.image_urls.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">الصور المرفقة (صور تشخيصية)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedConsultation.image_urls.map((url: string, index: number) => (
                      <div key={index} className="border rounded-lg p-2 bg-muted/30">
                        <img
                          src={url}
                          alt={`صورة تشخيصية ${index + 1}`}
                          className="w-full h-64 object-contain rounded"
                        />
                        <p className="text-xs text-muted-foreground text-center mt-2">صورة {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">التفضيلات</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">نوع الاستشارة:</span> {selectedConsultation.consultation_preference}</p>
                  <p><span className="text-muted-foreground">وقت التواصل المفضل:</span> {selectedConsultation.preferred_contact_time}</p>
                  <p><span className="text-muted-foreground">تفضيل المنتجات:</span> {selectedConsultation.product_preference}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog للرد */}
      <Dialog open={isRespondOpen} onOpenChange={setIsRespondOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>الرد على الاستشارة</DialogTitle>
            <DialogDescription>
              {selectedConsultation?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">حالة الاستشارة</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">الرد للعميل</label>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={6}
                placeholder="اكتب الرد الذي سيصل للعميل..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">ملاحظات داخلية (لن تظهر للعميل)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="ملاحظات للفريق الطبي..."
              />
            </div>

            <Button
              onClick={handleSubmitResponse}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ الرد"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
