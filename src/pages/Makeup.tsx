import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

const Makeup = () => {
  const navigate = useNavigate();

  const { data: bannerSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["makeup-banner-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("makeup_banner")
        .select("show_coming_soon")
        .eq("is_active", true)
        .order("display_order")
        .limit(1)
        .maybeSingle();

      if (error || !data) return { show_coming_soon: true };
      return data;
    },
  });

  const showComingSoon = bannerSettings?.show_coming_soon ?? true;

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["makeup-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("makeup_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  const isLoading = isLoadingSettings || isLoadingCategories;

  const handleCategoryClick = (category: any) => {
    if (category.category_id && category.subcategory_id) {
      navigate(`/products?category=${category.category_id}&subCategory=${category.subcategory_id}`);
    } else {
      toast.error("هذا القسم غير مرتبط بالأقسام الرئيسية");
    }
  };

  // Show loading state
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  // Show coming soon page
  if (showComingSoon) {
    return (
      <>
        <SEO
          title="عالم المكياج - قريباً"
          description="قسم المكياج قادم قريباً بلمسة ساحرة تُكمل روتين جمالك"
          keywords="مكياج, كريم أساس, باودر, ماسكارا, ظلال عيون, حمرة شفاه"
        />
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <main className="flex-grow flex items-center justify-center px-4 py-8 pb-32 md:pb-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="mb-8 animate-bounce">
                <Sparkles className="w-20 h-20 mx-auto text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                ترقبوا الإطلالة الجديدة! 🤩
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                قسم المكياج قادم قريبًا بلمسة ساحرة تُكمل روتين جمالك.
                <br />
                <span className="text-primary font-semibold">سنخبركم فور وصوله!</span>
              </p>
              <div className="mt-10 flex justify-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <span className="w-3 h-3 bg-primary/70 rounded-full animate-pulse delay-100" />
                <span className="w-3 h-3 bg-primary/40 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="عالم المكياج - منتجات المكياج"
        description="اكتشفي جميع أقسام المكياج من كريم أساس، باودر، ماسكارا، ظلال عيون وأكثر"
        keywords="مكياج, كريم أساس, باودر, ماسكارا, ظلال عيون, حمرة شفاه"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 pb-32 md:pb-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">عالم المكياج</h1>
            <p className="text-xl text-muted-foreground">
              اختاري القسم المناسب لاكتشاف منتجاتنا
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {isLoading
              ? Array.from({ length: 20 }).map((_, index) => (
                  <Card key={index} className="p-4">
                    <Skeleton className="w-full h-40 mb-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                  </Card>
                ))
              : categories?.map((category) => (
                  <Card
                    key={category.id}
                    className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name_ar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-4xl">💄</div>
                      )}
                    </div>
                    <h3 className="text-center font-semibold text-lg">
                      {category.name_ar}
                    </h3>
                  </Card>
                ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default Makeup;
