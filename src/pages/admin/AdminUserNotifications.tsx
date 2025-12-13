import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { 
  Send, 
  Users, 
  User, 
  MessageSquare, 
  Mail,
  Loader2,
  Search,
  Link
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Consultation {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  created_at: string;
  user_id: string | null;
}

const AdminUserNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("send");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [notificationType, setNotificationType] = useState<"personal" | "broadcast">("personal");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedConsultationId, setSelectedConsultationId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-for-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch consultations with users
  const { data: consultations = [] } = useQuery({
    queryKey: ["admin-consultations-for-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("id, full_name, phone, status, created_at, user_id")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Consultation[];
    },
  });

  // Fetch sent notifications
  const { data: sentNotifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["admin-sent-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const notificationData = {
        title,
        message,
        type: notificationType,
        user_id: notificationType === "personal" ? selectedUserId : null,
        related_table: selectedConsultationId ? "consultations" : null,
        related_id: selectedConsultationId || null,
        link_url: linkUrl.trim() || null,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("user_notifications")
        .insert(notificationData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الإشعار بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-sent-notifications"] });
      // Reset form
      setTitle("");
      setMessage("");
      setLinkUrl("");
      setSelectedUserId("");
      setSelectedConsultationId("");
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الإرسال",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (notificationType === "personal" && !selectedUserId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المستخدم",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate();
  };

  const handleConsultationSelect = (consultationId: string) => {
    setSelectedConsultationId(consultationId);
    const consultation = consultations.find(c => c.id === consultationId);
    if (consultation?.user_id) {
      setSelectedUserId(consultation.user_id);
      setNotificationType("personal");
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <AdminBackButton />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                إشعارات المستخدمين
              </h1>
              <p className="text-muted-foreground">
                إرسال رسائل وإشعارات للمستخدمين
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="send" className="gap-2">
                <Send className="h-4 w-4" />
                إرسال إشعار
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                السجل
              </TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Send Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">إرسال إشعار جديد</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Notification Type */}
                    <div className="space-y-2">
                      <Label>نوع الإشعار</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={notificationType === "personal" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setNotificationType("personal")}
                        >
                          <User className="h-4 w-4 ml-2" />
                          مستخدم محدد
                        </Button>
                        <Button
                          type="button"
                          variant={notificationType === "broadcast" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setNotificationType("broadcast")}
                        >
                          <Users className="h-4 w-4 ml-2" />
                          جميع المستخدمين
                        </Button>
                      </div>
                    </div>

                    {/* User Selection (for personal) */}
                    {notificationType === "personal" && (
                      <div className="space-y-2">
                        <Label>اختر المستخدم</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مستخدم..." />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2">
                              <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="بحث..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pr-9"
                                />
                              </div>
                            </div>
                            <ScrollArea className="h-48">
                              {filteredUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className="flex flex-col">
                                    <span>{user.full_name || "بدون اسم"}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {user.email || user.phone}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                      <Label>عنوان الإشعار *</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: رد على استشارتك"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label>نص الرسالة *</Label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        rows={5}
                      />
                    </div>

                    {/* Link URL */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        رابط التوجيه (اختياري)
                      </Label>
                      <Input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="مثال: /products/abc123 أو https://example.com"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        عند الضغط على الإشعار سيتم توجيه المستخدم لهذا الرابط
                      </p>
                    </div>

                    <Button 
                      onClick={handleSend} 
                      className="w-full"
                      disabled={sendNotificationMutation.isPending}
                    >
                      {sendNotificationMutation.isPending ? (
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 ml-2" />
                      )}
                      إرسال الإشعار
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Send from Consultations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">الرد على استشارة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label>اختر استشارة للرد عليها</Label>
                      <Select 
                        value={selectedConsultationId} 
                        onValueChange={handleConsultationSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر استشارة..." />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-64">
                            {consultations.map((consultation) => (
                              <SelectItem key={consultation.id} value={consultation.id}>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span>{consultation.full_name}</span>
                                    <Badge 
                                      variant={consultation.status === "pending" ? "destructive" : "secondary"}
                                      className="text-xs"
                                    >
                                      {consultation.status === "pending" ? "معلق" : 
                                       consultation.status === "responded" ? "تم الرد" : consultation.status}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(consultation.created_at), "dd/MM/yyyy", { locale: ar })}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      
                      {selectedConsultationId && !consultations.find(c => c.id === selectedConsultationId)?.user_id && (
                        <p className="text-sm text-amber-600">
                          ⚠️ هذه الاستشارة من مستخدم غير مسجل، لن يتمكن من رؤية الإشعار
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">سجل الإشعارات المرسلة</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingNotifications ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : sentNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد إشعارات مرسلة
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>النوع</TableHead>
                            <TableHead>العنوان</TableHead>
                            <TableHead>الرسالة</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>الحالة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sentNotifications.map((notification) => (
                            <TableRow key={notification.id}>
                              <TableCell>
                                <Badge variant={notification.type === "broadcast" ? "secondary" : "outline"}>
                                  {notification.type === "broadcast" ? "للجميع" : "شخصي"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {notification.title}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {notification.message}
                              </TableCell>
                              <TableCell>
                                {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={notification.is_read ? "secondary" : "default"}>
                                  {notification.is_read ? "مقروء" : "غير مقروء"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminUserNotifications;
