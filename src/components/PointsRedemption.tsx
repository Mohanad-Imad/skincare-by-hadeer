import { useState } from "react";
import { Gift, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useLoyaltySettings, useUserPoints, calculatePointsValue } from "@/hooks/useLoyaltyProgram";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { toast } from "sonner";

interface PointsRedemptionProps {
  userId: string | undefined;
  maxDiscount: number; // Maximum discount allowed (usually subtotal)
  onPointsApplied: (points: number, discount: number) => void;
  appliedPoints?: number;
}

const PointsRedemption = ({ 
  userId, 
  maxDiscount, 
  onPointsApplied,
  appliedPoints = 0 
}: PointsRedemptionProps) => {
  const { data: settings } = useLoyaltySettings();
  const { data: userPoints } = useUserPoints(userId);
  const { settings: storeSettings } = useStoreSettings();
  const [selectedPoints, setSelectedPoints] = useState(appliedPoints);
  const [isApplied, setIsApplied] = useState(appliedPoints > 0);

  if (!settings?.is_active || !userId) return null;

  const availablePoints = userPoints?.total_points || 0;
  const minPoints = settings.min_redemption_points;
  
  // Calculate max points that can be used (limited by available points and max discount)
  const maxPointsForDiscount = Math.floor(maxDiscount / settings.redemption_rate);
  const maxUsablePoints = Math.min(availablePoints, maxPointsForDiscount);
  
  const canRedeem = availablePoints >= minPoints && maxDiscount > 0;
  const discountValue = calculatePointsValue(selectedPoints, settings.redemption_rate);

  const handleApplyPoints = () => {
    if (selectedPoints < minPoints) {
      toast.error(`الحد الأدنى للاستبدال هو ${minPoints} نقطة`);
      return;
    }
    setIsApplied(true);
    onPointsApplied(selectedPoints, discountValue);
    toast.success(`تم تطبيق خصم ${discountValue.toLocaleString()} ${storeSettings?.currency}`);
  };

  const handleRemovePoints = () => {
    setIsApplied(false);
    setSelectedPoints(0);
    onPointsApplied(0, 0);
    toast.info('تم إزالة خصم النقاط');
  };

  const adjustPoints = (delta: number) => {
    const step = 10; // Adjust by 10 points at a time
    const newValue = Math.max(minPoints, Math.min(maxUsablePoints, selectedPoints + (delta * step)));
    setSelectedPoints(newValue);
  };

  if (!canRedeem) {
    return (
      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Gift className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">نقاط الولاء</p>
              <p className="text-xs">
                {availablePoints < minPoints 
                  ? `تحتاج ${minPoints - availablePoints} نقطة إضافية للاستبدال`
                  : 'رصيدك: ' + availablePoints + ' نقطة'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-medium">استبدال النقاط</span>
          </div>
          <span className="text-sm text-muted-foreground">
            متاح: {availablePoints.toLocaleString()} نقطة
          </span>
        </div>

        {isApplied ? (
          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-700">تم تطبيق {selectedPoints} نقطة</p>
                <p className="text-sm text-green-600">
                  خصم {discountValue.toLocaleString()} {storeSettings?.currency}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRemovePoints}
              className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
            >
              إزالة
            </Button>
          </div>
        ) : (
          <>
            {/* Points Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustPoints(-1)}
                  disabled={selectedPoints <= minPoints}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedPoints || minPoints}
                  </span>
                  <span className="text-sm text-muted-foreground mr-1">نقطة</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustPoints(1)}
                  disabled={selectedPoints >= maxUsablePoints}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Slider
                value={[selectedPoints || minPoints]}
                min={minPoints}
                max={maxUsablePoints}
                step={10}
                onValueChange={([value]) => setSelectedPoints(value)}
                className="py-2"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>الحد الأدنى: {minPoints}</span>
                <span>الحد الأقصى: {maxUsablePoints.toLocaleString()}</span>
              </div>
            </div>

            {/* Discount Preview */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">قيمة الخصم:</span>
              <span className="font-bold text-primary">
                {calculatePointsValue(selectedPoints || minPoints, settings.redemption_rate).toLocaleString()} {storeSettings?.currency}
              </span>
            </div>

            <Button 
              onClick={handleApplyPoints} 
              className="w-full"
              disabled={!selectedPoints || selectedPoints < minPoints}
            >
              <Gift className="h-4 w-4 ml-2" />
              تطبيق الخصم
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsRedemption;
