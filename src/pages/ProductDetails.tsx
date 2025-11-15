import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, ArrowRight, Tag } from "lucide-react";
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
      <div className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
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
          <div className="space-y-6">
            <div>
              {/* Breadcrumbs */}
              <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
                <span className="rounded-lg bg-primary/10 px-3 py-1.5 font-medium text-primary/90 hover:bg-primary/20 transition-colors">
                  المنتجات
                </span>
                <svg 
                  className="h-4 w-4 text-muted-foreground rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="rounded-lg bg-primary/15 px-3 py-1.5 font-medium text-primary hover:bg-primary/25 transition-colors">
                  {product.categories?.parent?.name_ar || "العناية بالبشرة"}
                </span>
                {(product.categories?.parent || (!product.categories?.parent_category_id && product.categories)) && (
                  <>
                    <svg 
                      className="h-4 w-4 text-muted-foreground rotate-180" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="rounded-lg bg-primary/20 px-3 py-1.5 font-semibold text-primary hover:bg-primary/30 transition-colors">
                      {product.categories?.name_ar || "تصنيف فرعي"}
                    </span>
                  </>
                )}
              </div>
              
              <h1 className="mb-3 text-3xl md:text-4xl font-bold leading-tight">{product.name_ar}</h1>
              {product.company_name_ar && (
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <span className="font-semibold">الشركة:</span>
                  <span className="text-primary">{product.company_name_ar}</span>
                </p>
              )}
            </div>

            {product.description_ar && (
              <p className="text-base md:text-lg leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl">
                {product.description_ar}
              </p>
            )}

            {product.skin_type && product.skin_type.length > 0 && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-xl border border-primary/20">
                <h3 className="mb-3 text-base font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
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
                        className="rounded-full bg-background border border-primary/30 px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        {skinTypeLabels[type] || type}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <Label className="mb-4 block text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                اختاري الحجم والسعر
              </Label>
              <RadioGroup value={selectedVariant} onValueChange={setSelectedVariant}>
                <div className="space-y-3">
                  {product.product_variants.map((variant: any) => {
                    const variantDiscount = calculateDiscount(product.id, variant.price, discounts);
                    const isOutOfStock = variant.stock_quantity === 0;
                    const isSelected = selectedVariant === variant.id;
                    
                    return (
                      <div 
                        key={variant.id} 
                        className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                          isOutOfStock 
                            ? 'opacity-50 bg-muted cursor-not-allowed border-muted' 
                            : isSelected 
                              ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                              : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => !isOutOfStock && setSelectedVariant(variant.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem 
                            value={variant.id} 
                            id={variant.id} 
                            disabled={isOutOfStock}
                          />
                          <Label 
                            htmlFor={variant.id} 
                            className={`text-base font-medium ${isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {variant.size_ar}
                          </Label>
                          {isOutOfStock && (
                            <Badge variant="destructive" className="text-xs">
                              نفذت الكمية
                            </Badge>
                          )}
                          {!isOutOfStock && variant.stock_quantity <= 5 && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                              متبقي {variant.stock_quantity}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {variantDiscount ? (
                            <>
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="flex items-center gap-1 text-xs animate-pulse">
                                  <Tag className="h-3 w-3" />
                                  خصم {Math.round(variantDiscount.percentage)}%
                                </Badge>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-primary">
                                  {Math.round(variantDiscount.discountedPrice)} د.ع
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  {Math.round(variant.price)} د.ع
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-primary">{Math.round(variant.price)} د.ع</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* Add to Cart Button */}
            <div className="sticky bottom-4 z-10">
              <Button
                size="lg"
                disabled={!selectedVariant || addToCartMutation.isPending}
                onClick={handleAddToCart}
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <ShoppingCart className="ml-2 h-5 w-5" />
                {addToCartMutation.isPending ? "جاري الإضافة..." : "أضيفي إلى السلة"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="container mx-auto px-4 py-12">
        <ProductReviews productId={id!} />
      </div>
      
      {addedProduct && (
        <MiniCart
          open={showMiniCart}
          onOpenChange={setShowMiniCart}
          product={addedProduct}
          session={session}
        />
      )}

      <Footer />
    </div>
  );
};
export default ProductDetails;
