import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const QuickLinks = () => {
  const navigate = useNavigate();

  const { data: quickLinks, isLoading } = useQuery({
    queryKey: ["quick-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_links")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-3 md:gap-4 px-4 md:px-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-shrink-0 w-24 md:w-32">
                <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm">
                  <Skeleton className="aspect-square rounded-md" />
                  <Skeleton className="h-4 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!quickLinks || quickLinks.length === 0) {
    return null;
  }

  const handleLinkClick = (url: string) => {
    // Check if it's an internal link
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        {/* Gradient fade left */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden md:block" />
        
        {/* Gradient fade right */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden md:block" />
        
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-3 md:gap-4 px-4 md:px-2">
            {quickLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.link_url)}
                className="group flex-shrink-0 w-24 md:w-32"
              >
                <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md">
                    <img
                      src={link.image_url}
                      alt={link.title_ar}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-center mt-2 text-foreground line-clamp-2">
                    {link.title_ar}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
