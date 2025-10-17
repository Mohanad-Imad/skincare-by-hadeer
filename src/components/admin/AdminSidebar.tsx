import { Package, ShoppingBag, Grid3x3, FileText } from "lucide-react";
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
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "المنتجات", url: "/admin/products", icon: Package },
  { title: "الطلبات", url: "/admin/orders", icon: ShoppingBag },
  { title: "التصنيفات", url: "/admin/categories", icon: Grid3x3 },
  { title: "المدونة", url: "/admin/blog", icon: FileText },
];

export function AdminSidebar() {
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
