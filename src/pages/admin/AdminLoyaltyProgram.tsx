import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Save, Users, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBackButton } from "@/components/admin/AdminBackButton";

interface LoyaltySettings {
  id: string;
  is_active: boolean;
  points_per_currency: number;
  currency_per_point: number;
  redemption_rate: number;
  min_redemption_points: number;
  welcome_bonus: number;
}

interface UserPointsWithProfile {
  id: string;
  user_id: string;
  total_points: number;
  total_earned: number;
  total_redeemed: number;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const AdminLoyaltyProgram = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);

  // Fetch loyalty settings
  const { data: loyaltySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-loyalty-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all user points
  const { data: userPoints, isLoading: pointsLoading } = useQuery({
    queryKey: ['admin-user-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_points')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      return data as unknown as UserPointsWithProfile[];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-loyalty-stats'],
    queryFn: async () => {
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points, total_earned, total_redeemed');
      
      const totalUsers = pointsData?.length || 0;
      const totalPointsCirculating = pointsData?.reduce((sum, u) => sum + u.total_points, 0) || 0;
      const totalPointsEarned = pointsData?.reduce((sum, u) => sum + u.total_earned, 0) || 0;
      const totalPointsRedeemed = pointsData?.reduce((sum, u) => sum + u.total_redeemed, 0) || 0;

      return {
        totalUsers,
        totalPointsCirculating,
        totalPointsEarned,
        totalPointsRedeemed,
      };
    },
  });

  useEffect(() => {
    if (loyaltySettings) {
      setSettings(loyaltySettings);
    }
  }, [loyaltySettings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<LoyaltySettings>) => {
      if (!settings?.id) throw new Error('No settings found');
      
      const { error } = await supabase
        .from('loyalty_settings')
        .update(newSettings)
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-settings'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    },
  });

  const handleSaveSettings = () => {
    if (!settings) return;
    updateSettingsMutation.mutate(settings);
  };

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <AdminBackButton />
        
        <div className="flex items-center gap-3 mb-6">
          <Gift className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">برنامج الولاء</h1>
            <p className="text-muted-foreground">إدارة نقاط العملاء والمكافآت</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">المستخدمين</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.totalUsers || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">النقاط المتداولة</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.totalPointsCirculating?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">إجمالي المكتسب</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.totalPointsEarned?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-muted-foreground">إجمالي المستبدل</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats?.totalPointsRedeemed?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            <TabsTrigger value="users">نقاط العملاء</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات البرنامج</CardTitle>
                <CardDescription>تحكم في كيفية اكتساب واستبدال النقاط</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : settings ? (
                  <>
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">تفعيل برنامج الولاء</Label>
                        <p className="text-sm text-muted-foreground">
                          عند التفعيل، سيتمكن العملاء من اكتساب واستبدال النقاط
                        </p>
                      </div>
                      <Switch
                        checked={settings.is_active}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, is_active: checked })
                        }
                      />
                    </div>

                    {/* Earning Settings */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">إعدادات الاكتساب</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>قيمة العملة لكل نقطة</Label>
                          <Input
                            type="number"
                            value={settings.currency_per_point}
                            onChange={(e) => 
                              setSettings({ 
                                ...settings, 
                                currency_per_point: Number(e.target.value) 
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            كل {settings.currency_per_point} دينار = 1 نقطة
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>نقاط الترحيب</Label>
                          <Input
                            type="number"
                            value={settings.welcome_bonus}
                            onChange={(e) => 
                              setSettings({ 
                                ...settings, 
                                welcome_bonus: Number(e.target.value) 
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            نقاط إضافية للمستخدمين الجدد
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Redemption Settings */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">إعدادات الاستبدال</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>قيمة النقطة الواحدة</Label>
                          <Input
                            type="number"
                            value={settings.redemption_rate}
                            onChange={(e) => 
                              setSettings({ 
                                ...settings, 
                                redemption_rate: Number(e.target.value) 
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            1 نقطة = {settings.redemption_rate} دينار خصم
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>الحد الأدنى للاستبدال</Label>
                          <Input
                            type="number"
                            value={settings.min_redemption_points}
                            onChange={(e) => 
                              setSettings({ 
                                ...settings, 
                                min_redemption_points: Number(e.target.value) 
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            أقل عدد نقاط يمكن استبداله
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <h4 className="font-medium mb-2">معاينة:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• شراء بقيمة {(settings.currency_per_point * 10).toLocaleString()} دينار = 10 نقاط</li>
                        <li>• استبدال {settings.min_redemption_points} نقطة = {(settings.min_redemption_points * settings.redemption_rate).toLocaleString()} دينار خصم</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={handleSaveSettings}
                      disabled={updateSettingsMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      <Save className="h-4 w-4 ml-2" />
                      حفظ الإعدادات
                    </Button>
                  </>
                ) : (
                  <p>لم يتم العثور على الإعدادات</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>نقاط العملاء</CardTitle>
                <CardDescription>عرض وإدارة نقاط جميع العملاء</CardDescription>
              </CardHeader>
              <CardContent>
                {pointsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : userPoints && userPoints.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>العميل</TableHead>
                          <TableHead>البريد الإلكتروني</TableHead>
                          <TableHead className="text-center">النقاط المتاحة</TableHead>
                          <TableHead className="text-center">المكتسب</TableHead>
                          <TableHead className="text-center">المستبدل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userPoints.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.profiles?.full_name || 'غير معروف'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {user.profiles?.email || '-'}
                            </TableCell>
                            <TableCell className="text-center font-bold text-primary">
                              {user.total_points.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center text-green-600">
                              {user.total_earned.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center text-orange-600">
                              {user.total_redeemed.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا يوجد عملاء لديهم نقاط بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminLoyaltyProgram;
