import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("company_name_ar")
        .not("company_name_ar", "is", null)
        .neq("company_name_ar", "");
      if (error) throw error;
      
      // استخراج الأسماء الفريدة
      const uniqueCompanies = Array.from(
        new Set(data.map((p) => p.company_name_ar).filter(Boolean))
      );
      return uniqueCompanies as string[];
    },
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", categoryFilter, skinTypeFilter, companyFilter, searchTerm, currentPage],
    queryFn: async () => {
      let countQuery = supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (categoryFilter !== "all") {
        countQuery = countQuery.eq("category_id", categoryFilter);
      }

      if (companyFilter !== "all") {
        countQuery = countQuery.eq("company_name_ar", companyFilter);
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

      if (categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      if (companyFilter !== "all") {
        query = query.eq("company_name_ar", companyFilter);
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

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold">جميع المنتجات</h1>

        {/* Filters */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحثي عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={handleFilterChange(setCategoryFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={handleFilterChange(setCompanyFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="الشركة المصنعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الشركات</SelectItem>
              {companies?.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={skinTypeFilter} onValueChange={handleFilterChange(setSkinTypeFilter)}>
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
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  nameAr={product.name_ar}
                  imageUrl={product.displayImage}
                  minPrice={product.minPrice}
                />
              ))}
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