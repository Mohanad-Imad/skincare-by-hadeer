import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export const GuaranteeBanner = () => {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50"
      onClick={() => navigate("/guarantee")}
    >
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-around gap-4 md:gap-6">
          {/* Logo - على اليمين */}
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          {/* Content - في المنتصف */}
          <div className="flex-shrink-0 text-center">
            <h3 className="text-sm md:text-lg font-bold mb-0.5 text-foreground whitespace-nowrap">
              منتجات أصلية ومضمونة
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
              تعرفي أكثر على ضمان هدير
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
