import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Chrome, Mail, Phone, Smartphone } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emailAuthSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح").max(255, "البريد الإلكتروني طويل جداً"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(100, "كلمة المرور طويلة جداً"),
  fullName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً").optional(),
});

const phoneSchema = z.object({
  phone: z.string()
    .min(7, "رقم الهاتف يجب أن يكون 7 أرقام على الأقل")
    .max(12, "رقم الهاتف طويل جداً")
    .regex(/^[0-9]+$/, "رقم الهاتف يجب أن يحتوي على أرقام فقط"),
});

const countryCodes = [
  { code: "+964", name: "العراق", flag: "🇮🇶" },
  { code: "+966", name: "السعودية", flag: "🇸🇦" },
  { code: "+971", name: "الإمارات", flag: "🇦🇪" },
  { code: "+965", name: "الكويت", flag: "🇰🇼" },
  { code: "+973", name: "البحرين", flag: "🇧🇭" },
  { code: "+974", name: "قطر", flag: "🇶🇦" },
  { code: "+968", name: "عُمان", flag: "🇴🇲" },
  { code: "+962", name: "الأردن", flag: "🇯🇴" },
  { code: "+961", name: "لبنان", flag: "🇱🇧" },
  { code: "+963", name: "سوريا", flag: "🇸🇾" },
  { code: "+20", name: "مصر", flag: "🇪🇬" },
  { code: "+212", name: "المغرب", flag: "🇲🇦" },
  { code: "+216", name: "تونس", flag: "🇹🇳" },
  { code: "+213", name: "الجزائر", flag: "🇩🇿" },
  { code: "+90", name: "تركيا", flag: "🇹🇷" },
];

type AuthMethod = "email" | "phone";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+964");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
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
  }, [navigate, redirectTo]);

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

  // إرسال رمز OTP إلى رقم الهاتف
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // التحقق من صحة رقم الهاتف
      try {
        phoneSchema.parse({ phone });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          toast.error(validationError.errors[0].message);
          setLoading(false);
          return;
        }
      }

      const fullPhoneNumber = `${countryCode}${phone}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhoneNumber,
      });

      if (error) throw error;

      setShowOtpInput(true);
      toast.success("تم إرسال رمز التحقق إلى هاتفك");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Phone OTP error:", error);
      }
      toast.error("فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  // التحقق من رمز OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${phone}`;
      
      const { error } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      
      // سيتم التوجيه تلقائياً عبر onAuthStateChange
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("OTP verification error:", error);
      }
      toast.error("رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // التحقق من صحة البيانات
      const validationData = isLogin ? { email, password } : { email, password, fullName };
      
      try {
        emailAuthSchema.parse(validationData);
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

  // عرض شاشة إدخال رمز OTP
  if (showOtpInput) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
        <div className="w-full max-w-md">
          <Card className="w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">أدخل رمز التحقق</CardTitle>
              <CardDescription className="text-base">
                تم إرسال رمز التحقق إلى رقم هاتفك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground mb-2">تم إرسال الرمز إلى:</p>
                <p className="font-medium text-foreground" dir="ltr">{countryCode}{phone}</p>
              </div>
              
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? "جاري التحقق..." : "تأكيد"}
                </Button>
              </form>

              <div className="pt-4 space-y-3">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleSendOtp({ preventDefault: () => {} } as React.FormEvent)}
                  disabled={loading}
                >
                  إعادة إرسال الرمز
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                  }}
                >
                  تغيير رقم الهاتف
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

            {/* Auth Method Tabs */}
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </TabsTrigger>
                <TabsTrigger value="phone" className="gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
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
              </TabsContent>

              <TabsContent value="phone" className="mt-4">
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <div className="flex gap-2" dir="ltr">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[140px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {countryCodes.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <span className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.code}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="7xxxxxxxxx"
                        required
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      اختر رمز الدولة ثم أدخل رقم الهاتف بدون الصفر الأول
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !phone}>
                    {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

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