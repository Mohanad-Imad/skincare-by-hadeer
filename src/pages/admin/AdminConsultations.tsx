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
import { Loader2, Eye, MessageSquare, X, ChevronLeft, ChevronRight, ZoomIn, Copy, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AdminBackButton } from "@/components/admin/AdminBackButton";


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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);

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

  const formatConsultationText = (consultation: Consultation) => {
    const genderLabel = consultation.gender === "female" ? "أنثى" : "ذكر";
    const concerns = consultation.main_concerns?.map((c: string) => concernLabels[c] || c).join("، ") || "";
    
    const text = `
═══════════════════════════════════════
      تقرير استشارة جلدية
═══════════════════════════════════════

📋 المعلومات الشخصية:
━━━━━━━━━━━━━━━━━━━━
• الاسم: ${consultation.full_name}
• الجنس: ${genderLabel}
• العمر: ${consultation.age} سنة
• الهاتف: ${consultation.phone}
• الموقع: ${consultation.location}
• نوع البشرة: ${consultation.skin_type || "غير محدد"}

🔍 المشاكل الرئيسية:
━━━━━━━━━━━━━━━━━━━━
${concerns}
${consultation.other_concern ? `• مشكلة أخرى: ${consultation.other_concern}` : ""}
• مدة المشكلة: ${consultation.problem_duration}
${consultation.previous_treatment ? `• علاج سابق: ${consultation.previous_treatment_details || "نعم"}` : ""}

🧴 روتين العناية الحالي:
━━━━━━━━━━━━━━━━━━━━
• غسل الوجه: ${consultation.face_wash_frequency}
• نوع الغسول: ${consultation.cleanser_type || "غير محدد"}
• استخدام المرطب: ${consultation.uses_moisturizer ? "نعم" : "لا"}
${consultation.moisturizer_type ? `• نوع المرطب: ${consultation.moisturizer_type}` : ""}
• استخدام واقي الشمس: ${consultation.uses_sunscreen ? "نعم" : "لا"}
• استخدام السيروم: ${consultation.uses_serums ? "نعم" : "لا"}
${consultation.serum_details ? `• تفاصيل السيروم: ${consultation.serum_details}` : ""}
${consultation.removes_makeup ? `• إزالة المكياج: ${consultation.removes_makeup}` : ""}

🌿 نمط الحياة:
━━━━━━━━━━━━━━━━━━━━
• التعرض للشمس: ${consultation.sun_exposure}
• شرب الماء يومياً: ${consultation.daily_water_intake}
• نظام غذائي متوازن: ${consultation.balanced_diet ? "نعم" : "لا"}
• ضغط نفسي: ${consultation.stress_levels ? "نعم" : "لا"}
• التدخين/الكحول: ${consultation.smoking_alcohol ? "نعم" : "لا"}
${consultation.work_environment ? `• بيئة العمل: ${consultation.work_environment}` : ""}

${consultation.gender === "female" ? `👩 معلومات صحية (للنساء):
━━━━━━━━━━━━━━━━━━━━
• حبوب منع الحمل: ${consultation.uses_contraceptives ? "نعم" : "لا"}
• حامل أو مرضع: ${consultation.is_pregnant_nursing ? "نعم" : "لا"}
` : ""}

🏥 المعلومات الصحية:
━━━━━━━━━━━━━━━━━━━━
${consultation.chronic_diseases ? `• الأمراض المزمنة: ${consultation.chronic_diseases}` : "• الأمراض المزمنة: لا يوجد"}
${consultation.current_medications ? `• الأدوية الحالية: ${consultation.current_medications}` : "• الأدوية الحالية: لا يوجد"}
${consultation.allergies ? `• الحساسية: ${consultation.allergies}` : "• الحساسية: لا يوجد"}

📝 التفضيلات:
━━━━━━━━━━━━━━━━━━━━
• نوع الاستشارة: ${consultation.consultation_preference}
• وقت التواصل المفضل: ${consultation.preferred_contact_time}
• تفضيل المنتجات: ${consultation.product_preference}

${consultation.additional_notes ? `📌 ملاحظات إضافية:
━━━━━━━━━━━━━━━━━━━━
${consultation.additional_notes}` : ""}

${consultation.image_urls && consultation.image_urls.length > 0 ? `📸 الصور المرفقة: ${consultation.image_urls.length} صورة
━━━━━━━━━━━━━━━━━━━━
${consultation.image_urls.map((url: string, i: number) => `${i + 1}. ${url}`).join("\n")}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
تاريخ الاستشارة: ${format(new Date(consultation.created_at), "dd MMMM yyyy - hh:mm a", { locale: ar })}
حالة الاستشارة: ${statusLabels[consultation.status]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    return text.trim();
  };

  const handleCopyConsultation = (consultation: Consultation) => {
    const text = formatConsultationText(consultation);
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ معلومات الاستشارة");
  };

  const handleDownloadPDF = (consultation: Consultation) => {
    const fileName = `استشارة-${consultation.full_name}-${format(new Date(consultation.created_at), "yyyy-MM-dd")}.pdf`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      toast.warning("المتصفح منع فتح نافذة جديدة. يرجى السماح بـ Popups ثم حاول مرة أخرى.");
      return;
    }

    const genderLabel = consultation.gender === "female" ? "أنثى" : "ذكر";
    const concerns = consultation.main_concerns?.map((c: string) => concernLabels[c] || c).join("، ") || "";

    const statusHex: Record<string, string> = {
      pending: "#f59e0b",
      in_progress: "#3b82f6",
      completed: "#22c55e",
      cancelled: "#ef4444",
    };

    const reportHtml = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${fileName}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif; color: #222; background: #fff; }
            a { color: #2563eb; word-break: break-all; }
            .no-print { position: sticky; top: 0; background: #111827; color: #fff; padding: 12px 14px; display: flex; gap: 10px; align-items: center; justify-content: space-between; }
            .no-print .hint { font-size: 12px; opacity: .9; }
            .btn { border: 0; background: #e91e8c; color: #fff; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; }
            .btn.secondary { background: rgba(255,255,255,.16); }
            .wrap { padding: 22px; max-width: 900px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 18px; border-bottom: 3px solid #e91e8c; padding-bottom: 14px; }
            .title { margin: 0; color: #e91e8c; font-size: 26px; }
            .meta { margin: 8px 0 0; color: #666; font-size: 13px; }
            .badge { display: inline-block; margin-top: 10px; padding: 6px 12px; border-radius: 999px; font-size: 12px; color: #fff; background: ${statusHex[consultation.status] || "#6b7280"}; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
            .card { border: 1px solid #eee; border-radius: 12px; padding: 14px; }
            .card h3 { margin: 0 0 10px; font-size: 15px; color: #374151; }
            .row { margin: 7px 0; font-size: 13px; }
            .row strong { color: #111827; }
            .muted { color: #6b7280; }
            .full { grid-column: 1 / -1; }
            @media (max-width: 780px) { .grid { grid-template-columns: 1fr; } }
            @media print { .no-print { display: none !important; } .wrap { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="no-print">
            <div>
              <div style="font-weight:700">تقرير الاستشارة</div>
              <div class="hint">اضغط (طباعة/حفظ PDF) ثم اختر Save as PDF</div>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn secondary" id="closeBtn" type="button">إغلاق</button>
              <button class="btn" id="printBtn" type="button">طباعة / حفظ PDF</button>
            </div>
          </div>

          <main class="wrap">
            <header class="header">
              <h1 class="title">تقرير استشارة جلدية</h1>
              <p class="meta">${format(new Date(consultation.created_at), "dd MMMM yyyy - hh:mm a", { locale: ar })}</p>
              <span class="badge">${statusLabels[consultation.status] || consultation.status}</span>
            </header>

            <section class="grid">
              <article class="card">
                <h3>المعلومات الشخصية</h3>
                <div class="row"><strong>الاسم:</strong> ${consultation.full_name}</div>
                <div class="row"><strong>الجنس:</strong> ${genderLabel}</div>
                <div class="row"><strong>العمر:</strong> ${consultation.age} سنة</div>
                <div class="row"><strong>الهاتف:</strong> ${consultation.phone}</div>
                <div class="row"><strong>الموقع:</strong> ${consultation.location}</div>
                <div class="row"><strong>نوع البشرة:</strong> ${consultation.skin_type || "غير محدد"}</div>
              </article>

              <article class="card">
                <h3>المشاكل الرئيسية</h3>
                <div class="row"><strong>المشاكل:</strong> ${concerns}</div>
                ${consultation.other_concern ? `<div class="row"><strong>مشكلة أخرى:</strong> ${consultation.other_concern}</div>` : ""}
                <div class="row"><strong>مدة المشكلة:</strong> ${consultation.problem_duration}</div>
                ${consultation.previous_treatment ? `<div class="row"><strong>علاج سابق:</strong> ${consultation.previous_treatment_details || "نعم"}</div>` : ""}
              </article>

              <article class="card">
                <h3>روتين العناية</h3>
                <div class="row"><strong>غسل الوجه:</strong> ${consultation.face_wash_frequency}</div>
                <div class="row"><strong>نوع الغسول:</strong> ${consultation.cleanser_type || "غير محدد"}</div>
                <div class="row"><strong>استخدام المرطب:</strong> ${consultation.uses_moisturizer ? "نعم" : "لا"}</div>
                <div class="row"><strong>واقي الشمس:</strong> ${consultation.uses_sunscreen ? "نعم" : "لا"}</div>
                <div class="row"><strong>استخدام السيروم:</strong> ${consultation.uses_serums ? "نعم" : "لا"}</div>
                ${consultation.serum_details ? `<div class="row"><strong>تفاصيل السيروم:</strong> ${consultation.serum_details}</div>` : ""}
              </article>

              <article class="card">
                <h3>نمط الحياة</h3>
                <div class="row"><strong>التعرض للشمس:</strong> ${consultation.sun_exposure}</div>
                <div class="row"><strong>شرب الماء:</strong> ${consultation.daily_water_intake}</div>
                <div class="row"><strong>نظام غذائي متوازن:</strong> ${consultation.balanced_diet ? "نعم" : "لا"}</div>
                <div class="row"><strong>ضغط نفسي:</strong> ${consultation.stress_levels ? "نعم" : "لا"}</div>
                <div class="row"><strong>التدخين/الكحول:</strong> ${consultation.smoking_alcohol ? "نعم" : "لا"}</div>
                ${consultation.work_environment ? `<div class="row"><strong>بيئة العمل:</strong> ${consultation.work_environment}</div>` : ""}
              </article>

              ${consultation.gender === "female" ? `
                <article class="card full">
                  <h3>معلومات صحية (للنساء)</h3>
                  <div class="row"><strong>حبوب منع الحمل:</strong> ${consultation.uses_contraceptives ? "نعم" : "لا"}</div>
                  <div class="row"><strong>حامل أو مرضع:</strong> ${consultation.is_pregnant_nursing ? "نعم" : "لا"}</div>
                </article>
              ` : ""}

              <article class="card full">
                <h3>المعلومات الصحية</h3>
                <div class="row"><strong>الأمراض المزمنة:</strong> ${consultation.chronic_diseases || "لا يوجد"}</div>
                <div class="row"><strong>الأدوية الحالية:</strong> ${consultation.current_medications || "لا يوجد"}</div>
                <div class="row"><strong>الحساسية:</strong> ${consultation.allergies || "لا يوجد"}</div>
              </article>

              <article class="card full">
                <h3>التفضيلات</h3>
                <div class="row"><strong>نوع الاستشارة:</strong> ${consultation.consultation_preference}</div>
                <div class="row"><strong>وقت التواصل المفضل:</strong> ${consultation.preferred_contact_time}</div>
                <div class="row"><strong>تفضيل المنتجات:</strong> ${consultation.product_preference}</div>
              </article>

              ${consultation.additional_notes ? `
                <article class="card full">
                  <h3>ملاحظات إضافية</h3>
                  <div class="row">${consultation.additional_notes}</div>
                </article>
              ` : ""}

              ${consultation.image_urls && consultation.image_urls.length > 0 ? `
                <article class="card full">
                  <h3>روابط الصور المرفقة (${consultation.image_urls.length})</h3>
                  <div class="row muted">(لتجنب بطء/تعليق التحميل، نعرض الروابط فقط)</div>
                  ${consultation.image_urls
                    .map((url: string, i: number) => `<div class="row">${i + 1}. <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></div>`)
                    .join("")}
                </article>
              ` : ""}
            </section>
          </main>

          <script>
            const printBtn = document.getElementById('printBtn');
            const closeBtn = document.getElementById('closeBtn');
            printBtn?.addEventListener('click', () => window.print());
            closeBtn?.addEventListener('click', () => window.close());
            window.addEventListener('load', () => setTimeout(() => window.print(), 400));
          </script>
        </body>
      </html>
    `;

    w.document.open();
    w.document.write(reportHtml);
    w.document.close();

    toast.success("تم فتح التقرير — اختر حفظ كـ PDF");
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

      // Send notification to user if they have an account
      if (selectedConsultation.user_id && adminResponse) {
        await supabase.from("user_notifications").insert({
          user_id: selectedConsultation.user_id,
          title: "رد على استشارتك",
          message: adminResponse.substring(0, 200) + (adminResponse.length > 200 ? "..." : ""),
          type: "personal",
          related_id: selectedConsultation.id,
          related_table: "consultations",
          created_by: session?.user.id,
        });
      }

      toast.success(
        selectedConsultation.user_id 
          ? "تم حفظ الرد وإرسال إشعار للعميل" 
          : "تم حفظ الرد - العميل غير مسجل، يرجى التواصل عبر الهاتف: " + selectedConsultation.phone
      );
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
      <AdminBackButton />
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
                      <div
                        key={index}
                        className="border rounded-lg p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors group relative"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setImageGalleryOpen(true);
                        }}
                      >
                        <img
                          src={url}
                          alt={`صورة تشخيصية ${index + 1}`}
                          className="w-full h-64 object-contain rounded"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                          <ZoomIn className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">صورة {index + 1} - انقر للتكبير</p>
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

              {/* أزرار النسخ والتحميل */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleCopyConsultation(selectedConsultation)}
                  className="flex-1 min-w-[140px]"
                >
                  <Copy className="ml-2 h-4 w-4" />
                  نسخ المعلومات
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedConsultation)}
                  className="flex-1 min-w-[140px]"
                >
                  <Download className="ml-2 h-4 w-4" />
                  تحميل PDF
                </Button>
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

      {/* Dialog لعرض الصور المكبرة */}
      <Dialog open={imageGalleryOpen} onOpenChange={setImageGalleryOpen}>
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-black/95">
          {selectedConsultation?.image_urls && selectedImageIndex !== null && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={() => setImageGalleryOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Image counter */}
              <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {selectedImageIndex + 1} / {selectedConsultation.image_urls.length}
              </div>

              {/* Main image */}
              <div className="flex items-center justify-center min-h-[60vh] max-h-[85vh] p-4">
                <img
                  src={selectedConsultation.image_urls[selectedImageIndex]}
                  alt={`صورة تشخيصية ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>

              {/* Navigation arrows */}
              {selectedConsultation.image_urls.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? selectedConsultation.image_urls!.length - 1 : prev! - 1
                    )}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === selectedConsultation.image_urls!.length - 1 ? 0 : prev! + 1
                    )}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
