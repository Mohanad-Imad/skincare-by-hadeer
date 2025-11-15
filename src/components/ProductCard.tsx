import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  const { data: guaranteeSettings } = useQuery({
    queryKey: ["guarantee-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("guarantee_settings")
        .select("logo_url")
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg h-full flex flex-col"
      onClick={() => navigate(`/products/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-background p-1 relative flex-shrink-0">
        <div className="absolute top-0 left-0 z-10 overflow-hidden w-20 h-20">
          <div className="absolute transform -rotate-45 bg-emerald-600 text-white text-center font-bold py-1 left-[-28px] top-[14px] w-28 shadow-[0_2px_8px_rgba(0,0,0,0.3)] border-y border-emerald-700/30">
            <div className="flex items-center justify-center gap-1">
              {guaranteeSettings?.logo_url ? (
                <img 
                  src={guaranteeSettings.logo_url} 
                  alt="guarantee" 
                  className="h-3 w-3 object-contain drop-shadow-sm"
                />
              ) : (
                <ShieldCheck className="h-2.5 w-2.5 drop-shadow-sm" />
              )}
              <span className="text-[9px] font-bold drop-shadow-sm">أصلي ومضمون</span>
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
              className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            بدون صورة
          </div>
        )}
      </div>
      <CardContent className="p-1.5 flex-1 flex flex-col justify-between">
        <h3 className="mb-0.5 text-[11px] font-semibold line-clamp-2 min-h-[1.75rem] leading-tight">{nameAr}</h3>
        {minPrice && (
          <div className="mb-1 space-y-0.5">
            {discount ? (
              <>
                <div className="flex items-center gap-0.5">
                  <Badge variant="destructive" className="flex items-center gap-0.5 text-[8px] py-0 px-1 h-3.5">
                    <Tag className="h-2 w-2" />
                    {Math.round(discount.percentage)}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-xs font-bold text-primary">
                    {Math.round(discount.discountedPrice)} د.ع
                  </p>
                  <p className="text-[9px] text-muted-foreground line-through">
                    {Math.round(minPrice)} د.ع
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs font-bold text-primary">
                {Math.round(minPrice)} د.ع
              </p>
            )}
          </div>
        )}
        <Button className="w-full h-6 text-[10px] py-0" variant="outline">
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
};