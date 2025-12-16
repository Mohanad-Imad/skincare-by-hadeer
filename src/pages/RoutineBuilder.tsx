import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { toast } from "sonner";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import {
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Calendar,
  ShoppingCart,
  X,
  Package,
  Sparkles,
  Search,
  Trash2,
} from "lucide-react";

interface RoutineSlot {
  id: string;
  name: string;
  categoryKeywords: string[];
  product: SelectedProduct | null;
  skipped: boolean;
}

interface SelectedProduct {
  id: string;
  name_ar: string;
  image_url: string | null;
  variant_id: string;
  variant_price: number;
  variant_size_ar: string;
  quantity: number;
}

interface RoutineSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  slots: RoutineSlot[];
  isOpen: boolean;
}

const MORNING_SLOTS: Omit<RoutineSlot, "product" | "skipped">[] = [
  { id: "morning-cleanser", name: "غسول", categoryKeywords: ["غسول", "cleanser", "منظف"] },
  { id: "morning-toner", name: "تونر", categoryKeywords: ["تونر", "toner"] },
  { id: "morning-serum", name: "سيروم", categoryKeywords: ["سيروم", "serum"] },
  { id: "morning-moisturizer", name: "مرطب", categoryKeywords: ["مرطب", "كريم", "moisturizer", "cream"] },
  { id: "morning-sunscreen", name: "واقي شمس", categoryKeywords: ["واقي", "شمس", "sunscreen", "spf"] },
  { id: "morning-other", name: "أخرى", categoryKeywords: [] },
];

const EVENING_SLOTS: Omit<RoutineSlot, "product" | "skipped">[] = [
  { id: "evening-micellar", name: "مسلار", categoryKeywords: ["مسلار", "micellar", "ماء"] },
  { id: "evening-oil-cleanser", name: "غسول زيتي", categoryKeywords: ["زيتي", "oil", "بلسم"] },
  { id: "evening-foam-cleanser", name: "غسول رغوي", categoryKeywords: ["غسول", "رغوي", "foam", "cleanser"] },
  { id: "evening-toner", name: "تونر", categoryKeywords: ["تونر", "toner"] },
  { id: "evening-serum", name: "سيروم", categoryKeywords: ["سيروم", "serum"] },
  { id: "evening-moisturizer", name: "مرطب", categoryKeywords: ["مرطب", "كريم", "moisturizer", "cream", "ليلي"] },
  { id: "evening-other", name: "أخرى", categoryKeywords: [] },
];

const WEEKLY_SLOTS: Omit<RoutineSlot, "product" | "skipped">[] = [
  { id: "weekly-mask", name: "قناع ليلي", categoryKeywords: ["قناع", "ماسك", "mask", "ليلي"] },
  { id: "weekly-exfoliator", name: "مقشر", categoryKeywords: ["مقشر", "تقشير", "exfoliator", "scrub", "peel"] },
  { id: "weekly-other", name: "أخرى", categoryKeywords: [] },
];

const STORAGE_KEY = "routine-builder-saved";

interface SavedRoutineData {
  slots: {
    [slotId: string]: {
      product: SelectedProduct | null;
      skipped: boolean;
    };
  };
}

