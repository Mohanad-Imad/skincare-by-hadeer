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
      <div className="w-full py-6">
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 min-w-[100px]">
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
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
    <div className="w-full py-6 relative">
      <div className="overflow-x-auto scrollbar-hide relative">
        <div className="flex gap-4 px-4">
          {quickLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.link_url)}
              className="flex flex-col items-center gap-3 min-w-[100px] group flex-shrink-0"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-300 shadow-md group-hover:shadow-lg">
                  <img
                    src={link.image_url}
                    alt={link.title_ar}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/0 to-primary/20 group-hover:from-primary/10 group-hover:to-primary/30 transition-all duration-300 pointer-events-none" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300 text-center max-w-[100px] truncate">
                {link.title_ar}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Fade edges effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};
