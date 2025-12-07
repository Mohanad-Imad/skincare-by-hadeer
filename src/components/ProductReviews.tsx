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
        className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Rating Section */}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold">{averageRating}</span>
            <span className="text-xs text-muted-foreground">
              ({reviews?.length || 0})
            </span>
          </div>

          {/* Separator */}
          <div className="h-3.5 w-px bg-border" />

          {/* Photos Section - Always show camera icon with count */}
          <div 
            className="flex items-center gap-1 text-muted-foreground"
            onClick={(e) => {
              if (reviewsWithImages.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                setGalleryInitialIndex(0);
                setGalleryOpen(true);
              }
            }}
          >
            <Camera className={`h-4 w-4 ${reviewsWithImages.length > 0 ? "text-primary cursor-pointer" : ""}`} />
            <span className={`text-xs ${reviewsWithImages.length > 0 ? "text-primary" : ""}`}>
              {reviewsWithImages.length}
            </span>
          </div>
        </div>

        {/* View All Link */}
        <div className="flex items-center gap-0.5 text-xs text-primary">
          <span>عرض الكل</span>
          <ChevronLeft className="h-3.5 w-3.5" />
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
