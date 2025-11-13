// @ts-nocheck
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";

const Categories = () => {
  const { data: discounts } = useProductDiscounts();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ["parent-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_category_id", null)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["products-by-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories!inner(*),
          product_variants(*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getProductsForCategory = (categoryId: string) => {
    if (!allProducts) return [];
    return allProducts
      .filter(product => product.category_id === categoryId)
      .slice(0, 4);
  };

  const getCategoryProductCount = (categoryId: string) => {
    if (!allProducts) return 0;
    return allProducts.filter(product => product.category_id === categoryId).length;
  };

  const isLoading = categoriesLoading || productsLoading;

  return (
    <>
      <SEO 
        title="الأقسام - تسوق حسب التصنيفات"
        description="اكتشف جميع أقسام المنتجات لدينا واختر ما يناسب احتياجات بشرتك"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 container py-12">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">تسوق حسب الأقسام</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              استكشف مجموعتنا المتنوعة من منتجات العناية بالبشرة المصنفة بعناية لتلبية احتياجاتك
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-16">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-6">
                  <Skeleton className="h-32 w-full max-w-md" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-96" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-24">
              {categories?.map((category) => {
                const categoryProducts = getProductsForCategory(category.id);
                const totalCount = getCategoryProductCount(category.id);

                return (
                  <section key={category.id} className="space-y-8">
                    {category.image_url && (
                      <div className="w-full h-64 overflow-hidden rounded-lg">
                        <img 
                          src={category.image_url} 
                          alt={category.name_ar} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                      <div className="space-y-3 max-w-2xl">
                        <h2 className="text-3xl font-bold text-foreground">
                          {category.name_ar}
                        </h2>
                        {category.description_ar && (
                          <p className="text-lg text-muted-foreground leading-relaxed">
                            {category.description_ar}
                          </p>
                        )}
                      </div>
                      
                      {totalCount > 0 && (
                        <Button 
                          variant="ghost" 
                          asChild
                          className="self-start md:self-auto gap-2 group"
                        >
                          <Link to={`/products?category=${category.id}`}>
                            <span>عرض جميع المنتجات ({totalCount})</span>
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                          </Link>
                        </Button>
                      )}
                    </div>

                    {categoryProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categoryProducts.map((product) => {
                          const lowestPrice = product.product_variants && product.product_variants.length > 0
                            ? Math.min(...product.product_variants.map((v: any) => parseFloat(v.price)))
                            : 0;
                          
                          const discountInfo = calculateDiscount(product.id, lowestPrice, discounts);

                          return (
                            <ProductCard
                              key={product.id}
                              id={product.id}
                              nameAr={product.name_ar}
                              imageUrl={product.image_url}
                              minPrice={lowestPrice}
                              discount={discountInfo}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-lg">
                        <p className="text-lg text-muted-foreground">لا توجد منتجات في هذا القسم حالياً</p>
                        <p className="text-sm text-muted-foreground mt-2">سيتم إضافة منتجات جديدة قريباً</p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Categories;
