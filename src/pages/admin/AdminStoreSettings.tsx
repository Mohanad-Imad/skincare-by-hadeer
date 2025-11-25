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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  const [showLiveActivityFeed, setShowLiveActivityFeed] = useState(true);
  // Light mode colors with better contrast
  const [lightBackground, setLightBackground] = useState("#FCF7F8");
  const [lightForeground, setLightForeground] = useState("#2D1B1F");
  const [lightCard, setLightCard] = useState("#FFFFFF");
  const [lightPrimary, setLightPrimary] = useState("#E91E63");
  const [lightSecondary, setLightSecondary] = useState("#F8BBD0");
  const [lightAccent, setLightAccent] = useState("#F48FB1");
  const [lightMuted, setLightMuted] = useState("#F5E6E8");
  const [lightBorder, setLightBorder] = useState("#F8BBD0");
  
  // Dark mode colors with better contrast
  const [darkBackground, setDarkBackground] = useState("#1A1114");
  const [darkForeground, setDarkForeground] = useState("#F5E6E8");
  const [darkCard, setDarkCard] = useState("#2D1B1F");
  const [darkPrimary, setDarkPrimary] = useState("#F06292");
  const [darkSecondary, setDarkSecondary] = useState("#3D2329");
  const [darkAccent, setDarkAccent] = useState("#4D2D34");
  const [darkMuted, setDarkMuted] = useState("#2D1B1F");
  const [darkBorder, setDarkBorder] = useState("#4D2D34");
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
      setShowLiveActivityFeed(settings.show_live_activity_feed ?? true);
      
      // Convert HSL to HEX for color pickers
      if (settings.light_background) setLightBackground(hslToHex(settings.light_background));
      if (settings.light_foreground) setLightForeground(hslToHex(settings.light_foreground));
      if (settings.light_card) setLightCard(hslToHex(settings.light_card));
      if (settings.light_primary) setLightPrimary(hslToHex(settings.light_primary));
      if (settings.light_secondary) setLightSecondary(hslToHex(settings.light_secondary));
      if (settings.light_accent) setLightAccent(hslToHex(settings.light_accent));
      if (settings.light_muted) setLightMuted(hslToHex(settings.light_muted));
      if (settings.light_border) setLightBorder(hslToHex(settings.light_border));
      
      if (settings.dark_background) setDarkBackground(hslToHex(settings.dark_background));
      if (settings.dark_foreground) setDarkForeground(hslToHex(settings.dark_foreground));
      if (settings.dark_card) setDarkCard(hslToHex(settings.dark_card));
      if (settings.dark_primary) setDarkPrimary(hslToHex(settings.dark_primary));
      if (settings.dark_secondary) setDarkSecondary(hslToHex(settings.dark_secondary));
      if (settings.dark_accent) setDarkAccent(hslToHex(settings.dark_accent));
      if (settings.dark_muted) setDarkMuted(hslToHex(settings.dark_muted));
      if (settings.dark_border) setDarkBorder(hslToHex(settings.dark_border));
    }
  }, [settings]);

  // Helper function to convert HSL to HEX
  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    
    let r, g, b;
    if (s === 0) {
      r = g = b = lDecimal;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
      const p = 2 * lDecimal - q;
      r = hue2rgb(p, q, hDecimal + 1/3);
      g = hue2rgb(p, q, hDecimal);
      b = hue2rgb(p, q, hDecimal - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Helper function to convert HEX to HSL
  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "";
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };

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
    mutationFn: async (updates: any) => {
      const settingsData = updates;

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

  const resetToDefaultMutation = useMutation({
    mutationFn: async () => {
      const defaultColors = {
        light_background: hexToHsl("#FCF7F8"),
        light_foreground: hexToHsl("#2D1B1F"),
        light_card: hexToHsl("#FFFFFF"),
        light_primary: hexToHsl("#E91E63"),
        light_secondary: hexToHsl("#F8BBD0"),
        light_accent: hexToHsl("#F48FB1"),
        light_muted: hexToHsl("#F5E6E8"),
        light_border: hexToHsl("#F8BBD0"),
        dark_background: hexToHsl("#1A1114"),
        dark_foreground: hexToHsl("#F5E6E8"),
        dark_card: hexToHsl("#2D1B1F"),
        dark_primary: hexToHsl("#F06292"),
        dark_secondary: hexToHsl("#3D2329"),
        dark_accent: hexToHsl("#4D2D34"),
        dark_muted: hexToHsl("#2D1B1F"),
        dark_border: hexToHsl("#4D2D34"),
      };
      
      const { error } = await supabase
        .from("store_settings" as any)
        .update(defaultColors)
        .eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("تم إرجاع ألوان الموقع الافتراضية بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ في إرجاع الألوان");
      console.error(error);
    },
  });

  const handleSaveBasicInfo = () => {
    updateSettingsMutation.mutate({
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
      show_live_activity_feed: showLiveActivityFeed,
    });
  };

  const handleSaveColors = () => {
    updateSettingsMutation.mutate({
      light_background: hexToHsl(lightBackground),
      light_foreground: hexToHsl(lightForeground),
      light_card: hexToHsl(lightCard),
      light_primary: hexToHsl(lightPrimary),
      light_secondary: hexToHsl(lightSecondary),
      light_accent: hexToHsl(lightAccent),
      light_muted: hexToHsl(lightMuted),
      light_border: hexToHsl(lightBorder),
      dark_background: hexToHsl(darkBackground),
      dark_foreground: hexToHsl(darkForeground),
      dark_card: hexToHsl(darkCard),
      dark_primary: hexToHsl(darkPrimary),
      dark_secondary: hexToHsl(darkSecondary),
      dark_accent: hexToHsl(darkAccent),
      dark_muted: hexToHsl(darkMuted),
      dark_border: hexToHsl(darkBorder),
    });
  };

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
            <div className="space-y-2">
              <Label htmlFor="showLiveActivityFeed">عرض إشعارات النشاط المباشر</Label>
              <div className="flex items-center gap-3">
                <Switch
                  id="showLiveActivityFeed"
                  checked={showLiveActivityFeed}
                  onCheckedChange={setShowLiveActivityFeed}
                />
                <span className="text-sm text-muted-foreground">
                  عرض إشعارات الطلبات والتقييمات الجديدة في أسفل الصفحة للزوار
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveBasicInfo}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ المعلومات الأساسية"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>ألوان الموقع</CardTitle>
                <CardDescription>تخصيص ألوان الموقع بالكامل للوضع النهاري والليلي (HEX)</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => resetToDefaultMutation.mutate()}
                disabled={resetToDefaultMutation.isPending}
              >
                إرجاع للإعدادات الافتراضية
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">الوضع النهاري</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lightBackground">الخلفية</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightBackground"
                      type="color"
                      value={lightBackground}
                      onChange={(e) => setLightBackground(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightBackground}
                      onChange={(e) => setLightBackground(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#FCF7F8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lightForeground">النص</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightForeground"
                      type="color"
                      value={lightForeground}
                      onChange={(e) => setLightForeground(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightForeground}
                      onChange={(e) => setLightForeground(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#2D1B1F"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lightCard">الكروت</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightCard"
                      type="color"
                      value={lightCard}
                      onChange={(e) => setLightCard(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightCard}
                      onChange={(e) => setLightCard(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lightPrimary">اللون الأساسي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightPrimary"
                      type="color"
                      value={lightPrimary}
                      onChange={(e) => setLightPrimary(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightPrimary}
                      onChange={(e) => setLightPrimary(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#E91E63"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lightSecondary">اللون الثانوي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightSecondary"
                      type="color"
                      value={lightSecondary}
                      onChange={(e) => setLightSecondary(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightSecondary}
                      onChange={(e) => setLightSecondary(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#F8BBD0"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lightAccent">لون التمييز</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightAccent"
                      type="color"
                      value={lightAccent}
                      onChange={(e) => setLightAccent(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightAccent}
                      onChange={(e) => setLightAccent(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#F48FB1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lightMuted">اللون الباهت</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightMuted"
                      type="color"
                      value={lightMuted}
                      onChange={(e) => setLightMuted(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightMuted}
                      onChange={(e) => setLightMuted(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#F5E6E8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lightBorder">الحدود</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightBorder"
                      type="color"
                      value={lightBorder}
                      onChange={(e) => setLightBorder(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={lightBorder}
                      onChange={(e) => setLightBorder(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#F8BBD0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">الوضع الليلي</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="darkBackground">الخلفية</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkBackground"
                      type="color"
                      value={darkBackground}
                      onChange={(e) => setDarkBackground(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkBackground}
                      onChange={(e) => setDarkBackground(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#1A1114"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="darkForeground">النص</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkForeground"
                      type="color"
                      value={darkForeground}
                      onChange={(e) => setDarkForeground(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkForeground}
                      onChange={(e) => setDarkForeground(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#F5E6E8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="darkCard">الكروت</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkCard"
                      type="color"
                      value={darkCard}
                      onChange={(e) => setDarkCard(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkCard}
                      onChange={(e) => setDarkCard(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#2D1B1F"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="darkPrimary">اللون الأساسي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkPrimary"
                      type="color"
                      value={darkPrimary}
                      onChange={(e) => setDarkPrimary(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkPrimary}
                      onChange={(e) => setDarkPrimary(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#F06292"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="darkSecondary">اللون الثانوي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkSecondary"
                      type="color"
                      value={darkSecondary}
                      onChange={(e) => setDarkSecondary(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkSecondary}
                      onChange={(e) => setDarkSecondary(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#3D2329"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="darkAccent">لون التمييز</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkAccent"
                      type="color"
                      value={darkAccent}
                      onChange={(e) => setDarkAccent(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkAccent}
                      onChange={(e) => setDarkAccent(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#4D2D34"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="darkMuted">اللون الباهت</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkMuted"
                      type="color"
                      value={darkMuted}
                      onChange={(e) => setDarkMuted(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkMuted}
                      onChange={(e) => setDarkMuted(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#2D1B1F"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="darkBorder">الحدود</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkBorder"
                      type="color"
                      value={darkBorder}
                      onChange={(e) => setDarkBorder(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={darkBorder}
                      onChange={(e) => setDarkBorder(e.target.value)}
                      className="flex-1 h-10 text-xs"
                      placeholder="#4D2D34"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveColors}
              disabled={updateSettingsMutation.isPending}
              className="w-full"
            >
              حفظ الألوان
            </Button>
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
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveBasicInfo}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ المعلومات"}
              </Button>
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
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveBasicInfo}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ المعلومات"}
              </Button>
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
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveBasicInfo}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ المعلومات"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveBasicInfo}
            disabled={updateSettingsMutation.isPending}
            size="lg"
          >
            {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ المعلومات الأساسية"}
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
