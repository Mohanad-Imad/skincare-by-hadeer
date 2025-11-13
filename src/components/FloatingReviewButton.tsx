import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FloatingReviewButton = () => {
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Only show for logged-in users
  if (!session) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate("/submit-review")}
      className="fixed bottom-6 left-6 z-50 h-16 px-6 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80"
      aria-label="شاركنا رأيك"
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <span className="font-semibold">شاركنا رأيك</span>
      </div>
    </Button>
  );
};
