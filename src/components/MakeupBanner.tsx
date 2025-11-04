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
    <div className="container mx-auto px-4">
      <section
        className="relative w-full py-24 px-8 cursor-pointer transition-transform hover:scale-[1.02] rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center"
        onClick={() => navigate("/makeup")}
      >
        {/* Background Image */}
        {banner.image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${banner.image_url})`,
            }}
          />
        )}
        
        {/* Overlay with background color */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundColor: banner.background_color || "#FFC0CB",
          }}
        />

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
              className="text-xl md:text-2xl mb-8"
              style={{
                color: banner.text_color || "#000000",
              }}
            >
              {banner.description_ar}
            </p>
          )}
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            style={{
              backgroundColor: banner.text_color || "#000000",
              color: banner.background_color || "#FFC0CB",
            }}
          >
            {banner.button_text_ar}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default MakeupBanner;
