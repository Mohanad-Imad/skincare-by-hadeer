import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface Consultation {
  id: string;
  full_name: string;
  gender: string;
  age: number;
  phone: string;
  location: string;
  skin_type: string | null;
  main_concerns: string[];
  status: string;
  created_at: string;
  problem_duration: string;
  other_concern: string | null;
  previous_treatment: boolean;
  previous_treatment_details: string | null;
  face_wash_frequency: string;
  cleanser_type: string | null;
  uses_moisturizer: boolean;
  uses_sunscreen: boolean;
  uses_serums: boolean;
  serum_details: string | null;
  sun_exposure: string;
  daily_water_intake: string;
  balanced_diet: boolean;
  stress_levels: boolean;
  smoking_alcohol: boolean;
  work_environment: string | null;
  uses_contraceptives: boolean | null;
  is_pregnant_nursing: boolean | null;
  chronic_diseases: string | null;
  current_medications: string | null;
  allergies: string | null;
  additional_notes: string | null;
  consultation_preference: string;
  preferred_contact_time: string;
  product_preference: string;
  image_urls: string[] | null;
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  in_progress: "قيد المعالجة",
  completed: "مكتملة",
  cancelled: "ملغية",
};

const statusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "cancelled") return "destructive";
  if (status === "completed") return "default";
  if (status === "in_progress") return "secondary";
  return "outline";
};

