import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Chrome, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const authSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح").max(255, "البريد الإلكتروني طويل جداً"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(100, "كلمة المرور طويلة جداً"),
  fullName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  // الحصول على صفحة التوجيه من state
  const redirectTo = (location.state as any)?.redirectTo || "/";

  useEffect(() => {
    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // تحديث React Query cache لتحديث حالة المستخدم في جميع المكونات
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["session"] });
            queryClient.invalidateQueries({ queryKey: ["is-admin"] });
            queryClient.invalidateQueries({ queryKey: ["cart-count"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
          }, 0);
          
          // عرض رسالة النجاح عند تأكيد البريد الإلكتروني أو تسجيل الدخول
          toast.success("تم تسجيل الدخول بنجاح");
          navigate(redirectTo);
        }
      }
    );

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo, queryClient]);

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
        
        // سيتم التوجيه تلقائياً عبر onAuthStateChange
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
        
        // التحقق مما إذا كان المستخدم يحتاج تأكيد البريد الإلكتروني
        if (data.user && !data.session) {
          // المستخدم بحاجة لتأكيد البريد الإلكتروني
          setRegisteredEmail(email);
          setShowEmailConfirmation(true);
        } else {
          // تم تفعيل auto-confirm، سيتم التوجيه تلقائياً عبر onAuthStateChange
        }
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

  // عرض شاشة تأكيد البريد الإلكتروني
  if (showEmailConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
        <div className="w-full max-w-md">
          <Card className="w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">تحقق من بريدك الإلكتروني</CardTitle>
              <CardDescription className="text-base">
                تم إرسال رابط التأكيد إلى بريدك الإلكتروني
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground mb-2">تم إرسال رابط التأكيد إلى:</p>
                <p className="font-medium text-foreground" dir="ltr">{registeredEmail}</p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>يرجى فتح بريدك الإلكتروني والضغط على رابط التأكيد لإكمال عملية التسجيل.</p>
                <p>إذا لم تجد الرسالة، يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam).</p>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowEmailConfirmation(false);
                    setIsLogin(true);
                  }}
                >
                  العودة لتسجيل الدخول
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  العودة للرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
