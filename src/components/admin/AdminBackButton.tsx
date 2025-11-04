import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdminBackButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/admin")}
      className="gap-2 mb-4"
    >
      <ArrowRight className="h-4 w-4" />
      العودة للوحة التحكم
    </Button>
  );
};
