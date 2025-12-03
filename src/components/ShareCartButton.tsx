import { useState } from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  productName: string;
  variantId: string;
  variantSize: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface ShareCartButtonProps {
  cartItems: CartItem[];
  disabled?: boolean;
}

const generateShareCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const ShareCartButton = ({ cartItems, disabled }: ShareCartButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (cartItems.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    setIsLoading(true);
    try {
      const shareCode = generateShareCode();
      
      const { data: session } = await supabase.auth.getSession();
      
      // Ensure we're sharing all items
      const itemsToShare = [...cartItems];
      console.log("Sharing cart items:", itemsToShare.length, "items", itemsToShare);
      
      const { error } = await (supabase.from("shared_carts") as any).insert({
        share_code: shareCode,
        cart_items: itemsToShare,
        created_by: session.session?.user?.id || null,
      });

      if (error) throw error;

      const link = `${window.location.origin}/shared-cart/${shareCode}`;
      setShareLink(link);
      setIsOpen(true);
    } catch (error) {
      console.error("Error sharing cart:", error);
      toast.error("حدث خطأ في مشاركة السلة");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("فشل في نسخ الرابط");
    }
  };

  const shareViaWhatsApp = () => {
    const text = `شوف سلة التسوق هذي 🛒\n${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={disabled || isLoading || cartItems.length === 0}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        {isLoading ? "جاري المشاركة..." : "مشاركة السلة"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>مشاركة سلة التسوق</DialogTitle>
            <DialogDescription>
              شارك سلتك مع الآخرين عبر هذا الرابط
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={shareLink}
                readOnly
                className="text-sm"
                dir="ltr"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                onClick={shareViaWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                مشاركة عبر واتساب
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              صلاحية الرابط: 30 يوم
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
