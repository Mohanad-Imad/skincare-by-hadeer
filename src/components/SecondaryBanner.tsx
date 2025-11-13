import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useState, useEffect, useRef } from "react";

export const SecondaryBanner = () => {
  const navigate = useNavigate();
  const plugin = useRef(Autoplay({ delay: 2900, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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
        setApi={setApi}
        plugins={[plugin.current]}
        opts={{
          align: "start",
          loop: true,
          direction: "rtl",
        }}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner: any) => {
            const desktopImage = banner.image_url_desktop || banner.image_url;
            const tabletImage = banner.image_url_tablet || banner.image_url_desktop || banner.image_url;
            const mobileImage = banner.image_url_mobile || banner.image_url_tablet || banner.image_url_desktop || banner.image_url;
            
            return (
              <CarouselItem key={banner.id}>
                <div 
                  className="relative w-full h-[100px] md:h-[120px] lg:h-[150px] xl:h-[180px] 2xl:h-[220px] overflow-hidden group cursor-pointer"
                  onClick={() => handleBannerClick(banner.link_url)}
                >
                  {/* Mobile image */}
                  <img
                    src={mobileImage}
                    alt={banner.title_ar || ""}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 md:hidden"
                  />
                  {/* Tablet image */}
                  <img
                    src={tabletImage}
                    alt={banner.title_ar || ""}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 hidden md:block lg:hidden"
                  />
                  {/* Desktop image */}
                  <img
                    src={desktopImage}
                    alt={banner.title_ar || ""}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 hidden lg:block"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent group-hover:from-black/50 group-hover:via-black/20 transition-all duration-300" />
                  
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-4">
                      <div className="max-w-xl text-right">
                        {banner.title_ar && (
                          <h2 className="text-sm md:text-lg lg:text-xl font-bold text-white mb-1 drop-shadow-lg">
                            {banner.title_ar}
                          </h2>
                        )}
                        {banner.description_ar && (
                          <p className="text-xs md:text-sm lg:text-base text-white/95 drop-shadow-md">
                            {banner.description_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current
                  ? "w-8 bg-primary"
                  : "w-2 bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`الانتقال إلى البنر ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
