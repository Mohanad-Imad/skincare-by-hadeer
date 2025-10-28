import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ShoppingBag, User, Package, Shield, LogOut, ShoppingCart, BookOpen, MessageSquare, Sparkles, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocalCart } from "@/hooks/useLocalCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getLocalCartCount } = useLocalCart();
  const [isOpen, setIsOpen] = useState(false);

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

  const displayCartCount = session?.user ? cartCount : getLocalCartCount();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/");
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="text-right">القائمة</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-6">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className="justify-start gap-2"
                onClick={() => handleNavigate("/")}
              >
                <Home className="h-4 w-4" />
                الرئيسية
              </Button>

              <Button
                variant={isActive("/products") ? "default" : "ghost"}
                className="justify-start gap-2"
                onClick={() => handleNavigate("/products")}
              >
                <ShoppingBag className="h-4 w-4" />
                المنتجات
              </Button>

              <Button
                variant={isActive("/blog") ? "default" : "ghost"}
                className="justify-start gap-2"
                onClick={() => handleNavigate("/blog")}
              >
                <BookOpen className="h-4 w-4" />
                المدونة
              </Button>

              <Button
                variant={isActive("/consultation") ? "default" : "ghost"}
                className="justify-start gap-2"
                onClick={() => handleNavigate("/consultation")}
              >
                <MessageSquare className="h-4 w-4" />
                استشارة
              </Button>

              <Button
                variant={isActive("/celebrity-routines") ? "default" : "ghost"}
                className="justify-start gap-2"
                onClick={() => handleNavigate("/celebrity-routines")}
              >
                <Sparkles className="h-4 w-4" />
                روتين المشاهير
              </Button>

              {session && (
                <Button
                  variant={isActive("/my-orders") ? "default" : "ghost"}
                  className="justify-start gap-2"
                  onClick={() => handleNavigate("/my-orders")}
                >
                  <Package className="h-4 w-4" />
                  طلباتي
                </Button>
              )}

              {isAdmin && (
                <Button
                  variant={location.pathname.startsWith("/admin") ? "default" : "ghost"}
                  className="justify-start gap-2"
                  onClick={() => handleNavigate("/admin/products")}
                >
                  <Shield className="h-4 w-4" />
                  الإدارة
                </Button>
              )}

              <div className="border-t pt-2 mt-2">
                {session ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => handleNavigate("/auth")}
                  >
                    <User className="h-4 w-4" />
                    تسجيل الدخول
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <h1 
          className="cursor-pointer text-base font-bold text-primary whitespace-nowrap sm:text-lg flex-1 text-center lg:text-right" 
          onClick={() => navigate("/")}
        >
          <span className="hidden md:inline">متجر هدير للعناية بالبشرة</span>
          <span className="md:hidden">متجر هدير</span>
        </h1>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Button>

          <Button
            variant={isActive("/products") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/products")}
            className="gap-1.5"
          >
            <ShoppingBag className="h-4 w-4" />
            المنتجات
          </Button>

          <Button
            variant={isActive("/blog") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/blog")}
            className="gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            المدونة
          </Button>

          <Button
            variant={isActive("/consultation") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/consultation")}
            className="gap-1.5"
          >
            <MessageSquare className="h-4 w-4" />
            استشارة
          </Button>

          <Button
            variant={isActive("/celebrity-routines") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/celebrity-routines")}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            روتين المشاهير
          </Button>

          {session && (
            <Button
              variant={isActive("/my-orders") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/my-orders")}
              className="gap-1.5"
            >
              <Package className="h-4 w-4" />
              طلباتي
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
              الإدارة
            </Button>
          )}
        </div>

        {/* Cart & Auth */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="relative" onClick={() => navigate("/cart")}>
            <ShoppingCart className="h-4 w-4" />
            {displayCartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {displayCartCount}
              </span>
            )}
          </Button>
          
          <div className="hidden lg:flex">
            {session ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
                <User className="h-4 w-4" />
                دخول
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
