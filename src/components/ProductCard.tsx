import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  nameAr: string;
  imageUrl?: string;
  minPrice?: number;
  discount?: {
    percentage: number;
    discountedPrice: number;
  };
}

export const ProductCard = ({ id, nameAr, imageUrl, minPrice, discount }: ProductCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={() => navigate(`/products/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-background p-2 relative">
        <div className="absolute top-0 left-0 z-10 overflow-hidden w-32 h-32">
          <div className="absolute transform -rotate-45 bg-emerald-500/90 text-white text-center font-bold py-1.5 left-[-38px] top-[26px] w-40 shadow-lg">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs">أصلي ومضمون</span>
            </div>
          </div>
        </div>
        {imageUrl ? (
          <div className="h-full w-full bg-background rounded-md overflow-hidden flex items-center justify-center relative">
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
              src={imageUrl}
              alt={nameAr}
              className={`h-full w-full object-contain transition-transform group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            بدون صورة
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="mb-1.5 text-sm font-semibold line-clamp-2">{nameAr}</h3>
        {minPrice && (
          <div className="mb-2 space-y-1">
            {discount ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    خصم {Math.round(discount.percentage)}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-bold text-primary">
                    {Math.round(discount.discountedPrice)} د.ع
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    {Math.round(minPrice)} د.ع
                  </p>
                </div>
              </>
            ) : (
              <p className="text-base font-bold text-primary">
                {Math.round(minPrice)} د.ع
              </p>
            )}
          </div>
        )}
        <Button className="w-full h-8 text-sm" variant="outline">
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
};