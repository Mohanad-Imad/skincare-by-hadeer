import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "أفضل روتين للعناية بالبشرة الدهنية في الصيف",
    description: "تعرفي على أفضل المنتجات والخطوات للعناية بالبشرة الدهنية خلال فصل الصيف الحار في العراق",
    author: "فريق التحرير",
    date: "2025-01-10",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800",
    content: "البشرة الدهنية تحتاج إلى عناية خاصة في الصيف..."
  },
  {
    id: 2,
    title: "كيف تختارين الكريم المناسب لنوع بشرتك",
    description: "دليل شامل لاختيار كريم البشرة المثالي حسب نوع بشرتك واحتياجاتها الخاصة",
    author: "د. سارة أحمد",
    date: "2025-01-08",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800",
    content: "اختيار الكريم المناسب يعتمد على عدة عوامل..."
  },
  {
    id: 3,
    title: "فوائد السيروم للبشرة وكيفية استخدامه",
    description: "اكتشفي أهمية السيروم في روتين العناية بالبشرة والطريقة الصحيحة لتطبيقه",
    author: "نور محمد",
    date: "2025-01-05",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800",
    content: "السيروم من أهم منتجات العناية بالبشرة..."
  },
  {
    id: 4,
    title: "العناية بالبشرة الحساسة: نصائح ومنتجات",
    description: "دليلك الكامل للعناية بالبشرة الحساسة وتجنب التهيج والاحمرار",
    author: "ليلى حسن",
    date: "2025-01-03",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
    content: "البشرة الحساسة تحتاج إلى منتجات خاصة..."
  }
];

const Blog = () => {
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
      
      <div className="container py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">مدونة العناية بالبشرة</h1>
          <p className="text-lg text-muted-foreground">
            نصائح ومقالات من خبراء التجميل لمساعدتك في الحصول على بشرة صحية ومشرقة
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">{post.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString("ar-IQ")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Blog;
