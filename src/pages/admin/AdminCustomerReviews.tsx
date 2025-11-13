import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Check, X, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCustomerReviews() {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<any>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("customer_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, status, is_active }: { id: string; status?: string; is_active?: boolean }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      
      if (status) {
        updates.status = status;
        updates.reviewed_by = (await supabase.auth.getUser()).data.user?.id;
        updates.reviewed_at = new Date().toISOString();
      }
      
      if (is_active !== undefined) {
        updates.is_active = is_active;
      }

      const { error } = await (supabase as any)
        .from("customer_reviews")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("تم تحديث الرأي بنجاح");
      setSelectedReview(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الرأي");
    },
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "قيد المراجعة" },
      approved: { variant: "default", label: "معتمد" },
      rejected: { variant: "destructive", label: "مرفوض" },
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <AdminBackButton />
        <h1 className="text-3xl font-bold mt-4">إدارة آراء العملاء</h1>
        <p className="text-muted-foreground mt-2">
          راجع وافق على آراء العملاء لعرضها في الموقع
        </p>
      </div>

      <div className="grid gap-4">
        {reviews?.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{review.customer_name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">{renderStars(review.rating)}</div>
                    {getStatusBadge(review.status)}
                    {review.is_active ? (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="h-3 w-3" />
                        نشط
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        معطل
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {review.status === "pending" && (
                  <>
                    <Button
                      onClick={() => updateReviewMutation.mutate({ id: review.id, status: "approved" })}
                      className="gap-2"
                      variant="default"
                    >
                      <Check className="h-4 w-4" />
                      الموافقة على العرض
                    </Button>
                    <Button
                      onClick={() => updateReviewMutation.mutate({ id: review.id, status: "rejected" })}
                      className="gap-2"
                      variant="destructive"
                    >
                      <X className="h-4 w-4" />
                      رفض
                    </Button>
                  </>
                )}

                {review.status === "approved" && (
                  <>
                    <Button
                      onClick={() => updateReviewMutation.mutate({ id: review.id, is_active: !review.is_active })}
                      className="gap-2"
                      variant="outline"
                    >
                      {review.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          إخفاء
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          عرض
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => updateReviewMutation.mutate({ id: review.id, status: "rejected" })}
                      className="gap-2"
                      variant="destructive"
                    >
                      <X className="h-4 w-4" />
                      رفض
                    </Button>
                  </>
                )}

                {review.status === "rejected" && (
                  <Button
                    onClick={() => updateReviewMutation.mutate({ id: review.id, status: "approved" })}
                    className="gap-2"
                    variant="default"
                  >
                    <Check className="h-4 w-4" />
                    الموافقة على العرض
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {!reviews || reviews.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              لا توجد آراء بعد
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
