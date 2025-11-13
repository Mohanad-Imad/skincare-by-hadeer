import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { toast } from "sonner";
import { Search, Package, AlertTriangle } from "lucide-react";

const AdminInventory = () => {
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminCheck();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name_ar,
          image_url,
          product_variants (
            id,
            size_ar,
            stock_quantity,
            price
          )
        `)
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ variantId, newQuantity }: { variantId: string; newQuantity: number }) => {
      const { error } = await supabase
        .from("product_variants")
        .update({ stock_quantity: newQuantity })
        .eq("id", variantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success("تم تحديث المخزون بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث المخزون");
    },
  });

  const handleStockUpdate = (variantId: string, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    updateStockMutation.mutate({ variantId, newQuantity });
  };

  const handleSetStock = (variantId: string, quantity: string) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    updateStockMutation.mutate({ variantId, newQuantity });
  };

  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">جاري التحقق من الصلاحيات...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredProducts = products?.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return product.name_ar?.toLowerCase().includes(searchLower);
  });

  const lowStockCount = products?.reduce((count, product) => {
    const lowStockVariants = product.product_variants?.filter((v: any) => v.stock_quantity > 0 && v.stock_quantity <= 5).length || 0;
    return count + lowStockVariants;
  }, 0) || 0;

  const outOfStockCount = products?.reduce((count, product) => {
    const outOfStockVariants = product.product_variants?.filter((v: any) => v.stock_quantity === 0).length || 0;
    return count + outOfStockVariants;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المخزون</h1>
          <p className="text-muted-foreground mt-2">
            متابعة وتحديث كميات المنتجات المتاحة
          </p>
        </div>
        <AdminBackButton />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              مخزون منخفض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-red-500" />
              نفذت الكمية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>جرد المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الحجم</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الكمية المتاحة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    product.product_variants?.map((variant: any) => (
                      <TableRow key={variant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name_ar}
                                className="h-12 w-12 rounded object-cover"
                              />
                            )}
                            <span className="font-medium">{product.name_ar}</span>
                          </div>
                        </TableCell>
                        <TableCell>{variant.size_ar}</TableCell>
                        <TableCell>{Math.round(variant.price)} د.ع</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={variant.stock_quantity}
                              onChange={(e) => handleSetStock(variant.id, e.target.value)}
                              className="w-20 text-center"
                              min="0"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {variant.stock_quantity === 0 ? (
                            <Badge variant="destructive">نفذت الكمية</Badge>
                          ) : variant.stock_quantity <= 5 ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              مخزون منخفض
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              متوفر
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockUpdate(variant.id, variant.stock_quantity, -1)}
                              disabled={variant.stock_quantity === 0}
                            >
                              -
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockUpdate(variant.id, variant.stock_quantity, 1)}
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockUpdate(variant.id, variant.stock_quantity, 10)}
                            >
                              +10
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد منتجات
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventory;