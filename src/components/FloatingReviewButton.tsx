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
      className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      size="icon"
      aria-label="شاركنا رأيك"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};
