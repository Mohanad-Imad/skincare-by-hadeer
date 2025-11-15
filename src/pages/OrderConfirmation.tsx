import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";

const OrderConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CheckoutStepper currentStep={3} />
      <div className="container flex min-h-[80vh] items-center justify-center py-16">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-24 w-24 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold">تم استلام طلبك بنجاح!</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            شكراً لك على طلبك. سنتواصل معك قريباً لتأكيد التوصيل.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => navigate("/")}>
              العودة للرئيسية
            </Button>
            <Button variant="outline" onClick={() => navigate("/products")}>
              مواصلة التسوق
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default OrderConfirmation;