import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";
import { useLocalCart } from "@/hooks/useLocalCart";
import { ArrowRight } from "lucide-react";

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
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
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
      console.error("Error migrating cart:", error);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResettingPassword(true);

    try {
      const emailSchema = z.string().email("البريد الإلكتروني غير صحيح");
      emailSchema.parse(resetEmail);

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("حدث خطأ. يرجى المحاولة مرة أخرى");
      }
    } finally {
      setIsResettingPassword(false);
    }
  };


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input data
      const validationData: any = { email, password };
      if (!isLogin) {
        validationData.fullName = fullName;
      }
      
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
      console.error("Auth error:", error);
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
            <CardTitle className="text-2xl">{isLogin ? "تسجيل الدخول" : "إنشاء حساب"}</CardTitle>
            <CardDescription>
              {isLogin ? "مرحباً بعودتك" : "انضمي إلينا اليوم"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
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
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm">
                    نسيت كلمة المرور؟
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
                    <DialogDescription>
                      أدخلي بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">البريد الإلكتروني</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isResettingPassword}>
                      {isResettingPassword ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "ليس لديك حساب؟ سجلي الآن" : "لديك حساب؟ سجلي الدخول"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;