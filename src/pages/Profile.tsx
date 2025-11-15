import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, MapPin, Phone, Mail, Package, ShoppingCart, Star, LogOut, Camera } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ["user-orders", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_name_ar,
            variant_size_ar,
            quantity,
            price,
            subtotal
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["user-reviews", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await (supabase as any)
        .from("product_reviews")
        .select(`
          *,
          products (
            name_ar,
            image_url
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate("/auth");
    }
  }, [session, sessionLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setAvatarPreview(profile.avatar_url || "");
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return profile?.avatar_url;

    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("غير مسجل دخول");

      let avatarUrl = profile?.avatar_url;
      
      if (avatarFile) {
        avatarUrl = await uploadAvatar(session.user.id);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          address,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", session?.user?.id] });
      toast.success("تم تحديث البروفايل بنجاح");
      setIsEditing(false);
      setAvatarFile(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث البروفايل");
      console.error(error);
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: ["session"] });
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/");
  };

  if (sessionLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    new: "جديد",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SEO
        title="حسابي"
        description="إدارة حسابك الشخصي والطلبات"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || profile?.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {(profile?.full_name || session.user.email)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-4 w-4 text-primary-foreground" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </div>
                
                <div className="flex-1 w-full text-center md:text-right">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label>الاسم الكامل</Label>
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="أدخل اسمك الكامل"
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>رقم الهاتف</Label>
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="أدخل رقم الهاتف"
                          />
                        </div>
                        <div>
                          <Label>البريد الإلكتروني</Label>
                          <Input value={session.user.email} disabled />
                        </div>
                      </div>
                      <div>
                        <Label>العنوان</Label>
                        <Textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="أدخل عنوانك"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-xl md:text-2xl font-bold break-words">{profile?.full_name || "مستخدم جديد"}</h2>
                      <div className="flex flex-col gap-2 text-sm md:text-base text-muted-foreground">
                        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="break-all">{session.user.email}</span>
                        </div>
                        {profile?.phone && (
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile?.address && (
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="break-words line-clamp-2">{profile.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto flex-shrink-0">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={() => updateProfileMutation.mutate()}
                        disabled={updateProfileMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        حفظ التغييرات
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFullName(profile?.full_name || "");
                          setPhone(profile?.phone || "");
                          setAddress(profile?.address || "");
                          setAvatarPreview(profile?.avatar_url || "");
                          setAvatarFile(null);
                        }}
                        className="w-full md:w-auto"
                      >
                        إلغاء
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)} className="w-full md:w-auto">
                        <User className="ml-2 h-4 w-4" />
                        تعديل البروفايل
                      </Button>
                      <Button variant="destructive" onClick={handleLogout} className="w-full md:w-auto">
                        <LogOut className="ml-2 h-4 w-4" />
                        تسجيل الخروج
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">
                <Package className="ml-2 h-4 w-4" />
                طلباتي ({orders?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="ml-2 h-4 w-4" />
                تقييماتي ({reviews?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="cart" onClick={() => navigate("/cart")}>
                <ShoppingCart className="ml-2 h-4 w-4" />
                السلة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4 mt-6">
              {!orders || orders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">لا توجد طلبات بعد</p>
                    <Button className="mt-4" onClick={() => navigate("/products")}>
                      تصفح المنتجات
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order: any) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>طلب #{order.id.slice(0, 8)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(order.created_at), "d MMMM yyyy - h:mm a", {
                              locale: ar,
                            })}
                          </p>
                        </div>
                        <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.order_items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium">{item.product_name_ar}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.variant_size_ar} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-bold">{Math.round(item.subtotal)} د.ع</p>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="font-bold">المجموع الكلي:</span>
                          <span className="text-xl font-bold text-primary">
                            {Math.round(order.total_amount)} د.ع
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-6">
              {!reviews || reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">لم تضف أي تقييمات بعد</p>
                    <Button className="mt-4" onClick={() => navigate("/products")}>
                      تصفح المنتجات
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {review.products?.image_url && (
                          <img
                            src={review.products.image_url}
                            alt={review.products.name_ar}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{review.products?.name_ar}</h3>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-foreground mb-2">{review.comment}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>
                              {format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}
                            </span>
                            {review.is_approved ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                معتمد
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                قيد المراجعة
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
