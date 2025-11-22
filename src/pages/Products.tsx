import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [parentCategoryFilter, setParentCategoryFilter] = useState<string>(searchParams.get("category") || "all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>(searchParams.get("subCategory") || "all");
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>(searchParams.get("skinType") || "all");
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get("company") || "all");
  const [problemFilter, setProblemFilter] = useState<string>(searchParams.get("problem") || "all");
  const [makeupFilter, setMakeupFilter] = useState<string>(searchParams.get("makeup") || "all");
  const [productTypeFilter, setProductTypeFilter] = useState<string>(searchParams.get("productType") || "all");

  // 🆕 فلتر الأسعار الجديد
  const [minPriceFilter, setMinPriceFilter] = useState<string>(searchParams.get("minPrice") || "");
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>(searchParams.get("maxPrice") || "");

  const [companyOpen, setCompanyOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const itemsPerPage = 20;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: discounts } = useProductDiscounts();

  // ... (useQuery للحصول على Categories و Companies تبقى كما هي)

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
      const { data, error } = await supabase.from("products").select("company_name_ar, company_name_en");
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

      return Array.from(companiesMap.entries())
        .map(([key, value]) => ({
          key,
          displayName: value.ar || value.en,
          ar: value.ar,
          en: value.en,
        }))
        .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "ar"));
    },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    // 🆕 إضافة فلاتر الأسعار إلى queryKey
    queryKey: [
      "products",
      parentCategoryFilter,
      subCategoryFilter,
      skinTypeFilter,
      companyFilter,
      searchTerm,
      problemFilter,
      makeupFilter,
      productTypeFilter,
      minPriceFilter, // 🆕
      maxPriceFilter, // 🆕
    ],
    queryFn: async ({ pageParam = 0 }) => {
      let categoryIds: string[] = [];

      if (subCategoryFilter !== "all") {
        categoryIds = [subCategoryFilter];
      } else if (parentCategoryFilter !== "all") {
        // جلب معلومات التصنيف المحدد من قاعدة البيانات
        const { data: selectedCategoryData } = await supabase
          .from("categories")
          .select("id, parent_category_id")
          .eq("id", parentCategoryFilter)
          .single();

        if (selectedCategoryData?.parent_category_id) {
          // إذا كان التصنيف المحدد هو تصنيف فرعي، نحصل على التصنيف الأب وجميع التصنيفات الفرعية
          const { data: allSubCategoriesData } = await supabase
            .from("categories")
            .select("id")
            .eq("parent_category_id", selectedCategoryData.parent_category_id);

          categoryIds = [
            selectedCategoryData.parent_category_id,
            ...(allSubCategoriesData?.map((sub) => sub.id) || []),
          ];
        } else {
          // إذا كان التصنيف المحدد هو تصنيف أب، نحصل على جميع التصنيفات الفرعية
          const { data: subCategoriesData } = await supabase
            .from("categories")
            .select("id")
            .eq("parent_category_id", parentCategoryFilter);

          categoryIds = [parentCategoryFilter, ...(subCategoriesData?.map((sub) => sub.id) || [])];
        }
      }

      const from = pageParam * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("products")
        .select(
          `
          *,
          product_variants (
            price
          ),
          product_images (
            image_url,
            display_order
          ),
          product_sub_problems (
            sub_problem_id,
            sub_problems (
              slug
            )
          ),
          product_makeup_categories (
            makeup_category_id,
            makeup_categories (
              slug
            )
          )
        `,
        )
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
        query = query.or(
          `name_ar.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%,company_name_ar.ilike.%${searchTerm}%,company_name_en.ilike.%${searchTerm}%`,
        );
      }

      if (productTypeFilter !== "all") {
        query = query.eq("product_type", productTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];

      // تجهيز minPrice لكل منتج قبل الفلترة المحلية
      let productsWithMinPrice = filtered.map((product) => {
        // ... (جزء تجهيز minPrice يبقى كما هو)
        const minPrice = product.product_variants?.[0]?.price;
        return {
          ...product,
          minPrice: minPrice,
        };
      });

      // 🆕 فلترة المنتجات بناءً على الحد الأدنى والأقصى للسعر
      const minPrice = parseFloat(minPriceFilter);
      const maxPrice = parseFloat(maxPriceFilter);

      if (!isNaN(minPrice) && minPrice >= 0) {
        productsWithMinPrice = productsWithMinPrice.filter(
          (product) => product.minPrice !== null && product.minPrice >= minPrice,
        );
      }

      if (!isNaN(maxPrice) && maxPrice >= 0) {
        productsWithMinPrice = productsWithMinPrice.filter(
          (product) => product.minPrice !== null && product.minPrice <= maxPrice,
        );
      }

      // تطبيق باقي الفلاتر المحلية على productsWithMinPrice

      if (problemFilter !== "all") {
        productsWithMinPrice = productsWithMinPrice.filter((product) => {
          return product.product_sub_problems?.some((psp: any) => psp.sub_problems?.slug === problemFilter);
        });
      }

      if (makeupFilter !== "all") {
        productsWithMinPrice = productsWithMinPrice.filter((product) => {
          return product.product_makeup_categories?.some((pmc: any) => pmc.makeup_categories?.slug === makeupFilter);
        });
      }

      if (skinTypeFilter !== "all") {
        productsWithMinPrice = productsWithMinPrice.filter((product) =>
          product.skin_type?.includes(skinTypeFilter as any),
        );
      }

      const productsWithImages = productsWithMinPrice.map((product) => {
        const sortedImages = product.product_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
        const firstImage = sortedImages.length > 0 ? sortedImages[0].image_url : product.image_url;

        return {
          ...product,
          displayImage: firstImage,
        };
      });

      return { products: productsWithImages };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // يجب أن نكون حذرين هنا: قد تكون الفلترة المحلية قللت عدد المنتجات
      // إذا كان عدد المنتجات بعد الفلترة المحلية يساوي itemsPerPage، فسنحاول جلب المزيد
      return lastPage.products.length === itemsPerPage ? allPages.length : undefined;
    },
  });

  const products = data?.pages.flatMap((page) => page.products) || [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    const option = { threshold: 0 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // 🆕 تعديل لتشمل التعامل مع مدخلات النصوص (الأسعار)
  const handleFilterChange =
    (setter: (value: string) => void, paramName?: string, isInput = false) =>
    (valueOrEvent: string | React.ChangeEvent<HTMLInputElement>) => {
      let value: string;

      if (isInput && typeof valueOrEvent !== "string" && valueOrEvent.target) {
        value = valueOrEvent.target.value;
      } else if (typeof valueOrEvent === "string") {
        value = valueOrEvent;
      } else {
        return; // تجاهل إذا لم يكن إدخال نصي أو قيمة سلسلة نصية
      }

      setter(value);

      if (paramName) {
        const newParams = new URLSearchParams(searchParams);
        if (value === "all" || value === "") {
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
    const search = searchParams.get("search");
    const problem = searchParams.get("problem");
    const makeup = searchParams.get("makeup");
    const productType = searchParams.get("productType");
    // 🆕
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    if (category) setParentCategoryFilter(category);
    if (subCategory) setSubCategoryFilter(subCategory);
    if (skinType) setSkinTypeFilter(skinType);
    if (company) setCompanyFilter(company);
    if (search) setSearchTerm(search);
    if (problem) setProblemFilter(problem);
    if (makeup) setMakeupFilter(makeup);
    if (productType) setProductTypeFilter(productType);
    // 🆕
    if (minPrice) setMinPriceFilter(minPrice);
    if (maxPrice) setMaxPriceFilter(maxPrice);
  }, [searchParams]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "جميع المنتجات - مستحضرات التجميل والعناية بالبشرة",
    description: "تصفحي مجموعة واسعة من منتجات العناية بالبشرة ومستحضرات التجميل الأصلية",
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
        {/* 🆕 تم تغيير تصميم الشبكة (grid) لاستيعاب فلاتر الأسعار (7 أعمدة في الشاشات الكبيرة) */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحثي عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {
                // لتطبيق البحث عند الانتهاء من الكتابة (مثل فلاتر الأسعار)
                handleFilterChange(
                  setSearchTerm,
                  "search",
                  true,
                )({ target: { value: searchTerm } } as React.ChangeEvent<HTMLInputElement>);
              }}
              onKeyDown={(e) => {
                // للسماح بالبحث عند الضغط على Enter
                if (e.key === "Enter") {
                  handleFilterChange(setSearchTerm, "search", true)(e as any);
                }
              }}
              className="pr-10"
            />
          </div>

          <Select value={productTypeFilter} onValueChange={handleFilterChange(setProductTypeFilter, "productType")}>
            <SelectTrigger>
              <SelectValue placeholder="نوع المنتج" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="skincare">العناية بالبشرة</SelectItem>
              <SelectItem value="watches">ساعات</SelectItem>
              <SelectItem value="clothing">ملابس</SelectItem>
            </SelectContent>
          </Select>

          {/* 🆕 فلتر الحد الأدنى للسعر */}
          <Input
            placeholder="الحد الأدنى للسعر"
            type="number"
            min="0"
            value={minPriceFilter}
            onChange={handleFilterChange(setMinPriceFilter, "minPrice", true)}
            className="w-full"
          />

          {/* 🆕 فلتر الحد الأقصى للسعر */}
          <Input
            placeholder="الحد الأقصى للسعر"
            type="number"
            min="0"
            value={maxPriceFilter}
            onChange={handleFilterChange(setMaxPriceFilter, "maxPrice", true)}
            className="w-full"
          />

          <Select
            value={parentCategoryFilter}
            onValueChange={(value) => {
              setParentCategoryFilter(value);
              setSubCategoryFilter("all");

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

          <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={companyOpen}
                className="w-full justify-between text-right"
              >
                {companyFilter === "all"
                  ? "الشركة المصنعة"
                  : companies?.find((company) => company.key === companyFilter)?.displayName}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-popover" align="start">
              <Command>
                <CommandInput
                  placeholder="ابحث عن شركة..."
                  value={companySearch}
                  onValueChange={setCompanySearch}
                  className="text-right"
                />
                <CommandList>
                  <CommandEmpty>لا توجد نتائج</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        handleFilterChange(setCompanyFilter, "company")("all");
                        setCompanyOpen(false);
                        setCompanySearch("");
                      }}
                    >
                      <Check className={cn("ml-2 h-4 w-4", companyFilter === "all" ? "opacity-100" : "opacity-0")} />
                      جميع الشركات
                    </CommandItem>
                    {companies?.map((company) => (
                      <CommandItem
                        key={company.key}
                        value={company.displayName}
                        onSelect={() => {
                          handleFilterChange(setCompanyFilter, "company")(company.key);
                          setCompanyOpen(false);
                          setCompanySearch("");
                        }}
                      >
                        <Check
                          className={cn("ml-2 h-4 w-4", companyFilter === company.key ? "opacity-100" : "opacity-0")}
                        />
                        {company.displayName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

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
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => {
                const discount = product.minPrice ? calculateDiscount(product.id, product.minPrice, discounts) : null;

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

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="mt-8 flex justify-center">
              {isFetchingNextPage && (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 w-full">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">لا توجد منتجات مطابقة لمرشحات البحث</div>
        )}
      </div>
    </div>
  );
};

export default Products;
