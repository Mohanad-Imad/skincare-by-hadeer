import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, ShoppingBag, User, Package, Shield, ShoppingCart, BookOpen, MessageSquare, Sparkles, Menu, Grid3x3, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocalCart } from "@/hooks/useLocalCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getLocalCartCount } = useLocalCart();
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const storeName = settings?.store_name || "متجر هدير للعناية بالبشرة";

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

  const { data: profile } = useQuery<{ full_name: string; avatar_url: string } | null>({
    queryKey: ["navbar-profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (error) return null;
      return data as { full_name: string; avatar_url: string };
    },
    enabled: !!session?.user?.id,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["navbar-categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("categories")
        .select("*")
        .is("parent_category_id", null)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: subCategories = [] } = useQuery<any[]>({
    queryKey: ["navbar-sub-categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("categories")
        .select("*")
        .not("parent_category_id", "is", null)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const displayCartCount = session?.user ? cartCount : getLocalCartCount();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Left Side: Mobile Menu (mobile) / Logo (desktop) */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden" aria-label="فتح القائمة">
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
                  variant={isActive("/cart") ? "default" : "ghost"}
                  className="justify-start gap-2 relative"
                  onClick={() => handleNavigate("/cart")}
                >
                  <ShoppingCart className="h-4 w-4" />
                  السلة
                  {displayCartCount > 0 && (
                    <span className="mr-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {displayCartCount}
                    </span>
                  )}
                </Button>

                <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <Grid3x3 className="h-4 w-4" />
                      الأقسام
                      <ChevronDown className={`h-4 w-4 mr-auto transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pr-4 space-y-1">
                    {categories.map((category: any) => {
                      const categorySubCategories = subCategories.filter((sub: any) => sub.parent_category_id === category.id);
                      
                      if (categorySubCategories.length > 0) {
                        return (
                          <Collapsible key={category.id}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-sm font-medium"
                              >
                                {category.name_ar}
                                <ChevronDown className="h-3 w-3 mr-auto transition-transform data-[state=open]:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pr-4 space-y-1">
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-xs"
                                onClick={() => handleNavigate(`/products?category=${category.id}`)}
                              >
                                الكل
                              </Button>
                              {categorySubCategories.map((subCategory: any) => (
                                <Button
                                  key={subCategory.id}
                                  variant="ghost"
                                  className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => handleNavigate(`/products?category=${category.id}&subCategory=${subCategory.id}`)}
                                >
                                  {subCategory.name_ar}
                                </Button>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      } else {
                        return (
                          <Button
                            key={category.id}
                            variant="ghost"
                            className="w-full justify-start gap-2 text-sm font-medium"
                            onClick={() => handleNavigate(`/products?category=${category.id}`)}
                          >
                            {category.name_ar}
                          </Button>
                        );
                      }
                    })}
                  </CollapsibleContent>
                </Collapsible>

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
                    onClick={() => handleNavigate("/admin")}
                  >
                    <Shield className="h-4 w-4" />
                    الإدارة
                  </Button>
                )}

              <Separator className="my-3" />
              
              <ThemeSelector />
              
              <Separator className="my-3" />
              
              <div className="px-2">
                {session ? (
                  <button
                    onClick={() => handleNavigate("/profile")}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(profile?.full_name || session.user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-right">
                      <p className="font-medium text-sm">{profile?.full_name || "مستخدم"}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </button>
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

          {/* Logo - Desktop Only (left side) */}
          <div 
            className="hidden lg:flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            {settings?.logo_url && (
              <img src={settings.logo_url} alt={storeName} className="h-8 w-8 object-contain" />
            )}
            <h1 className="text-lg font-bold text-primary whitespace-nowrap">
              {storeName}
            </h1>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden lg:flex items-center justify-center gap-1 flex-1">
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
            variant={isActive("/categories") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/categories")}
            className="gap-1.5"
          >
            <Grid3x3 className="h-4 w-4" />
            الأقسام
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
              onClick={() => navigate("/admin")}
              className="gap-1.5"
            >
              <Shield className="h-4 w-4" />
              الإدارة
            </Button>
          )}
        </div>

        {/* Right Side: Avatar (mobile) & Logo (mobile center) / Cart & Auth (desktop right) */}
        <div className="flex items-center gap-2">
          {/* Avatar - Mobile Only */}
          {session ? (
            <button
              onClick={() => navigate("/profile")}
              className="lg:hidden flex items-center gap-2"
              aria-label="الملف الشخصي"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {(profile?.full_name || session.user.email)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => navigate("/auth")} aria-label="تسجيل الدخول">
              <User className="h-4 w-4" />
            </Button>
          )}

          {/* Logo - Mobile Only (centered with absolute positioning) */}
          <div 
            className="lg:hidden cursor-pointer flex items-center gap-2 absolute left-1/2 -translate-x-1/2" 
            onClick={() => navigate("/")}
          >
            {settings?.logo_url && (
              <img src={settings.logo_url} alt={storeName} className="h-6 w-6 object-contain" />
            )}
            <h1 className="text-base font-bold text-primary whitespace-nowrap sm:text-lg">
              <span className="hidden md:inline">{storeName}</span>
              <span className="md:hidden">{storeName.split(' ')[0]}</span>
            </h1>
          </div>

          {/* Cart & Auth - Desktop Only (right side) */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            
            <Button variant="ghost" size="sm" className="relative px-3" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-4 w-4" />
              {displayCartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {displayCartCount}
                </span>
              )}
            </Button>
            
            {session ? (
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {(profile?.full_name || session.user.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{profile?.full_name || "حسابي"}</span>
              </button>
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
