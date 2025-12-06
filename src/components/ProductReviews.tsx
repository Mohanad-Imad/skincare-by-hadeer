import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ChevronLeft, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { ReviewImageGallery } from "@/components/ReviewImageGallery";

interface ProductReviewsProps {
  productId: string;
}

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
    <div>
      {/* Compact Combined Reviews Box */}
      <Link 
        to={`/products/${productId}/reviews`}
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Rating Section */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold">{averageRating}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(Number(averageRating))
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviews?.length || 0})
            </span>
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-border" />

          {/* Photos Section */}
          {reviewsWithImages.length > 0 ? (
            <div 
              className="flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGalleryInitialIndex(0);
                setGalleryOpen(true);
              }}
            >
              {reviewsWithImages.slice(0, 3).map((review: any) => (
                <div
                  key={review.id}
                  className="w-8 h-8 rounded overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={review.image_url}
                    alt="صورة التقييم"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {reviewsWithImages.length > 3 && (
                <span className="text-xs text-muted-foreground mr-1">
                  +{reviewsWithImages.length - 3}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span className="text-xs">0</span>
            </div>
          )}
        </div>

        {/* View All Link */}
        <div className="flex items-center gap-1 text-sm text-primary">
          <span>عرض الكل</span>
          <ChevronLeft className="h-4 w-4" />
        </div>
      </Link>

      {/* Image Gallery Dialog */}
      <ReviewImageGallery
        reviews={reviewsWithImages}
        initialIndex={galleryInitialIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </div>
  );
};
