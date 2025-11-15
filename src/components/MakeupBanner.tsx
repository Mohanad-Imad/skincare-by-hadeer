import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const MakeupBanner = () => {
  const navigate = useNavigate();

  const { data: banner, isLoading } = useQuery({
    queryKey: ["makeup-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("makeup_banner")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !banner) return null;

  return (
    <div>
      <section
        className="relative w-full cursor-pointer transition-transform hover:scale-[1.02] rounded-2xl overflow-hidden h-[175px] md:h-[300px] lg:h-[400px] xl:h-[500px] 2xl:h-[600px] flex items-center justify-center"
        onClick={() => navigate("/makeup")}
      >
        {/* Background Image */}
        {banner.image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{
              backgroundImage: `url(${banner.image_url})`,
            }}
            role="img"
            aria-label={banner.title_ar || 'Makeup banner'}
          />
        )}

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl">
          <h2 
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{
              color: banner.text_color || "#000000",
            }}
          >
            {banner.title_ar}
          </h2>
          {banner.description_ar && (
            <p 
              className="text-xl md:text-2xl"
              style={{
                color: banner.text_color || "#000000",
              }}
            >
              {banner.description_ar}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MakeupBanner;
