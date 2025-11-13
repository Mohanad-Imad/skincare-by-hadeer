import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export const TopAnnouncementBar = () => {
  const navigate = useNavigate();
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const [api, setApi] = useState<CarouselApi>();
  const [isVisible, setIsVisible] = useState(true);

  const { data: announcements } = useQuery({
    queryKey: ["announcement-bar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_bar")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  if (!isVisible || !announcements || announcements.length === 0) {
    return null;
  }

  const handleAnnouncementClick = (url?: string | null) => {
    if (!url) return;
    
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full relative" style={{ backgroundColor: announcements[0]?.background_color || '#000000' }}>
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        opts={{
          align: "center",
          loop: true,
          direction: "rtl",
        }}
        className="w-full"
      >
        <CarouselContent>
          {announcements.map((announcement) => (
            <CarouselItem key={announcement.id}>
              <button
                onClick={() => handleAnnouncementClick(announcement.link_url)}
                className="w-full py-2 px-4 text-center transition-opacity hover:opacity-80"
                style={{ color: announcement.text_color || '#FFFFFF' }}
              >
                <p className="text-xs md:text-sm font-medium">
                  {announcement.text_ar}
                </p>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      <button
        onClick={() => setIsVisible(false)}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        style={{ color: announcements[0]?.text_color || '#FFFFFF' }}
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
