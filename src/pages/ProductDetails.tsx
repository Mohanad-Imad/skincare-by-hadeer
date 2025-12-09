import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, ArrowRight, Tag, MessageCircle, Info } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { MiniCart } from "@/components/MiniCart";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { ProductReviews } from "@/components/ProductReviews";
import { SimilarProducts } from "@/components/SimilarProducts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [addedProduct, setAddedProduct] = useState<any>(null);
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const { addToLocalCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();

  // جلب إعدادات "لمّح للحبايب"
  const { data: dropHintSettings } = useQuery({
    queryKey: ["drop-hint-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drop_hint_settings").select("*").eq("is_active", true).single();

      if (error) throw error;
      return data;
    },
  });
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          product_variants (*),
          categories (
            id,
            name_ar,
            parent_category_id,
            parent:parent_category_id (
              id,
              name_ar
            )
          ),
          product_images (
            id,
            image_url,
            display_order
          )
        `,
        )
        .eq("id", id)
        .single();
      if (error) throw error;

      // ترتيب الصور حسب display_order
      if (data.product_images) {
        data.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
      }
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // تعيين أول variant متاح تلقائياً عند تحميل المنتج
  useEffect(() => {
    if (product && product.product_variants && product.product_variants.length > 0 && !selectedVariant) {
      // اختيار أول variant متاح (غير منفذ)
      const availableVariant = product.product_variants.find((v: any) => v.stock_quantity > 0);
      if (availableVariant) {
        setSelectedVariant(availableVariant.id);
      } else {
        // إذا كانت جميع الأحجام منفذة، اختر الأول
        setSelectedVariant(product.product_variants[0].id);
      }
    }
  }, [product, selectedVariant]);

  const handleDropHint = () => {
    setShowMoodDialog(true);
  };

  const sendWhatsAppMessage = (mood: "funny" | "formal" | "urgent") => {
    if (!dropHintSettings) return;

    const currentUrl = window.location.href;
    let message = "";

    if (mood === "funny") {
      message = dropHintSettings.funny_message_ar;
    } else if (mood === "formal") {
      message = dropHintSettings.formal_message_ar;
    } else if (mood === "urgent") {
      message = dropHintSettings.urgent_message_ar;
    }

    // استبدال {URL} برابط المنتج
    message = message.replace("{URL}", currentUrl);

    // إضافة كود الخصم إذا كان موجوداً
    if (dropHintSettings.discount_code && dropHintSettings.discount_suffix_ar) {
      const discountText = dropHintSettings.discount_suffix_ar.replace("{CODE}", dropHintSettings.discount_code);
      message += ` ${discountText}`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    setShowMoodDialog(false);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const variantData = product.product_variants.find((v: any) => v.id === selectedVariant);
    if (!variantData) return;

    // التحقق من توفر المخزون
    if (variantData.stock_quantity === 0) {
      toast.error("عذراً، هذا الحجم غير متوفر حالياً");
      return;
    }

    // حساب السعر النهائي بعد الخصم
    const discount = calculateDiscount(product.id, variantData.price, discounts);
    const finalPrice = discount ? discount.discountedPrice : variantData.price;

    // تحضير بيانات المنتج للنافذة المنبثقة
    const productImages =
      product.product_images && product.product_images.length > 0
        ? product.product_images.map((img: any) => img.image_url)
        : product.image_url
          ? [product.image_url]
          : [];

    setAddedProduct({
      name: product.name_ar,
      image: productImages[0] || "/placeholder.svg",
      price: finalPrice,
      size: variantData.size_ar,
      quantity: 1,
    });

    if (!session?.user) {
      // إضافة إلى السلة المؤقتة
      addToLocalCart(selectedVariant);
      setShowMiniCart(true);
    } else {
      // إضافة إلى قاعدة البيانات
      addToCartMutation.mutate(selectedVariant);
    }
  };

  const addToCartMutation = useMutation({
    mutationFn: async (variantId: string) => {
      if (!session?.user) return;

      const { data: existing } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("product_variant_id", variantId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({
            quantity: existing.quantity + 1,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: session.user.id,
          product_variant_id: variantId,
          quantity: 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart-count"],
      });
      setShowMiniCart(true);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الإضافة إلى السلة");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!product || !product.product_variants || product.product_variants.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center">المنتج غير موجود</div>
      </div>
    );
  }

  const selectedVariantData = product.product_variants.find((v: any) => v.id === selectedVariant);
  const selectedVariantDiscount = selectedVariantData
    ? calculateDiscount(product.id, selectedVariantData.price, discounts)
    : null;
  const finalPrice = selectedVariantDiscount ? selectedVariantDiscount.discountedPrice : selectedVariantData?.price;

  // استخدام صور product_images إذا كانت موجودة، وإلا استخدم image_url القديمة
  const productImages =
    product.product_images && product.product_images.length > 0
      ? product.product_images.map((img: any) => img.image_url)
      : product.image_url
        ? [product.image_url]
        : [];

  // Get variant prices safely
  const variantPrices = product.product_variants.map((v: any) => v.price);
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;

  // Structured data for product
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name_ar,
    description: product.description_ar || `${product.name_ar} - منتج عناية بالبشرة`,
    image: productImages,
    brand: {
      "@type": "Brand",
      name: product.company_name_ar || "متجر مستحضرات التجميل",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IQD",
      lowPrice: minPrice,
      highPrice: maxPrice,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${product.name_ar} - منتجات العناية بالبشرة`}
        description={
          product.description_ar ||
          `اشتري ${product.name_ar} - منتج عناية بالبشرة أصلي بأفضل سعر في العراق. توصيل سريع لجميع المحافظات.`
        }
        keywords={`${product.name_ar}, ${product.company_name_ar || ""}, منتجات العناية بالبشرة, شراء ${product.name_ar} العراق`}
        image={productImages[0]}
        type="product"
        structuredData={structuredData}
      />
      <Navbar />
      <div className="container pb-32 pt-4 md:pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>

        {/* Breadcrumbs - تصميم أجمل */}
        <div className="flex items-center gap-2 text-xs flex-wrap mb-6">
          <span className="text-muted-foreground">المنتجات</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground rotate-180" />
          {product.categories?.parent && (
            <>
              <span className="text-sm font-medium text-primary/80">
                {product.categories.parent.name_ar || "تصنيف رئيسي"}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground rotate-180" />
              <span className="text-sm font-semibold text-foreground">
                {product.categories?.name_ar || "تصنيف فرعي"}
              </span>
            </>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Images Gallery (Col 1) */}
          <Card className="lg:col-span-1 border-none shadow-none p-0">
            <CardContent className="space-y-4 p-0">
              {/* Main Image */}
              <div className="aspect-square overflow-hidden rounded-2xl bg-secondary shadow-xl border border-border/50">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[selectedImageIndex]}
                    alt={`${product.name_ar} - صورة ${selectedImageIndex + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">بدون صورة</div>
                )}
              </div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {productImages.map((imageUrl: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${selectedImageIndex === index ? "border-primary scale-105 shadow-md" : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"}`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${product.name_ar} - صورة مصغرة ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Info & Options (Col 2 & 3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. الاسم والشركة والسعر الأساسي */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold leading-snug text-foreground/95">{product.name_ar}</h1>
              {product.company_name_ar && (
                <p className="text-base text-muted-foreground flex items-center gap-1.5">
                  <span className="font-semibold text-foreground/70">من:</span>
                  <span className="font-bold text-primary">{product.company_name_ar}</span>
                </p>
              )}

              {/* عرض السعر الرئيسي للواريانت المحدد */}
              {selectedVariantData && (
                <div className="mt-4 flex items-baseline gap-3">
                  {selectedVariantDiscount ? (
                    <>
                      <span className="text-4xl font-extrabold text-primary">{Math.round(finalPrice!)} د.ع</span>
                      <span className="text-xl text-muted-foreground line-through">
                        {Math.round(selectedVariantData.price)} د.ع
                      </span>
                      <Badge variant="destructive" className="text-lg px-3 py-1.5 font-bold shadow-md">
                        -{Math.round(selectedVariantDiscount.percentage)}% خصم
                      </Badge>
                    </>
                  ) : (
                    <span className="text-4xl font-extrabold text-primary">{Math.round(finalPrice!)} د.ع</span>
                  )}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* 2. اختيار الحجم (ضمن Card أنيقة) */}
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                  <Tag className="h-5 w-5" />
                  اختاري الحجم والكمية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedVariant} onValueChange={setSelectedVariant}>
                  <div className="space-y-3">
                    {product.product_variants.map((variant: any) => {
                      const variantDiscount = calculateDiscount(product.id, variant.price, discounts);
                      const isOutOfStock = variant.stock_quantity === 0;
                      const isSelected = selectedVariant === variant.id;

                      return (
                        <div
                          key={variant.id}
                          className={`flex items-center justify-between rounded-xl border-2 p-3 transition-all cursor-pointer ${
                            isOutOfStock
                              ? "opacity-60 bg-muted/50 cursor-not-allowed border-muted"
                              : isSelected
                                ? "border-primary bg-primary/10 shadow-md"
                                : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => !isOutOfStock && setSelectedVariant(variant.id)}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value={variant.id}
                              id={variant.id}
                              disabled={isOutOfStock}
                              className="h-5 w-5"
                            />
                            <Label
                              htmlFor={variant.id}
                              className={`text-base font-semibold cursor-pointer ${isOutOfStock ? "cursor-not-allowed text-muted-foreground" : "text-foreground"}`}
                            >
                              {variant.size_ar}
                            </Label>
                          </div>

                          <div className="flex items-center gap-3">
                            {isOutOfStock && (
                              <Badge
                                variant="secondary"
                                className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700"
                              >
                                غير متوفر
                              </Badge>
                            )}
                            {variantDiscount ? (
                              <div className="text-right flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">
                                  {Math.round(variantDiscount.discountedPrice)} د.ع
                                </span>
                                <span className="text-xs text-muted-foreground line-through">
                                  {Math.round(variant.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-primary">{Math.round(variant.price)} د.ع</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* 3. الوصف */}
            {product.description_ar && (
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                    <Info className="h-5 w-5" />
                    وصف المنتج
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground/85">{product.description_ar}</p>
                </CardContent>
              </Card>
            )}

            {/* 4. مناسب لنوع البشرة */}
            {product.skin_type && product.skin_type.length > 0 && (
              <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                    مناسب لنوع البشرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.skin_type.map((type: string) => {
                      const skinTypeLabels: Record<string, string> = {
                        oily: "دهنية",
                        dry: "جافة",
                        combination: "مختلطة",
                        sensitive: "حساسة",
                        normal: "عادية",
                      };
                      return (
                        <Badge
                          key={type}
                          variant="outline"
                          className="bg-background border-primary/50 text-foreground px-3 py-1 text-xs font-medium"
                        >
                          {skinTypeLabels[type] || type}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5. التقييمات والمراجعات */}
            <div className="pt-4">
              <ProductReviews productId={id!} />
            </div>
          </div>
        </div>

        {/* منتجات مشابهة */}
        {product.category_id && (
          <div className="mt-12">
            <SimilarProducts categoryId={product.category_id} currentProductId={product.id} />
          </div>
        )}
      </div>

      {/* أزرار الإجراءات - عائمة في أسفل الشاشة */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto">
          <div className="flex gap-2 justify-center">
            <Button
              size="lg"
              disabled={!selectedVariant || addToCartMutation.isPending || selectedVariantData?.stock_quantity === 0}
              onClick={handleAddToCart}
              className="flex-1 h-12 px-4 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] disabled:opacity-70 disabled:pointer-events-none"
            >
              <ShoppingCart className="ml-2 h-5 w-5 flex-shrink-0" />
              <span className="truncate">{addToCartMutation.isPending ? "جاري الإضافة..." : "أضيفي إلى السلة"}</span>
            </Button>
            {dropHintSettings?.is_active && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleDropHint}
                className="flex-1 h-12 px-4 rounded-xl shadow-lg border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all hover:scale-[1.01] text-base sm:text-lg font-bold"
              >
                <MessageCircle className="ml-2 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{dropHintSettings.button_text_ar}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {addedProduct && (
        <MiniCart open={showMiniCart} onOpenChange={setShowMiniCart} product={addedProduct} session={session} />
      )}

      {/* نافذة اختيار نبرة الرسالة */}
      <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-extrabold text-primary">
              اختاري نبرة الرسالة 💌
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => sendWhatsAppMessage("funny")}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-start gap-2 border-2 hover:bg-primary/5 hover:border-primary transition-all"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">😂</span>
                <span className="font-bold text-base">نبرة مزاح (للأصدقاء)</span>
              </div>
              <span className="text-xs text-muted-foreground text-right">تكسر حاجز الخجل بالضحك وتجعل الطلب أخف</span>
            </Button>

            <Button
              onClick={() => sendWhatsAppMessage("formal")}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-start gap-2 border-2 hover:bg-primary/5 hover:border-primary transition-all"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">❤️</span>
                <span className="font-bold text-base">نبرة رسمية/لطيفة</span>
              </div>
              <span className="text-xs text-muted-foreground text-right">
                للزوج/الخطيب/الأهل - تبدو كأخذ رأي لكنها طلب مبطن
              </span>
            </Button>

            <Button
              onClick={() => sendWhatsAppMessage("urgent")}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-start gap-2 border-2 hover:bg-primary/5 hover:border-primary transition-all"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">🔥</span>
                <span className="font-bold text-base">الفرصة لا تعوض</span>
              </div>
              <span className="text-xs text-muted-foreground text-right">
                محفزة وتخلق إحساس بالاستعجال وعدم فوات الفرصة
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ProductDetails;
