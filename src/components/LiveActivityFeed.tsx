import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Star } from "lucide-react";

interface ActivityItem {
  type: 'purchase' | 'review';
  customerName: string;
  city?: string;
  productName: string;
  rating?: number;
  timestamp: string;
}

const extractCityFromAddress = (address: string): string => {
  const iraqiCities = ["بغداد", "البصرة", "أربيل", "الموصل", "النجف", "كربلاء", "السليمانية", "الأنبار", "بابل", "ديالى"];
  for (const city of iraqiCities) {
    if (address.includes(city)) {
      return city;
    }
  }
  return "العراق";
};

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const LiveActivityFeed = () => {
  const [activityQueue, setActivityQueue] = useState<ActivityItem[]>([]);

  // جلب إعدادات المتجر للتحقق من تفعيل الخاصية
  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings-live-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("show_live_activity_feed")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

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
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
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
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // إنشاء قائمة النشاطات من البيانات الحقيقية فقط
  useEffect(() => {
    const activities: ActivityItem[] = [];

    // إضافة الطلبات الحقيقية
    if (recentOrders && recentOrders.length > 0) {
      recentOrders.forEach(order => {
        if (order.order_items && order.order_items.length > 0) {
          // إضافة أول منتج من الطلب
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

    // إضافة مراجعات المنتجات الحقيقية
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
    // إذا كانت الخاصية معطلة، لا نعرض شيء
    if (!storeSettings?.show_live_activity_feed) return;
    
    // إذا لم يكن هناك أي نشاطات حقيقية، لا نعرض شيء
    if (activityQueue.length === 0) return;

    let currentIndex = 0;

    const showNotification = () => {
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
    };

    // عرض أول إشعار بعد 3 ثواني
    const initialTimeout = setTimeout(showNotification, 3000);

    // ثم عرض الإشعارات كل 15-20 ثانية
    const interval = setInterval(() => {
      showNotification();
    }, getRandomNumber(15000, 20000));

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [activityQueue, storeSettings?.show_live_activity_feed]);

  return null;
};
