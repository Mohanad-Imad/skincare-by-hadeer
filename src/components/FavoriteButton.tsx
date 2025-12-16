import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const FavoriteButton = ({ productId, className, size = "md" }: FavoriteButtonProps) => {
  const { isFavorite, addToFavorites, removeFromFavorites, userId, isAuthLoading } = useFavorites();
  const navigate = useNavigate();
  const isFav = isFavorite(productId);

  const sizeClasses = {
    sm: "h-6 w-6 p-1",
    md: "h-8 w-8 p-1.5",
    lg: "h-10 w-10 p-2",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Wait for auth to load
    if (isAuthLoading) return;

    if (!userId) {
      navigate("/auth");
      return;
    }

    if (isFav) {
      removeFromFavorites.mutate(productId);
    } else {
      addToFavorites.mutate({ productId });
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isAuthLoading}
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm shadow-md transition-all duration-300 hover:scale-110 flex items-center justify-center",
        sizeClasses[size],
        isAuthLoading && "opacity-50",
        className
      )}
      aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
    >
      {isAuthLoading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin text-muted-foreground" />
      ) : (
        <Heart
          size={iconSizes[size]}
          className={cn(
            "transition-colors duration-300",
            isFav ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"
          )}
        />
      )}
    </button>
  );
};
