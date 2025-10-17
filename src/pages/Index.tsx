import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-skincare.jpg";

const Index = () => {
  const navigate = useNavigate();

  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (
            price
          )
        `)
        .eq("is_featured", true)
        .eq("is_active", true)
        .limit(6);

      if (error) throw error;
      
      return data?.map(product => ({
        ...product,
        minPrice: product.product_variants?.[0]?.price
      })) || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "متجر مستحضرات التجميل",
    "description": "متجر عراقي متخصص في منتجات العناية بالبشرة ومستحضرات التجميل الأصلية",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <SEO
        title="الصفحة الرئيسية - منتجات العناية بالبشرة ومستحضرات التجميل"
        description="اكتشفي أفضل منتجات العناية بالبشرة ومستحضرات التجميل في العراق. منتجات أصلية، أسعار منافسة، توصيل سريع في بغداد وجميع المحافظات العراقية."
        keywords="مستحضرات تجميل العراق، منتجات العناية بالبشرة بغداد، مستحضرات تجميل اون لاين العراق، متجر مستحضرات تجميل، عناية بالبشرة، كريمات البشرة، منتجات تجميل اصلية"
        structuredData={structuredData}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-8 items-center md:grid-cols-2">
          <div className="text-center md:text-right order-2 md:order-1">
            <div className="mb-6 flex justify-center md:justify-start">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              اكتشفي جمال بشرتك الطبيعي
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              منتجات عناية فاخرة مصممة خصيصاً لجميع أنواع البشرة
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Button
                size="lg"
                className="h-12 px-8"
                onClick={() => navigate("/products")}
              >
                تسوقي الآن
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8"
                onClick={() => navigate("/products")}
              >
                عرض المنتجات
              </Button>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img 
              src={heroImage} 
              alt="منتجات العناية بالبشرة الفاخرة"
              className="w-full h-auto rounded-2xl shadow-lg"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container py-12">
          <h3 className="mb-8 text-center text-2xl font-bold">التصنيفات</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group cursor-pointer rounded-lg bg-card p-6 text-center shadow-sm transition-all hover:shadow-md"
                onClick={() => navigate(`/products?category=${category.id}`)}
              >
                <h4 className="font-semibold">{category.name_ar}</h4>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container py-12">
          <h3 className="mb-8 text-center text-2xl font-bold">منتجات مميزة</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                nameAr={product.name_ar}
                imageUrl={product.image_url}
                minPrice={product.minPrice}
              />
            ))}
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
};

export default Index;