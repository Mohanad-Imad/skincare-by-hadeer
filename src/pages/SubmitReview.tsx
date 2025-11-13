import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, MessageCircle, Upload, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const reviewSchema = z.object({
  customer_name: z.string()
    .trim()
    .min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
    .max(100, { message: "الاسم يجب أن يكون أقل من 100 حرف" }),
  rating: z.number()
    .min(1, { message: "يرجى اختيار التقييم" })
    .max(5),
  comment: z.string()
    .trim()
    .min(10, { message: "الرأي يجب أن يكون 10 أحرف على الأقل" })
    .max(1000, { message: "الرأي يجب أن يكون أقل من 1000 حرف" }),
  customer_image: z.instanceof(File).optional().nullable(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function SubmitReview() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      customer_name: "",
      rating: 0,
      comment: "",
      customer_image: null,
    },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("يجب تسجيل الدخول لإضافة رأيك");
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Pre-fill name from profile if available
      setTimeout(() => {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.full_name) {
              form.setValue("customer_name", data.full_name);
            }
          });
      }, 0);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        toast.error("يجب تسجيل الدخول لإضافة رأيك");
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("يجب أن يكون الملف صورة");
        return;
      }

      form.setValue("customer_image", file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue("customer_image", null);
    setImagePreview(null);
  };

  const onSubmit = async (values: ReviewFormValues) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول لإضافة رأيك");
      navigate("/auth");
      return;
    }

    if (values.rating === 0) {
      toast.error("يرجى اختيار التقييم");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (values.customer_image) {
        const fileExt = values.customer_image.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("customer-reviews")
          .upload(fileName, values.customer_image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("customer-reviews")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await (supabase as any)
        .from("customer_reviews")
        .insert({
          user_id: user.id,
          customer_name: values.customer_name.trim(),
          rating: values.rating,
          comment: values.comment.trim(),
          customer_image: imageUrl,
          status: "pending",
        });

      if (error) throw error;

      toast.success("تم إرسال رأيك بنجاح! سيتم مراجعته قبل النشر");
      form.reset();
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("حدث خطأ أثناء إرسال رأيك");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, isInteractive = false) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-8 w-8 transition-all ${
          index < (isInteractive ? hoveredRating || rating : rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        } ${isInteractive ? "cursor-pointer hover:scale-110" : ""}`}
        onClick={isInteractive ? () => form.setValue("rating", index + 1) : undefined}
        onMouseEnter={isInteractive ? () => setHoveredRating(index + 1) : undefined}
        onMouseLeave={isInteractive ? () => setHoveredRating(0) : undefined}
      />
    ));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <SEO
        title="شاركنا رأيك - تقييمات العملاء"
        description="شارك تجربتك مع منتجاتنا وخدماتنا. رأيك مهم لنا ولعملائنا الآخرين"
      />
      <Navbar />

      <div className="container mx-auto px-4 py-12" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <MessageCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl">شاركنا رأيك</CardTitle>
              <CardDescription className="text-base">
                نحن نقدر آراء عملائنا. شاركنا تجربتك مع منتجاتنا وخدماتنا
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">الاسم *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسمك"
                            {...field}
                            className="text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">التقييم *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 py-2">
                            {renderStars(field.value, true)}
                          </div>
                        </FormControl>
                        <FormDescription>
                          اختر عدد النجوم من 1 إلى 5
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">رأيك *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="شاركنا تجربتك مع منتجاتنا وخدماتنا..."
                            className="min-h-[120px] text-base resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value.length}/1000 حرف
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_image"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-base">صورتك (اختياري)</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {!imagePreview ? (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">اضغط لرفع الصورة</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    PNG, JPG أو WEBP (بحد أقصى 5MB)
                                  </p>
                                </div>
                                <Input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  {...field}
                                />
                              </label>
                            ) : (
                              <div className="relative">
                                <img
                                  src={imagePreview}
                                  alt="معاينة"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 left-2"
                                  onClick={removeImage}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          يمكنك إضافة صورتك الشخصية
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">
                      📝 <strong>ملاحظة:</strong> سيتم مراجعة رأيك من قبل فريقنا قبل نشره على الموقع.
                      نشكرك على مشاركتك!
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                      size="lg"
                    >
                      {isSubmitting ? "جاري الإرسال..." : "إرسال الرأي"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/")}
                      size="lg"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
