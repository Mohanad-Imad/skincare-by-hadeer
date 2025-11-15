import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { DynamicIcon } from "@/components/DynamicIcon";

export default function AdminNavigationLinks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ["admin-navigation-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_links")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("navigation_links")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الرابط بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الرابط",
        variant: "destructive",
      });
    },
  });

  const toggleNavbarMutation = useMutation({
    mutationFn: async ({ id, show_in_navbar }: { id: string; show_in_navbar: boolean }) => {
      const { error } = await supabase
        .from("navigation_links")
        .update({ show_in_navbar })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث ظهور الرابط في شريط التنقل",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الرابط",
        variant: "destructive",
      });
    },
  });

  const toggleSidebarMutation = useMutation({
    mutationFn: async ({ id, show_in_sidebar }: { id: string; show_in_sidebar: boolean }) => {
      const { error } = await supabase
        .from("navigation_links")
        .update({ show_in_sidebar })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث ظهور الرابط في القائمة الجانبية",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الرابط",
        variant: "destructive",
      });
    },
  });

  const getIcon = (iconName: string) => {
    return <DynamicIcon name={iconName as any} className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <AdminBackButton />
        <h1 className="text-3xl font-bold mb-6">إدارة روابط التنقل</h1>
        <div className="text-center py-8">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AdminBackButton />
      <h1 className="text-3xl font-bold mb-6">إدارة روابط التنقل</h1>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الأيقونة</TableHead>
              <TableHead className="text-right">العنوان بالعربية</TableHead>
              <TableHead className="text-right">العنوان بالإنجليزية</TableHead>
              <TableHead className="text-right">الرابط</TableHead>
              <TableHead className="text-right">شريط التنقل</TableHead>
              <TableHead className="text-right">القائمة الجانبية</TableHead>
              <TableHead className="text-right">الترتيب</TableHead>
              <TableHead className="text-right">مفعّل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links?.map((link) => (
              <TableRow key={link.id}>
                <TableCell>{getIcon(link.icon)}</TableCell>
                <TableCell className="font-medium">{link.title_ar}</TableCell>
                <TableCell>{link.title_en}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{link.url}</code>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={link.show_in_navbar}
                    onCheckedChange={(checked) =>
                      toggleNavbarMutation.mutate({
                        id: link.id,
                        show_in_navbar: checked,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={link.show_in_sidebar}
                    onCheckedChange={(checked) =>
                      toggleSidebarMutation.mutate({
                        id: link.id,
                        show_in_sidebar: checked,
                      })
                    }
                  />
                </TableCell>
                <TableCell>{link.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({
                        id: link.id,
                        is_active: checked,
                      })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}