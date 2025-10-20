import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
          categories (name_ar),
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
  const addToCartMutation = useMutation({
    mutationFn: async (variantId: string) => {
      if (!session?.user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }
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
      toast.success("تمت الإضافة إلى السلة");
    },
    onError: (error: Error) => {
      if (error.message === "يجب تسجيل الدخول أولاً") {
        toast.error(error.message);
        navigate("/auth");
      } else {
        toast.error("حدث خطأ أثناء الإضافة إلى السلة");
      }
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
        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Images Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
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
                    className={`aspect-square overflow-hidden rounded-md border-2 transition-all ${selectedImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50"}`}
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
              {product.categories && (
                <p className="mb-2 text-base font-medium text-primary/80">{product.categories.name_ar}</p>
              )}
              <h1 className="mb-2 text-3xl font-bold">{product.name_ar}</h1>
              {product.company_name_ar && (
                <p className="mt-2 text-lg font-semibold text-muted-foreground">الشركة: {product.company_name_ar}</p>
              )}
            </div>

            {product.description_ar && <p className="text-lg leading-relaxed">{product.description_ar}</p>}

            {product.skin_type && product.skin_type.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">مناسب لنوع البشرة:</h3>
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
                      <span key={type} className="rounded-full bg-secondary px-3 py-1 text-sm">
                        {skinTypeLabels[type] || type}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div>
              <Label className="mb-3 block text-lg font-semibold">اختاري الحجم</Label>
              <RadioGroup value={selectedVariant} onValueChange={setSelectedVariant}>
                <div className="space-y-3">
                  {product.product_variants.map((variant: any) => (
                    <div key={variant.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value={variant.id} id={variant.id} />
                        <Label htmlFor={variant.id} className="cursor-pointer">
                          {variant.size_ar}
                        </Label>
                      </div>
                      <span className="font-bold text-primary">{Math.round(variant.price)} د.ع</span>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Add to Cart */}
            <Button
              size="lg"
              disabled={!selectedVariant || addToCartMutation.isPending}
              onClick={() => selectedVariant && addToCartMutation.mutate(selectedVariant)}
              className="w-full mt-12"
            >
              <ShoppingCart className="ml-2 h-5 w-5 " />
              {addToCartMutation.isPending ? "جاري الإضافة..." : "أضيفي إلى السلة"}
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};
export default ProductDetails;
