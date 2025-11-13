import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, ArrowRight } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح").max(255, "البريد الإلكتروني طويل جداً"),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // التحقق من صحة البريد الإلكتروني
      emailSchema.parse({ email });

      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error(error.message || "حدث خطأ أثناء إرسال البريد الإلكتروني");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">نسيت كلمة المرور؟</CardTitle>
          <CardDescription>
            {emailSent
              ? "تم إرسال رابط إعادة تعيين كلمة المرور"
              : "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="mb-2">تم إرسال رابط إعادة تعيين كلمة المرور إلى:</p>
                <p className="font-semibold">{email}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
              </p>
              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={() => navigate("/auth")}
              >
                <ArrowRight className="h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => navigate("/auth")}
              >
                <ArrowRight className="h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
