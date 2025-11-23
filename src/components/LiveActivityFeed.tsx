import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Flame, Star, Package } from "lucide-react";

interface ActivityItem {
  type: 'purchase' | 'review' | 'cart';
  customerName: string;
  city?: string;
  productName: string;
  rating?: number;
  timestamp: string;
}

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const extractCityFromAddress = (address: string): string => {
  // محاولة استخراج المدينة من العنوان
  const iraqiCities = ["بغداد", "البصرة", "أربيل", "الموصل", "النجف", "كربلاء", "السليمانية"];
  for (const city of iraqiCities) {
    if (address.includes(city)) {
      return city;
    }
  }
  return "العراق";
};

export const LiveActivityFeed = () => {
  const [activityQueue, setActivityQueue] = useState<ActivityItem[]>([]);

  // جلب الطلبات الأخيرة
  const { data: recentOrders } = useQuery({
    queryKey: ["recent-orders-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          customer_name,
          customer_address,
          created_at,
          order_items (
            product_name_ar
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  // جلب المراجعات الأخيرة
  const { data: recentReviews } = useQuery({
    queryKey: ["recent-reviews-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("customer_name, comment, rating, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  // جلب مراجعات المنتجات الأخيرة
  const { data: recentProductReviews } = useQuery({
    queryKey: ["recent-product-reviews-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          customer_name,
          rating,
          created_at,
          products (
            name_ar
          )
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  // جلب المنتجات النشطة للاستخدام في إشعارات المشاهدات
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

  // إنشاء قائمة النشاطات من البيانات الحقيقية
  useEffect(() => {
    const activities: ActivityItem[] = [];

    // إضافة الطلبات
    if (recentOrders && recentOrders.length > 0) {
      recentOrders.forEach(order => {
        if (order.order_items && order.order_items.length > 0) {
          const firstProduct = order.order_items[0].product_name_ar;
          activities.push({
            type: 'purchase',
            customerName: order.customer_name,
            city: extractCityFromAddress(order.customer_address),
            productName: firstProduct,
            timestamp: order.created_at
          });
        }
      });
    }

    // إضافة مراجعات المنتجات
    if (recentProductReviews && recentProductReviews.length > 0) {
      recentProductReviews.forEach(review => {
        if (review.products) {
          activities.push({
            type: 'review',
            customerName: review.customer_name,
            productName: review.products.name_ar,
            rating: review.rating,
            timestamp: review.created_at
          });
        }
      });
    }

    // ترتيب النشاطات حسب الوقت (الأحدث أولاً)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setActivityQueue(activities);
  }, [recentOrders, recentProductReviews]);

  useEffect(() => {
    if (activityQueue.length === 0 && (!products || products.length === 0)) return;

    let currentIndex = 0;

    const showNotification = () => {
      // إذا كان لدينا نشاطات حقيقية، نعرضها
      if (activityQueue.length > 0) {
        const activity = activityQueue[currentIndex % activityQueue.length];
        currentIndex++;

        if (activity.type === 'purchase') {
          toast(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  مبروك! <span className="text-primary font-bold">{activity.customerName} من {activity.city}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  اشترى للتو {activity.productName}! 🎉
                </p>
              </div>
            </div>,
            {
              duration: 6000,
              position: "bottom-left",
              className: "bg-card border-border",
            }
          );
        } else if (activity.type === 'review') {
          toast(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.customerName} انطى تقييم {activity.rating} نجوم!
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  لـ {activity.productName} ⭐
                </p>
              </div>
            </div>,
            {
              duration: 6000,
              position: "bottom-left",
              className: "bg-card border-border",
            }
          );
        }
      } else if (products && products.length > 0) {
        // فقط إذا لم يكن لدينا نشاطات حقيقية، نعرض إشعارات المشاهدات
        const randomProduct = products[Math.floor(Math.random() * products.length)];
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
  }, [activityQueue, products]);

  return null;
};
