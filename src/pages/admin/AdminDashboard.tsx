import { useAdminCheck } from "@/hooks/useAdminCheck";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAdminCheck();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: unreadCount } = useUnreadNotifications();

  // Fetch recent notifications for dropdown
  const { data: recentNotifications } = useQuery({
    queryKey: ["recent-notifications"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const handleNotificationClick = (notification: any) => {
    markAsReadMutation.mutate(notification.id);
    
    if (notification.related_table === "customer_reviews") {
      navigate("/admin/customer-reviews");
    } else if (notification.related_table === "orders") {
      navigate("/admin/orders");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    await queryClient.invalidateQueries({ queryKey: ["is-admin"] });
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <button 
                onClick={() => navigate("/admin")}
                className="text-xl font-bold hover:text-primary transition-colors"
              >
                لوحة التحكم
              </button>
              <div className="flex gap-2">
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" title="الإشعارات">
                      <Bell className="h-5 w-5" />
                      {unreadCount && unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                    <DropdownMenuLabel>الإشعارات الأخيرة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!recentNotifications || recentNotifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        لا توجد إشعارات
                      </div>
                    ) : (
                      <>
                        {recentNotifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`cursor-pointer p-3 ${
                              !notification.is_read ? "bg-muted/50" : ""
                            }`}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">
                                  {notification.title}
                                </span>
                                {!notification.is_read && (
                                  <Badge variant="default" className="text-xs">
                                    جديد
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleDateString("ar-SA", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate("/admin/notifications")}
                          className="cursor-pointer justify-center font-medium text-primary"
                        >
                          عرض جميع الإشعارات
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="العودة للموقع">
                  <Home className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="تسجيل الخروج">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
