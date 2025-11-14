import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { useState, useEffect } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AdminStoreSettings = () => {
  const { isAdmin, isLoading: isLoadingAdmin } = useAdminCheck();
  const queryClient = useQueryClient();
  const [storeName, setStoreName] = useState("");
  const [currency, setCurrency] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [aboutAr, setAboutAr] = useState("");
  const [aboutEn, setAboutEn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressAr, setAddressAr] = useState("");
  const [addressEn, setAddressEn] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [footerTextAr, setFooterTextAr] = useState("");
  const [footerTextEn, setFooterTextEn] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: priceHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["price-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_history" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name || "");
      setCurrency(settings.currency || "");
      setLogoUrl(settings.logo_url || "");
      setAboutAr(settings.about_ar || "");
      setAboutEn(settings.about_en || "");
      setPhone(settings.phone || "");
      setEmail(settings.email || "");
      setAddressAr(settings.address_ar || "");
      setAddressEn(settings.address_en || "");
      setFacebookUrl(settings.facebook_url || "");
      setInstagramUrl(settings.instagram_url || "");
      setTiktokUrl(settings.tiktok_url || "");
      setWhatsappUrl(settings.whatsapp_url || "");
      setFooterTextAr(settings.footer_text_ar || "");
      setFooterTextEn(settings.footer_text_en || "");
      setPrimaryColor(settings.theme_primary_color || "");
      setSecondaryColor(settings.theme_secondary_color || "");
      setAccentColor(settings.theme_accent_color || "");
    }
  }, [settings]);

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast.success("تم رفع الشعار بنجاح");
    } catch (error: any) {
      toast.error("فشل رفع الشعار: " + error.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const settingsData = {
        store_name: storeName,
        currency: currency,
        logo_url: logoUrl || null,
        about_ar: aboutAr,
        about_en: aboutEn,
        phone: phone,
        email: email,
        address_ar: addressAr,
        address_en: addressEn,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        tiktok_url: tiktokUrl,
        whatsapp_url: whatsappUrl,
        footer_text_ar: footerTextAr,
        footer_text_en: footerTextEn,
        theme_primary_color: primaryColor || '330 81% 65%',
        theme_secondary_color: secondaryColor || '60 4.8% 95.9%',
        theme_accent_color: accentColor || '60 4.8% 95.9%',
      };

      if (!settings?.id) {
        // Create new settings
        const { error } = await supabase
          .from("store_settings" as any)
          .insert(settingsData as any);
        if (error) throw error;
      } else {
        // Update existing settings
        const { error } = await supabase
          .from("store_settings" as any)
          .update(settingsData as any)
          .eq("id", settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ الإعدادات"),
  });

  const updatePricesMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(priceAdjustment);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("يرجى إدخال مبلغ صحيح");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("المستخدم غير مسجل");

      const adjustmentAmount = adjustmentType === "increase" ? amount : -amount;

      const { data, error } = await supabase.rpc("update_all_product_prices" as any, {
        amount_to_add: adjustmentAmount,
        p_change_type: adjustmentType,
        p_admin_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["price-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`تم تحديث أسعار ${data?.[0]?.updated_count || 0} منتج بنجاح`);
      setPriceAdjustment("");
      setShowConfirmDialog(false);
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ أثناء تحديث الأسعار"),
  });

  const handlePriceUpdate = () => {
    const amount = parseFloat(priceAdjustment);
    if (isNaN(amount) || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    setShowConfirmDialog(true);
  };

  if (isLoadingAdmin || isLoading) return <div className="p-8">جاري التحميل...</div>;
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-6">
      <AdminBackButton />
      
      {/* Store Settings Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
            <CardDescription>قم بتعديل معلومات المتجر الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">اسم المتجر</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="أدخل اسم المتجر"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">العملة</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="أدخل العملة (مثال: ريال، دينار)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoFile">شعار المتجر (رفع صورة)</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      handleLogoUpload(file);
                    }
                  }}
                  disabled={isUploadingLogo}
                />
                {logoUrl && (
                  <div className="mt-2">
                    <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                  </div>
                )}
                {isUploadingLogo && <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ألوان المتجر</CardTitle>
            <CardDescription>تخصيص ألوان المتجر (قيم HSL)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">اللون الأساسي</Label>
                <Input
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="مثال: 330 81% 65%"
                />
                <p className="text-xs text-muted-foreground">صيغة HSL بدون hsl()</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                <Input
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="مثال: 60 4.8% 95.9%"
                />
                <p className="text-xs text-muted-foreground">صيغة HSL بدون hsl()</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">لون التمييز</Label>
                <Input
                  id="accentColor"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="مثال: 60 4.8% 95.9%"
                />
                <p className="text-xs text-muted-foreground">صيغة HSL بدون hsl()</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نبذة عن المتجر</CardTitle>
            <CardDescription>معلومات تعريفية عن المتجر</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aboutAr">النبذة (عربي)</Label>
              <Input
                id="aboutAr"
                value={aboutAr}
                onChange={(e) => setAboutAr(e.target.value)}
                placeholder="أدخل النبذة بالعربية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aboutEn">النبذة (English)</Label>
              <Input
                id="aboutEn"
                value={aboutEn}
                onChange={(e) => setAboutEn(e.target.value)}
                placeholder="Enter description in English"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معلومات الاتصال</CardTitle>
            <CardDescription>بيانات التواصل مع المتجر</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+964XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressAr">العنوان (عربي)</Label>
                <Input
                  id="addressAr"
                  value={addressAr}
                  onChange={(e) => setAddressAr(e.target.value)}
                  placeholder="أدخل العنوان بالعربية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressEn">العنوان (English)</Label>
                <Input
                  id="addressEn"
                  value={addressEn}
                  onChange={(e) => setAddressEn(e.target.value)}
                  placeholder="Enter address in English"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>روابط التواصل الاجتماعي</CardTitle>
            <CardDescription>روابط حساباتك على مواقع التواصل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">رابط Facebook</Label>
                <Input
                  id="facebookUrl"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">رابط Instagram</Label>
                <Input
                  id="instagramUrl"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl">رابط TikTok</Label>
                <Input
                  id="tiktokUrl"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappUrl">رابط WhatsApp</Label>
                <Input
                  id="whatsappUrl"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="footerTextAr">نص التابعنا (عربي)</Label>
                <Input
                  id="footerTextAr"
                  value={footerTextAr}
                  onChange={(e) => setFooterTextAr(e.target.value)}
                  placeholder="أدخل النص بالعربية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerTextEn">نص التابعنا (English)</Label>
                <Input
                  id="footerTextEn"
                  value={footerTextEn}
                  onChange={(e) => setFooterTextEn(e.target.value)}
                  placeholder="Enter text in English"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={() => updateSettingsMutation.mutate()}
            disabled={updateSettingsMutation.isPending}
            size="lg"
          >
            {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ جميع الإعدادات"}
          </Button>
        </div>
      </div>

      {/* Bulk Price Management Card */}
      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>إدارة الأسعار الجماعية</CardTitle>
          <CardDescription>
            تحديث أسعار جميع المنتجات دفعة واحدة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="adjustment-type">نوع التعديل</Label>
            <Select value={adjustmentType} onValueChange={(value: "increase" | "decrease") => setAdjustmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">زيادة السعر</SelectItem>
                <SelectItem value="decrease">تخفيض السعر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-adjustment">المبلغ ({currency || "دينار"})</Label>
            <Input
              id="price-adjustment"
              type="number"
              value={priceAdjustment}
              onChange={(e) => setPriceAdjustment(e.target.value)}
              placeholder="مثال: 1000"
              min="0"
              step="0.01"
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>ملاحظة:</strong> سيتم تطبيق التعديل على جميع المنتجات في المتجر.
              الأسعار الجديدة ستعمل مع جميع الخصومات والكوبونات بالطريقة المعتادة.
            </p>
          </div>

          <Button 
            onClick={handlePriceUpdate}
            disabled={updatePricesMutation.isPending || !priceAdjustment}
            variant="default"
            className="w-full"
          >
            {updatePricesMutation.isPending ? "جاري التحديث..." : "تطبيق التعديل على جميع المنتجات"}
          </Button>
        </CardContent>
      </Card>

      {/* Price History Card */}
      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>سجل تغييرات الأسعار</CardTitle>
          <CardDescription>
            آخر 10 تعديلات على الأسعار
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <p className="text-center text-muted-foreground">جاري التحميل...</p>
          ) : !priceHistory || priceHistory.length === 0 ? (
            <p className="text-center text-muted-foreground">لا توجد تعديلات سابقة</p>
          ) : (
            <div className="space-y-3">
              {priceHistory.map((record: any) => (
                <div key={record.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {record.change_type === "increase" ? "زيادة" : "تخفيض"} بمقدار {record.change_amount} {currency || "دينار"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      تم تحديث {record.affected_products_count} منتج
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.created_at), "dd MMMM yyyy", { locale: ar })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(record.created_at), "hh:mm a", { locale: ar })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد التعديل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من {adjustmentType === "increase" ? "زيادة" : "تخفيض"} أسعار جميع المنتجات بمقدار {priceAdjustment} {currency || "دينار"}؟
              <br />
              <br />
              <strong>تحذير:</strong> هذا الإجراء سيؤثر على جميع المنتجات في المتجر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updatePricesMutation.mutate()}
              disabled={updatePricesMutation.isPending}
            >
              {updatePricesMutation.isPending ? "جاري التحديث..." : "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStoreSettings;
