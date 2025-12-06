import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Review {
  id: string;
  image_url: string;
  comment: string;
  rating: number;
  customer_name: string;
  created_at: string;
}

interface ReviewImageGalleryProps {
  reviews: Review[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const maskName = (name: string): string => {
  if (!name || name.length <= 1) return name;
  const firstChar = name.charAt(0);
  const masked = "*".repeat(Math.min(name.length - 1, 3));
  return `${firstChar}${masked}`;
};

export const ReviewImageGallery = ({
  reviews,
  initialIndex = 0,
  open,
  onOpenChange,
}: ReviewImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentReview = reviews[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  // Reset index when dialog opens with new initial index
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setCurrentIndex(initialIndex);
    }
    onOpenChange(newOpen);
  };

  if (!currentReview) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Image */}
          <div className="relative aspect-square md:aspect-video bg-black flex items-center justify-center">
            <img
              src={currentReview.image_url}
              alt="صورة التقييم"
              className="max-w-full max-h-[60vh] object-contain"
            />

            {/* Navigation arrows */}
            {reviews.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={goToPrevious}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={goToNext}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image counter */}
            {reviews.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {currentIndex + 1} / {reviews.length}
              </div>
            )}
          </div>

          {/* Review details */}
          <div className="p-4 bg-background" dir="rtl">
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= currentReview.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>

            {/* Customer info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>{maskName(currentReview.customer_name)}</span>
              <span>|</span>
              <span>
                {format(new Date(currentReview.created_at), "d MMMM yyyy", {
                  locale: ar,
                })}
              </span>
            </div>

            {/* Comment */}
            <p className="text-sm text-foreground leading-relaxed">
              {currentReview.comment}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
