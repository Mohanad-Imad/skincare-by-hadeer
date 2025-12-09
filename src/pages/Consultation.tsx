import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const concernOptions = [
  { value: "acne", label: "حب الشباب" },
  { value: "pigmentation", label: "التصبغات أو الكلف" },
  { value: "freckles", label: "النمش" },
  { value: "wrinkles", label: "التجاعيد أو علامات التقدم بالعمر" },
  { value: "dryness", label: "الجفاف الشديد" },
  { value: "large_pores", label: "المسامات الواسعة" },
  { value: "redness", label: "الاحمرار أو الحساسية" },
  { value: "brightening", label: "تفتيح البشرة وتوحيد اللون" },
  { value: "other", label: "مشكلة أخرى" },
];

const consultationSchema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  gender: z.enum(["male", "female"]),
  age: z.coerce.number().min(13, "العمر يجب أن يكون 13 عاماً على الأقل").max(120),
  phone: z.string().min(10, "رقم الهاتف غير صحيح"),
  location: z.string().min(2, "الموقع مطلوب"),
  skin_type: z.string().optional(),
  main_concerns: z.array(z.string()).min(1, "يجب اختيار مشكلة واحدة على الأقل"),
  other_concern: z.string().optional(),
  problem_duration: z.string(),
  previous_treatment: z.boolean(),
  previous_treatment_details: z.string().optional(),
  face_wash_frequency: z.string(),
  cleanser_type: z.string().optional(),
  uses_moisturizer: z.boolean(),
  moisturizer_type: z.string().optional(),
  uses_sunscreen: z.boolean(),
  uses_serums: z.boolean(),
  serum_details: z.string().optional(),
  removes_makeup: z.string(),
  sun_exposure: z.string(),
  work_environment: z.string().optional(),
  daily_water_intake: z.string(),
  smoking_alcohol: z.boolean(),
  balanced_diet: z.boolean(),
  stress_levels: z.boolean(),
  chronic_diseases: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  uses_contraceptives: z.boolean().optional(),
  is_pregnant_nursing: z.boolean().optional(),
  additional_notes: z.string().optional(),
  consultation_preference: z.string(),
  preferred_contact_time: z.string(),
  product_preference: z.string(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

export default function Consultation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      main_concerns: [],
      previous_treatment: false,
      uses_moisturizer: false,
      uses_sunscreen: false,
      uses_serums: false,
      smoking_alcohol: false,
      balanced_diet: false,
      stress_levels: false,
      uses_contraceptives: false,
      is_pregnant_nursing: false,
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedImages.length > 5) {
      toast.error("يمكنك رفع 5 صور كحد أقصى");
      return;
    }
    setUploadedImages([...uploadedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      setIsSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("يجب تسجيل الدخول أولاً");
        navigate("/auth");
        return;
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const file of uploadedImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('consultation-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('consultation-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Create consultation
      const consultationData = {
        user_id: session.user.id,
        full_name: data.full_name,
        gender: data.gender,
        age: data.age,
        phone: data.phone,
        location: data.location,
        skin_type: data.skin_type || null,
        main_concerns: data.main_concerns,
        other_concern: data.other_concern || null,
        problem_duration: data.problem_duration,
        previous_treatment: data.previous_treatment,
        previous_treatment_details: data.previous_treatment_details || null,
        face_wash_frequency: data.face_wash_frequency,
        cleanser_type: data.cleanser_type || null,
        uses_moisturizer: data.uses_moisturizer,
        moisturizer_type: data.moisturizer_type || null,
        uses_sunscreen: data.uses_sunscreen,
        uses_serums: data.uses_serums,
        serum_details: data.serum_details || null,
        removes_makeup: data.removes_makeup,
        sun_exposure: data.sun_exposure,
        work_environment: data.work_environment || null,
        daily_water_intake: data.daily_water_intake,
        smoking_alcohol: data.smoking_alcohol,
        balanced_diet: data.balanced_diet,
        stress_levels: data.stress_levels,
        chronic_diseases: data.chronic_diseases || null,
        current_medications: data.current_medications || null,
        allergies: data.allergies || null,
        uses_contraceptives: data.uses_contraceptives || null,
        is_pregnant_nursing: data.is_pregnant_nursing || null,
        image_urls: imageUrls,
        additional_notes: data.additional_notes || null,
        consultation_preference: data.consultation_preference,
        preferred_contact_time: data.preferred_contact_time,
        product_preference: data.product_preference,
      };

      const { error } = await supabase.from('consultations').insert([consultationData]);

      if (error) throw error;

      toast.success("تم إرسال الاستشارة بنجاح! سنتواصل معك قريباً");
      navigate("/my-orders");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error submitting consultation:", error);
      }
      toast.error("حدث خطأ أثناء إرسال الاستشارة. يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO 
        title="استشارة مع خبير | العناية بالبشرة"
        description="احصل على استشارة مخصصة مع خبراء العناية بالبشرة. املأ الاستبيان وسنساعدك في إيجاد الحل الأمثل لبشرتك"
      />
      
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          الرجوع إلى الصفحة الرئيسية
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">استشارة مع خبير</h1>
          <p className="text-muted-foreground">
            املأ الاستبيان التالي بعناية لنتمكن من تقديم أفضل استشارة مخصصة لبشرتك
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* القسم الأول: المعلومات الشخصية */}
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الشخصية الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنس *</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          value={field.value}
                          className="flex gap-6 justify-end"
                        >
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <FormLabel htmlFor="female" className="font-normal">أنثى</FormLabel>
                            <RadioGroupItem value="female" id="female" />
                          </div>
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <FormLabel htmlFor="male" className="font-normal">ذكر</FormLabel>
                            <RadioGroupItem value="male" id="male" />
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العمر *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموقع الجغرافي (المدينة/البلد) *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skin_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع البشرة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع البشرة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="oily">دهنية</SelectItem>
                          <SelectItem value="dry">جافة</SelectItem>
                          <SelectItem value="combination">مختلطة</SelectItem>
                          <SelectItem value="normal">عادية</SelectItem>
                          <SelectItem value="sensitive">حساسة</SelectItem>
                          <SelectItem value="unknown">غير متأكد</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* القسم الثاني: المشاكل الرئيسية */}
            <Card>
              <CardHeader>
                <CardTitle>المشاكل أو الأهداف الرئيسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="main_concerns"
                  render={() => (
                    <FormItem>
                      <FormLabel>ما هي المشكلة أو الهدف الأساسي؟ *</FormLabel>
                      {concernOptions.map((concern) => (
                        <FormField
                          key={concern.value}
                          control={form.control}
                          name="main_concerns"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(concern.value)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), concern.value]
                                      : field.value?.filter((v) => v !== concern.value) || [];
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{concern.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("main_concerns")?.includes("other") && (
                  <FormField
                    control={form.control}
                    name="other_concern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اذكر المشكلة الأخرى</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="problem_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>منذ متى بدأت هذه المشكلة؟ *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المدة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="less_than_month">أقل من شهر</SelectItem>
                          <SelectItem value="1_6_months">1-6 أشهر</SelectItem>
                          <SelectItem value="more_than_6_months">أكثر من 6 أشهر</SelectItem>
                          <SelectItem value="years">منذ سنوات</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previous_treatment"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        هل سبق أن استشرت طبيب جلدية أو استخدمت علاجاً؟
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("previous_treatment") && (
                  <FormField
                    control={form.control}
                    name="previous_treatment_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تفاصيل العلاج السابق</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* القسم الثالث: روتين العناية */}
            <Card>
              <CardHeader>
                <CardTitle>روتين العناية اليومي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="face_wash_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كم مرة تغسل وجهك يومياً؟ *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: مرتين يومياً" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cleanser_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الغسول المستخدم</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uses_moisturizer"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">هل تستخدم مرطباً؟</FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("uses_moisturizer") && (
                  <FormField
                    control={form.control}
                    name="moisturizer_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع المرطب</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="uses_sunscreen"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">هل تستخدم واقي شمس؟</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uses_serums"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        هل تستخدم سيرومات أو منتجات مخصصة؟
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("uses_serums") && (
                  <FormField
                    control={form.control}
                    name="serum_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تفاصيل السيرومات</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="removes_makeup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>هل تزيل المكياج قبل النوم؟ *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="always">دائماً</SelectItem>
                          <SelectItem value="sometimes">أحياناً</SelectItem>
                          <SelectItem value="rarely">نادراً</SelectItem>
                          <SelectItem value="na">لا ينطبق</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* القسم الرابع: نمط الحياة */}
            <Card>
              <CardHeader>
                <CardTitle>العوامل الخارجية ونمط الحياة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sun_exposure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التعرض لأشعة الشمس *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rarely">نادراً</SelectItem>
                          <SelectItem value="sometimes">أحياناً</SelectItem>
                          <SelectItem value="daily">يومياً</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="work_environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بيئة العمل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: مكتب، خارجي، مغبر" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="daily_water_intake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>معدل شرب الماء يومياً *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: 2 لتر، 8 أكواب" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smoking_alcohol"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        هل التدخين أو الكحول جزء من نمط حياتك؟
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balanced_diet"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">هل لديك نظام غذائي متوازن؟</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stress_levels"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        هل تمر بفترات توتر أو ضغط نفسي متكرر؟
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* القسم الخامس: الحالة الصحية */}
            <Card>
              <CardHeader>
                <CardTitle>الحالة الصحية العامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="chronic_diseases"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأمراض المزمنة</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="مثال: السكري، الغدة الدرقية، الحساسية" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأدوية الحالية</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحساسية من أي مكونات</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("gender") === "female" && (
                  <>
                    <FormField
                      control={form.control}
                      name="uses_contraceptives"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">هل تستخدمين موانع حمل؟</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_pregnant_nursing"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            هل تمرين بفترة حمل أو رضاعة؟
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* القسم السادس: الصور والملاحظات */}
            <Card>
              <CardHeader>
                <CardTitle>الصور والملاحظات</CardTitle>
                <CardDescription>رفع الصور يساعد كثيراً في التشخيص الدقيق</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FormLabel>صور البشرة (اختياري - حتى 5 صور)</FormLabel>
                  <div className="mt-2">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">اضغط لرفع الصور</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="additional_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* القسم السابع: التفضيلات */}
            <Card>
              <CardHeader>
                <CardTitle>التفضيلات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="consultation_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الاستشارة المفضل *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="written">استشارة كتابية</SelectItem>
                          <SelectItem value="voice">مكالمة صوتية</SelectItem>
                          <SelectItem value="video">مكالمة مرئية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_contact_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوقت الأنسب للتواصل *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: صباحاً، مساءً، نهاية الأسبوع" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="product_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تفضيل المنتجات *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="medical">منتجات علاجية طبية</SelectItem>
                          <SelectItem value="natural">منتجات طبيعية/عضوية</SelectItem>
                          <SelectItem value="both">كلاهما</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال الاستشارة"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
