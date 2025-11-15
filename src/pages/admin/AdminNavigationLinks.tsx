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

  const toggleLinkMutation = useMutation({
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

  const getLocationBadge = (location: string) => {
    const variants: Record<string, any> = {
      navbar: "default",
      sidebar: "secondary",
      both: "outline",
    };
    
    const labels: Record<string, string> = {
      navbar: "شريط التنقل",
      sidebar: "القائمة الجانبية",
      both: "كلاهما",
    };

    return (
      <Badge variant={variants[location] || "default"}>
        {labels[location] || location}
      </Badge>
    );
  };

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
              <TableHead className="text-right">الموقع</TableHead>
              <TableHead className="text-right">الترتيب</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
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
                <TableCell>{getLocationBadge(link.location)}</TableCell>
                <TableCell>{link.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={(checked) =>
                      toggleLinkMutation.mutate({
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