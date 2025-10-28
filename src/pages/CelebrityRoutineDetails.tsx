import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Heart, Sun, Moon, ShoppingBag, MessageSquare, Sparkles, ImageOff } from "lucide-react";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";

interface CelebrityRoutine {
  id: string;
  celebrity_name_ar: string;
  celebrity_name_en: string;
  image_url: string | null;
  country_ar: string;
  skin_type: string;
  tagline_ar: string | null;
  morning_routine_ar: string;
  evening_routine_ar: string;
  favorite_products: any;
  expert_notes_ar: string | null;
  tips_ar: string | null;
  view_count: number;
}

export default function CelebrityRoutineDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<CelebrityRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchRoutineDetails();
      incrementViewCount();
      checkIfSaved();
    }
  }, [id]);

  const fetchRoutineDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("celebrity_routines")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setRoutine(data);
      
      // Fetch product images
      const products = data?.favorite_products as any[];
      if (products && Array.isArray(products) && products.length > 0) {
        const productIds = products
          .filter((p: any) => p.product_id)
          .map((p: any) => p.product_id);
        
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from("products")
            .select("id, image_url")
            .in("id", productIds);
          
          if (productsData) {
            const imagesMap: Record<string, string> = {};
            productsData.forEach((product) => {
              imagesMap[product.id] = product.image_url || "";
            });
            setProductImages(imagesMap);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching routine:", error);
      toast.error("حدث خطأ في تحميل الروتين");
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      if (routine) {
        await supabase
          .from("celebrity_routines")
          .update({ view_count: routine.view_count + 1 })
          .eq("id", id);
      }
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("saved_celebrity_routines")
        .select("id")
        .eq("user_id", user.id)
        .eq("routine_id", id)
        .single();

      setIsSaved(!!data);
    } catch (error) {
      // Not saved
    }
  };

  const toggleSave = async () => {
    try {
      setSavingState(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        navigate("/auth");
        return;
      }

      if (isSaved) {
        await supabase
          .from("saved_celebrity_routines")
          .delete()
          .eq("user_id", user.id)
          .eq("routine_id", id);
        
        setIsSaved(false);
        toast.success("تم إزالة الروتين من المفضلة");
      } else {
        await supabase
          .from("saved_celebrity_routines")
          .insert({ user_id: user.id, routine_id: id });
        
        setIsSaved(true);
        toast.success("تم حفظ الروتين في المفضلة");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("حدث خطأ، حاولي مرة أخرى");
    } finally {
      setSavingState(false);
    }
  };

  const getSkinTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      oily: "دهنية",
      dry: "جافة",
      combination: "مختلطة",
      sensitive: "حساسة",
      normal: "عادية",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">الروتين غير موجود</h2>
          <Button onClick={() => navigate("/celebrity-routines")}>
            العودة للروتينات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`روتين ${routine.celebrity_name_ar} - استشارات العناية بالبشرة`}
        description={routine.tagline_ar || `اكتشفي روتين العناية بالبشرة لـ ${routine.celebrity_name_ar}`}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/celebrity-routines")}
            className="mb-6 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            الرجوع للروتينات
          </Button>

          {/* Celebrity Header */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <Avatar className="w-32 h-32 ring-4 ring-primary/30">
                  <AvatarImage src={routine.image_url || ""} alt={routine.celebrity_name_ar} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                    {routine.celebrity_name_ar.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-right space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{routine.celebrity_name_ar}</h1>
                    {routine.tagline_ar && (
                      <p className="text-lg text-muted-foreground italic">"{routine.tagline_ar}"</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <Badge variant="secondary">{routine.country_ar}</Badge>
                    <Badge variant="outline">{getSkinTypeLabel(routine.skin_type)}</Badge>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant={isSaved ? "outline" : "default"}
                  onClick={toggleSave}
                  disabled={savingState}
                  className="gap-2"
                >
                  <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "محفوظ" : "احفظ الروتين"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="morning" className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2">
              <TabsTrigger value="morning" className="gap-2 py-3">
                <Sun className="h-4 w-4" />
                الروتين الصباحي
              </TabsTrigger>
              <TabsTrigger value="evening" className="gap-2 py-3">
                <Moon className="h-4 w-4" />
                الروتين المسائي
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2 py-3">
                <ShoppingBag className="h-4 w-4" />
                المنتجات المفضلة
              </TabsTrigger>
              <TabsTrigger value="tips" className="gap-2 py-3">
                <MessageSquare className="h-4 w-4" />
                نصائح خاصة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="morning">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    الروتين الصباحي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate max-w-none" dir="rtl">
                    <div className="whitespace-pre-wrap text-right">{routine.morning_routine_ar}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evening">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-blue-500" />
                    الروتين المسائي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate max-w-none" dir="rtl">
                    <div className="whitespace-pre-wrap text-right">{routine.evening_routine_ar}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-green-500" />
                    المنتجات المفضلة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {routine.favorite_products && Array.isArray(routine.favorite_products) && routine.favorite_products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(routine.favorite_products as any[]).map((product: any, index: number) => {
                        const productImage = product.product_id ? productImages[product.product_id] : null;
                        
                        return (
                          <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
                            <CardContent className="p-0">
                              <div className="flex flex-col">
                                {/* Product Image */}
                                <div className="relative w-full h-48 bg-muted flex items-center justify-center overflow-hidden">
                                  {productImage ? (
                                    <img 
                                      src={productImage} 
                                      alt={product.name_ar}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('no-image');
                                      }}
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                      <ImageOff className="h-12 w-12" />
                                      <span className="text-sm">لا توجد صورة</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <div className="p-4">
                                  <h4 className="font-semibold mb-2">{product.name_ar}</h4>
                                  <p className="text-sm text-muted-foreground mb-3">{product.description_ar}</p>
                                  <Button 
                                    size="sm" 
                                    className="w-full" 
                                    onClick={() => {
                                      if (product.product_id) {
                                        navigate(`/products/${product.product_id}`);
                                      } else {
                                        navigate("/products");
                                      }
                                    }}
                                  >
                                    تسوق المنتج
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">لا توجد منتجات مضافة حالياً</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    نصائح خاصة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {routine.tips_ar && (
                    <div className="prose prose-slate max-w-none" dir="rtl">
                      <div className="whitespace-pre-wrap text-right">{routine.tips_ar}</div>
                    </div>
                  )}
                  
                  {routine.expert_notes_ar && (
                    <Alert className="bg-primary/5 border-primary/20">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-right">
                        <strong className="text-primary">ملاحظة الخبير:</strong>
                        <p className="mt-2">{routine.expert_notes_ar}</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {!routine.tips_ar && !routine.expert_notes_ar && (
                    <p className="text-muted-foreground text-center py-8">لا توجد نصائح مضافة حالياً</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
