import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, Star } from "lucide-react";
export const PromoBanner = () => {
  const navigate = useNavigate();
  return <section className="relative py-20 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 opacity-10">
        <Sparkles className="w-20 h-20 text-primary animate-pulse" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10">
        <Heart className="w-16 h-16 text-primary animate-pulse" style={{
        animationDelay: "1s"
      }} />
      </div>
      <div className="absolute top-1/2 left-1/4 opacity-5">
        <Star className="w-24 h-24 text-accent animate-pulse" style={{
        animationDelay: "0.5s"
      }} />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">عروض خاصة</span>
          </div>

          {/* Main heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in my-[4px]">
            جمالك يبدأ من هنا
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            اكتشفي مجموعة حصرية من منتجات العناية بالبشرة التي تمنحك إشراقة طبيعية وجمال دائم
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm">منتجات أصلية 100%</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{
              animationDelay: "0.3s"
            }} />
              <span className="text-sm">توصيل سريع</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{
              animationDelay: "0.6s"
            }} />
              <span className="text-sm">أسعار منافسة</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate("/products")} className="group relative overflow-hidden px-8 py-6 text-lg">
              <span className="relative z-10">تسوقي الآن</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
            
            <Button size="lg" variant="outline" onClick={() => navigate("/consultation")} className="px-8 py-6 text-lg hover-scale">
              استشارة مجانية
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>;
};