import { useNavigate } from "react-router-dom";
import {
  Package,
  FolderTree,
  ShoppingBag,
  Ticket,
  Percent,
  Image,
  Images,
  ImagePlus,
  Link,
  Star,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Truck,
  Grid3x3,
  Palette,
  Settings,
  MessageCircle,
  Bell,
  UserCircle,
  Boxes,
  ShieldCheck,
  Megaphone,
  Mail,
} from "lucide-react";

interface QuickAccessCard {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
}

const AdminHome = () => {
  const navigate = useNavigate();

  const cards: QuickAccessCard[] = [
    {
      title: "الإحصائيات",
      description: "عرض تقارير المبيعات والأداء",
      icon: BarChart3,
      route: "/admin/analytics",
    },
    {
      title: "الإشعارات",
      description: "عرض جميع الإشعارات والتنبيهات",
      icon: Bell,
      route: "/admin/notifications",
    },
    {
      title: "رسائل المستخدمين",
      description: "إرسال إشعارات ورسائل للمستخدمين",
      icon: Mail,
      route: "/admin/user-notifications",
    },
    {
      title: "المستخدمين",
      description: "إدارة ومتابعة المستخدمين",
      icon: UserCircle,
      route: "/admin/users",
    },
    {
      title: "آراء العملاء",
      description: "مراجعة والموافقة على آراء العملاء",
      icon: MessageCircle,
      route: "/admin/customer-reviews",
    },
    {
      title: "تقييمات المنتجات",
      description: "إدارة تقييمات المنتجات",
      icon: Star,
      route: "/admin/product-reviews",
    },
    {
      title: "المنتجات",
      description: "إدارة المنتجات والمخزون",
      icon: Package,
      route: "/admin/products",
    },
    {
      title: "المخزون",
      description: "متابعة الكميات المتوفرة",
      icon: Boxes,
      route: "/admin/inventory",
    },
    {
      title: "الطلبات",
      description: "متابعة وإدارة الطلبات",
      icon: ShoppingBag,
      route: "/admin/orders",
    },
    {
      title: "الاستشارات",
      description: "متابعة طلبات الاستشارات",
      icon: MessageSquare,
      route: "/admin/consultations",
    },
    {
      title: "روتين المشاهير",
      description: "إدارة روتينات العناية",
      icon: Users,
      route: "/admin/celebrity-routines",
    },
    {
      title: "التصنيفات",
      description: "تنظيم فئات المنتجات",
      icon: FolderTree,
      route: "/admin/categories",
    },
    {
      title: "التسوق حسب المشكلة",
      description: "إدارة المشاكل والحلول",
      icon: Grid3x3,
      route: "/admin/problem-categories",
    },
    {
      title: "أكواد الخصم",
      description: "إنشاء وإدارة أكواد الخصم",
      icon: Ticket,
      route: "/admin/discount-codes",
    },
    {
      title: "خصومات المنتجات",
      description: "تطبيق خصومات على المنتجات",
      icon: Percent,
      route: "/admin/product-discounts",
    },
    {
      title: "إعدادات التوصيل",
      description: "تكوين خيارات التوصيل",
      icon: Truck,
      route: "/admin/shipping-settings",
    },
    {
      title: "إعدادات الضمان",
      description: "إدارة صفحة الضمان والاسترجاع",
      icon: ShieldCheck,
      route: "/admin/guarantee",
    },
    {
      title: "إعدادات المتجر",
      description: "تخصيص المتجر ومعلومات الاتصال",
      icon: Settings,
      route: "/admin/store-settings",
    },
    {
      title: "شريط الإعلانات",
      description: "إدارة رسائل شريط الإعلانات",
      icon: Megaphone,
      route: "/admin/announcement-bar",
    },
    {
      title: "المدونة",
      description: "نشر وإدارة المقالات",
      icon: FileText,
      route: "/admin/blog-posts",
    },
    {
      title: "البنرات الرئيسية",
      description: "إدارة بنرات الصفحة الرئيسية",
      icon: Image,
      route: "/admin/banners",
    },
    {
      title: "البنرات الثانوية",
      description: "بنرات إعلانية إضافية",
      icon: Images,
      route: "/admin/secondary-banners",
    },
    {
      title: "البنرات العلوية",
      description: "بنرات ترويجية أخرى",
      icon: ImagePlus,
      route: "/admin/tertiary-banners",
    },
    {
      title: "بنر المكياج",
      description: "إدارة بنر قسم المكياج",
      icon: Palette,
      route: "/admin/makeup-banner",
    },
    {
      title: "أقسام المكياج",
      description: "إدارة أقسام وأنواع المكياج",
      icon: Grid3x3,
      route: "/admin/makeup-categories",
    },
    {
      title: "الروابط السريعة",
      description: "روابط الوصول السريع",
      icon: Link,
      route: "/admin/quick-links",
    },
    {
      title: "روابط التنقل",
      description: "إدارة روابط النافبار والسايدبار",
      icon: Link,
      route: "/admin/navigation-links",
    },
    {
      title: "ماركاتنا",
      description: "إدارة الماركات والعلامات",
      icon: Star,
      route: "/admin/brands-links",
    },
    {
      title: "لمح للحبايب",
      description: "إدارة قسم لمح للحبايب",
      icon: Star,
      route: "/admin/drop-hint-settings",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">مرحباً بك في لوحة التحكم</h2>
        <p className="text-muted-foreground">اختر القسم الذي تريد إدارته</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.route}
              onClick={() => navigate(card.route)}
              className="bg-card hover:bg-accent rounded-xl p-6 text-right transition-all duration-300 hover:shadow-lg hover:scale-105 border border-border"
            >
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-foreground">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHome;
