import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ChevronLeft, ZoomIn } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReviewImageGallery } from "@/components/ReviewImageGallery";

interface ProductReviewsProps {
  productId: string;
}

// Function to mask customer name for privacy (e.g., "مهند" becomes "م***")
const maskName = (name: string): string => {
  if (!name || name.length <= 1) return name;
  const firstChar = name.charAt(0);
  const masked = "*".repeat(Math.min(name.length - 1, 3));
  return `${firstChar}${masked}`;
};

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

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

  const averageRating = reviews?.length
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const reviewsWithImages = reviews?.filter((r: any) => r.image_url) || [];

  if (isLoading) {
    return (
      <div className="py-4 text-center text-muted-foreground text-sm">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Summary Row - Links to full reviews page */}
      <Link 
        to={`/products/${productId}/reviews`}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold">{averageRating}</span>
            <div className="flex">
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
          </div>
          <span className="text-sm text-muted-foreground">
            {reviews?.length || 0} تقييم
          </span>
        </div>
        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
      </Link>

      {/* Reviews with Images Gallery */}
      {reviewsWithImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">تقييمات مع صور</span>
            {reviewsWithImages.length > 5 && (
              <Link 
                to={`/products/${productId}/reviews`}
                className="text-sm text-primary hover:underline"
              >
                الكل &gt;
              </Link>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {reviewsWithImages.slice(0, 5).map((review: any, index: number) => (
              <div
                key={review.id}
                className="relative w-16 h-16 flex-shrink-0 cursor-pointer group rounded-lg overflow-hidden border"
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
                  <ZoomIn className="h-4 w-4 text-white" />
                </div>
              </div>
            ))}
          </div>
          <ReviewImageGallery
            reviews={reviewsWithImages.slice(0, 5)}
            initialIndex={galleryInitialIndex}
            open={galleryOpen}
            onOpenChange={setGalleryOpen}
          />
        </div>
      )}

      {/* Recent Reviews Preview (compact) */}
      {reviews && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.slice(0, 2).map((review: any) => (
            <div key={review.id} className="py-3 border-b last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{maskName(review.customer_name)}</span>
                <span>|</span>
                <span>{format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}</span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">{review.comment}</p>
              {review.image_url && (
                <div className="mt-2 w-12 h-12 rounded overflow-hidden border">
                  <img
                    src={review.image_url}
                    alt="صورة التقييم"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
          
          {reviews.length > 2 && (
            <Link 
              to={`/products/${productId}/reviews`}
              className="block text-center text-sm text-primary hover:underline py-2"
            >
              عرض جميع التقييمات ({reviews.length})
            </Link>
          )}
        </div>
      )}

      {(!reviews || reviews.length === 0) && (
        <p className="text-center text-sm text-muted-foreground py-4">
          لا توجد تقييمات بعد
        </p>
      )}
    </div>
  );
};