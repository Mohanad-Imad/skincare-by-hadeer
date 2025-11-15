import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const GuaranteeBanner = () => {
  const navigate = useNavigate();

  const { data: guaranteeSettings } = useQuery({
    queryKey: ["guarantee-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guarantee_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!guaranteeSettings) return null;

  return (
    <Card 
      className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50"
      onClick={() => navigate("/guarantee")}
    >
      <CardContent className="p-8 md:p-10 xl:p-12 2xl:p-14">
        <div className="flex items-center justify-around gap-6 md:gap-8">
          {/* Logo - على اليمين - صورة عمودية كبيرة */}
          <div className="flex-shrink-0 w-32 h-48 md:w-40 md:h-56 rounded-lg bg-emerald-500/10 flex items-center justify-center overflow-hidden">
            {guaranteeSettings.logo_url ? (
              <img src={guaranteeSettings.logo_url} alt="Guarantee" className="w-full h-full object-contain" />
            ) : (
              <ShieldCheck className="w-16 h-16 md:w-20 md:h-20 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          
          {/* Content - في المنتصف */}
          <div className="flex-shrink-0 text-center">
            <h3 className="text-sm md:text-lg font-bold mb-0.5 text-foreground whitespace-nowrap">
              {guaranteeSettings.banner_title_ar || "منتجات أصلية ومضمونة"}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
              {guaranteeSettings.banner_description_ar || "تعرفي أكثر على ضمان هدير"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
