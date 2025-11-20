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
import { ShoppingCart, ArrowRight, Tag, MessageCircle } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { MiniCart } from "@/components/MiniCart";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import { ProductReviews } from "@/components/ProductReviews";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [addedProduct, setAddedProduct] = useState<any>(null);
  const { addToLocalCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();
  
  // كود الخصم (اتركه فارغاً إذا لم يكن هناك كود)
  const discountCode = "";
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
    const currentUrl = window.location.href;
    let message = `هلو.. شفت هذا الشي بمتجر هدير وكُلش عجبني ويخبل! 😍 كلت أدزه إلك بلكي تخليه ببالك وتفاجئني بي.. 😉 وهذا الرابط لسهولة الاختيار: ${currentUrl}`;
    
    // إضافة كود الخصم إذا كان موجوداً
    if (discountCode) {
      message += ` وهمين اكو كود خصم اذا نويت: ${discountCode}`;
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center">المنتج غير موجود</div>
      </div>
    );
  }
  const selectedVariantData = product.product_variants.find((v: any) => v.id === selectedVariant);

  // استخدام صور product_images إذا كانت موجودة، وإلا استخدم image_url القديمة
  const productImages =
    product.product_images && product.product_images.length > 0
      ? product.product_images.map((img: any) => img.image_url)
      : product.image_url
        ? [product.image_url]
        : [];

  // Structured data for product
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name_ar,
    "description": product.description_ar || `${product.name_ar} - منتج عناية بالبشرة`,
    "image": productImages,
    "brand": {
      "@type": "Brand",
      "name": product.company_name_ar || "متجر مستحضرات التجميل"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "IQD",
      "lowPrice": Math.min(...product.product_variants.map((v: any) => v.price)),
      "highPrice": Math.max(...product.product_variants.map((v: any) => v.price)),
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${product.name_ar} - منتجات العناية بالبشرة`}
        description={product.description_ar || `اشتري ${product.name_ar} - منتج عناية بالبشرة أصلي بأفضل سعر في العراق. توصيل سريع لجميع المحافظات.`}
        keywords={`${product.name_ar}, ${product.company_name_ar || ""}, منتجات العناية بالبشرة, شراء ${product.name_ar} العراق`}
        image={productImages[0]}
        type="product"
        structuredData={structuredData}
      />
      <Navbar />
      <div className="container pb-32 pt-2">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-2 gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs flex-wrap mb-4">
          <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-medium text-primary/90 hover:bg-primary/20 transition-colors">
            المنتجات
          </span>
          <svg 
            className="h-3 w-3 text-muted-foreground rotate-180" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {product.categories?.parent && (
            <>
              <span className="rounded-lg bg-primary/15 px-2.5 py-1 font-medium text-primary hover:bg-primary/25 transition-colors">
                {product.categories.parent.name_ar || "تصنيف رئيسي"}
              </span>
              <svg 
                className="h-3 w-3 text-muted-foreground rotate-180" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="rounded-lg bg-primary/20 px-2.5 py-1 font-semibold text-primary hover:bg-primary/30 transition-colors">
                {product.categories?.name_ar || "تصنيف فرعي"}
              </span>
            </>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Images Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-2xl bg-secondary shadow-lg">
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
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${selectedImageIndex === index ? "border-primary scale-105 shadow-md" : "border-transparent hover:border-primary/50 opacity-70 hover:opacity-100"}`}
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
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            {/* 1. الاسم */}
            <h1 className="text-lg md:text-xl font-bold leading-tight">{product.name_ar}</h1>

            {/* 2. السعر مع اختيار الحجم */}
            <div className="bg-card border rounded-xl p-3 shadow-sm">
              <Label className="mb-2 block text-xs font-bold flex items-center gap-1.5">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                اختاري الحجم
              </Label>
              <RadioGroup value={selectedVariant} onValueChange={setSelectedVariant}>
                <div className="space-y-1.5">
                  {product.product_variants.map((variant: any) => {
                    const variantDiscount = calculateDiscount(product.id, variant.price, discounts);
                    const isOutOfStock = variant.stock_quantity === 0;
                    const isSelected = selectedVariant === variant.id;
                    
                    return (
                      <div 
                        key={variant.id} 
                        className={`flex items-center justify-between rounded-lg border p-2.5 transition-all cursor-pointer ${
                          isOutOfStock 
                            ? 'opacity-50 bg-muted cursor-not-allowed border-muted' 
                            : isSelected 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => !isOutOfStock && setSelectedVariant(variant.id)}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={variant.id} 
                            id={variant.id} 
                            disabled={isOutOfStock}
                          />
                          <div className="flex items-center gap-1.5">
                            <Label 
                              htmlFor={variant.id} 
                              className={`text-sm font-medium cursor-pointer ${isOutOfStock ? 'cursor-not-allowed' : ''}`}
                            >
                              {variant.size_ar}
                            </Label>
                            {isOutOfStock && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                غير متوفر
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {variantDiscount && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              -{Math.round(variantDiscount.percentage)}%
                            </Badge>
                          )}
                          <div className="text-right">
                            {variantDiscount ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-primary">
                                  {Math.round(variantDiscount.discountedPrice)}
                                </span>
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {Math.round(variant.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-primary">{Math.round(variant.price)} د.ع</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* 3. الشركة */}
            {product.company_name_ar && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="font-semibold">الشركة:</span>
                  <span className="text-primary font-medium">{product.company_name_ar}</span>
                </p>
              </div>
            )}

            {/* 5. الوصف */}
            {product.description_ar && (
              <div className="bg-muted/30 p-4 rounded-xl">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  وصف المنتج
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {product.description_ar}
                </p>
              </div>
            )}

            {/* 6. مناسب لنوع البشرة */}
            {product.skin_type && product.skin_type.length > 0 && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl border border-primary/20">
                <h3 className="mb-2 text-sm font-semibold flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  مناسب لنوع البشرة
                </h3>
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
                      <span 
                        key={type} 
                        className="rounded-full bg-background border border-primary/30 px-3 py-1 text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        {skinTypeLabels[type] || type}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. التقييمات والمراجعات */}
            <div className="pt-4">
              <ProductReviews productId={id!} />
            </div>
          </div>
        </div>
      </div>
      
      {/* أزرار الإجراءات - عائمة في أسفل الشاشة */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-3 shadow-lg">
        <div className="container">
          <div className="flex gap-2">
            <Button
              size="lg"
              disabled={!selectedVariant || addToCartMutation.isPending}
              onClick={handleAddToCart}
              className="flex-1 h-11 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <ShoppingCart className="ml-2 h-5 w-5" />
              {addToCartMutation.isPending ? "جاري الإضافة..." : "أضيفي إلى السلة"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleDropHint}
              className="h-11 px-4 rounded-xl shadow-lg border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all hover:scale-[1.02]"
              title="لمّح لأحد يهديك"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {addedProduct && (
        <MiniCart
          open={showMiniCart}
          onOpenChange={setShowMiniCart}
          product={addedProduct}
          session={session}
        />
      )}
    </div>
  );
};
export default ProductDetails;
