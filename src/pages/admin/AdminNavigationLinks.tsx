import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { DynamicIcon } from "@/components/DynamicIcon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  title_ar: z.string().min(1, "العنوان بالعربية مطلوب"),
  title_en: z.string().optional(),
  url: z.string().min(1, "الرابط مطلوب"),
  icon: z.string().min(1, "اسم الأيقونة مطلوب"),
  display_order: z.coerce.number().min(0, "الترتيب يجب أن يكون رقم موجب"),
});

export default function AdminNavigationLinks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title_ar: "",
      title_en: "",
      url: "",
      icon: "home",
      display_order: 0,
    },
  });

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

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { error } = await supabase
        .from("navigation_links")
        .insert([{
          title_ar: values.title_ar,
          title_en: values.title_en || null,
          url: values.url,
          icon: values.icon,
          display_order: values.display_order,
          show_in_navbar: true,
          show_in_sidebar: true,
          is_active: true,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({
        title: "تم الإضافة",
        description: "تم إضافة الرابط بنجاح",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الرابط",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: z.infer<typeof formSchema> }) => {
      const { error } = await supabase
        .from("navigation_links")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث الرابط بنجاح",
      });
      setOpen(false);
      setEditingLink(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الرابط",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("navigation_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الرابط بنجاح",
      });
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الرابط",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (link: any) => {
    setEditingLink(link);
    form.reset({
      title_ar: link.title_ar,
      title_en: link.title_en || "",
      url: link.url,
      icon: link.icon,
      display_order: link.display_order,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setLinkToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingLink(null);
    form.reset();
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">إدارة روابط التنقل</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLink(null); form.reset(); }}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة رابط جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLink ? "تحرير الرابط" : "إضافة رابط جديد"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان بالعربية</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان بالإنجليزية</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرابط (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="/example" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الأيقونة (lucide-react)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="home" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الترتيب</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingLink ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
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
              <TableHead className="text-right">الإجراءات</TableHead>
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
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(link)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الرابط نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => linkToDelete && deleteMutation.mutate(linkToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}