const RoutineBuilder = () => {
  const navigate = useNavigate();
  const { addToLocalCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();

  const getDiscountedPrice = (productId: string, originalPrice: number) => {
    const result = calculateDiscount(productId, originalPrice, discounts);
    return result?.discountedPrice || originalPrice;
  };

  const getDiscountPercentage = (productId: string) => {
    const result = calculateDiscount(productId, 100, discounts);
    return result?.percentage || 0;
  };

  // Load saved routine from localStorage
  const loadSavedRoutine = (): SavedRoutineData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error loading saved routine:", e);
    }
    return null;
  };

  const createInitialSections = (): RoutineSection[] => {
    const saved = loadSavedRoutine();
    
    const applySavedData = (slots: Omit<RoutineSlot, "product" | "skipped">[]): RoutineSlot[] => {
      return slots.map((slot) => {
        const savedSlot = saved?.slots?.[slot.id];
        return {
          ...slot,
          product: savedSlot?.product || null,
          skipped: savedSlot?.skipped || false,
        };
      });
    };

    return [
      {
        id: "morning",
        title: "الروتين الصباحي",
        icon: <Sun className="h-5 w-5 text-amber-500" />,
        slots: applySavedData(MORNING_SLOTS),
        isOpen: true,
      },
      {
        id: "evening",
        title: "الروتين المسائي",
        icon: <Moon className="h-5 w-5 text-indigo-500" />,
        slots: applySavedData(EVENING_SLOTS),
        isOpen: false,
      },
      {
        id: "weekly",
        title: "الروتين الأسبوعي",
        icon: <Calendar className="h-5 w-5 text-emerald-500" />,
        slots: applySavedData(WEEKLY_SLOTS),
        isOpen: false,
      },
    ];
  };

  const [sections, setSections] = useState<RoutineSection[]>(createInitialSections);

  // Save routine to localStorage when sections change
  useEffect(() => {
    const dataToSave: SavedRoutineData = {
      slots: {},
    };

    sections.forEach((section) => {
      section.slots.forEach((slot) => {
        if (slot.product || slot.skipped) {
          dataToSave.slots[slot.id] = {
            product: slot.product,
            skipped: slot.skipped,
          };
        }
      });
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [sections]);

  // Clear saved routine
  const clearRoutine = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSections([
      {
        id: "morning",
        title: "الروتين الصباحي",
        icon: <Sun className="h-5 w-5 text-amber-500" />,
        slots: MORNING_SLOTS.map((slot) => ({ ...slot, product: null, skipped: false })),
        isOpen: true,
      },
      {
        id: "evening",
        title: "الروتين المسائي",
        icon: <Moon className="h-5 w-5 text-indigo-500" />,
        slots: EVENING_SLOTS.map((slot) => ({ ...slot, product: null, skipped: false })),
        isOpen: false,
      },
      {
        id: "weekly",
        title: "الروتين الأسبوعي",
        icon: <Calendar className="h-5 w-5 text-emerald-500" />,
        slots: WEEKLY_SLOTS.map((slot) => ({ ...slot, product: null, skipped: false })),
        isOpen: false,
      },
    ]);
    toast.success("تم مسح الروتين");
  };

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ sectionId: string; slotId: string } | null>(null);
  const [activeSlotKeywords, setActiveSlotKeywords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = useState(false);
  const [visibleProductsCount, setVisibleProductsCount] = useState(12);

  // Fetch all products with variants
  const { data: products } = useQuery({
    queryKey: ["routine-builder-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name_ar,
          image_url,
          category_id,
          categories (name_ar, name_en),
          product_variants (id, price, size_ar, stock_quantity)
        `)
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  // Filter products based on slot keywords and search query
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products;
    
    // Filter by slot keywords (unless "أخرى" which shows all)
    if (activeSlotKeywords.length > 0) {
      filtered = filtered.filter((product) => {
        const productName = product.name_ar?.toLowerCase() || "";
        const categoryName = (product.categories as any)?.name_ar?.toLowerCase() || "";
        const categoryNameEn = (product.categories as any)?.name_en?.toLowerCase() || "";

        return activeSlotKeywords.some(
          (keyword) =>
            productName.includes(keyword.toLowerCase()) ||
            categoryName.includes(keyword.toLowerCase()) ||
            categoryNameEn.includes(keyword.toLowerCase())
        );
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        const productName = product.name_ar?.toLowerCase() || "";
        return productName.includes(query);
      });
    }

    return filtered;
  }, [products, activeSlotKeywords, searchQuery]);

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, isOpen: !section.isOpen } : section
      )
    );
  };

  // Reset visible count when dialog opens or search changes
  useEffect(() => {
    setVisibleProductsCount(12);
  }, [productDialogOpen, searchQuery, activeSlotKeywords]);

  // Lazy loading using scroll event
  const loadMoreProducts = useCallback(() => {
    setVisibleProductsCount((prev) => Math.min(prev + 12, filteredProducts.length));
  }, [filteredProducts.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Load more when near bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (visibleProductsCount < filteredProducts.length) {
        loadMoreProducts();
      }
    }
  }, [loadMoreProducts, visibleProductsCount, filteredProducts.length]);

  // Visible products for lazy loading
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleProductsCount);
  }, [filteredProducts, visibleProductsCount]);

  const openProductDialog = (sectionId: string, slotId: string, keywords: string[]) => {
    setSelectedSlot({ sectionId, slotId });
    setActiveSlotKeywords(keywords);
    setSearchQuery("");
    setVisibleProductsCount(12);
    setProductDialogOpen(true);
  };

  const selectProduct = (product: any, variant: any) => {
    if (!selectedSlot) return;

    const selectedProduct: SelectedProduct = {
      id: product.id,
      name_ar: product.name_ar,
      image_url: product.image_url,
      variant_id: variant.id,
      variant_price: variant.price,
      variant_size_ar: variant.size_ar,
      quantity: 1,
    };

    setSections((prev) =>
      prev.map((section) =>
        section.id === selectedSlot.sectionId
          ? {
              ...section,
              slots: section.slots.map((slot) =>
                slot.id === selectedSlot.slotId
                  ? { ...slot, product: selectedProduct, skipped: false }
                  : slot
              ),
            }
          : section
      )
    );

    setProductDialogOpen(false);
    toast.success(`تم اختيار ${product.name_ar}`);
  };

  const skipSlot = (sectionId: string, slotId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              slots: section.slots.map((slot) =>
                slot.id === slotId ? { ...slot, product: null, skipped: true } : slot
              ),
            }
          : section
      )
    );
  };

  const clearSlot = (sectionId: string, slotId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              slots: section.slots.map((slot) =>
                slot.id === slotId ? { ...slot, product: null, skipped: false } : slot
              ),
            }
          : section
      )
    );
  };

  const updateQuantity = (sectionId: string, slotId: string, delta: number) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              slots: section.slots.map((slot) =>
                slot.id === slotId && slot.product
                  ? {
                      ...slot,
                      product: {
                        ...slot.product,
                        quantity: Math.max(1, slot.product.quantity + delta),
                      },
                    }
                  : slot
              ),
            }
          : section
      )
    );
  };

  // Calculate totals
  const calculateSectionTotal = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return 0;

    return section.slots.reduce((total, slot) => {
      if (slot.product) {
        const discountedPrice = getDiscountedPrice(slot.product.id, slot.product.variant_price);
        return total + discountedPrice * slot.product.quantity;
      }
      return total;
    }, 0);
  };

  const totalPrice = sections.reduce((total, section) => total + calculateSectionTotal(section.id), 0);

  const getSelectedProducts = (sectionIds?: string[]) => {
    const targetSections = sectionIds
      ? sections.filter((s) => sectionIds.includes(s.id))
      : sections;

    return targetSections.flatMap((section) =>
      section.slots.filter((slot) => slot.product).map((slot) => slot.product!)
    );
  };

  const addToCart = async (sectionIds?: string[]) => {
    const productsToAdd = getSelectedProducts(sectionIds);

    if (productsToAdd.length === 0) {
      toast.error("لم يتم اختيار أي منتجات");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Add to authenticated cart
      for (const product of productsToAdd) {
        const { data: existingItem } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_variant_id", product.variant_id)
          .single();

        if (existingItem) {
          await supabase
            .from("cart_items")
            .update({ quantity: existingItem.quantity + product.quantity })
            .eq("id", existingItem.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_variant_id: product.variant_id,
            quantity: product.quantity,
          });
        }
      }
    } else {
      // Add to local cart
      for (const product of productsToAdd) {
        addToLocalCart(product.variant_id, product.quantity);
      }
    }

    toast.success(`تمت إضافة ${productsToAdd.length} منتجات إلى السلة`);
    navigate("/cart");
  };

  const getSectionProductCount = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    return section?.slots.filter((slot) => slot.product).length || 0;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="بناء الروتين المخصص - منتجات العناية بالبشرة"
        description="أنشئ روتينك الخاص للعناية بالبشرة. اختر منتجاتك للروتين الصباحي والمسائي والأسبوعي."
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 pb-32 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-primary font-medium">ابني روتينك الخاص</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">بناء الروتين المخصص</h1>
            <p className="text-muted-foreground mb-4">اختر منتجاتك المفضلة لكل خطوة من روتينك اليومي</p>
            {totalPrice > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRoutine}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 ml-1" />
                مسح الروتين والبدء من جديد
              </Button>
            )}
          </div>

          {/* Routine Sections */}
          <div className="space-y-4 mb-8">
            {sections.map((section) => (
              <Collapsible
                key={section.id}
                open={section.isOpen}
                onOpenChange={() => toggleSection(section.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <span className="font-semibold text-lg">{section.title}</span>
                        {getSectionProductCount(section.id) > 0 && (
                          <Badge variant="secondary">
                            {getSectionProductCount(section.id)} منتجات
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {calculateSectionTotal(section.id) > 0 && (
                          <span className="text-primary font-medium">
                            {Math.round(calculateSectionTotal(section.id)).toLocaleString()} د.ع
                          </span>
                        )}
                        {section.isOpen ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.slots.map((slot, index) => (
                        <SlotCard
                          key={slot.id}
                          slot={slot}
                          sectionId={section.id}
                          stepNumber={index + 1}
                          onBrowse={() => openProductDialog(section.id, slot.id, slot.categoryKeywords)}
                          onSkip={() => skipSlot(section.id, slot.id)}
                          onClear={() => clearSlot(section.id, slot.id)}
                          onQuantityChange={(delta) => updateQuantity(section.id, slot.id, delta)}
                          getDiscountedPrice={getDiscountedPrice}
                          getDiscountPercentage={getDiscountPercentage}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>

          {/* Summary & Actions - Desktop */}
          <Card className="hidden md:block p-6 sticky bottom-4 bg-card/95 backdrop-blur-sm border-2 border-primary/20">
            <div className="flex flex-col gap-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">المجموع الكلي:</span>
                <span className="text-2xl font-bold text-primary">
                  {Math.round(totalPrice).toLocaleString()} د.ع
                </span>
              </div>

              {/* Main CTA */}
              <Button
                size="lg"
                className="w-full text-lg py-6"
                onClick={() => addToCart()}
                disabled={totalPrice === 0}
              >
                <ShoppingCart className="h-5 w-5 ml-2" />
                أضف الروتين الكامل إلى السلة
              </Button>

              {/* Section-specific buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToCart(["morning"])}
                  disabled={calculateSectionTotal("morning") === 0}
                >
                  <Sun className="h-4 w-4 ml-1" />
                  الصباحي فقط
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToCart(["evening"])}
                  disabled={calculateSectionTotal("evening") === 0}
                >
                  <Moon className="h-4 w-4 ml-1" />
                  المسائي فقط
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToCart(["weekly"])}
                  disabled={calculateSectionTotal("weekly") === 0}
                >
                  <Calendar className="h-4 w-4 ml-1" />
                  الأسبوعي فقط
                </Button>
              </div>
            </div>
          </Card>

          {/* Mobile Floating Button */}
          <div className="md:hidden fixed bottom-28 left-4 right-4 z-40">
            <Drawer open={mobileCartDrawerOpen} onOpenChange={setMobileCartDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  size="lg"
                  className="w-full py-6 shadow-lg animate-fade-in"
                  disabled={totalPrice === 0}
                >
                  <ChevronUp className="h-5 w-5 ml-2" />
                  <span>تفاصيل</span>
                  <Badge variant="secondary" className="mr-2">
                    {Math.round(totalPrice).toLocaleString()} د.ع
                  </Badge>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="px-4 pb-8">
                <DrawerHeader className="text-center">
                  <DrawerTitle>ملخص الروتين</DrawerTitle>
                </DrawerHeader>
                <div className="flex flex-col gap-4">
                  {/* Total */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-lg font-medium">المجموع الكلي:</span>
                    <span className="text-2xl font-bold text-primary">
                      {Math.round(totalPrice).toLocaleString()} د.ع
                    </span>
                  </div>

                  {/* Main CTA */}
                  <Button
                    size="lg"
                    className="w-full text-lg py-6"
                    onClick={() => {
                      addToCart();
                      setMobileCartDrawerOpen(false);
                    }}
                    disabled={totalPrice === 0}
                  >
                    <ShoppingCart className="h-5 w-5 ml-2" />
                    أضف الروتين الكامل إلى السلة
                  </Button>

                  {/* Section-specific buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        addToCart(["morning"]);
                        setMobileCartDrawerOpen(false);
                      }}
                      disabled={calculateSectionTotal("morning") === 0}
                    >
                      <Sun className="h-4 w-4 ml-1" />
                      الصباحي فقط ({Math.round(calculateSectionTotal("morning")).toLocaleString()} د.ع)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        addToCart(["evening"]);
                        setMobileCartDrawerOpen(false);
                      }}
                      disabled={calculateSectionTotal("evening") === 0}
                    >
                      <Moon className="h-4 w-4 ml-1" />
                      المسائي فقط ({Math.round(calculateSectionTotal("evening")).toLocaleString()} د.ع)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        addToCart(["weekly"]);
                        setMobileCartDrawerOpen(false);
                      }}
                      disabled={calculateSectionTotal("weekly") === 0}
                    >
                      <Calendar className="h-4 w-4 ml-1" />
                      الأسبوعي فقط ({Math.round(calculateSectionTotal("weekly")).toLocaleString()} د.ع)
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </main>

      {/* Product Selection Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>اختر منتجاً</DialogTitle>
          </DialogHeader>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          <div 
            className="h-[55vh] pr-4 overflow-y-auto"
            onScroll={handleScroll}
          >
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات متاحة لهذه الفئة"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {visibleProducts.map((product) => (
                  <ProductSelectCard
                    key={product.id}
                    product={product}
                    onSelect={selectProduct}
                    getDiscountedPrice={getDiscountedPrice}
                    getDiscountPercentage={getDiscountPercentage}
                  />
                ))}
              </div>
            )}
            {/* Load more indicator */}
            {visibleProductsCount < filteredProducts.length && (
              <div className="py-4 text-center">
                <span className="text-sm text-muted-foreground">جاري تحميل المزيد...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

// Slot Card Component
interface SlotCardProps {
  slot: RoutineSlot;
  sectionId: string;
  stepNumber: number;
  onBrowse: () => void;
  onSkip: () => void;
  onClear: () => void;
  onQuantityChange: (delta: number) => void;
  getDiscountedPrice: (productId: string, originalPrice: number) => number;
  getDiscountPercentage: (productId: string) => number;
}

const SlotCard = ({
  slot,
  stepNumber,
  onBrowse,
  onSkip,
  onClear,
  onQuantityChange,
  getDiscountedPrice,
  getDiscountPercentage,
}: SlotCardProps) => {
  if (slot.skipped) {
    return (
      <div className="border-2 border-dashed border-muted rounded-xl p-4 flex flex-col items-center justify-center min-h-[180px] bg-muted/20">
        <span className="text-sm font-medium text-muted-foreground mb-1">{stepNumber}-{slot.name}</span>
        <span className="text-xs text-muted-foreground mb-3">لا يوجد منتج</span>
        <Button variant="ghost" size="sm" onClick={onClear}>
          إعادة الاختيار
        </Button>
      </div>
    );
  }

  if (slot.product) {
    const discountedPrice = getDiscountedPrice(slot.product.id, slot.product.variant_price);
    const discountPercentage = getDiscountPercentage(slot.product.id);
    const hasDiscount = discountPercentage > 0;

    return (
      <div className="border rounded-xl p-3 relative bg-card">
        <button
          onClick={onClear}
          className="absolute top-2 left-2 p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-xs font-medium text-muted-foreground mb-2">{stepNumber}-{slot.name}</div>

        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {slot.product.image_url ? (
              <img
                src={slot.product.image_url}
                alt={slot.product.name_ar}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2 mb-1">{slot.product.name_ar}</p>
            <p className="text-xs text-muted-foreground mb-1">{slot.product.variant_size_ar}</p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-primary">
                {Math.round(discountedPrice).toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {Math.round(slot.product.variant_price).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">الكمية:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onQuantityChange(-1)}
              disabled={slot.product.quantity <= 1}
            >
              -
            </Button>
            <span className="w-6 text-center text-sm font-medium">{slot.product.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onQuantityChange(1)}
            >
              +
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-muted rounded-xl p-4 flex flex-col items-center justify-center min-h-[180px] hover:border-primary/50 transition-colors">
      <span className="text-sm font-medium mb-3">{stepNumber}-{slot.name}</span>
      <div className="flex flex-col gap-2 w-full">
        <Button variant="default" size="sm" className="w-full" onClick={onBrowse}>
          تصفح واختيار
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onSkip}>
          تخطي هذه الخطوة
        </Button>
      </div>
    </div>
  );
};

// Product Select Card Component
interface ProductSelectCardProps {
  product: any;
  onSelect: (product: any, variant: any) => void;
  getDiscountedPrice: (productId: string, originalPrice: number) => number;
  getDiscountPercentage: (productId: string) => number;
}

const ProductSelectCard = ({
  product,
  onSelect,
  getDiscountedPrice,
  getDiscountPercentage,
}: ProductSelectCardProps) => {
  const [selectedVariant, setSelectedVariant] = useState(
    product.product_variants?.[0] || null
  );

  const variants = product.product_variants?.filter((v: any) => v.stock_quantity > 0) || [];

  if (variants.length === 0) return null;

  const discountedPrice = selectedVariant
    ? getDiscountedPrice(product.id, selectedVariant.price)
    : 0;
  const discountPercentage = getDiscountPercentage(product.id);
  const hasDiscount = discountPercentage > 0;

  return (
    <div className="border rounded-xl p-3 hover:border-primary/50 transition-colors">
      <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_ar}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            خصم {discountPercentage}%
          </Badge>
        )}
      </div>

      <h3 className="text-sm font-medium line-clamp-2 mb-2 min-h-[40px]">{product.name_ar}</h3>

      {variants.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {variants.map((variant: any) => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariant(variant)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                selectedVariant?.id === variant.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              {variant.size_ar}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <span className="font-bold text-primary">
            {Math.round(discountedPrice).toLocaleString()}
          </span>
          {hasDiscount && selectedVariant && (
            <span className="text-xs text-muted-foreground line-through">
              {Math.round(selectedVariant.price).toLocaleString()}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">د.ع</span>
      </div>

      <Button
        size="sm"
        className="w-full"
        onClick={() => onSelect(product, selectedVariant)}
        disabled={!selectedVariant}
      >
        اختيار
      </Button>
    </div>
  );
};

export default RoutineBuilder;
