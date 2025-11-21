import { Package, ShoppingBag, Grid3x3, FileText, Percent, BarChart3, ImageIcon, MessageSquare, Sparkles, Tag, Truck, Link2, RectangleHorizontal, Home, Settings, Bell, MessageCircleMore, Star, Users, Boxes, ShieldCheck, MessageCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const menuItems = [
  { title: "الصفحة الرئيسية", url: "/admin", icon: Home },
  { title: "الإحصائيات", url: "/admin/analytics", icon: BarChart3 },
  { title: "الإشعارات", url: "/admin/notifications", icon: Bell, showBadge: true },
  { title: "المستخدمين", url: "/admin/users", icon: Users },
  { title: "آراء العملاء", url: "/admin/customer-reviews", icon: MessageCircleMore },
  { title: "تقييمات المنتجات", url: "/admin/product-reviews", icon: Star },
  { title: "المنتجات", url: "/admin/products", icon: Package },
  { title: "المخزون", url: "/admin/inventory", icon: Boxes },
  { title: "الطلبات", url: "/admin/orders", icon: ShoppingBag },
  { title: "الاستشارات", url: "/admin/consultations", icon: MessageSquare },
  { title: "روتين المشاهير", url: "/admin/celebrity-routines", icon: Sparkles },
  { title: "التصنيفات", url: "/admin/categories", icon: Grid3x3 },
  { title: "التسوق حسب المشكلة", url: "/admin/problem-categories", icon: Grid3x3 },
  { title: "أكواد الخصم", url: "/admin/discount-codes", icon: Percent },
  { title: "خصومات المنتجات", url: "/admin/product-discounts", icon: Tag },
  { title: "إعدادات التوصيل", url: "/admin/shipping-settings", icon: Truck },
  { title: "إعدادات المتجر", url: "/admin/store-settings", icon: Settings },
  { title: "لمّح للحبايب", url: "/admin/drop-hint-settings", icon: MessageCircle },
  { title: "المدونة", url: "/admin/blog-posts", icon: FileText },
  { title: "البنرات الرئيسية", url: "/admin/banners", icon: ImageIcon },
  { title: "البنرات الثانوية", url: "/admin/secondary-banners", icon: RectangleHorizontal },
  { title: "البنرات العلوية", url: "/admin/tertiary-banners", icon: RectangleHorizontal },
  { title: "بنر المكياج", url: "/admin/makeup-banner", icon: ImageIcon },
  { title: "أقسام المكياج", url: "/admin/makeup-categories", icon: Grid3x3 },
  { title: "الروابط السريعة", url: "/admin/quick-links", icon: Link2 },
  { title: "ماركاتنا", url: "/admin/brands-links", icon: Tag },
  { title: "صفحة الضمان", url: "/admin/guarantee", icon: ShieldCheck },
];

export function AdminSidebar() {
  const { setOpenMobile, setOpen, isMobile } = useSidebar();
  const { data: unreadCount } = useUnreadNotifications();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>لوحة التحكم</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-10">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      onClick={handleLinkClick}
                      className={({ isActive }) => (isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "")}
                    >
                      <item.icon className="ml-2 h-4 w-4" />
                      <span>{item.title}</span>
                      {item.showBadge && unreadCount && unreadCount > 0 && (
                        <Badge variant="destructive" className="mr-auto">
                          {unreadCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
