import { useEffect, useState } from "react";
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="mx-3 mb-3">
        <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-border/50 overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative flex items-center justify-around py-2">
            {navItems.map((item, index) => {
              const isActive = activeIndex === index;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.path, item.id)}
                  className="relative flex flex-col items-center justify-center py-2 px-4 min-w-[70px]"
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-1 bg-primary/15 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <motion.div
                      className="relative"
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors duration-300 ${
                          isActive 
                            ? "text-primary" 
                            : "text-muted-foreground"
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      
                      {/* Cart badge */}
                      {item.id === "cart" && cartCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                        >
                          {cartCount > 99 ? "99+" : cartCount}
                        </motion.span>
                      )}
                    </motion.div>

                    <motion.span
                      className={`text-[10px] font-medium transition-colors duration-300 ${
                        isActive 
                          ? "text-primary" 
                          : "text-muted-foreground"
                      }`}
                      animate={{
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {item.label}
                    </motion.span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="activeDot"
                        className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
