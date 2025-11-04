import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ShieldCheck, Award, CheckCircle, Package, Truck, HeadphonesIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Guarantee = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <SEO
        title="ضمان المنتجات الأصلية - منتجاتنا أصلية ومضمونة 100%"
        description="جميع منتجاتنا أصلية ومن مصادر موثوقة. نضمن لك الحصول على منتجات أصلية بجودة عالية وأسعار منافسة."
        keywords="منتجات أصلية، ضمان المنتجات، مستحضرات تجميل أصلية، منتجات موثوقة"
      />
      <Navbar />
      
      <main className="container py-8 md:py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-500/10 mb-6">
            <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-emerald-500" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            منتجات أصلية ومضمونة 100%
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            نفخر بتقديم منتجات أصلية من مصادر موثوقة ومعتمدة عالمياً. ضمانك راحة بالك وثقتك بنا
          </p>
        </section>

        {/* Main Guarantee Card */}
        <Card className="mb-12 border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <Award className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">ضمان هدير للمنتجات الأصلية</h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  نتعهد بأن جميع المنتجات المعروضة في متجرنا أصلية 100% ومستوردة مباشرة من الشركات المصنعة أو موزعيها المعتمدين. 
                  نحن نفهم أهمية استخدام منتجات عناية بالبشرة أصلية وآمنة، ولذلك نضع معايير صارمة لاختيار مورّدينا وشركائنا.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">لماذا تثقين بنا؟</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">مصادر موثوقة</h3>
                <p className="text-muted-foreground">
                  نستورد منتجاتنا مباشرة من الموزعين المعتمدين والشركات المصنعة الأصلية فقط
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">فحص دقيق</h3>
                <p className="text-muted-foreground">
                  يتم فحص كل منتج قبل عرضه للتأكد من أصالته وصلاحيته وسلامة التغليف
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">ضمان الاسترجاع</h3>
                <p className="text-muted-foreground">
                  في حال استلامك منتج غير أصلي، نضمن لك استرجاع كامل المبلغ فوراً
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">شهادات الأصالة</h3>
                <p className="text-muted-foreground">
                  جميع منتجاتنا مرفقة بشهادات الأصالة والجودة من الشركات المصنعة
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">تخزين آمن</h3>
                <p className="text-muted-foreground">
                  نحفظ المنتجات في ظروف مثالية للحفاظ على جودتها وفعاليتها
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <HeadphonesIcon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">دعم متواصل</h3>
                <p className="text-muted-foreground">
                  فريق خدمة العملاء جاهز للإجابة على استفساراتك وتقديم الدعم في أي وقت
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Verify Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-secondary/50 to-background">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">كيف تتحققين من أصالة المنتج؟</h2>
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">التحقق من ختم الضمان</h3>
                    <p className="text-muted-foreground">جميع منتجاتنا تحمل ختم "أصلي ومضمون" على الكرت</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">فحص التغليف</h3>
                    <p className="text-muted-foreground">التغليف الأصلي يكون محكم ومختوم بشكل احترافي</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">التحقق من الباركود</h3>
                    <p className="text-muted-foreground">يمكنك التحقق من الباركود على الموقع الرسمي للشركة المصنعة</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">تاريخ الإنتاج والانتهاء</h3>
                    <p className="text-muted-foreground">جميع منتجاتنا تحمل تواريخ واضحة ومطبوعة بشكل احترافي</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Commitment Section */}
        <section className="text-center">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">التزامنا تجاهك</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                نلتزم بتقديم تجربة تسوق آمنة وموثوقة. ثقتك بنا هي أغلى ما نملك، ولذلك نحرص على توفير منتجات أصلية بجودة عالية وأسعار منافسة.
              </p>
              <div className="inline-flex items-center gap-2 text-emerald-500 font-bold text-xl">
                <ShieldCheck className="w-6 h-6" />
                <span>ضمان 100% منتجات أصلية</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Guarantee;
