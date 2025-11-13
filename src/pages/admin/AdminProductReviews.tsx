import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminCheck } from "@/hooks/useAdminCheck";

export default function AdminProductReviews() {
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminCheck();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-product-reviews"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_reviews")
        .select(`
          *,
          products (
            name_ar,
            name_en
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await (supabase as any)
        .from("product_reviews")
        .update({ is_approved })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] });
      toast.success("تم تحديث التقييم بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث التقييم");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("product_reviews").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] });
      toast.success("تم حذف التقييم بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف التقييم");
    },
  });

  if (isCheckingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">غير مصرح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  const pendingReviews = reviews?.filter((r) => !r.is_approved) || [];
  const approvedReviews = reviews?.filter((r) => r.is_approved) || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminBackButton />

        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">تقييمات المنتجات</h1>
            <p className="text-muted-foreground">
              إدارة ومراجعة تقييمات العملاء للمنتجات
            </p>
          </div>
        </div>

        {/* Pending Reviews */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            التقييمات بانتظار المراجعة ({pendingReviews.length})
          </h2>
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">جاري التحميل...</p>
              </CardContent>
            </Card>
          ) : pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  لا توجد تقييمات بانتظار المراجعة
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review: any) => (
                <Card key={review.id} className="border-yellow-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {review.products?.name_ar || "منتج غير معروف"}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">بانتظار المراجعة</Badge>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateReviewMutation.mutate({ id: review.id, is_approved: true })
                          }
                          disabled={updateReviewMutation.isPending}
                        >
                          <Check className="h-4 w-4 ml-1" />
                          موافقة
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteReviewMutation.mutate(review.id)}
                          disabled={deleteReviewMutation.isPending}
                        >
                          <X className="h-4 w-4 ml-1" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{review.customer_name}</span>
                        <span>•</span>
                        <span>{format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Approved Reviews */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            التقييمات المعتمدة ({approvedReviews.length})
          </h2>
          {approvedReviews.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">لا توجد تقييمات معتمدة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedReviews.map((review: any) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {review.products?.name_ar || "منتج غير معروف"}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            معتمد
                          </Badge>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateReviewMutation.mutate({ id: review.id, is_approved: false })
                          }
                          disabled={updateReviewMutation.isPending}
                        >
                          <X className="h-4 w-4 ml-1" />
                          إلغاء الموافقة
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteReviewMutation.mutate(review.id)}
                          disabled={deleteReviewMutation.isPending}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{review.customer_name}</span>
                        <span>•</span>
                        <span>{format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
