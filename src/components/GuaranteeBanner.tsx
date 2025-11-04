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
        <div className="flex items-center gap-4 md:gap-6">
          {/* Logo */}
          <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-2xl font-bold mb-1 text-foreground">
              منتجات أصلية ومضمونة
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              تعرفي أكثر على ضمان هدير
            </p>
          </div>
          
          {/* Arrow indicator (hidden on mobile) */}
          <div className="hidden md:flex flex-shrink-0 text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
