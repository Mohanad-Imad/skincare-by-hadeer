import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState, useEffect } from "react";

export const HeroBanner = () => {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
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

  if (isLoading) {
    return (
      <div className="relative h-[300px] md:h-[400px] bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse" />
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="container py-6">
      <Carousel
        plugins={[plugin.current]}
        className="w-full overflow-hidden rounded-2xl"
        opts={{
          align: "start",
          direction: "rtl",
        }}
        setApi={setApi}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[175px] md:h-[225px] overflow-hidden rounded-2xl">
                {/* صورة الخلفية */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${banner.image_url})`,
                  }}
                >
                  {/* طبقة شفافة للتباين */}
                  <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/50 to-black/30" />
                </div>

                {/* المحتوى */}
                <div className="container relative z-10 flex h-full flex-col justify-end">
                  {(banner.title_ar || banner.description_ar) && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="max-w-2xl space-y-2 text-center">
                        {banner.title_ar && (
                          <h1 className="text-xl font-black leading-tight md:text-2xl lg:text-3xl text-white drop-shadow-2xl animate-fade-in tracking-tight">
                            {banner.title_ar}
                          </h1>
                        )}
                        {banner.description_ar && (
                          <p className="text-sm md:text-base text-white font-medium drop-shadow-lg animate-fade-in [animation-delay:200ms] leading-relaxed">
                            {banner.description_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {banner.link_url && (
                    <div className="flex justify-center pb-4 animate-fade-in [animation-delay:400ms]">
                      <Button
                        asChild
                        size="default"
                        className="bg-white hover:bg-white/90 text-primary font-bold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 rounded-full shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-110"
                      >
                        <Link to={banner.link_url}>
                          {banner.button_text_ar}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
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
                  ? "w-8 bg-gray-700"
                  : "w-2 bg-gray-400 hover:bg-gray-600"
              }`}
              aria-label={`الانتقال إلى الصورة ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
