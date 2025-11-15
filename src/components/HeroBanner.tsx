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
  const plugin = useRef(Autoplay({ delay: 3200, stopOnInteraction: false }));
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
    <div className="w-full py-3 md:py-6">
      <Carousel
        plugins={[plugin.current]}
        className="w-full overflow-hidden rounded-2xl"
        opts={{
          align: "start",
          loop: true,
          direction: "rtl",
        }}
        setApi={setApi}
        onMouseEnter={() => plugin.current?.stop()}
        onMouseLeave={() => {
          if (plugin.current && api) {
            plugin.current.play();
          }
        }}
      >
        <CarouselContent>
          {banners.map((banner: any) => {
            const desktopImage = banner.image_url_desktop || banner.image_url;
            const tabletImage = banner.image_url_tablet || banner.image_url_desktop || banner.image_url;
            const mobileImage = banner.image_url_mobile || banner.image_url_tablet || banner.image_url_desktop || banner.image_url;
            
            return banner.link_url ? (
              <CarouselItem key={banner.id}>
                <Link to={banner.link_url} className="cursor-pointer block">
                  <div className="relative h-[175px] md:h-[300px] lg:h-[400px] xl:h-[500px] 2xl:h-[600px] overflow-hidden rounded-2xl group transition-transform duration-500 hover:scale-95">
                    {/* صورة الخلفية - responsive */}
                    <div className="absolute inset-0">
                      {/* Mobile image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center md:hidden"
                        style={{
                          backgroundImage: `url(${mobileImage})`,
                        }}
                      />
                      {/* Tablet image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center hidden md:block lg:hidden"
                        style={{
                          backgroundImage: `url(${tabletImage})`,
                        }}
                      />
                      {/* Desktop image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center hidden lg:block"
                        style={{
                          backgroundImage: `url(${desktopImage})`,
                        }}
                      />
                      {/* طبقة شفافة للتباين */}
                      <div className="absolute inset-0 bg-gradient-to-l from-black/30 via-black/20 to-black/10 transition-all duration-300" />
                    </div>

                    {/* المحتوى */}
                    <div className="container relative z-10 flex h-full flex-col justify-center items-center">
                      {(banner.title_ar || banner.description_ar) && (
                        <div className="max-w-2xl space-y-1 md:space-y-2 text-center">
                          {banner.title_ar && (
                            <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight text-white drop-shadow-2xl animate-fade-in tracking-tight">
                              {banner.title_ar}
                            </h1>
                          )}
                          {banner.description_ar && (
                            <p className="text-sm md:text-lg lg:text-xl text-white font-medium drop-shadow-lg animate-fade-in [animation-delay:200ms] leading-relaxed">
                              {banner.description_ar}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ) : (
              <CarouselItem key={banner.id}>
                <div className="relative h-[175px] md:h-[300px] lg:h-[400px] xl:h-[500px] 2xl:h-[600px] overflow-hidden rounded-2xl">
                  {/* صورة الخلفية - responsive */}
                  <div className="absolute inset-0">
                    {/* Mobile image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center md:hidden"
                      style={{
                        backgroundImage: `url(${mobileImage})`,
                      }}
                    />
                    {/* Tablet image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center hidden md:block lg:hidden"
                      style={{
                        backgroundImage: `url(${tabletImage})`,
                      }}
                    />
                    {/* Desktop image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center hidden lg:block"
                      style={{
                        backgroundImage: `url(${desktopImage})`,
                      }}
                    />
                    {/* طبقة شفافة للتباين */}
                    <div className="absolute inset-0 bg-gradient-to-l from-black/30 via-black/20 to-black/10" />
                  </div>

                  {/* المحتوى */}
                  <div className="container relative z-10 flex h-full flex-col justify-center items-center">
                    {(banner.title_ar || banner.description_ar) && (
                      <div className="max-w-2xl space-y-1 md:space-y-2 text-center">
                        {banner.title_ar && (
                          <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight text-white drop-shadow-2xl animate-fade-in tracking-tight">
                            {banner.title_ar}
                          </h1>
                        )}
                        {banner.description_ar && (
                          <p className="text-sm md:text-lg lg:text-xl text-white font-medium drop-shadow-lg animate-fade-in [animation-delay:200ms] leading-relaxed">
                            {banner.description_ar}
                          </p>
                        )}
                      </div>
                    )}
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
              aria-label={`الانتقال إلى الصورة ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
