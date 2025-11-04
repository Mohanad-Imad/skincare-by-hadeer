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
} from "lucide-react";

interface QuickAccessCard {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  route: string;
}

const AdminHome = () => {
  const navigate = useNavigate();

  const cards: QuickAccessCard[] = [
    {
      title: "المنتجات",
      description: "إدارة المنتجات والمخزون",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      route: "/admin/products",
    },
    {
      title: "الفئات",
      description: "تنظيم فئات المنتجات",
      icon: FolderTree,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      route: "/admin/categories",
    },
    {
      title: "التسوق حسب المشكلة",
      description: "إدارة المشاكل والحلول",
      icon: Grid3x3,
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-50 hover:bg-fuchsia-100",
      route: "/admin/problem-categories",
    },
    {
      title: "الطلبات",
      description: "متابعة وإدارة الطلبات",
      icon: ShoppingBag,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
      route: "/admin/orders",
    },
    {
      title: "أكواد الخصم",
      description: "إنشاء وإدارة أكواد الخصم",
      icon: Ticket,
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
      route: "/admin/discount-codes",
    },
    {
      title: "خصومات المنتجات",
      description: "تطبيق خصومات على المنتجات",
      icon: Percent,
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
      route: "/admin/product-discounts",
    },
    {
      title: "البنرات الرئيسية",
      description: "إدارة بنرات الصفحة الرئيسية",
      icon: Image,
      color: "text-pink-600",
      bgColor: "bg-pink-50 hover:bg-pink-100",
      route: "/admin/banners",
    },
    {
      title: "البنرات الثانوية",
      description: "بنرات إعلانية إضافية",
      icon: Images,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
      route: "/admin/secondary-banners",
    },
    {
      title: "البنرات الثلاثية",
      description: "بنرات ترويجية أخرى",
      icon: ImagePlus,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 hover:bg-cyan-100",
      route: "/admin/tertiary-banners",
    },
    {
      title: "بنر المكياج",
      description: "إدارة بنر قسم المكياج",
      icon: Palette,
      color: "text-pink-600",
      bgColor: "bg-pink-50 hover:bg-pink-100",
      route: "/admin/makeup-banner",
    },
    {
      title: "أقسام المكياج",
      description: "إدارة أقسام وأنواع المكياج",
      icon: Grid3x3,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      route: "/admin/makeup-categories",
    },
    {
      title: "الروابط السريعة",
      description: "روابط الوصول السريع",
      icon: Link,
      color: "text-teal-600",
      bgColor: "bg-teal-50 hover:bg-teal-100",
      route: "/admin/quick-links",
    },
    {
      title: "ماركاتنا",
      description: "إدارة الماركات والعلامات",
      icon: Star,
      color: "text-amber-600",
      bgColor: "bg-amber-50 hover:bg-amber-100",
      route: "/admin/brands-links",
    },
    {
      title: "المدونة",
      description: "نشر وإدارة المقالات",
      icon: FileText,
      color: "text-slate-600",
      bgColor: "bg-slate-50 hover:bg-slate-100",
      route: "/admin/blog-posts",
    },
    {
      title: "الاستشارات",
      description: "متابعة طلبات الاستشارات",
      icon: MessageSquare,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 hover:bg-emerald-100",
      route: "/admin/consultations",
    },
    {
      title: "روتينات المشاهير",
      description: "إدارة روتينات العناية",
      icon: Users,
      color: "text-rose-600",
      bgColor: "bg-rose-50 hover:bg-rose-100",
      route: "/admin/celebrity-routines",
    },
    {
      title: "الإحصائيات",
      description: "عرض تقارير المبيعات",
      icon: BarChart3,
      color: "text-violet-600",
      bgColor: "bg-violet-50 hover:bg-violet-100",
      route: "/admin/analytics",
    },
    {
      title: "إعدادات الشحن",
      description: "تكوين خيارات التوصيل",
      icon: Truck,
      color: "text-lime-600",
      bgColor: "bg-lime-50 hover:bg-lime-100",
      route: "/admin/shipping-settings",
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
              className={`${card.bgColor} rounded-xl p-6 text-right transition-all duration-300 hover:shadow-lg hover:scale-105 border border-transparent hover:border-current`}
            >
              <div className="flex flex-col gap-3">
                <div className={`${card.color} w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{card.title}</h3>
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