export default function AdminConsultationPrint() {
  const { id } = useParams();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [isLoading, setIsLoading] = useState(true);
  const [consultation, setConsultation] = useState<Consultation | null>(null);

  const fileName = useMemo(() => {
    if (!consultation) return "consultation.pdf";
    return `استشارة-${consultation.full_name}-${format(new Date(consultation.created_at), "yyyy-MM-dd")}.pdf`;
  }, [consultation]);

  useEffect(() => {
    if (!isAdmin || !id) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("consultations")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setConsultation(data as Consultation);
      } catch (e) {
        console.error("Failed to load consultation for print:", e);
        toast.error("تعذر تحميل الاستشارة للطباعة");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, isAdmin]);

  useEffect(() => {
    if (!consultation) return;
    document.title = fileName;

    // Auto-open print dialog (after data renders)
    const t = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(t);
  }, [consultation, fileName]);

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  if (!consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">لا يمكن عرض الاستشارة.</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SEO
        title="طباعة الاستشارة"
        description="صفحة طباعة الاستشارة من لوحة التحكم"
        noindex
      />

      <header className="print:hidden sticky top-0 z-50 border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">تقرير الاستشارة</p>
            <p className="text-xs text-muted-foreground truncate">{fileName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.close()}>
              <X className="ml-2 h-4 w-4" />
              إغلاق
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="ml-2 h-4 w-4" />
              طباعة / حفظ PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 print:py-0">
        <section className="mb-4">
          <h1 className="text-2xl font-bold">تقرير استشارة جلدية</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusBadgeVariant(consultation.status)}>
              {statusLabels[consultation.status] || consultation.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(consultation.created_at), "dd MMMM yyyy - hh:mm a", { locale: ar })}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">الاسم:</span> {consultation.full_name}</p>
              <p><span className="text-muted-foreground">الجنس:</span> {consultation.gender === "female" ? "أنثى" : "ذكر"}</p>
              <p><span className="text-muted-foreground">العمر:</span> {consultation.age} سنة</p>
              <p><span className="text-muted-foreground">الهاتف:</span> {consultation.phone}</p>
              <p><span className="text-muted-foreground">الموقع:</span> {consultation.location}</p>
              <p><span className="text-muted-foreground">نوع البشرة:</span> {consultation.skin_type || "غير محدد"}</p>
            </CardContent>
          </Card>

          <Card className="break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">المشاكل الرئيسية</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">المشاكل:</span> {consultation.main_concerns?.join("، ")}
              </p>
              {consultation.other_concern && (
                <p><span className="text-muted-foreground">مشكلة أخرى:</span> {consultation.other_concern}</p>
              )}
              <p><span className="text-muted-foreground">مدة المشكلة:</span> {consultation.problem_duration}</p>
              {consultation.previous_treatment && (
                <p><span className="text-muted-foreground">علاج سابق:</span> {consultation.previous_treatment_details || "نعم"}</p>
              )}
            </CardContent>
          </Card>

          <Card className="break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">روتين العناية</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">غسل الوجه:</span> {consultation.face_wash_frequency}</p>
              <p><span className="text-muted-foreground">نوع الغسول:</span> {consultation.cleanser_type || "غير محدد"}</p>
              <p><span className="text-muted-foreground">المرطب:</span> {consultation.uses_moisturizer ? "نعم" : "لا"}</p>
              <p><span className="text-muted-foreground">واقي الشمس:</span> {consultation.uses_sunscreen ? "نعم" : "لا"}</p>
              <p><span className="text-muted-foreground">السيروم:</span> {consultation.uses_serums ? "نعم" : "لا"}</p>
              {consultation.serum_details && (
                <p><span className="text-muted-foreground">تفاصيل السيروم:</span> {consultation.serum_details}</p>
              )}
            </CardContent>
          </Card>

          <Card className="break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">نمط الحياة</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">التعرض للشمس:</span> {consultation.sun_exposure}</p>
              <p><span className="text-muted-foreground">شرب الماء:</span> {consultation.daily_water_intake}</p>
              <p><span className="text-muted-foreground">نظام غذائي متوازن:</span> {consultation.balanced_diet ? "نعم" : "لا"}</p>
              <p><span className="text-muted-foreground">ضغط نفسي:</span> {consultation.stress_levels ? "نعم" : "لا"}</p>
              <p><span className="text-muted-foreground">التدخين/الكحول:</span> {consultation.smoking_alcohol ? "نعم" : "لا"}</p>
              {consultation.work_environment && (
                <p><span className="text-muted-foreground">بيئة العمل:</span> {consultation.work_environment}</p>
              )}
            </CardContent>
          </Card>

          {consultation.gender === "female" && (
            <Card className="break-inside-avoid md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">معلومات صحية (للنساء)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><span className="text-muted-foreground">حبوب منع الحمل:</span> {consultation.uses_contraceptives ? "نعم" : "لا"}</p>
                <p><span className="text-muted-foreground">حامل أو مرضع:</span> {consultation.is_pregnant_nursing ? "نعم" : "لا"}</p>
              </CardContent>
            </Card>
          )}

          <Card className="break-inside-avoid md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">المعلومات الصحية</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">الأمراض المزمنة:</span> {consultation.chronic_diseases || "لا يوجد"}</p>
              <p><span className="text-muted-foreground">الأدوية الحالية:</span> {consultation.current_medications || "لا يوجد"}</p>
              <p><span className="text-muted-foreground">الحساسية:</span> {consultation.allergies || "لا يوجد"}</p>
            </CardContent>
          </Card>

          <Card className="break-inside-avoid md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">التفضيلات</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">نوع الاستشارة:</span> {consultation.consultation_preference}</p>
              <p><span className="text-muted-foreground">وقت التواصل المفضل:</span> {consultation.preferred_contact_time}</p>
              <p><span className="text-muted-foreground">تفضيل المنتجات:</span> {consultation.product_preference}</p>
            </CardContent>
          </Card>

          {consultation.additional_notes && (
            <Card className="break-inside-avoid md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ملاحظات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="whitespace-pre-wrap">{consultation.additional_notes}</p>
              </CardContent>
            </Card>
          )}

          {consultation.image_urls && consultation.image_urls.length > 0 && (
            <Card className="break-inside-avoid md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">روابط الصور المرفقة ({consultation.image_urls.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">(لتجنب بطء/تعليق التحميل، نعرض الروابط فقط)</p>
                <ol className="list-decimal pr-5 space-y-1">
                  {consultation.image_urls.map((url, i) => (
                    <li key={url + i}>
                      <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
