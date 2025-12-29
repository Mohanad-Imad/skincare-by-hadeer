import { useState, useMemo } from "react";
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
  Gift,
  PackageOpen,
  Coins,
  Tag,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QuickAccessCard {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  keywords?: string[];
}

const AdminHome = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const cards: QuickAccessCard[] = [
    {
      title: "الإحصائيات",
      description: "عرض تقارير المبيعات والأداء",
      icon: BarChart3,
      route: "/admin/analytics",
      keywords: ["احصائيات", "تقارير", "مبيعات", "analytics"],
    },
    {
      title: "الإشعارات",
      description: "عرض جميع الإشعارات والتنبيهات",
      icon: Bell,
      route: "/admin/notifications",
      keywords: ["اشعارات", "تنبيهات", "notifications"],
    },
    {
      title: "رسائل المستخدمين",
      description: "إرسال إشعارات ورسائل للمستخدمين",
      icon: Mail,
      route: "/admin/user-notifications",
      keywords: ["رسائل", "مستخدمين", "ارسال"],
    },
    {
      title: "المستخدمين",
      description: "إدارة ومتابعة المستخدمين",
      icon: UserCircle,
      route: "/admin/users",
      keywords: ["مستخدمين", "عملاء", "users"],
    },
    {
      title: "آراء العملاء",
      description: "مراجعة والموافقة على آراء العملاء",
      icon: MessageCircle,
      route: "/admin/customer-reviews",
      keywords: ["اراء", "عملاء", "تعليقات", "reviews"],
    },
    {
      title: "تقييمات المنتجات",
      description: "إدارة تقييمات المنتجات",
      icon: Star,
      route: "/admin/product-reviews",
      keywords: ["تقييمات", "منتجات", "نجوم"],
    },
    {
      title: "المنتجات",
      description: "إدارة المنتجات والمخزون",
      icon: Package,
      route: "/admin/products",
      keywords: ["منتجات", "اضافة", "تعديل", "products"],
    },
    {
      title: "المخزون",
      description: "متابعة الكميات المتوفرة",
      icon: Boxes,
      route: "/admin/inventory",
      keywords: ["مخزون", "كميات", "متوفر", "inventory"],
    },
    {
      title: "الطلبات",
      description: "متابعة وإدارة الطلبات",
      icon: ShoppingBag,
      route: "/admin/orders",
      keywords: ["طلبات", "orders", "شراء"],
    },
    {
      title: "الاستشارات",
      description: "متابعة طلبات الاستشارات",
      icon: MessageSquare,
      route: "/admin/consultations",
      keywords: ["استشارات", "طلب استشارة"],
    },
    {
      title: "روتين المشاهير",
      description: "إدارة روتينات العناية",
      icon: Users,
      route: "/admin/celebrity-routines",
      keywords: ["مشاهير", "روتين", "عناية"],
    },
    {
      title: "التصنيفات",
      description: "تنظيم فئات المنتجات",
      icon: FolderTree,
      route: "/admin/categories",
      keywords: ["تصنيفات", "فئات", "categories"],
    },
    {
      title: "التسوق حسب المشكلة",
      description: "إدارة المشاكل والحلول",
      icon: Grid3x3,
      route: "/admin/problem-categories",
      keywords: ["مشكلة", "مشاكل", "بشرة"],
    },
    {
      title: "أكواد الخصم",
      description: "إنشاء وإدارة أكواد الخصم",
      icon: Ticket,
      route: "/admin/discount-codes",
      keywords: ["خصم", "كوبون", "اكواد", "discount"],
    },
    {
      title: "خصومات المنتجات",
      description: "تطبيق خصومات على المنتجات",
      icon: Percent,
      route: "/admin/product-discounts",
      keywords: ["خصومات", "تخفيضات", "عروض"],
    },
    {
      title: "منتج الأسبوع",
      description: "عرض خاص أسبوعي بسعر مخفض",
      icon: Gift,
      route: "/admin/weekly-product",
      keywords: ["اسبوع", "عرض", "خاص"],
    },
    {
      title: "مجموعة الأسبوع",
      description: "باقة منتجات بسعر خاص",
      icon: PackageOpen,
      route: "/admin/weekly-bundle",
      keywords: ["مجموعة", "باقة", "bundle"],
    },
    {
      title: "برنامج الولاء",
      description: "إدارة نقاط الولاء والمكافآت",
      icon: Coins,
      route: "/admin/loyalty-program",
      keywords: ["ولاء", "نقاط", "مكافآت", "loyalty"],
    },
    {
      title: "إعدادات التوصيل",
      description: "تكوين خيارات التوصيل",
      icon: Truck,
      route: "/admin/shipping-settings",
      keywords: ["توصيل", "شحن", "delivery"],
    },
    {
      title: "إعدادات الضمان",
      description: "إدارة صفحة الضمان والاسترجاع",
      icon: ShieldCheck,
      route: "/admin/guarantee",
      keywords: ["ضمان", "استرجاع", "guarantee"],
    },
    {
      title: "إعدادات المتجر",
      description: "تخصيص المتجر ومعلومات الاتصال",
      icon: Settings,
      route: "/admin/store-settings",
      keywords: ["اعدادات", "متجر", "settings"],
    },
    {
      title: "شريط الإعلانات",
      description: "إدارة رسائل شريط الإعلانات",
      icon: Megaphone,
      route: "/admin/announcement-bar",
      keywords: ["اعلانات", "شريط", "announcement"],
    },
    {
      title: "المدونة",
      description: "نشر وإدارة المقالات",
      icon: FileText,
      route: "/admin/blog-posts",
      keywords: ["مدونة", "مقالات", "blog"],
    },
    {
      title: "البنرات الرئيسية",
      description: "إدارة بنرات الصفحة الرئيسية",
      icon: Image,
      route: "/admin/banners",
      keywords: ["بنرات", "صور", "banners"],
    },
    {
      title: "البنرات الثانوية",
      description: "بنرات إعلانية إضافية",
      icon: Images,
      route: "/admin/secondary-banners",
      keywords: ["بنرات", "ثانوية"],
    },
    {
      title: "البنرات العلوية",
      description: "بنرات ترويجية أخرى",
      icon: ImagePlus,
      route: "/admin/tertiary-banners",
      keywords: ["بنرات", "علوية"],
    },
    {
      title: "بنر المكياج",
      description: "إدارة بنر قسم المكياج",
      icon: Palette,
      route: "/admin/makeup-banner",
      keywords: ["مكياج", "بنر"],
    },
    {
      title: "أقسام المكياج",
      description: "إدارة أقسام وأنواع المكياج",
      icon: Grid3x3,
      route: "/admin/makeup-categories",
      keywords: ["مكياج", "اقسام"],
    },
    {
      title: "الروابط السريعة",
      description: "روابط الوصول السريع",
      icon: Link,
      route: "/admin/quick-links",
      keywords: ["روابط", "سريعة", "links"],
    },
    {
      title: "روابط التنقل",
      description: "إدارة روابط النافبار والسايدبار",
      icon: Link,
      route: "/admin/navigation-links",
      keywords: ["تنقل", "نافبار", "navigation"],
    },
    {
      title: "ماركاتنا",
      description: "إدارة الماركات والعلامات",
      icon: Tag,
      route: "/admin/brands-links",
      keywords: ["ماركات", "علامات", "brands"],
    },
    {
      title: "لمح للحبايب",
      description: "إدارة قسم لمح للحبايب",
      icon: MessageCircle,
      route: "/admin/drop-hint-settings",
      keywords: ["لمح", "حبايب", "هدية"],
    },
  ];

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    
    const query = searchQuery.toLowerCase().trim();
    return cards.filter((card) => {
      const titleMatch = card.title.toLowerCase().includes(query);
      const descMatch = card.description.toLowerCase().includes(query);
      const keywordMatch = card.keywords?.some((kw) => kw.toLowerCase().includes(query));
      return titleMatch || descMatch || keywordMatch;
    });
  }, [searchQuery, cards]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">مرحباً بك في لوحة التحكم</h2>
        <p className="text-muted-foreground">اختر القسم الذي تريد إدارته</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن قسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            عرض {filteredCards.length} من {cards.length} قسم
          </p>
        )}
      </div>

      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لم يتم العثور على أقسام تطابق البحث</p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            مسح البحث
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => {
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
      )}
    </div>
  );
};

export default AdminHome;
