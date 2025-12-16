import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useProductDiscounts } from "@/hooks/useProductDiscounts";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, isLoading: favoritesLoading, userId, removeFromFavorites, updateFavoriteQuantity } = useFavorites();
  const { addToLocalCart } = useLocalCart();
  const { data: discounts } = useProductDiscounts();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Redirect to auth if not logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  // Stable product IDs for query key
  const productIds = favorites.map(f => f.product_id).sort().join(',');

  // Fetch products data for favorites with optimized caching
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["favorites-products", productIds],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      const ids = favorites.map(f => f.product_id);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name_ar,
          company_name_ar,
          image_url,
          product_variants(id, size_ar, price),
          product_images(image_url)
        `)
        .in("id", ids)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
    enabled: favorites.length > 0 && !favoritesLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      if (!userId) {
        addToLocalCart(variantId, quantity);
        return;
      }
      
      // Check if item exists in cart
      const { data: existing } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId)
        .eq("product_variant_id", variantId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({
            user_id: userId,
            product_variant_id: variantId,
            quantity,
          });
      }
    },
  });

  const handleSelectAll = () => {
    if (selectedItems.length === favorites.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(favorites.map(f => f.product_id));
    }
  };

  const handleSelectItem = (productId: string) => {
    setSelectedItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddSelectedToCart = async () => {
    if (selectedItems.length === 0) {
      toast.error("يرجى اختيار منتج واحد على الأقل");
      return;
    }

    let addedCount = 0;
    for (const productId of selectedItems) {
      const favorite = favorites.find(f => f.product_id === productId);
      const product = productsData?.find(p => p.id === productId);
      
      if (favorite && product) {
        const variantId = favorite.variant_id || product.product_variants?.[0]?.id;
        if (variantId) {
          await addToCartMutation.mutateAsync({ 
            variantId, 
            quantity: favorite.quantity 
          });
          addedCount++;
        }
      }
    }
    
    if (addedCount > 0) {
      toast.success(`تمت إضافة ${addedCount} منتج إلى السلة`);
      // Dispatch cart update event
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
  };

  const handleAddAllToCart = async () => {
    let addedCount = 0;
    for (const favorite of favorites) {
      const product = productsData?.find(p => p.id === favorite.product_id);
      if (product) {
        const variantId = favorite.variant_id || product.product_variants?.[0]?.id;
        if (variantId) {
          await addToCartMutation.mutateAsync({ 
            variantId, 
            quantity: favorite.quantity 
          });
          addedCount++;
        }
      }
    }
    
    if (addedCount > 0) {
      toast.success(`تمت إضافة ${addedCount} منتج إلى السلة`);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateFavoriteQuantity.mutate({ productId, quantity: newQuantity });
  };

  const handleVariantChange = (productId: string, variantId: string) => {
    const favorite = favorites.find(f => f.product_id === productId);
    if (favorite) {
      updateFavoriteQuantity.mutate({ 
        productId, 
        quantity: favorite.quantity, 
        variantId 
      });
    }
  };

  const getProductDiscount = (productId: string) => {
    return discounts?.find(d => d.product_id === productId);
  };

  const isLoading = favoritesLoading || productsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-32 md:pb-8">
      <SEO 
        title="المفضلة"
        description="قائمة المنتجات المفضلة لديك"
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <h1 className="text-2xl font-bold">المفضلة</h1>
          {favorites.length > 0 && (
            <span className="text-muted-foreground">({favorites.length} منتج)</span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">قائمة المفضلة فارغة</h2>
            <p className="text-muted-foreground mb-4">
              أضف منتجاتك المفضلة من خلال الضغط على أيقونة القلب
            </p>
            <Button onClick={() => navigate("/products")}>
              تصفح المنتجات
            </Button>
          </div>
        ) : (
          <>
            {/* Actions bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedItems.length === favorites.length && favorites.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm cursor-pointer">
                  تحديد الكل
                </label>
              </div>
              
              <div className="hidden sm:block flex-1" />
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSelectedToCart}
                  disabled={selectedItems.length === 0}
                  className="gap-2 w-full sm:w-auto"
                >
                  <ShoppingCart className="h-4 w-4" />
                  إضافة المحدد ({selectedItems.length})
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleAddAllToCart}
                  className="gap-2 w-full sm:w-auto"
                >
                  <ShoppingCart className="h-4 w-4" />
                  إضافة الكل للسلة
                </Button>
              </div>
            </div>

            {/* Favorites grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((favorite) => {
                const product = productsData?.find(p => p.id === favorite.product_id);
                if (!product) return null;
                
                const variants = product.product_variants || [];
                const selectedVariant = variants.find(v => v.id === favorite.variant_id) || variants[0];
                const discount = getProductDiscount(product.id);
                const originalPrice = selectedVariant?.price || 0;
                const finalPrice = discount 
                  ? originalPrice * (1 - discount.discount_percentage / 100)
                  : originalPrice;
                const imageUrl = product.product_images?.[0]?.image_url || product.image_url;

                return (
                  <Card key={favorite.id} className="p-4 relative">
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedItems.includes(product.id)}
                          onCheckedChange={() => handleSelectItem(product.id)}
                        />
                      </div>

                      {/* Image */}
                      <div 
                        className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted cursor-pointer"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={product.name_ar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            بدون صورة
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          {product.name_ar}
                        </h3>
                        
                        {product.company_name_ar && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.company_name_ar}
                          </p>
                        )}

                        {/* Variant selector */}
                        {variants.length > 1 && (
                          <Select
                            value={favorite.variant_id || variants[0]?.id}
                            onValueChange={(value) => handleVariantChange(product.id, value)}
                          >
                            <SelectTrigger className="h-7 text-xs mt-2 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {variants.map((variant) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.size_ar} - {Math.round(variant.price)} د.ع
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Price */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-bold text-primary">
                            {Math.round(finalPrice)} د.ع
                          </span>
                          {discount && (
                            <span className="text-xs text-muted-foreground line-through">
                              {Math.round(originalPrice)} د.ع
                            </span>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">الكمية:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleQuantityChange(product.id, favorite.quantity - 1)}
                              disabled={favorite.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {favorite.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleQuantityChange(product.id, favorite.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromFavorites.mutate(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
