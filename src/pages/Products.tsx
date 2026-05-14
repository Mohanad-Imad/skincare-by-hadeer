import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, X, RotateCcw, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
type SortOption = "newest" | "price_low" | "price_high" | "most_reviewed";
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [parentCategoryFilter, setParentCategoryFilter] = useState<string>(searchParams.get("category") || "all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>(searchParams.get("subCategory") || "all");
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>(searchParams.get("skinType") || "all");
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get("company") || "all");
  const [problemFilter, setProblemFilter] = useState<string>(searchParams.get("problem") || "all");
  const [makeupFilter, setMakeupFilter] = useState<string>(searchParams.get("makeup") || "all");
  const [productTypeFilter, setProductTypeFilter] = useState<string>(searchParams.get("productType") || "skincare");
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false);
  const [desktopCompanyOpen, setDesktopCompanyOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [displayCount, setDisplayCount] = useState(20);
  const itemsPerPage = 20;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { data: discounts } = useProductDiscounts();

  // Fetch review counts per product
  const { data: reviewCounts } = useQuery({
    queryKey: ["product-review-counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_reviews")
        .select("product_id")
        .eq("is_approved", true);
      if (error) throw error;

      // Count reviews per product
      const counts: Record<string, number> = {};
      data?.forEach((review: any) => {
        counts[review.product_id] = (counts[review.product_id] || 0) + 1;
      });
      return counts;
    },
  });
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
            companiesMap.set(key, {
              ar: arName,
              en: enName,
            });
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

  // Fetch ALL products (without pagination)
  const { data: allProducts, isLoading } = useQuery({
    queryKey: [
      "all-products",
      parentCategoryFilter,
      subCategoryFilter,
      skinTypeFilter,
      companyFilter,
      searchTerm,
      problemFilter,
      makeupFilter,
      productTypeFilter,
    ],
    queryFn: async () => {
      let categoryIds: string[] = [];

      // لا نطبق فلتر التصنيف عند استخدام فلتر المشكلة لعرض جميع المنتجات
      if (problemFilter === "all") {
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
      }

      // إذا كان هناك فلتر مشكلة، نجلب معرفات المنتجات المرتبطة بها أولاً
      let productIdsFromProblem: string[] = [];
      if (problemFilter !== "all") {
        const { data: subProblemData } = await supabase
          .from("sub_problems")
          .select("id")
          .eq("slug", problemFilter)
          .single();
        if (subProblemData) {
          const { data: productSubProblems } = await supabase
            .from("product_sub_problems")
            .select("product_id")
            .eq("sub_problem_id", subProblemData.id);
          productIdsFromProblem = productSubProblems?.map((psp) => psp.product_id) || [];
        }
      }
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
        .eq("is_active", true);

      // تطبيق فلتر المشكلة على مستوى قاعدة البيانات
      if (problemFilter !== "all" && productIdsFromProblem.length > 0) {
        query = query.in("id", productIdsFromProblem);
      } else if (problemFilter !== "all" && productIdsFromProblem.length === 0) {
        // لا توجد منتجات لهذه المشكلة
        return [];
      }
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
      if (makeupFilter !== "all") {
        filtered = filtered.filter((product) => {
          return product.product_makeup_categories?.some((pmc: any) => pmc.makeup_categories?.slug === makeupFilter);
        });
      }
      if (skinTypeFilter !== "all") {
        filtered = filtered.filter((product) => product.skin_type?.includes(skinTypeFilter as any));
      }

      // Transform products with images and minPrice
      return filtered.map((product) => {
        const sortedImages = product.product_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
        const firstImage = sortedImages.length > 0 ? sortedImages[0].image_url : product.image_url;
        return {
          ...product,
          minPrice: product.product_variants?.[0]?.price,
          displayImage: firstImage,
        };
      });
    },
  });

  // Sort products client-side
  const sortedProducts = useMemo(() => {
    if (!allProducts) return [];
    const sorted = [...allProducts];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price_low":
        sorted.sort((a, b) => {
          const priceA = a.minPrice || Infinity;
          const priceB = b.minPrice || Infinity;
          return priceA - priceB;
        });
        break;
      case "price_high":
        sorted.sort((a, b) => {
          const priceA = a.minPrice || 0;
          const priceB = b.minPrice || 0;
          return priceB - priceA;
        });
        break;
      case "most_reviewed":
        sorted.sort((a, b) => {
          const countA = reviewCounts?.[a.id] || 0;
          const countB = reviewCounts?.[b.id] || 0;
          return countB - countA;
        });
        break;
    }
    return sorted;
  }, [allProducts, sortBy, reviewCounts]);

  // Lazy load products - show up to displayCount items
  const displayedProducts = useMemo(() => {
    return sortedProducts.slice(0, displayCount);
  }, [sortedProducts, displayCount]);
  const hasMore = displayCount < (sortedProducts?.length || 0);

  // Load more products when scrolling
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore) {
        setDisplayCount((prev) => prev + itemsPerPage);
      }
    },
    [hasMore, itemsPerPage],
  );
  useEffect(() => {
    const element = loadMoreRef.current;
    const option = {
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // Reset display count when filters or sort change
  useEffect(() => {
    setDisplayCount(itemsPerPage);
  }, [
    parentCategoryFilter,
    subCategoryFilter,
    skinTypeFilter,
    companyFilter,
    searchTerm,
    problemFilter,
    makeupFilter,
    productTypeFilter,
    sortBy,
  ]);
  const handleFilterChange = (setter: (value: string) => void, paramName?: string) => (value: string) => {
    setter(value);
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

  // التحقق من وجود فلاتر نشطة
  const hasActiveFilters =
    searchTerm !== "" ||
    parentCategoryFilter !== "all" ||
    subCategoryFilter !== "all" ||
    skinTypeFilter !== "all" ||
    companyFilter !== "all" ||
    problemFilter !== "all" ||
    makeupFilter !== "all" ||
    productTypeFilter !== "skincare";

  // إعادة ضبط جميع الفلاتر
  const resetAllFilters = () => {
    setSearchTerm("");
    setParentCategoryFilter("all");
    setSubCategoryFilter("all");
    setSkinTypeFilter("all");
    setCompanyFilter("all");
    setProblemFilter("all");
    setMakeupFilter("all");
    setProductTypeFilter("skincare");
    setSearchParams(new URLSearchParams());
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
    if (category) setParentCategoryFilter(category);
    if (subCategory) setSubCategoryFilter(subCategory);
    if (skinType) setSkinTypeFilter(skinType);
    if (company) setCompanyFilter(company);
    if (search) setSearchTerm(search);
    if (problem) setProblemFilter(problem);
    if (makeup) setMakeupFilter(makeup);
    if (productType) setProductTypeFilter(productType);
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
        title="جميع المنتجات"
        description="تصفحي أكبر مجموعة من منتجات العناية بالبشرة ومستحضرات التجميل في العراق. منتجات أصلية من أفضل العلامات التجارية العالمية بأسعار تنافسية."
        keywords="شراء مستحضرات تجميل، متجر مستحضرات تجميل اون لاين، منتجات العناية بالبشرة العراق، كريمات البشرة، سيروم، تونر، مرطبات"
        structuredData={structuredData}
      />
      <Navbar />
      <main className="container py-4 md:py-8">
        <h1 className="mb-4 md:mb-8 text-2xl md:text-3xl font-bold">جميع المنتجات</h1>

        {/* Mobile: Search + Filter Button */}
        <div className="flex gap-2 mb-4 md:hidden">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحثي عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setFiltersOpen(!filtersOpen)} className="shrink-0">
            {filtersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Collapsible Filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="md:hidden mb-4">
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Sort Option */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_low">السعر: من الأقل</SelectItem>
                <SelectItem value="price_high">السعر: من الأعلى</SelectItem>
                <SelectItem value="most_reviewed">الأكثر تقييماً</SelectItem>
              </SelectContent>
            </Select>

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

            <Drawer open={mobileCompanyOpen} onOpenChange={setMobileCompanyOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={mobileCompanyOpen}
                  className="w-full justify-between text-right"
                >
                  {companyFilter === "all"
                    ? "الشركة المصنعة"
                    : companies?.find((company) => company.key === companyFilter)?.displayName}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="text-right">
                  <DrawerTitle>اختر الشركة المصنعة</DrawerTitle>
                </DrawerHeader>
                <div className="p-4">
                  <Command className="w-full" shouldFilter={false}>
                    <CommandInput
                      placeholder="ابحث عن شركة..."
                      value={companySearch}
                      onValueChange={setCompanySearch}
                      className="text-right"
                    />
                    <CommandList className="max-h-[50vh] mt-2">
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            handleFilterChange(setCompanyFilter, "company")("all");
                            setMobileCompanyOpen(false);
                            setCompanySearch("");
                          }}
                          className="py-3"
                        >
                          <Check
                            className={cn("ml-2 h-4 w-4", companyFilter === "all" ? "opacity-100" : "opacity-0")}
                          />
                          جميع الشركات
                        </CommandItem>
                        {companies
                          ?.filter(
                            (company) =>
                              !companySearch ||
                              company.displayName?.toLowerCase().includes(companySearch.toLowerCase()),
                          )
                          .map((company) => (
                            <CommandItem
                              key={company.key}
                              value={company.displayName}
                              onSelect={() => {
                                handleFilterChange(setCompanyFilter, "company")(company.key);
                                setMobileCompanyOpen(false);
                                setCompanySearch("");
                              }}
                              className="py-3"
                            >
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  companyFilter === company.key ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {company.displayName}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              </DrawerContent>
            </Drawer>

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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={resetAllFilters}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 ml-2" />
                إعادة ضبط الفلاتر
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop Filters */}
        <div className="hidden md:grid mb-8 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحثي عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <Popover open={desktopCompanyOpen} onOpenChange={setDesktopCompanyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={desktopCompanyOpen}
                className="w-full justify-between text-right"
              >
                {companyFilter === "all"
                  ? "الشركة المصنعة"
                  : companies?.find((company) => company.key === companyFilter)?.displayName}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="ابحث عن شركة..."
                  value={companySearch}
                  onValueChange={setCompanySearch}
                  className="text-right"
                />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>لا توجد نتائج</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        handleFilterChange(setCompanyFilter, "company")("all");
                        setDesktopCompanyOpen(false);
                        setCompanySearch("");
                      }}
                    >
                      <Check className={cn("ml-2 h-4 w-4", companyFilter === "all" ? "opacity-100" : "opacity-0")} />
                      جميع الشركات
                    </CommandItem>
                    {companies
                      ?.filter(
                        (company) =>
                          !companySearch || company.displayName?.toLowerCase().includes(companySearch.toLowerCase()),
                      )
                      .map((company) => (
                        <CommandItem
                          key={company.key}
                          value={company.displayName}
                          onSelect={() => {
                            handleFilterChange(setCompanyFilter, "company")(company.key);
                            setDesktopCompanyOpen(false);
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

        {/* Sort and Reset Row */}
        <div className="hidden md:flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_low">السعر: من الأقل</SelectItem>
                <SelectItem value="price_high">السعر: من الأعلى</SelectItem>
                <SelectItem value="most_reviewed">الأكثر تقييماً</SelectItem>
              </SelectContent>
            </Select>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 ml-2" />
              إعادة ضبط الفلاتر
            </Button>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({
              length: itemsPerPage,
            }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : displayedProducts && displayedProducts.length > 0 ? (
          <>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 mb-[100px]">
              {displayedProducts.map((product) => {
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

            {/* Lazy Load Trigger */}
            <div ref={loadMoreRef} className="mt-8 flex justify-center">
              {hasMore && (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 w-full">
                  {Array.from({
                    length: 6,
                  }).map((_, i) => (
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
          <div className="text-center text-muted-foreground">لا توجد منتجات</div>
        )}
      </div>
    </div>
  );
};
export default Products;
