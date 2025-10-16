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
      <div className="aspect-square overflow-hidden bg-secondary">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nameAr}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            بدون صورة
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 font-semibold">{nameAr}</h3>
        {minPrice && (
          <p className="text-lg font-bold text-primary">
            {minPrice.toFixed(2)} د.ع
          </p>
        )}
        <Button className="mt-3 w-full" variant="outline">
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
};