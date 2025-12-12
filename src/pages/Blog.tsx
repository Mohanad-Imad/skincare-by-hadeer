import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Blog = () => {
  const navigate = useNavigate();
  
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "مدونة العناية بالبشرة",
    "description": "مقالات ونصائح للعناية بالبشرة ومستحضرات التجميل"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="مدونة العناية بالبشرة - نصائح ومقالات تجميل"
        description="اقرأي أحدث المقالات والنصائح حول العناية بالبشرة، روتين التجميل، وأفضل المنتجات. نصائح من خبراء التجميل في العراق."
        keywords="مدونة العناية بالبشرة، نصائح التجميل، روتين البشرة، مقالات التجميل العراق، نصائح جمال"
        structuredData={structuredData}
      />
      <Navbar />
      
      <div className="container py-8 pb-32">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold leading-relaxed">مدونة العناية بالبشرة</h1>
          <p className="text-lg text-muted-foreground">
            نصائح ومقالات من خبراء التجميل لمساعدتك في الحصول على بشرة صحية ومشرقة
          </p>
        </div>

        {isLoading ? (
          <div className="text-center">جاري التحميل...</div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center text-muted-foreground">لا توجد مقالات متاحة حالياً</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                {post.image_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg md:text-xl leading-relaxed">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.published_at || post.created_at).toLocaleDateString("ar-IQ")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
