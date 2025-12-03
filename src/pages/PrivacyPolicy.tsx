import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Eye, Database, Mail, Clock } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="سياسة الخصوصية"
        description="سياسة الخصوصية لمتجر مستحضرات التجميل - تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية"
      />
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">سياسة الخصوصية</h1>
            <p className="text-muted-foreground">آخر تحديث: {new Date().toLocaleDateString('ar-IQ')}</p>
          </div>

          <div className="space-y-8">
            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">المعلومات التي نجمعها</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>نقوم بجمع المعلومات التالية عند استخدامك لموقعنا:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>الاسم الكامل ومعلومات الاتصال (رقم الهاتف، البريد الإلكتروني)</li>
                  <li>عنوان التوصيل</li>
                  <li>معلومات الطلبات وتاريخ الشراء</li>
                  <li>معلومات الحساب (البريد الإلكتروني وكلمة المرور المشفرة)</li>
                  <li>تفضيلات المنتجات ونوع البشرة (في حالة الاستشارات)</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">كيف نستخدم معلوماتك</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>نستخدم المعلومات المجمعة للأغراض التالية:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>معالجة وتنفيذ طلباتك وتوصيل المنتجات</li>
                  <li>التواصل معك بشأن طلباتك واستفساراتك</li>
                  <li>تقديم استشارات مخصصة للعناية بالبشرة</li>
                  <li>تحسين خدماتنا وتجربة المستخدم</li>
                  <li>إرسال عروض وتحديثات (بموافقتك)</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">حماية معلوماتك</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>نتخذ إجراءات أمنية صارمة لحماية بياناتك:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>تشفير البيانات الحساسة باستخدام تقنيات التشفير الحديثة</li>
                  <li>الوصول المحدود للبيانات للموظفين المصرح لهم فقط</li>
                  <li>مراجعة دورية لإجراءات الأمان</li>
                  <li>عدم مشاركة بياناتك مع أطراف ثالثة دون موافقتك</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">الاحتفاظ بالبيانات</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>نحتفظ ببياناتك طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات. يمكنك طلب حذف بياناتك في أي وقت عبر التواصل معنا.</p>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">تواصل معنا</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>البريد الإلكتروني: skincareby.hadeer@gmail.com</li>
                  <li>الهاتف: +9647748209420</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
