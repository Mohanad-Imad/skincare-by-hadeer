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

  const { data: subCategories = [], isLoading: subCategoriesLoading } = useQuery<any[]>({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .not("parent_category_id", "is", null)
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

  const getSubCategoriesForParent = (parentId: string) => {
    if (!subCategories) return [];
    return subCategories.filter(sub => sub.parent_category_id === parentId);
  };

  const isLoading = categoriesLoading || productsLoading || subCategoriesLoading;

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
                const categorySubCategories = getSubCategoriesForParent(category.id);

                return (
                  <section key={category.id} className="space-y-6">
                    <Link to={`/products?category=${category.id}`} className="flex items-center gap-6 group">
                      {category.image_url && (
                        <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                          <img 
                            src={category.image_url} 
                            alt={category.name_ar} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {category.name_ar}
                        </h2>
                        {totalCount > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {totalCount} منتج
                          </p>
                        )}
                      </div>
                    </Link>

                    {categorySubCategories.length > 0 && (
                      <div className="mr-0 lg:mr-12">
                        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">الأقسام الفرعية</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {categorySubCategories.map((subCategory) => {
                            const subCategoryCount = getCategoryProductCount(subCategory.id);
                            return (
                              <Link
                                key={subCategory.id}
                                to={`/products?category=${category.id}&subCategory=${subCategory.id}`}
                                className="group flex flex-col items-center p-4 rounded-lg border border-border hover:border-primary transition-all hover:shadow-md bg-card"
                              >
                                {subCategory.image_url && (
                                  <div className="w-20 h-20 overflow-hidden rounded-md mb-3">
                                    <img 
                                      src={subCategory.image_url} 
                                      alt={subCategory.name_ar} 
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                  </div>
                                )}
                                <h4 className="text-sm font-semibold text-center group-hover:text-primary transition-colors">
                                  {subCategory.name_ar}
                                </h4>
                                {subCategoryCount > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ({subCategoryCount} منتج)
                                  </p>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {categoryProducts.length > 0 && (
                      <div className="mr-0 lg:mr-12">
                        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">المنتجات المميزة</h3>
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
                      </div>
                    )}
                    
                    {categoryProducts.length === 0 && categorySubCategories.length === 0 && (
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
