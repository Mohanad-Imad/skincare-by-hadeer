import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ShieldCheck, Award, CheckCircle, Package, Truck, HeadphonesIcon, ArrowRight, RefreshCw, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = {
  shield: ShieldCheck,
  refresh: RefreshCw,
  check: CheckCircle,
  coins: Coins,
  package: Package,
  truck: Truck,
  headphones: HeadphonesIcon,
};

const Guarantee = () => {
  const navigate = useNavigate();

  const { data: guaranteeSettings, isLoading } = useQuery({
    queryKey: ["guarantee-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guarantee_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <Navbar />
        <main className="container py-8 md:py-12">
          <Skeleton className="h-12 w-32 mb-6" />
          <div className="text-center mb-12">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-6" />
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!guaranteeSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <Navbar />
        <main className="container py-8 md:py-12">
          <p className="text-center text-muted-foreground">لا توجد بيانات ضمان متاحة</p>
        </main>
        <Footer />
      </div>
    );
  }

  const features = (guaranteeSettings.features as any[]) || [];
  const termsLines = guaranteeSettings.terms_ar?.split('\n').filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <SEO
        title={guaranteeSettings.page_title_ar || "ضمان المنتجات"}
        description={guaranteeSettings.page_description_ar || "نضمن لك حقك في استرجاع المنتج"}
        keywords="ضمان، استرجاع المنتج، منتجات أصلية"
      />
      <Navbar />
      
      <main className="container py-8 md:py-12">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>

        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-500/10 mb-6 overflow-hidden">
            {guaranteeSettings.logo_url ? (
              <img src={guaranteeSettings.logo_url} alt="Guarantee" className="w-full h-full object-contain p-2" />
            ) : (
              <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-emerald-500" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {guaranteeSettings.page_title_ar}
          </h1>
          {guaranteeSettings.page_subtitle_ar && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {guaranteeSettings.page_subtitle_ar}
            </p>
          )}
        </section>

        <Card className="mb-12 border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <Award className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  {guaranteeSettings.page_description_ar}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        {features.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">مميزات الضمان</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature: any, index: number) => {
                const IconComponent = iconMap[feature.icon] || CheckCircle;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{feature.title_ar}</h3>
                      <p className="text-muted-foreground">
                        {feature.description_ar}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {guaranteeSettings.terms_ar && (
          <section className="mb-12">
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">شروط وأحكام الضمان</h2>
                <div className="space-y-3">
                  {termsLines.map((line: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{line}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {storeSettings && (
          <section className="text-center">
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6 md:p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <HeadphonesIcon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  {guaranteeSettings.contact_title_ar || "تواصل معنا"}
                </h2>
                {guaranteeSettings.contact_description_ar && (
                  <p className="text-base md:text-lg text-muted-foreground mb-6">
                    {guaranteeSettings.contact_description_ar}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {storeSettings.phone && (
                    <Button size="lg" onClick={() => window.open(`tel:${storeSettings.phone}`)}>
                      اتصل بنا الآن
                    </Button>
                  )}
                  {storeSettings.whatsapp_url && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => window.open(storeSettings.whatsapp_url, '_blank')}
                    >
                      واتساب
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Guarantee;
