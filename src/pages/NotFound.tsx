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
      <div className="container mx-auto px-4 py-12">
        {" "}
        {/* زيادة المسافة الرأسية */}
        <div className="text-center mb-10">
          <h1 className="mb-4 text-8xl font-black text-primary/80 drop-shadow-lg">404</h1>
          <p className="mb-2 text-3xl font-extrabold text-foreground">عذراً! فقدنا الاتصال بالصفحة 🔌</p>
          <p className="mb-6 text-xl text-muted-foreground">ساعدنا في جمع البتّات المفقودة حتى نجد الطريق للعودة!</p>
        </div>
        <NotFoundGame /> {/* تم وضع اللعبة في المنتصف */}
        <div className="text-center mt-10">
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="shadow-lg hover:shadow-primary/30 transition-all duration-300"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
