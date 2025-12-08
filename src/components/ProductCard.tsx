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

// **تم الحفاظ على الاسم الأصلي ProductCard**
export const ProductCard = ({ id, nameAr, imageUrl, minPrice, discount }: ProductCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: guaranteeSettings } = useQuery({
    queryKey: ["guarantee-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("guarantee_settings").select("logo_url").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  // دالة تحويل الرقم إلى تنسيق العملة مع فاصل الآلاف
  const formatPrice = (price: number) => {
    return Math.round(price)
      .toLocaleString("ar-IQ", { style: "currency", currency: "IQD", minimumFractionDigits: 0 })
      .replace("د.ع", "")
      .trim();
  };

  return (
    <Card
      // تصميم محدث مع تأثيرات التفاعل
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 h-full flex flex-col rounded-lg border-2 border-transparent hover:border-primary/50"
      onClick={() => navigate(`/products/${id}`)}
    >
      {/* 1. منطقة الصورة */}
      <div className="aspect-square overflow-hidden relative flex-shrink-0 bg-gray-100 dark:bg-gray-800">
        {/* شارة الخصم - موقع علوي أيمن */}
        {discount && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2 z-20 text-xs font-bold px-2 py-1 flex items-center gap-1 rounded-full shadow-md animate-pulse"
          >
            <Tag className="h-3 w-3" />
            توفير {Math.round(discount.percentage)}%
          </Badge>
        )}

        {imageUrl ? (
          <div className="h-full w-full bg-background rounded-md overflow-hidden flex items-center justify-center relative">
            {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
            <img
              src={imageUrl}
              alt={nameAr}
              // تأثير التكبير عند التفاعل (Hover)
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">بدون صورة</div>
        )}
      </div>

      {/* 2. منطقة المحتوى (CardContent) */}
      <CardContent className="p-3 flex-1 flex flex-col justify-between">
        {/* اسم المنتج */}
        <h3 className="mb-2 text-sm font-bold line-clamp-2 min-h-[2.2rem] leading-snug text-gray-800 dark:text-gray-200">
          {nameAr}
        </h3>

        {/* منطقة الأسعار */}
        {minPrice && (
          <div className="mb-2 space-y-1">
            {discount ? (
              <>
                <div className="flex items-baseline gap-2">
                  {/* السعر بعد الخصم (أكبر وأكثر جرأة) */}
                  <p className="text-lg font-extrabold text-primary">{formatPrice(discount.discountedPrice)} د.ع</p>
                  {/* السعر الأصلي (مشطوب وأصغر) */}
                  <p className="text-sm text-muted-foreground line-through">{formatPrice(minPrice)} د.ع</p>
                </div>
              </>
            ) : (
              <p className="text-lg font-extrabold text-primary">{formatPrice(minPrice)} د.ع</p>
            )}
          </div>
        )}

        {/* شعار أو علامة الضمان (في الأسفل) */}
        <div className="flex items-center justify-end text-xs text-emerald-600 dark:text-emerald-400 mt-1">
          {guaranteeSettings?.logo_url ? (
            <img src={guaranteeSettings.logo_url} alt="ضمان" className="h-4 w-4 object-contain ml-1 opacity-75" />
          ) : (
            <ShieldCheck className="h-4 w-4 ml-1 opacity-75" />
          )}
          <span>ضمان أصلي</span>
        </div>

        {/* زر الإجراء */}
        <Button
          className="w-full h-8 text-sm font-semibold mt-3 transition-colors duration-300 group-hover:bg-primary/90"
          variant="default" // استخدام لون أساسي لجذب الانتباه
        >
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
};
