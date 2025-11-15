import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

const steps = [
  { number: 1, label: "أضف إلى السلة", labelEn: "Add to Cart" },
  { number: 2, label: "إتمام الطلب", labelEn: "Complete Order" },
  { number: 3, label: "معلومات التوصيل", labelEn: "Delivery Info" },
  { number: 4, label: "تأكيد الطلب", labelEn: "Order Confirmation" },
];

export const CheckoutStepper = ({ currentStep }: CheckoutStepperProps) => {
  return (
    <div className="w-full py-6 bg-muted/20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" style={{ zIndex: 0, left: "8%", right: "8%" }}>
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-in-out"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps */}
          {steps.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center relative flex-1"
                style={{ zIndex: 1 }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                    "border-2 bg-background shadow-sm",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary scale-110 shadow-md ring-2 ring-primary/20",
                    !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-sm font-bold">{step.number}</span>
                  )}
                </div>

                <div className="mt-2 text-center max-w-[100px]">
                  <p
                    className={cn(
                      "text-xs font-medium transition-all duration-300",
                      isCurrent && "text-primary font-semibold",
                      isCompleted && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
