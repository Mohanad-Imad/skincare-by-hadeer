import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center">
          <p className="mb-4">المقال غير موجود</p>
          <Button onClick={() => navigate("/blog")}>العودة للمدونة</Button>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image_url,
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Person",
      "name": post.author_name
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        keywords={post.meta_keywords || "مدونة العناية بالبشرة، نصائح التجميل"}
        image={post.image_url}
        type="article"
        structuredData={structuredData}
      />
      <Navbar />
      
      <article className="container py-8 pb-32">
        <Button
          variant="ghost"
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للمدونة
        </Button>

        <div className="mx-auto max-w-4xl">
          {post.image_url && (
            <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={post.image_url}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>

          <div className="mb-8 flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>{post.author_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>
                {new Date(post.published_at || post.created_at).toLocaleDateString("ar-IQ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>
            <div className="mt-8 whitespace-pre-wrap leading-relaxed">{post.content}</div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
