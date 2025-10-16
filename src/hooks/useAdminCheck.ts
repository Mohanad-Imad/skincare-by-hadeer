import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdminCheck = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("يجب تسجيل الدخول أولاً");
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .rpc("is_admin", { user_id: session.user.id });

        if (error) throw error;

        if (!data) {
          toast.error("ليس لديك صلاحيات الوصول لهذه الصفحة");
          navigate("/");
          return;
        }

        setIsAdmin(data);
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("حدث خطأ في التحقق من الصلاحيات");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  return { isAdmin, isLoading };
};
