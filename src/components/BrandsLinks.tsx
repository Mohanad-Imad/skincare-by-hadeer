import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const BrandsLinks = () => {
  const navigate = useNavigate();

  const { data: brands } = useQuery({
    queryKey: ["brands-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands_links")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  if (!brands || brands.length === 0) return null;

  const handleBrandClick = (url: string) => {
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-6">ماركاتنا</h2>
        
        <div className="relative">
          {/* Gradient fade left */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden md:block" />
          
          {/* Gradient fade right */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden md:block" />
          
          <div className="overflow-x-auto scrollbar-hide pb-2">
            <div className="flex gap-3 md:gap-4 px-2">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandClick(brand.link_url)}
                  className="group flex-shrink-0 w-24 md:w-32"
                >
                  <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md">
                      <img
                        src={brand.image_url}
                        alt={brand.title_ar}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <p className="text-xs md:text-sm font-medium text-center mt-2 text-foreground line-clamp-2">
                      {brand.title_ar}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
