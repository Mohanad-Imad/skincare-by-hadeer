import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { TrendingUp, TrendingDown, Gift, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePointsTransactions } from "@/hooks/useLoyaltyProgram";

interface PointsTransactionHistoryProps {
  userId: string | undefined;
}

const PointsTransactionHistory = ({ userId }: PointsTransactionHistoryProps) => {
  const { data: transactions, isLoading } = usePointsTransactions(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجل النقاط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            سجل النقاط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد معاملات نقاط بعد</p>
            <p className="text-sm">اطلب الآن لتبدأ بجمع النقاط!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'redeemed':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-primary" />;
      case 'adjustment':
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string, points: number) => {
    if (points > 0) return 'text-green-600';
    return 'text-orange-600';
  };

  const getTransactionBg = (type: string) => {
    switch (type) {
      case 'earned':
        return 'bg-green-500/10';
      case 'redeemed':
        return 'bg-orange-500/10';
      case 'bonus':
        return 'bg-primary/10';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          سجل النقاط
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pl-4">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-3 rounded-lg ${getTransactionBg(transaction.transaction_type)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-full">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.description_ar}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                    </p>
                  </div>
                </div>
                <div className={`font-bold ${getTransactionColor(transaction.transaction_type, transaction.points)}`}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PointsTransactionHistory;
