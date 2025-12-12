import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
interface CelebrityRoutine {
  id: string;
  celebrity_name_ar: string;
  celebrity_name_en: string;
  image_url: string | null;
  country_ar: string;
  country_en: string;
  skin_type: string;
  tagline_ar: string | null;
  tagline_en: string | null;
}
export default function CelebrityRoutines() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<CelebrityRoutine[]>([]);
  const [filteredRoutines, setFilteredRoutines] = useState<CelebrityRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  useEffect(() => {
    fetchRoutines();
  }, []);
  useEffect(() => {
    filterRoutines();
  }, [routines, skinTypeFilter, regionFilter]);
  const fetchRoutines = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("celebrity_routines").select("*").eq("is_active", true).order("display_order", {
        ascending: true
      });
      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error fetching routines:", error);
      toast.error("حدث خطأ في تحميل الروتينات");
    } finally {
      setLoading(false);
    }
  };
  const filterRoutines = () => {
    let filtered = [...routines];
    if (skinTypeFilter !== "all") {
      filtered = filtered.filter(r => r.skin_type === skinTypeFilter);
    }
    if (regionFilter !== "all") {
      filtered = filtered.filter(r => {
        // @ts-ignore - region field exists in database
        return r.region === regionFilter;
      });
    }
    setFilteredRoutines(filtered);
  };
  const getSkinTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      oily: "دهنية",
      dry: "جافة",
      combination: "مختلطة",
      sensitive: "حساسة",
      normal: "عادية"
    };
    return types[type] || type;
  };
  return <>
      <SEO title="روتين المشاهير - استشارات العناية بالبشرة" description="اكتشفي روتينات العناية بالبشرة الخاصة بالمشاهير والمؤثرين، جربي روتيناتهم واحصلي على بشرة مثالية" />

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 py-12">
          <div className="container mx-auto px-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
              <ArrowRight className="h-4 w-4" />
              الرجوع إلى الصفحة الرئيسية
            </Button>

            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">روتين المشاهير</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent my-[5px] py-[5px]">
                أسرار جمال المشاهير
              </h1>
              <p className="text-muted-foreground text-lg">
                اكتشفي روتينات العناية بالبشرة المفضلة للمشاهير والمؤثرين حول العالم
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 pb-24">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Select value={skinTypeFilter} onValueChange={setSkinTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="نوع البشرة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع أنواع البشرة</SelectItem>
                <SelectItem value="oily">دهنية</SelectItem>
                <SelectItem value="dry">جافة</SelectItem>
                <SelectItem value="combination">مختلطة</SelectItem>
                <SelectItem value="sensitive">حساسة</SelectItem>
                <SelectItem value="normal">عادية</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="المنطقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المناطق</SelectItem>
                <SelectItem value="كوريا">كوريا</SelectItem>
                <SelectItem value="الخليج">الخليج</SelectItem>
                <SelectItem value="أوروبا">أوروبا</SelectItem>
                <SelectItem value="أمريكا">أمريكا</SelectItem>
                <SelectItem value="آسيا">آسيا</SelectItem>
                <SelectItem value="أخرى">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Celebrity Cards Grid */}
          {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-muted" />
                      <div className="w-32 h-6 bg-muted rounded" />
                      <div className="w-24 h-4 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>)}
            </div> : filteredRoutines.length === 0 ? <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                لا توجد روتينات متاحة بهذه الفلاتر
              </p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoutines.map(routine => <Card key={routine.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50" onClick={() => navigate(`/celebrity-routines/${routine.id}`)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <Avatar className="w-24 h-24 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        <AvatarImage src={routine.image_url || ""} alt={routine.celebrity_name_ar} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                          {routine.celebrity_name_ar.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-2 w-full">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                          {routine.celebrity_name_ar}
                        </h3>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {routine.country_ar}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getSkinTypeLabel(routine.skin_type)}
                          </Badge>
                        </div>
                        {routine.tagline_ar && <p className="text-sm text-muted-foreground italic">
                            "{routine.tagline_ar}"
                          </p>}
                      </div>

                      <Button className="w-full group-hover:bg-primary/90" size="lg">
                        عرض الروتين الكامل
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </div>
      </div>
    </>;
}