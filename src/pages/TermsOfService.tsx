import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, ShoppingCart, Truck, RefreshCw, AlertCircle, Scale } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="شروط الخدمة"
        description="شروط وأحكام استخدام متجر مستحضرات التجميل - تعرف على حقوقك وواجباتك عند التسوق معنا"
      />
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">شروط الخدمة</h1>
            <p className="text-muted-foreground">آخر تحديث: {new Date().toLocaleDateString('ar-IQ')}</p>
          </div>

          <div className="space-y-8">
            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">القبول بالشروط</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>باستخدامك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع.</p>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">الطلبات والشراء</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>جميع الأسعار المعروضة بالدينار العراقي وقابلة للتغيير دون إشعار مسبق</li>
                  <li>يتم تأكيد الطلب بعد التحقق من توفر المنتجات</li>
                  <li>نحتفظ بحق رفض أو إلغاء أي طلب لأي سبب</li>
                  <li>يجب تقديم معلومات صحيحة ودقيقة عند إجراء الطلب</li>
                  <li>الدفع يتم عند الاستلام (الدفع نقداً عند التوصيل)</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">التوصيل والشحن</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>نوفر خدمة التوصيل لجميع محافظات العراق</li>
                  <li>مدة التوصيل تتراوح بين 2-5 أيام عمل حسب الموقع</li>
                  <li>رسوم التوصيل تُحسب حسب الموقع ووزن الطلب</li>
                  <li>المستلم مسؤول عن فحص المنتجات عند الاستلام</li>
                  <li>في حالة عدم التواجد، سيتم التواصل لتحديد موعد آخر</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">الإرجاع والاستبدال</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>يمكن إرجاع المنتجات خلال 7 أيام من تاريخ الاستلام</li>
                  <li>يجب أن يكون المنتج في حالته الأصلية وغير مستخدم</li>
                  <li>المنتجات المفتوحة أو المستخدمة لا يمكن إرجاعها لأسباب صحية</li>
                  <li>في حالة وصول منتج تالف، يرجى التواصل فوراً مع خدمة العملاء</li>
                  <li>تكاليف الإرجاع يتحملها العميل إلا في حالة خطأ من المتجر</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">إخلاء المسؤولية</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>المعلومات المقدمة على الموقع هي للإرشاد فقط وليست بديلاً عن الاستشارة الطبية</li>
                  <li>النتائج قد تختلف من شخص لآخر</li>
                  <li>يُنصح بإجراء اختبار حساسية قبل استخدام أي منتج جديد</li>
                  <li>لسنا مسؤولين عن أي ردود فعل تحسسية ناتجة عن استخدام المنتجات</li>
                  <li>الصور المعروضة قد تختلف قليلاً عن المنتج الفعلي</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">التعديلات على الشروط</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>نحتفظ بحق تعديل هذه الشروط في أي وقت. التعديلات تصبح سارية فور نشرها على الموقع. استمرارك في استخدام الموقع يعني موافقتك على الشروط المعدلة.</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
