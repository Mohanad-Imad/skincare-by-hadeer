import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export const CustomerReviews = () => {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["customer-reviews"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("customer_reviews")
        .select("*")
        .eq("status", "approved")
        .eq("is_active", true)
        .order("display_order")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading || !reviews || reviews.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="w-full py-8 md:py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
            آراء عملائنا
          </h2>
          <p className="text-muted-foreground mb-4">
            ماذا يقول عملاؤنا عن منتجاتنا وخدماتنا
          </p>
          <Button
            onClick={() => window.location.href = "/submit-review"}
            variant="outline"
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            شاركنا رأيك
          </Button>
        </div>

        <Carousel
          plugins={[plugin.current]}
          opts={{
            align: "start",
            loop: true,
            direction: "rtl",
          }}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={() => plugin.current.play()}
        >
          <CarouselContent>
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full bg-card border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {review.customer_image ? (
                          <AvatarImage src={review.customer_image} alt={review.customer_name} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {review.customer_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{review.customer_name}</h3>
                        <div className="flex gap-1 mt-1">{renderStars(review.rating)}</div>
                      </div>
                    </div>

                    <div className="relative">
                      <Quote className="absolute -top-2 -right-2 h-8 w-8 text-primary/20" />
                      <p className="text-sm text-muted-foreground leading-relaxed relative z-10 pr-6">
                        {review.comment}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </div>
  );
};
