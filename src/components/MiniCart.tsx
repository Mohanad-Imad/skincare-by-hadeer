import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, CreditCard, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

interface MiniCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    name: string;
    image: string;
    price: number;
    size: string;
    quantity: number;
  };
  session: Session | null;
}

export const MiniCart = ({ open, onOpenChange, product, session }: MiniCartProps) => {
  const navigate = useNavigate();
  const total = product.price * product.quantity;

  const handleCheckout = () => {
    onOpenChange(false);
    if (!session) {
      // توجيه الزائر إلى صفحة الدفع كزائر
      navigate("/checkout?guest=true");
    } else {
      navigate("/checkout");
    }
  };

  const handleGoToCart = () => {
    onOpenChange(false);
    // الذهاب مباشرة إلى السلة - ستظهر خيارات تسجيل الدخول أو التسوق كزائر هناك
    navigate("/cart");
  };

  const handleContinueShopping = () => {
    onOpenChange(false);
    navigate("/products");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            تمت الإضافة إلى السلة!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Summary */}
          <div className="flex gap-4 rounded-lg border bg-secondary/30 p-4">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-background">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">الحجم: {product.size}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الكمية: {product.quantity}</span>
                <span className="text-lg font-bold text-primary">{Math.round(total)} د.ع</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
            >
              <CreditCard className="ml-2 h-5 w-5" />
              الانتقال إلى الدفع الآن
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={handleGoToCart}
            >
              <ShoppingBag className="ml-2 h-5 w-5" />
              الذهاب إلى السلة
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleContinueShopping}
            >
              <ArrowLeft className="ml-2 h-5 w-5" />
              متابعة التسوق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
