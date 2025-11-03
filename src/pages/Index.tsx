import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { SearchBar } from "@/components/SearchBar";
import { QuickLinks } from "@/components/QuickLinks";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";

const Index = () => {
  const navigate = useNavigate();
  const { data: discounts } = useProductDiscounts();

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

  const { data: newArrivals } = useQuery({
    queryKey: ["new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (
            price
          )
        `)
        .eq("is_new_arrival", true)
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
      
      {/* Search Bar */}
      <section className="container py-8">
        <SearchBar />
      </section>

      {/* Quick Links */}
      <section className="container">
        <QuickLinks />
      </section>

      {/* Hero Banner - Advertising Carousel */}
      <HeroBanner />

      {/* New Arrivals */}
      {newArrivals && newArrivals.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 text-center">
            <h3 className="text-3xl font-bold mb-2">وصل حديثاً</h3>
            <p className="text-muted-foreground">اكتشفي أحدث منتجاتنا</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newArrivals.map((product) => {
              const discount = product.minPrice 
                ? calculateDiscount(product.id, product.minPrice, discounts)
                : null;
                
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  nameAr={product.name_ar}
                  imageUrl={product.image_url}
                  minPrice={product.minPrice}
                  discount={discount}
                />
              );
            })}
          </div>
        </section>
      )}


      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 text-center">
            <h3 className="text-3xl font-bold mb-2">منتجات مميزة</h3>
            <p className="text-muted-foreground">أفضل اختياراتنا لك</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => {
              const discount = product.minPrice 
                ? calculateDiscount(product.id, product.minPrice, discounts)
                : null;
                
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  nameAr={product.name_ar}
                  imageUrl={product.image_url}
                  minPrice={product.minPrice}
                  discount={discount}
                />
              );
            })}
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
};

export default Index;