import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Package, User } from "lucide-react";
import { motion } from "framer-motion";
import { useLocalCart } from "@/hooks/useLocalCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { id: "home", icon: Home, label: "الرئيسية", path: "/" },
  { id: "products", icon: Package, label: "المنتجات", path: "/products" },
  { id: "cart", icon: ShoppingCart, label: "السلة", path: "/cart" },
  { id: "account", icon: User, label: "الحساب", path: "/profile" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { localCart } = useLocalCart();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Get cart count for authenticated users
  const { data: cartItems } = useQuery({
    queryKey: ["cart-items-count", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const cartCount = user
    ? cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0
    : localCart.reduce((sum, item) => sum + item.quantity, 0);

  const getActiveIndex = () => {
    const path = location.pathname;
    if (path === "/") return 0;
    if (path.startsWith("/products")) return 1;
    if (path === "/cart") return 2;
    if (path === "/profile" || path === "/auth") return 3;
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative flex items-center justify-around py-2 px-4">
        {/* Animated circle indicator */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute -top-5 w-16 h-16 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center"
            initial={false}
            animate={{
              x: `calc(${activeIndex * 100}% - ${activeIndex * 64}px + ${activeIndex === 0 ? 0 : activeIndex === 1 ? -8 : activeIndex === 2 ? -16 : -24}px)`,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            style={{
              left: "calc(12.5% - 32px)",
            }}
          />
        )}

        {navItems.map((item, index) => {
          const isActive = activeIndex === index;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path, item.id)}
              className="relative flex flex-col items-center justify-center w-16 h-16 z-10"
            >
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  y: isActive ? -20 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                  {/* Cart badge */}
                  {item.id === "cart" && cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium transition-all duration-200 ${
                    isActive ? "opacity-0 scale-0" : "text-muted-foreground opacity-100 scale-100"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </button>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-background/80" />
    </nav>
  );
};
