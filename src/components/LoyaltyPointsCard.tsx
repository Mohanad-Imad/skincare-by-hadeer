import { Gift, Star, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoyaltySettings, useUserPoints, calculatePointsValue } from "@/hooks/useLoyaltyProgram";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";

interface LoyaltyPointsCardProps {
  userId: string | undefined;
  compact?: boolean;
}

const LoyaltyPointsCard = ({ userId, compact = false }: LoyaltyPointsCardProps) => {
  const { data: settings, isLoading: settingsLoading } = useLoyaltySettings();
  const { data: userPoints, isLoading: pointsLoading } = useUserPoints(userId);
  const { settings: storeSettings } = useStoreSettings();

  if (!settings?.is_active) return null;

  if (settingsLoading || pointsLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const points = userPoints?.total_points || 0;
  const totalEarned = userPoints?.total_earned || 0;
  const totalRedeemed = userPoints?.total_redeemed || 0;
  const pointsValue = calculatePointsValue(points, settings.redemption_rate);
  const canRedeem = points >= settings.min_redemption_points;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 px-3 py-2 rounded-lg border border-primary/20">
        <Gift className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{points}</span>
        <span className="text-xs text-muted-foreground">نقطة</span>
        {canRedeem && (
          <Badge variant="secondary" className="text-xs">
            قابلة للاستبدال
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-primary/20 rounded-full">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          برنامج الولاء
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Balance */}
        <div className="text-center py-4 bg-background/50 rounded-xl border border-border/50">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <span className="text-4xl font-bold text-primary">{points.toLocaleString()}</span>
          </div>
          <p className="text-sm text-muted-foreground">نقطة متاحة</p>
          {points > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              تساوي {pointsValue.toLocaleString()} {storeSettings?.currency}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">إجمالي المكتسب</p>
              <p className="font-semibold text-green-600">{totalEarned.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">إجمالي المستبدل</p>
              <p className="font-semibold text-orange-600">{totalRedeemed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Redemption Info */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          {canRedeem ? (
            <p className="text-sm text-green-600 font-medium">
              ✓ يمكنك استبدال نقاطك عند الدفع
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              تحتاج {settings.min_redemption_points - points} نقطة إضافية للاستبدال
            </p>
          )}
        </div>

        {/* How it works */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
          <p>• اكسب نقطة واحدة لكل {settings.currency_per_point.toLocaleString()} {storeSettings?.currency} تنفقها</p>
          <p>• كل {settings.min_redemption_points} نقطة = {calculatePointsValue(settings.min_redemption_points, settings.redemption_rate).toLocaleString()} {storeSettings?.currency} خصم</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoyaltyPointsCard;
