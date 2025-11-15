import { Link } from "react-router-dom";
import { Facebook, Instagram, Music, Phone, Mail, MapPin, ShoppingBag, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Footer = () => {
  const { data: settings } = useQuery({
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

  const storeName = settings?.store_name || "متجر مستحضرات التجميل";
  const aboutText = settings?.about_ar || "نوفر لك أفضل منتجات العناية بالبشرة والجمال من أشهر العلامات التجارية العالمية بأسعار منافسة وجودة عالية.";
  const phone = settings?.phone || "+9647748209420";
  const email = settings?.email || "skincareby.hadeer@gmail.com";
  const address = settings?.address_ar || "بابل، العراق - المحاويل";
  const facebookUrl = settings?.facebook_url || "https://www.facebook.com/share/172mEBGsey/";
  const instagramUrl = settings?.instagram_url || "https://www.instagram.com/skincare.by.hadeer?igsh=MXR5cHdhMHI0cjAyZA==";
  const tiktokUrl = settings?.tiktok_url || "https://www.tiktok.com/@skincare.hadeer?_t=8rqGIXgOaBN&_r=1";
  const whatsappUrl = settings?.whatsapp_url || "https://wa.me/9647748209420";
  const footerText = settings?.footer_text_ar || "تابعونا على مواقع التواصل الاجتماعي للحصول على آخر العروض والمنتجات الجديدة";

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">{storeName}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aboutText}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  الصفحة الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  المنتجات
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  المدونة
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  سلة التسوق
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  طلباتي
                </Link>
              </li>
              <li>
                <Link to="/submit-review" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  شاركنا رأيك
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">معلومات الاتصال</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href={`tel:${phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">تابعنا</h3>
            <p className="text-sm text-muted-foreground">
              {footerText}
            </p>
            <div className="flex gap-3">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="TikTok"
              >
                <Music className="h-5 w-5" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="WhatsApp"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} جميع الحقوق محفوظة - {storeName}
          </p>
        </div>
      </div>
    </footer>
  );
};
