import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  nameAr: string;
  imageUrl?: string;
  minPrice?: number;
}

export const ProductCard = ({ id, nameAr, imageUrl, minPrice }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={() => navigate(`/products/${id}`)}
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nameAr}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            بدون صورة
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="mb-1.5 text-sm font-semibold line-clamp-2">{nameAr}</h3>
        {minPrice && (
          <p className="text-base font-bold text-primary mb-2">
            {Math.round(minPrice)} د.ع
          </p>
        )}
        <Button className="w-full h-8 text-sm" variant="outline">
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
};