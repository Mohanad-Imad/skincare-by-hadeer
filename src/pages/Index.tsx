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
import { SecondaryBanner } from "@/components/SecondaryBanner";
import { TertiaryBanner } from "@/components/TertiaryBanner";
import { BrandsLinks } from "@/components/BrandsLinks";
import { ShopByProblem } from "@/components/ShopByProblem";
import { GuaranteeBanner } from "@/components/GuaranteeBanner";
import MakeupBanner from "@/components/MakeupBanner";
import { CustomerReviews } from "@/components/CustomerReviews";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import AnnouncementBar from "@/components/AnnouncementBar";
import WeeklyProduct from "@/components/WeeklyProduct";
import WeeklyProductPopup from "@/components/WeeklyProductPopup";
import WeeklyBundleSection from "@/components/WeeklyBundleSection";
import { FestiveLights } from "@/components/FestiveLights";

const Index = () => {
  const navigate = useNavigate();
  const { data: discounts } = useProductDiscounts();

  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          product_variants (
            price
          )
        `,
        )
        .eq("is_featured", true)
        .eq("is_active", true)
        .limit(6);

      if (error) throw error;

      return (
        data?.map((product) => ({
          ...product,
          minPrice: product.product_variants?.[0]?.price,
        })) || []
      );
    },
  });

  const { data: newArrivals } = useQuery({
    queryKey: ["new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          product_variants (
            price
          )
        `,
        )
        .eq("is_new_arrival", true)
        .eq("is_active", true)
        .limit(6);

      if (error) throw error;

      return (
        data?.map((product) => ({
          ...product,
          minPrice: product.product_variants?.[0]?.price,
        })) || []
      );
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: expertChoices } = useQuery({
    queryKey: ["expert-choices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          product_variants (
            price
          )
        `,
        )
        .eq("is_expert_choice", true)
        .eq("is_active", true)
        .limit(8);

      if (error) throw error;

      return (
        data?.map((product) => ({
          ...product,
          minPrice: product.product_variants?.[0]?.price,
        })) || []
      );
    },
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "متجر مستحضرات التجميل",
    description: "متجر عراقي متخصص في منتجات العناية بالبشرة ومستحضرات التجميل الأصلية",
    url: window.location.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${window.location.origin}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <SEO
        title="الصفحة الرئيسية - منتجات العناية بالبشرة ومستحضرات التجميل"
        description="اكتشفي أفضل منتجات العناية بالبشرة ومستحضرات التجميل في العراق. منتجات أصلية، أسعار منافسة، توصيل سريع في بغداد وجميع المحافظات العراقية."
        keywords="مستحضرات تجميل العراق، منتجات العناية بالبشرة بغداد، مستحضرات تجميل اون لاين العراق، متجر مستحضرات تجميل، عناية بالبشرة، كريمات البشرة، منتجات تجميل اصلية"
        structuredData={structuredData}
      />
      <AnnouncementBar />
      <Navbar />
      <WeeklyProductPopup />
      <LiveActivityFeed />

      {/* Search Bar */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-2 md:py-4 pb-1 md:pb-2 max-w-[1920px] mx-auto">
        <SearchBar />
      </section>

      {/* Quick Links */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 max-w-[1920px] mx-auto">
        <QuickLinks />
      </section>

      {/* Tertiary Banner - Top promotional banner */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-2 md:py-3 max-w-[1920px] mx-auto">
        <TertiaryBanner />
      </section>

      {/* Hero Banner - Advertising Carousel */}
      <div className="max-w-[1920px] mx-auto px-3 md:px-6 xl:px-8 2xl:px-12">
        <HeroBanner />
      </div>

      {/* Secondary Banner - Bottom promotional banner */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-2 md:py-3 max-w-[1920px] mx-auto">
        <SecondaryBanner />
      </section>

      {/* Weekly Product - Special offer */}
      <WeeklyProduct />

      {/* Festive Lights */}
      <FestiveLights />

      {/* Weekly Bundle - مجموعة الأسبوع */}
      <WeeklyBundleSection />

      {/* Festive Lights */}
      <FestiveLights />

      {/* Brands Links - Quick access to brands */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-6 md:py-8 xl:py-10 max-w-[1920px] mx-auto">
        <BrandsLinks />
      </section>

      {/* Festive Lights */}
      <FestiveLights />

      {/* Makeup Banner */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 pt-3 md:pt-4 pb-2 md:pb-3 max-w-[1920px] mx-auto">
        <MakeupBanner />
      </section>

      {/* Shop By Problem Section */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-6 md:py-8 xl:py-10 max-w-[1920px] mx-auto">
        <ShopByProblem />
      </section>

      {/* Guarantee Banner */}
      <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 pt-3 md:pt-4 pb-6 md:pb-8 xl:pb-10 max-w-[1920px] mx-auto">
        <GuaranteeBanner />
      </section>

      {/* Customer Reviews */}
      <section className="w-full max-w-[1920px] mx-auto">
        <CustomerReviews />
      </section>

      {/* New Arrivals */}
      {newArrivals && newArrivals.length > 0 && (
        <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-8 md:py-16 xl:py-20 max-w-[1920px] mx-auto">
          <div className="mb-4 md:mb-8 xl:mb-10 text-center">
            <h3 className="text-2xl md:text-3xl xl:text-4xl font-bold mb-1 md:mb-2">وصل حديثاً</h3>
            <p className="text-sm md:text-base xl:text-lg text-muted-foreground">اكتشفي أحدث منتجاتنا</p>
          </div>
          <Carousel
            opts={{
              align: "start",
              direction: "rtl",
              slidesToScroll: 1,
            }}
            plugins={[
              Autoplay({
                delay: 2500,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {newArrivals.map((product) => {
                const discount = product.minPrice ? calculateDiscount(product.id, product.minPrice, discounts) : null;

                return (
                  <CarouselItem
                    key={product.id}
                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6"
                  >
                    <ProductCard
                      id={product.id}
                      nameAr={product.name_ar}
                      imageUrl={product.image_url}
                      minPrice={product.minPrice}
                      discount={discount}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-8 md:py-16 xl:py-20 max-w-[1920px] mx-auto">
          <div className="mb-4 md:mb-8 xl:mb-10 text-center">
            <h3 className="text-2xl md:text-3xl xl:text-4xl font-bold mb-1 md:mb-2">منتجات مميزة</h3>
            <p className="text-sm md:text-base xl:text-lg text-muted-foreground">أفضل اختياراتنا لك</p>
          </div>
          <Carousel
            opts={{
              align: "start",
              direction: "rtl",
              slidesToScroll: 1,
            }}
            plugins={[
              Autoplay({
                delay: 2200,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {featuredProducts.map((product) => {
                const discount = product.minPrice ? calculateDiscount(product.id, product.minPrice, discounts) : null;

                return (
                  <CarouselItem
                    key={product.id}
                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6"
                  >
                    <ProductCard
                      id={product.id}
                      nameAr={product.name_ar}
                      imageUrl={product.image_url}
                      minPrice={product.minPrice}
                      discount={discount}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </section>
      )}

      {/* Expert Choices */}
      {expertChoices && expertChoices.length > 0 && (
        <section className="w-full px-3 md:px-6 xl:px-8 2xl:px-12 py-8 md:py-16 xl:py-20 max-w-[1920px] mx-auto">
          <div className="mb-4 md:mb-8 xl:mb-10 text-center">
            <h3 className="text-2xl md:text-3xl xl:text-4xl font-bold mb-1 md:mb-2">اختيار خبراءنا</h3>
            <p className="text-sm md:text-base xl:text-lg text-muted-foreground">منتجات موصى بها من فريق خبرائنا</p>
          </div>
          <Carousel
            opts={{
              align: "start",
              direction: "rtl",
              slidesToScroll: 1,
            }}
            plugins={[
              Autoplay({
                delay: 2800,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {expertChoices.map((product) => {
                const discount = product.minPrice ? calculateDiscount(product.id, product.minPrice, discounts) : null;

                return (
                  <CarouselItem
                    key={product.id}
                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6"
                  >
                    <ProductCard
                      id={product.id}
                      nameAr={product.name_ar}
                      imageUrl={product.image_url}
                      minPrice={product.minPrice}
                      discount={discount}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
