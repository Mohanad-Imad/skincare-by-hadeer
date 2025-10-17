import { Link } from "react-router-dom";
import { Facebook, Instagram, Music, Phone, Mail, MapPin, ShoppingBag } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary/30 border-t mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">متجر مستحضرات التجميل</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نوفر لك أفضل منتجات العناية بالبشرة والجمال من أشهر العلامات التجارية العالمية بأسعار منافسة وجودة عالية.
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
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">معلومات الاتصال</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">بابل، العراق - المحاويل </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+9647748209420" className="text-muted-foreground hover:text-primary transition-colors">
                  +964 7748209420
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a
                  href="mailto:skincareby.hadeer@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  skincareby.hadeer@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">تابعنا</h3>
            <p className="text-sm text-muted-foreground">
              تابعونا على مواقع التواصل الاجتماعي للحصول على آخر العروض والمنتجات الجديدة
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="فيسبوك"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/hadeer.2540/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="إنستغرام"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="تيك توك"
              >
                <Music className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/9647748209420"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="واتساب"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} جميع الحقوق محفوظة - متجر هدير للعناية بالبشرة
          </p>
        </div>
      </div>
    </footer>
  );
};
