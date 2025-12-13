import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MailOpen, 
  Check, 
  ArrowRight, 
  Inbox as InboxIcon,
  MessageSquare,
  ShoppingBag,
  Trash2
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

const Inbox = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    isLoading 
  } = useUserNotifications();

  const readNotificationsCount = notifications.filter(n => n.is_read).length;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.related_table === "consultations" && notification.related_id) {
      navigate(`/consultation`);
    } else if (notification.related_table === "orders" && notification.related_id) {
      navigate(`/my-orders`);
    }
  };

  const getNotificationIcon = (notification: typeof notifications[0]) => {
    if (notification.related_table === "consultations") {
      return <MessageSquare className="h-5 w-5" />;
    } else if (notification.related_table === "orders") {
      return <ShoppingBag className="h-5 w-5" />;
    }
    return notification.is_read ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />;
  };

  return (
    <>
      <Helmet>
        <title>صندوق الوارد | الإشعارات</title>
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pb-32 md:pb-8">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">صندوق الوارد</h1>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 
                    ? `لديك ${unreadCount} إشعار${unreadCount > 1 ? "ات" : ""} غير مقروء${unreadCount > 1 ? "ة" : ""}`
                    : "لا توجد إشعارات جديدة"
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {readNotificationsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    deleteAllRead();
                    toast.success("تم حذف الإشعارات المقروءة");
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف المقروءة ({readNotificationsCount})
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead()}
                >
                  <Check className="h-4 w-4 ml-2" />
                  تحديد الكل كمقروء
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <InboxIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  صندوق الوارد فارغ
                </h3>
                <p className="text-muted-foreground">
                  ستظهر هنا الإشعارات والرسائل الواردة من الإدارة
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    !notification.is_read && "border-primary/50 bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        notification.is_read 
                          ? "bg-muted text-muted-foreground" 
                          : "bg-primary/10 text-primary"
                      )}>
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={cn(
                            "text-base",
                            !notification.is_read && "font-semibold"
                          )}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                  toast.success("تم حذف الإشعار");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {!notification.is_read && (
                              <Badge variant="default" className="text-xs">
                                جديد
                              </Badge>
                            )}
                            {notification.type === "broadcast" && (
                              <Badge variant="secondary" className="text-xs">
                                للجميع
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                          <span>
                            {format(new Date(notification.created_at), "dd/MM/yyyy", { locale: ar })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Inbox;
