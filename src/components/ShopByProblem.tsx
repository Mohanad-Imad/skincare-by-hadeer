import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "./ui/skeleton";

export const ShopByProblem = () => {
  const navigate = useNavigate();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["problem-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full py-12 px-4">
        <Skeleton className="h-10 w-64 mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="w-full py-12 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8 text-foreground">
          التسوق حسب المشكلة
        </h2>
        
        <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-4xl mx-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/problems/${category.slug}`)}
              className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name_ar}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="text-5xl md:text-6xl">
                    {category.slug === 'skin-body-problems' ? '🧴' : '💆‍♀️'}
                  </div>
                )}
              </div>
              <div className="p-3 md:p-6">
                <h3 className="text-base md:text-xl lg:text-2xl font-bold text-foreground text-center group-hover:text-primary transition-colors">
                  {category.name_ar}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
