import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Flame, Star, Package } from "lucide-react";

const iraqiNames = [
  "أحمد", "فاطمة", "علي", "زينب", "محمد", "سارة", "حسن", "مريم",
  "عمر", "نور", "يوسف", "هدى", "كريم", "رنا", "حسين", "دعاء"
];

const iraqiCities = [
  "بغداد", "البصرة", "أربيل", "الموصل", "النجف", "كربلاء", 
  "السليمانية", "الأنبار", "بابل", "ديالى"
];

const getRandomElement = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const LiveActivityFeed = () => {
  const { data: products } = useQuery({
    queryKey: ["active-products-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name_ar")
        .eq("is_active", true)
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!products || products.length === 0) return;

    const showNotification = () => {
      const notificationType = getRandomNumber(1, 4);
      const randomName = getRandomElement(iraqiNames);
      const randomCity = getRandomElement(iraqiCities);
      const randomProduct = getRandomElement(products);
      
      switch (notificationType) {
        case 1: // Purchase
          toast(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  مبروك! <span className="text-primary font-bold">{randomName} من {randomCity}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  اشترى للتو {randomProduct.name_ar}! 🎉
                </p>
              </div>
            </div>,
            {
              duration: 6000,
              position: "bottom-left",
              className: "bg-card border-border",
            }
          );
          break;

        case 2: // Add to cart
          toast(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {randomProduct.name_ar}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  انضاف للسلة مرتين في الـ 10 دقايق الفايتة 🛒
                </p>
              </div>
            </div>,
            {
              duration: 6000,
              position: "bottom-left",
              className: "bg-card border-border",
            }
          );
          break;

        case 3: // Product views
          const viewCount = getRandomNumber(3, 7);
          toast(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {viewCount} أشخاص ديشوفون هذا المنتج هسه!
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {randomProduct.name_ar} 🔥
                </p>
              </div>
            </div>,
            {
              duration: 6000,
              position: "bottom-left",
              className: "bg-card border-border",
            }
          );
          break;

        case 4: // Review
          toast(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {randomName} انطى تقييم 5 نجوم!
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  لـ {randomProduct.name_ar} ⭐
                </p>
              </div>
            </div>,
            {
              duration: 6000,
              position: "bottom-left",
              className: "bg-card border-border",
            }
          );
          break;
      }
    };

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Then show notifications every 12-18 seconds
    const interval = setInterval(() => {
      showNotification();
    }, getRandomNumber(12000, 18000));

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [products]);

  return null;
};
