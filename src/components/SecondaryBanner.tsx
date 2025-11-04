import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";

export const SecondaryBanner = () => {
  const navigate = useNavigate();

  const { data: banners, isLoading } = useQuery({
    queryKey: ["secondary-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secondary_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !banners || banners.length === 0) {
    return null;
  }

  const handleBannerClick = (url?: string | null) => {
    if (!url) return;
    
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative w-full h-[200px] rounded-2xl overflow-hidden group cursor-pointer">
                <img
                  src={banner.image_url}
                  alt={banner.title_ar || ""}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-8">
                    <div className="max-w-xl text-right">
                      {banner.title_ar && (
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                          {banner.title_ar}
                        </h2>
                      )}
                      {banner.description_ar && (
                        <p className="text-base md:text-lg text-white/95 mb-4 drop-shadow-md">
                          {banner.description_ar}
                        </p>
                      )}
                      {banner.link_url && (
                        <Button
                          onClick={() => handleBannerClick(banner.link_url)}
                          className="bg-white/95 text-primary hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg"
                        >
                          {banner.button_text_ar || "تسوق الآن"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
