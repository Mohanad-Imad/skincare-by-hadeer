import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const HeroBanner = () => {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

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

  if (isLoading) {
    return (
      <div className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse" />
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          align: "start",
          direction: "rtl",
        }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent data-carousel>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[500px] md:h-[600px] overflow-hidden">
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
                <div className="container relative z-10 flex h-full items-center justify-end">
                  <div className="max-w-2xl space-y-8 text-right">
                    <h1 className="text-5xl font-black leading-tight md:text-6xl lg:text-7xl text-white drop-shadow-2xl animate-fade-in tracking-tight">
                      {banner.title_ar}
                    </h1>
                    {banner.description_ar && (
                      <p className="text-xl md:text-2xl text-white font-medium drop-shadow-lg animate-fade-in [animation-delay:200ms] leading-relaxed">
                        {banner.description_ar}
                      </p>
                    )}
                    {banner.link_url && (
                      <div className="animate-fade-in [animation-delay:400ms]">
                        <Button
                          asChild
                          size="lg"
                          className="bg-white hover:bg-white/90 text-primary font-bold text-lg px-10 py-6 rounded-full shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-110"
                        >
                          <Link to={banner.link_url}>
                            {banner.button_text_ar}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {banners.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border-white/40 hover:bg-white/30 text-white hover:text-white transition-all"
              onClick={() => {
                const carousel = document.querySelector('[data-carousel]') as any;
                carousel?.scrollPrev();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border-white/40 hover:bg-white/30 text-white hover:text-white transition-all"
              onClick={() => {
                const carousel = document.querySelector('[data-carousel]') as any;
                carousel?.scrollNext();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </>
        )}
      </Carousel>
    </div>
  );
};
