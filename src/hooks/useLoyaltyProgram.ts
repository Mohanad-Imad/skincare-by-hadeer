import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LoyaltySettings {
  id: string;
  is_active: boolean;
  points_per_currency: number;
  currency_per_point: number;
  redemption_rate: number;
  min_redemption_points: number;
  welcome_bonus: number;
}

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  total_earned: number;
  total_redeemed: number;
}

type TransactionType = 'earned' | 'redeemed' | 'bonus' | 'adjustment';

interface PointsTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  points: number;
  transaction_type: TransactionType;
  description_ar: string | null;
  description_en: string | null;
  created_at: string;
}

export const useLoyaltySettings = () => {
  return useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: async (): Promise<LoyaltySettings | null> => {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
};

export const useUserPoints = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-points', userId],
    queryFn: async (): Promise<UserPoints | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const usePointsTransactions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['points-transactions', userId],
    queryFn: async (): Promise<PointsTransaction[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        transaction_type: item.transaction_type as TransactionType
      }));
    },
    enabled: !!userId,
  });
};

export const useRedeemPoints = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, points }: { userId: string; points: number }) => {
      const { data, error } = await supabase.rpc('redeem_points', {
        p_user_id: userId,
        p_points: points,
      });
      
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });
    },
    onError: (error: any) => {
      console.error('Error redeeming points:', error);
      toast.error('حدث خطأ أثناء استبدال النقاط');
    },
  });
};

// Calculate points that will be earned from an amount
export const calculatePointsToEarn = (amount: number, currencyPerPoint: number): number => {
  return Math.floor(amount / currencyPerPoint);
};

// Calculate discount value from points
export const calculatePointsValue = (points: number, redemptionRate: number): number => {
  return points * redemptionRate;
};
