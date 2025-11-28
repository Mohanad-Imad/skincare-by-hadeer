import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { useProductDiscounts, calculateDiscount } from "@/hooks/useProductDiscounts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SimilarProductsProps {
  categoryId: string;
  currentProductId: string;
}

export const SimilarProducts = ({ categoryId, currentProductId }: SimilarProductsProps) => {
  const { data: discounts } = useProductDiscounts();

  const { data: products, isLoading } = useQuery({
    queryKey: ["similar-products", categoryId, currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name_ar,
          image_url,
          product_variants (price)
        `)
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .neq("id", currentProductId);

      if (error) throw error;
      
      // ترتيب عشوائي واختيار 10 منتجات
      const shuffled = data?.sort(() => Math.random() - 0.5).slice(0, 10);
      return shuffled;
    },
    enabled: !!categoryId,
    staleTime: 0, // لضمان التحديث في كل مرة
  });

  if (isLoading || !products || products.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 pt-6 border-t">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
        منتجات مشابهة
      </h2>
      
      <Carousel
        opts={{
          align: "start",
          direction: "rtl",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {products.map((product) => {
            const minPrice = product.product_variants?.length > 0
              ? Math.min(...product.product_variants.map((v: any) => v.price))
              : undefined;
            const discount = minPrice ? calculateDiscount(product.id, minPrice, discounts) : undefined;

            return (
              <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                <ProductCard
                  id={product.id}
                  nameAr={product.name_ar}
                  imageUrl={product.image_url || undefined}
                  minPrice={minPrice}
                  discount={discount}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </section>
  );
};
