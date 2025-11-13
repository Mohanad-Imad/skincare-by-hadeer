import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showForm, setShowForm] = useState(false);

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
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!session?.user?.id,
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

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string; customer_name: string }) => {
      if (!session?.user) {
        throw new Error("يجب تسجيل الدخول لإضافة تقييم");
      }

      const { error } = await (supabase as any).from("product_reviews").insert({
        product_id: productId,
        user_id: session.user.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        customer_name: reviewData.customer_name,
        is_approved: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال تقييمك بنجاح! سيتم مراجعته قريباً");
      setRating(5);
      setComment("");
      setCustomerName("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء إرسال التقييم");
    },
  });

  // Auto-fill customer name from profile
  useEffect(() => {
    if (profile?.full_name && !customerName) {
      setCustomerName(profile.full_name);
    }
  }, [profile, customerName]);

  const handleSubmitReview = () => {
    if (!customerName.trim()) {
      toast.error("الرجاء إدخال اسمك");
      return;
    }

    if (!comment.trim()) {
      toast.error("الرجاء إدخال تعليقك");
      return;
    }

    submitReviewMutation.mutate({
      rating,
      comment: comment.trim(),
      customer_name: customerName.trim(),
    });
  };

  const averageRating = reviews?.length
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: reviews?.filter((r: any) => r.rating === star).length || 0,
  }));

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            التقييمات والمراجعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center gap-2 p-6 border rounded-lg">
              <div className="text-5xl font-bold">{averageRating}</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(Number(averageRating))
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                بناءً على {reviews?.length || 0} تقييم
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm w-16">{stars} نجوم</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: reviews?.length ? `${(count / reviews.length) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Review Button */}
          <div className="mt-6">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
                أضف تقييمك
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg">
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
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending}
                    className="flex-1"
                  >
                    إرسال التقييم
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForm(false);
                      setRating(5);
                      setComment("");
                      setCustomerName("");
                    }}
                    variant="outline"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">جاري التحميل...</p>
            </CardContent>
          </Card>
        ) : !reviews || reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review: any) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{review.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}
                        </p>
                      </div>
                      <div className="flex gap-1">
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
                    </div>
                    <p className="text-foreground leading-relaxed">{review.comment}</p>
                    {review.is_verified_purchase && (
                      <Badge variant="outline" className="text-xs">
                        عملية شراء موثقة
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
