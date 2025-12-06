import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight, ImagePlus, X, ZoomIn, ShoppingCart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ReviewImageGallery } from "@/components/ReviewImageGallery";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";

// Function to mask customer name for privacy
const maskName = (name: string): string => {
  if (!name || name.length <= 1) return name;
  const firstChar = name.charAt(0);
  const masked = "*".repeat(Math.min(name.length - 1, 3));
  return `${firstChar}${masked}`;
};

const ProductReviewsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  const { data: discounts } = useProductDiscounts();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: product } = useQuery({
    queryKey: ["product-details", productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select(`
          *,
          product_variants (*)
        `)
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.full_name && !customerName) {
      setCustomerName(profile.full_name);
    }
  }, [profile, customerName]);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string; customer_name: string; image_url?: string }) => {
      if (!session?.user) {
        throw new Error("يجب تسجيل الدخول لإضافة تقييم");
      }
      const { error } = await (supabase as any).from("product_reviews").insert({
        product_id: productId,
        user_id: session.user.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        customer_name: reviewData.customer_name,
        image_url: reviewData.image_url || null,
        is_approved: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال تقييمك بنجاح! سيتم مراجعته قريباً");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء إرسال التقييم");
    },
  });

  const resetForm = () => {
    setRating(5);
    setComment("");
    setCustomerName("");
    setSelectedImage(null);
    setImagePreview(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !session?.user) return null;
    const fileExt = selectedImage.name.split(".").pop();
    const fileName = `${session.user.id}/${productId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(`reviews/${fileName}`, selectedImage);
    if (uploadError) throw new Error("فشل رفع الصورة");
    const { data } = supabase.storage.from("product-images").getPublicUrl(`reviews/${fileName}`);
    return data.publicUrl;
  };

  const handleSubmitReview = async () => {
    if (!customerName.trim()) {
      toast.error("الرجاء إدخال اسمك");
      return;
    }
    if (!comment.trim()) {
      toast.error("الرجاء إدخال تعليقك");
      return;
    }
    setIsUploading(true);
    try {
      let imageUrl: string | null = null;
      if (selectedImage) imageUrl = await uploadImage();
      await submitReviewMutation.mutateAsync({
        rating,
        comment: comment.trim(),
        customer_name: customerName.trim(),
        image_url: imageUrl || undefined,
      });
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const averageRating = reviews?.length
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const reviewsWithImages = reviews?.filter((r: any) => r.image_url) || [];

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: reviews?.filter((r: any) => r.rating === star).length || 0,
    percentage: reviews?.length ? ((reviews.filter((r: any) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  // Get product price info
  const minVariant = product?.product_variants?.length > 0 
    ? product.product_variants.reduce((min: any, v: any) => v.price < min.price ? v : min, product.product_variants[0])
    : null;
  const originalPrice = minVariant?.price || 0;
  const discountResult = product ? calculateDiscount(product.id, originalPrice, discounts) : null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-full transition-colors">
          <ArrowRight className="h-5 w-5" />
        </button>
        <h1 className="font-semibold">تقييمات المنتج</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Product Info Card - Sticky for purchase decision */}
        {product && (
          <Card className="m-4 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex gap-3 p-3">
                <Link to={`/products/${productId}`} className="flex-shrink-0">
                  <img 
                    src={product.image_url || "/placeholder.svg"} 
                    alt={product.name_ar}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${productId}`}>
                    <h2 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                      {product.name_ar}
                    </h2>
                  </Link>
                  {product.company_name_ar && (
                    <p className="text-xs text-muted-foreground mt-0.5">{product.company_name_ar}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {discountResult ? (
                      <>
                        <span className="font-bold text-primary">{discountResult.discountedPrice.toFixed(0)} ر.س</span>
                        <span className="text-xs text-muted-foreground line-through">{originalPrice.toFixed(0)} ر.س</span>
                        <Badge variant="destructive" className="text-xs">-{discountResult.percentage}%</Badge>
                      </>
                    ) : (
                      <span className="font-bold">{originalPrice.toFixed(0)} ر.س</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t p-3">
                <Button asChild className="w-full gap-2">
                  <Link to={`/products/${productId}`}>
                    <ShoppingCart className="h-4 w-4" />
                    اذهب للمنتج
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Summary Section */}
        <div className="px-4 pb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-6">
                {/* Big Rating Number */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{averageRating}</div>
                  <div className="flex justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(Number(averageRating))
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{reviews?.length || 0} تقييم</p>
                </div>

                {/* Rating Distribution Bars */}
                <div className="flex-1 space-y-1.5">
                  {ratingDistribution.map(({ stars, count, percentage }) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs w-3 text-muted-foreground">{stars}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs w-6 text-muted-foreground text-left">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Reviews Gallery */}
        {reviewsWithImages.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">صور من العملاء ({reviewsWithImages.length})</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {reviewsWithImages.map((review: any, index: number) => (
                <div
                  key={review.id}
                  className="relative w-20 h-20 flex-shrink-0 cursor-pointer group rounded-lg overflow-hidden border"
                  onClick={() => {
                    setGalleryInitialIndex(index);
                    setGalleryOpen(true);
                  }}
                >
                  <img
                    src={review.image_url}
                    alt="صورة التقييم"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
            <ReviewImageGallery
              reviews={reviewsWithImages}
              initialIndex={galleryInitialIndex}
              open={galleryOpen}
              onOpenChange={setGalleryOpen}
            />
          </div>
        )}

        {/* Add Review Section */}
        <div className="px-4 pb-4">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
              أضف تقييمك
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>اسمك</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أدخل اسمك"
                  />
                </div>

                <div className="space-y-2">
                  <Label>تقييمك</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= (hoveredRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>تعليقك</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="شارك تجربتك مع هذا المنتج"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>صورة (اختياري)</Label>
                  {imagePreview ? (
                    <div className="relative w-24 h-24">
                      <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <ImagePlus className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">اضغط لاختيار صورة</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview} disabled={submitReviewMutation.isPending || isUploading} className="flex-1">
                    {isUploading ? "جاري الرفع..." : "إرسال التقييم"}
                  </Button>
                  <Button onClick={resetForm} variant="outline">إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews List */}
        <div className="px-4 pb-8">
          <h3 className="text-sm font-medium mb-3">جميع التقييمات ({reviews?.length || 0})</h3>
          
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : !reviews || reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 mx-auto text-muted mb-3" />
                <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
                <p className="text-sm text-muted-foreground mt-1">كن أول من يقيم هذا المنتج!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              موثق
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="font-medium">{maskName(review.customer_name)}</span>
                          <span>•</span>
                          <span>{format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                      </div>
                      {review.image_url && (
                        <div
                          className="w-16 h-16 flex-shrink-0 cursor-pointer group relative rounded-lg overflow-hidden border"
                          onClick={() => {
                            const idx = reviewsWithImages.findIndex((r: any) => r.id === review.id);
                            setGalleryInitialIndex(idx >= 0 ? idx : 0);
                            setGalleryOpen(true);
                          }}
                        >
                          <img src={review.image_url} alt="صورة التقييم" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsPage;
