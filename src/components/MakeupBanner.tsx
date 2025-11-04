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
    <section
      className="relative w-full py-16 px-4 cursor-pointer transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: banner.background_color || "#FFC0CB",
        color: banner.text_color || "#000000",
      }}
      onClick={() => navigate("/makeup")}
    >
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-right">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {banner.title_ar}
            </h2>
            {banner.description_ar && (
              <p className="text-xl mb-6">{banner.description_ar}</p>
            )}
            <Button
              size="lg"
              className="text-lg"
              style={{
                backgroundColor: banner.text_color || "#000000",
                color: banner.background_color || "#FFC0CB",
              }}
            >
              {banner.button_text_ar}
            </Button>
          </div>
          {banner.image_url && (
            <div className="flex justify-center">
              <img
                src={banner.image_url}
                alt={banner.title_ar || "Makeup"}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MakeupBanner;
