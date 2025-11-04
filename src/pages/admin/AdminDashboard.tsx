import { useAdminCheck } from "@/hooks/useAdminCheck";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAdminCheck();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
