import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

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

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", categoryFilter, skinTypeFilter, companyFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          product_variants (
            price
          )
        `)
        .eq("is_active", true);

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

      return filtered.map(product => ({
        ...product,
        minPrice: product.product_variants?.[0]?.price
      }));
    },
  });

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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
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

          <Select value={skinTypeFilter} onValueChange={setSkinTypeFilter}>
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
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                nameAr={product.name_ar}
                imageUrl={product.image_url}
                minPrice={product.minPrice}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">لا توجد منتجات</div>
        )}
      </div>
    </div>
  );
};

export default Products;