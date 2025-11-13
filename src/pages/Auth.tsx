import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { useLocalCart } from "@/hooks/useLocalCart";
import { ArrowRight, Chrome } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح").max(255, "البريد الإلكتروني طويل جداً"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(100, "كلمة المرور طويلة جداً"),
  fullName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { localCart, clearLocalCart } = useLocalCart();
  
  // الحصول على صفحة التوجيه من state
  const redirectTo = (location.state as any)?.redirectTo || "/";

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate(redirectTo);
      }
    };
    checkSession();
  }, [navigate, redirectTo]);

  // نقل السلة المؤقتة إلى قاعدة البيانات بعد تسجيل الدخول
  const migrateLocalCartToDatabase = async (userId: string) => {
    if (localCart.length === 0) return;

    try {
      for (const item of localCart) {
        // التحقق من وجود العنصر في السلة
        const { data: existing } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", userId)
          .eq("product_variant_id", item.variantId)
          .maybeSingle();

        if (existing) {
          // تحديث الكمية
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + item.quantity })
            .eq("id", existing.id);
        } else {
          // إضافة عنصر جديد
          await supabase.from("cart_items").insert({
            user_id: userId,
            product_variant_id: item.variantId,
            quantity: item.quantity,
          });
        }
      }

      clearLocalCart();
      toast.success("تم نقل منتجات السلة بنجاح");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error migrating cart:", error);
      }
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Google auth error:", error);
      }
      toast.error("فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // التحقق من صحة البيانات
      const validationData = isLogin ? { email, password } : { email, password, fullName };
      
      try {
        authSchema.parse(validationData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          toast.error(validationError.errors[0].message);
          setLoading(false);
          return;
        }
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // نقل السلة المؤقتة بعد تسجيل الدخول
        if (data.user) {
          await migrateLocalCartToDatabase(data.user.id);
        }
        
        toast.success("تم تسجيل الدخول بنجاح");
        navigate(redirectTo);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        
        // نقل السلة المؤقتة بعد التسجيل
        if (data.user) {
          await migrateLocalCartToDatabase(data.user.id);
        }
        
        toast.success("تم إنشاء الحساب بنجاح");
        navigate(redirectTo);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Auth error:", error);
      }
      toast.error(isLogin ? "فشل تسجيل الدخول. يرجى التحقق من البيانات" : "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للرئيسية
        </Button>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "مرحباً بعودتك" : "انضمي إلينا اليوم"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Sign In Button */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <Chrome className="h-5 w-5" />
                {isLogin ? "تسجيل الدخول عبر Google" : "التسجيل عبر Google"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    أو
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 mt-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري التحميل..." : isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-3 text-center">
                <Button 
                  variant="link" 
                  className="text-sm"
                  onClick={() => navigate("/forgot-password")}
                >
                  نسيت كلمة المرور؟
                </Button>
              </div>
            )}

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
              </span>
              {" "}
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "إنشاء حساب جديد" : "تسجيل الدخول"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
