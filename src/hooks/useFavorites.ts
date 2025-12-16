import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setIsAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!userId && !isAuthLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addToFavorites = useMutation({
    mutationFn: async ({ productId, variantId, quantity = 1 }: { productId: string; variantId?: string; quantity?: number }) => {
      if (!userId) throw new Error("يجب تسجيل الدخول لإضافة المنتج إلى المفضلة");
      
      const { data, error } = await supabase
        .from("favorites")
        .upsert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId || null,
          quantity,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,product_id",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
      toast.success("تمت الإضافة إلى المفضلة");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error("يجب تسجيل الدخول");
      
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
      toast.success("تمت الإزالة من المفضلة");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });

  const updateFavoriteQuantity = useMutation({
    mutationFn: async ({ productId, quantity, variantId }: { productId: string; quantity: number; variantId?: string }) => {
      if (!userId) throw new Error("يجب تسجيل الدخول");
      
      const updateData: { quantity: number; updated_at: string; variant_id?: string } = {
        quantity,
        updated_at: new Date().toISOString(),
      };
      
      if (variantId !== undefined) {
        updateData.variant_id = variantId;
      }
      
      const { error } = await supabase
        .from("favorites")
        .update(updateData)
        .eq("user_id", userId)
        .eq("product_id", productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });

  const isFavorite = (productId: string) => {
    return favorites.some((fav) => fav.product_id === productId);
  };

  const getFavorite = (productId: string) => {
    return favorites.find((fav) => fav.product_id === productId);
  };

  return {
    favorites,
    isLoading: isLoading || isAuthLoading,
    userId,
    isAuthLoading,
    addToFavorites,
    removeFromFavorites,
    updateFavoriteQuantity,
    isFavorite,
    getFavorite,
  };
};
