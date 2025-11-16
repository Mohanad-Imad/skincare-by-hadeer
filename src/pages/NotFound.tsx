import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NotFoundGame } from "@/components/NotFoundGame";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
          <p className="mb-2 text-2xl font-semibold text-foreground">عذراً! الصفحة غير موجودة</p>
          <p className="mb-6 text-muted-foreground">
            لكن لا تقلق، يمكنك تمضية الوقت في لعبة ممتعة!
          </p>
        </div>

        <NotFoundGame />

        <div className="text-center mt-8">
          <Button onClick={() => navigate("/")} size="lg">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
