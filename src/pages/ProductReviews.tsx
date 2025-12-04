import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, ImagePlus, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Function to mask customer name for privacy
const maskName = (name: string): string => {
  if (!name || name.length <= 1) return name;
  const firstChar = name.charAt(0);
  const masked = "*".repeat(Math.min(name.length - 1, 3));
  return `${firstChar}${masked}`;
};

const ProductReviewsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate(); // ✅ استخدام دالة التوجيه
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

  // --- Data Fetching (Queries) ---

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
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("products").select("name_ar").eq("id", productId).single();
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

  // --- Effects and Mutations ---

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

  // --- Handlers ---

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

  /**
   * دالة محسّنة للعودة:
   * تحاول العودة خطوة واحدة (-1).
   * في حالة فشلها (إذا لم يكن هناك تاريخ سابق في المتصفح/التطبيق)، تعود إلى صفحة تفاصيل المنتج بدلاً من التوقف.
   */
  const handleGoBack = () => {
    try {
      // نستخدم navigate(-1) للعودة في تاريخ React Router
      navigate(-1);
    } catch (e) {
      // في حالة فشل العودة (غالباً بسبب عدم وجود سجل سابق)
      // نقوم بتوجيهه إلى صفحة المنتج الرئيسية (تفاديًا للتوقف)
      console.warn("Failed to navigate back, redirecting to product details.");
      navigate(`/product/${productId}`);
    }
  };

  // --- Calculations ---

  const averageRating = reviews?.length
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const reviewsWithImages = reviews?.filter((r: any) => r.image_url) || [];

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: reviews?.filter((r: any) => r.rating === star).length || 0,
  }));

  // --- Render ---

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        {/* ⭐ التعديل هنا: استخدام دالة handleGoBack المحمية ⭐ */}
        <button onClick={handleGoBack} className="p-1">
          <ArrowRight className="h-5 w-5" />
        </button>
        <h1 className="font-semibold">{product?.name_ar ? `تقييمات: ${product.name_ar}` : "تقييمات المنتج"}</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Rating Summary */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <span className="text-2xl font-bold">{averageRating}</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(Number(averageRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{reviews?.length || 0} تقييم</span>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-1 pb-4 border-b">
          {ratingDistribution.map(({ stars, count }) => (
            <div key={stars} className="flex items-center gap-2 text-sm">
              <span className="w-12">{stars} نجوم</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{
                    width: reviews?.length ? `${(count / reviews.length) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="w-6 text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>

        {/* Images Gallery */}
        {reviewsWithImages.length > 0 && (
          <div className="space-y-2 pb-4 border-b">
            <span className="text-sm font-medium">تقييمات مع صور</span>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {reviewsWithImages.map((review: any) => (
                <Dialog key={review.id}>
                  <DialogTrigger asChild>
                    <div className="relative w-20 h-20 flex-shrink-0 cursor-pointer group rounded-lg overflow-hidden border">
                      <img src={review.image_url} alt="صورة التقييم" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-0">
                    <img src={review.image_url} alt="صورة التقييم" className="w-full h-auto rounded-lg" />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}

        {/* Add Review Button/Form */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
            أضف تقييمك
          </Button>
        ) : (
          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <div className="space-y-2">
              <Label>اسمك</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسمك" />
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
                        star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted"
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
              <Button
                onClick={handleSubmitReview}
                disabled={submitReviewMutation.isPending || isUploading}
                className="flex-1"
              >
                {isUploading ? "جاري الرفع..." : "إرسال التقييم"}
              </Button>
              <Button onClick={resetForm} variant="outline">
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">جاري التحميل...</p>
          ) : !reviews || reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!</p>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="py-4 border-b last:border-b-0">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>{maskName(review.customer_name)}</span>
                  <span>|</span>
                  <span>{format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                {review.image_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="mt-2 w-16 h-16 cursor-pointer group relative rounded-lg overflow-hidden border">
                        <img src={review.image_url} alt="صورة التقييم" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0">
                      <img src={review.image_url} alt="صورة التقييم" className="w-full h-auto rounded-lg" />
                    </DialogContent>
                  </Dialog>
                )}
                {review.is_verified_purchase && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    عملية شراء موثقة
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsPage;
