import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

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
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[400px] md:h-[500px] overflow-hidden">
                {/* صورة الخلفية */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${banner.image_url})`,
                  }}
                >
                  {/* طبقة شفافة للتباين */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                </div>

                {/* المحتوى */}
                <div className="container relative z-10 flex h-full items-center">
                  <div className="max-w-2xl space-y-6 text-white">
                    <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl animate-fade-in">
                      {banner.title_ar}
                    </h1>
                    {banner.description_ar && (
                      <p className="text-lg md:text-xl text-white/90 animate-fade-in [animation-delay:200ms]">
                        {banner.description_ar}
                      </p>
                    )}
                    {banner.link_url && (
                      <div className="animate-fade-in [animation-delay:400ms]">
                        <Button
                          asChild
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
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
            <CarouselPrevious className="right-12 left-auto" />
            <CarouselNext className="left-12 right-auto" />
          </>
        )}
      </Carousel>
    </div>
  );
};
