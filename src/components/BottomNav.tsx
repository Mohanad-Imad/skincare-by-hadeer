import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// تم استيراد أيقونة Palette الجديدة للمكياج
import { Home, ShoppingCart, Package, User, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalCart } from "@/hooks/useLocalCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// تحديد العنصر المركزي الذي سيصبح FAB
const CENTER_ITEM_ID = "cart";

const navItems = [
  { id: "home", icon: Home, label: "الرئيسية", path: "/" },
  { id: "products", icon: Package, label: "المنتجات", path: "/products" },
  { id: CENTER_ITEM_ID, icon: ShoppingCart, label: "السلة", path: "/cart" }, // العنصر المركزي
  // تم تغيير الأيقونة هنا إلى Palette
  { id: "makeup", icon: Palette, label: "المكياج", path: "/makeup" },
  { id: "account", icon: User, label: "الحساب", path: "/profile" },
];

// ***************************************************************
// ملاحظة هامة: يجب تحديث مركزية الأزرار بناءً على العدد الجديد (5 عناصر)
// لتجنب المشاكل في التنسيق، قمت بإبقاء السلة هي العنصر المركزي (الذي يقع في المنتصف
// إذا كان العدد فردياً)
// ***************************************************************

export const BottomNavPro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { localCart } = useLocalCart();
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  // --- منطق حالة المستخدم وحساب السلة (لم يتغير) ---

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: cartItems } = useQuery({
    queryKey: ["cart-items-count", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  // الاستماع لتغييرات السلة في الوقت الحقيقي
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("cart-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cart-items-count", user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const cartCount = user
    ? cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0
    : localCart.reduce((sum, item) => sum + item.quantity, 0);

  // تم تحديث دالة getActiveIndex لتشمل المسار الجديد /makeup
  const getActiveIndex = () => {
    const path = location.pathname;
    if (path === "/") return 0;
    if (path.startsWith("/products")) return 1;
    if (path === "/cart") return 2; // المركز الجديد
    if (path === "/makeup") return 3; // المكياج
    if (path === "/profile" || path === "/auth") return 4; // الحساب
    return -1;
  };

  const activeIndex = getActiveIndex();

  const handleNavClick = (path: string, id: string) => {
    if (id === "account" && !user) {
      navigate("/auth");
    } else {
      navigate(path);
    }
  };

  // --- التصميم الجديد لشريط التنقل ---

  // حساب العناصر التي تسبق وتلي العنصر المركزي
  const centerItemIndex = navItems.findIndex((item) => item.id === CENTER_ITEM_ID); // المركز هو 2 الآن
  const leftItems = navItems.slice(0, centerItemIndex); // [home, products]
  const rightItems = navItems.slice(centerItemIndex + 1); // [makeup, account]
  const centerItem = navItems[centerItemIndex];
  const totalNavItems = navItems.length; // 5 عناصر

  // تعديل تنسيق العناصر الجانبية لتستوعب 5 عناصر (2 يمين و 2 يسار)
  const navItemWidth = `calc(100% / ${totalNavItems} * 2)`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="relative h-[70px] bg-background shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        {/* شريط التنقل الأساسي */}
        <div className="flex justify-around items-center h-full w-full max-w-lg mx-auto bg-card/90 backdrop-blur-md">
          {/* العناصر اليسرى (2 عنصر) */}
          <div className="flex justify-around h-full" style={{ width: navItemWidth }}>
            {leftItems.map((item, index) => {
              const isActive = activeIndex === index;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.path, item.id)}
                  className="flex flex-col items-center justify-center p-2 min-w-[70px] transition-colors flex-1"
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon
                    className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  <span
                    className={`text-[11px] mt-1 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* مساحة العنصر المركزي (الثلمة) */}
          <div className="w-[80px] h-full" />

          {/* العناصر اليمنى (2 عنصر) */}
          <div className="flex justify-around h-full" style={{ width: navItemWidth }}>
            {rightItems.map((item, index) => {
              // فهرس العنصر في المصفوفة الأصلية بعد تخطي العنصر المركزي (3, 4)
              const originalIndex = centerItemIndex + 1 + index;
              const isActive = activeIndex === originalIndex;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.path, item.id)}
                  className="flex flex-col items-center justify-center p-2 min-w-[70px] transition-colors flex-1"
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon
                    className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  <span
                    className={`text-[11px] mt-1 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* العنصر العائم المركزي (FAB) - السلة */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.button
          onClick={() => handleNavClick(centerItem.path, centerItem.id)}
          className="w-16 h-16 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center border-4 border-background/50"
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="relative">
            <centerItem.icon className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />

            {/* شارة السلة */}
            <AnimatePresence>
              {CENTER_ITEM_ID === "cart" && cartCount > 0 && (
                <motion.span
                  key="cart-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 border-2 border-primary"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </div>

      {/* مؤشر الحالة النشط على العناصر الجانبية */}
      {activeIndex !== -1 && activeIndex !== centerItemIndex && (
        <motion.div
          className="absolute top-0 h-1 bg-primary rounded-full max-w-lg mx-auto"
          style={{ width: `calc(100% / ${totalNavItems} - 20px)` }}
          initial={false}
          animate={{
            // حساب موقع المؤشر الجديد بناءً على 5 عناصر
            x: `calc(${activeIndex * (100 / totalNavItems)}% + 10px + ${activeIndex > centerItemIndex ? "40px" : "0px"})`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </nav>
  );
};
