import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ShoppingBag, User, Package, Shield, LogOut, ShoppingCart, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      const { data, error } = await supabase.rpc("is_admin", {
        user_id: session.user.id,
      });
      if (error) return false;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: cartCount } = useQuery({
    queryKey: ["cart-count", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return 0;
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);
      return count || 0;
    },
    enabled: !!session?.user?.id,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <h1 
          className="cursor-pointer text-base font-bold text-primary whitespace-nowrap sm:text-lg lg:text-xl order-2 sm:order-1" 
          onClick={() => navigate("/")}
        >
          <span className="hidden md:inline">متجر هدير للعناية بالبشرة</span>
          <span className="md:hidden">متجر هدير</span>
        </h1>

        <div className="flex items-center gap-1 order-1 sm:order-2">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5"
          >
            <Home className="h-4 w-4" />
            <span className="hidden lg:inline">الرئيسية</span>
          </Button>

          <Button
            variant={isActive("/products") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/products")}
            className="gap-1.5"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden lg:inline">المنتجات</span>
          </Button>

          <Button
            variant={isActive("/blog") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/blog")}
            className="gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden lg:inline">المدونة</span>
          </Button>

          {session && (
            <Button
              variant={isActive("/my-orders") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/my-orders")}
              className="gap-1.5"
            >
              <Package className="h-4 w-4" />
              <span className="hidden lg:inline">طلباتي</span>
            </Button>
          )}

          {isAdmin && (
            <Button
              variant={location.pathname.startsWith("/admin") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/admin/products")}
              className="gap-1.5"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden lg:inline">الإدارة</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 order-3">
          <Button variant="ghost" size="sm" className="relative" onClick={() => navigate("/cart")}>
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
          {session ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">خروج</span>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
              <User className="h-4 w-4" />
              <span className="hidden lg:inline">دخول</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
