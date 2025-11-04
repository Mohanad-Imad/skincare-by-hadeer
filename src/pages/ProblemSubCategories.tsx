import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export default function ProblemSubCategories() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["problem-category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: subProblems, isLoading: subProblemsLoading } = useQuery({
    queryKey: ["sub-problems", category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const { data, error } = await supabase
        .from("sub_problems")
        .select("*")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  if (categoryLoading || subProblemsLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">القسم غير موجود</h1>
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${category.name_ar} - التسوق حسب المشكلة`}
        description={`اكتشف أفضل المنتجات لعلاج ${category.name_ar}`}
      />
      <Navbar />
      
      <main className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground mb-6 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للصفحة الرئيسية</span>
          </button>

          {/* Page Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-foreground">
            {category.name_ar}
          </h1>

          {/* Sub-problems Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subProblems?.map((subProblem) => (
              <button
                key={subProblem.id}
                onClick={() => navigate(`/products?problem=${subProblem.slug}`)}
                className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-center text-foreground group-hover:text-primary transition-colors">
                  {subProblem.name_ar}
                </h3>
              </button>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
