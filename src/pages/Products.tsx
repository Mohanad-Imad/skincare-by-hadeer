import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [parentCategoryFilter, setParentCategoryFilter] = useState<string>(searchParams.get("category") || "all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>(searchParams.get("subCategory") || "all");
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>(searchParams.get("skinType") || "all");
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get("company") || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { data: discounts } = useProductDiscounts();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, parent:parent_category_id(name_ar)")
        .order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("company_name_ar, company_name_en");
      if (error) throw error;
      
      // استخراج الأسماء الفريدة
      const companiesMap = new Map();
      data.forEach((p) => {
        const arName = p.company_name_ar;
        const enName = p.company_name_en;
        if (arName || enName) {
          const key = arName || enName;
          if (!companiesMap.has(key)) {
            companiesMap.set(key, { ar: arName, en: enName });
          }
        }
      });
      
      return Array.from(companiesMap.entries()).map(([key, value]) => ({
        key,
        displayName: value.ar || value.en,
        ar: value.ar,
        en: value.en,
      }));
    },
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", parentCategoryFilter, subCategoryFilter, skinTypeFilter, companyFilter, searchTerm, currentPage],
    queryFn: async () => {
      // تحديد التصنيفات المطلوبة للفلترة
      let categoryIds: string[] = [];
      
      if (subCategoryFilter !== "all") {
        // إذا تم اختيار تصنيف فرعي، نستخدمه فقط
        categoryIds = [subCategoryFilter];
      } else if (parentCategoryFilter !== "all") {
        // إذا تم اختيار تصنيف رئيسي فقط، نجلب جميع التصنيفات الفرعية التابعة له
        const subCategories = categories?.filter(cat => cat.parent_category_id === parentCategoryFilter) || [];
        categoryIds = [parentCategoryFilter, ...subCategories.map(sub => sub.id)];
      }

      let countQuery = supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (categoryIds.length > 0) {
        countQuery = countQuery.in("category_id", categoryIds);
      }

      if (companyFilter !== "all") {
        countQuery = countQuery.or(`company_name_ar.eq.${companyFilter},company_name_en.eq.${companyFilter}`);
      }

      if (searchTerm) {
        countQuery = countQuery.ilike("name_ar", `%${searchTerm}%`);
      }

      const { count } = await countQuery;

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("products")
        .select(`
          *,
          product_variants (
            price
          ),
          product_images (
            image_url,
            display_order
          )
        `)
        .eq("is_active", true)
        .range(from, to)
        .order("created_at", { ascending: false });

      if (categoryIds.length > 0) {
        query = query.in("category_id", categoryIds);
      }

      if (companyFilter !== "all") {
        query = query.or(`company_name_ar.eq.${companyFilter},company_name_en.eq.${companyFilter}`);
      }

      if (searchTerm) {
        query = query.ilike("name_ar", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];

      if (skinTypeFilter !== "all") {
        filtered = filtered.filter(
          (product) => product.skin_type?.includes(skinTypeFilter as any)
        );
      }

      const productsWithImages = filtered.map(product => {
        // ترتيب الصور حسب display_order واختيار الأولى
        const sortedImages = product.product_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
        const firstImage = sortedImages.length > 0 ? sortedImages[0].image_url : product.image_url;

        return {
          ...product,
          minPrice: product.product_variants?.[0]?.price,
          displayImage: firstImage,
        };
      });

      return { products: productsWithImages, totalCount: count || 0 };
    },
  });

  const totalPages = productsData ? Math.ceil(productsData.totalCount / itemsPerPage) : 0;
  const products = productsData?.products || [];

  const handleFilterChange = (setter: (value: string) => void, paramName?: string) => (value: string) => {
    setter(value);
    setCurrentPage(1);
    
    // تحديث URL parameters
    if (paramName) {
      const newParams = new URLSearchParams(searchParams);
      if (value === "all") {
        newParams.delete(paramName);
      } else {
        newParams.set(paramName, value);
      }
      setSearchParams(newParams);
    }
  };

  // تحديث الفلاتر عند تغيير URL
  useEffect(() => {
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");
    const skinType = searchParams.get("skinType");
    const company = searchParams.get("company");
    
    if (category) setParentCategoryFilter(category);
    if (subCategory) setSubCategoryFilter(subCategory);
    if (skinType) setSkinTypeFilter(skinType);
    if (company) setCompanyFilter(company);
  }, [searchParams]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "جميع المنتجات - مستحضرات التجميل والعناية بالبشرة",
    "description": "تصفحي مجموعة واسعة من منتجات العناية بالبشرة ومستحضرات التجميل الأصلية"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="جميع المنتجات - مستحضرات التجميل والعناية بالبشرة"
        description="تصفحي أكبر مجموعة من منتجات العناية بالبشرة ومستحضرات التجميل في العراق. منتجات أصلية من أفضل العلامات التجارية العالمية بأسعار تنافسية."
        keywords="شراء مستحضرات تجميل، متجر مستحضرات تجميل اون لاين، منتجات العناية بالبشرة العراق، كريمات البشرة، سيروم، تونر، مرطبات"
        structuredData={structuredData}
      />
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold">جميع المنتجات</h1>

        {/* Filters */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحثي عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <Select 
            value={parentCategoryFilter} 
            onValueChange={(value) => {
              setParentCategoryFilter(value);
              setSubCategoryFilter("all");
              setCurrentPage(1);
              
              const newParams = new URLSearchParams(searchParams);
              if (value === "all") {
                newParams.delete("category");
                newParams.delete("subCategory");
              } else {
                newParams.set("category", value);
                newParams.delete("subCategory");
              }
              setSearchParams(newParams);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="التصنيف الرئيسي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {categories
                ?.filter((cat) => !cat.parent_category_id)
                .map((mainCat) => (
                  <SelectItem key={mainCat.id} value={mainCat.id}>
                    {mainCat.name_ar}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {parentCategoryFilter !== "all" && (
            <Select value={subCategoryFilter} onValueChange={handleFilterChange(setSubCategoryFilter, "subCategory")}>
              <SelectTrigger>
                <SelectValue placeholder="التصنيف الفرعي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفرعيات</SelectItem>
                {categories
                  ?.filter((cat) => cat.parent_category_id === parentCategoryFilter)
                  .map((subCat) => (
                    <SelectItem key={subCat.id} value={subCat.id}>
                      {subCat.name_ar}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          <Select value={companyFilter} onValueChange={handleFilterChange(setCompanyFilter, "company")}>
            <SelectTrigger>
              <SelectValue placeholder="الشركة المصنعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الشركات</SelectItem>
              {companies?.map((company) => (
                <SelectItem key={company.key} value={company.key}>
                  {company.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={skinTypeFilter} onValueChange={handleFilterChange(setSkinTypeFilter, "skinType")}>
            <SelectTrigger>
              <SelectValue placeholder="نوع البشرة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع أنواع البشرة</SelectItem>
              <SelectItem value="normal">عادية</SelectItem>
              <SelectItem value="dry">جافة</SelectItem>
              <SelectItem value="oily">دهنية</SelectItem>
              <SelectItem value="combination">مختلطة</SelectItem>
              <SelectItem value="sensitive">حساسة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const discount = product.minPrice 
                  ? calculateDiscount(product.id, product.minPrice, discounts)
                  : null;
                  
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    nameAr={product.name_ar}
                    imageUrl={product.displayImage}
                    minPrice={product.minPrice}
                    discount={discount}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground">لا توجد منتجات</div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Products;