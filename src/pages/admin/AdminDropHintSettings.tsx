import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MessageCircle, Save } from "lucide-react";

const AdminDropHintSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    button_text_ar: "",
    funny_message_ar: "",
    formal_message_ar: "",
    urgent_message_ar: "",
    discount_code: "",
    discount_suffix_ar: "",
    is_active: true,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["drop-hint-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drop_hint_settings").select("*").single();

      if (error) throw error;

      if (data) {
        setFormData({
          button_text_ar: data.button_text_ar || "",
          funny_message_ar: data.funny_message_ar || "",
          formal_message_ar: data.formal_message_ar || "",
          urgent_message_ar: data.urgent_message_ar || "",
          discount_code: data.discount_code || "",
          discount_suffix_ar: data.discount_suffix_ar || "",
          is_active: data.is_active,
        });
      }

      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("drop_hint_settings").update(formData).eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drop-hint-settings"] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
...
    </div>
  );
};

export default AdminDropHintSettings;
