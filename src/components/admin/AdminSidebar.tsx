import { Package, ShoppingBag, Grid3x3, FileText, Percent, BarChart3, ImageIcon, MessageSquare, Sparkles } from "lucide-react";
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

const menuItems = [
  { title: "الإحصائيات", url: "/admin/analytics", icon: BarChart3 },
  { title: "المنتجات", url: "/admin/products", icon: Package },
  { title: "الطلبات", url: "/admin/orders", icon: ShoppingBag },
  { title: "الاستشارات", url: "/admin/consultations", icon: MessageSquare },
  { title: "روتين المشاهير", url: "/admin/celebrity-routines", icon: Sparkles },
  { title: "التصنيفات", url: "/admin/categories", icon: Grid3x3 },
  { title: "أكواد الخصم", url: "/admin/discount-codes", icon: Percent },
  { title: "المدونة", url: "/admin/blog", icon: FileText },
  { title: "البنرات الإعلانية", url: "/admin/banners", icon: ImageIcon },
];

export function AdminSidebar() {
  const { setOpenMobile, setOpen, isMobile } = useSidebar();

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
                      onClick={handleLinkClick}
                      className={({ isActive }) => (isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "")}
                    >
                      <item.icon className="ml-2 h-4 w-4" />
                      <span>{item.title}</span>
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
