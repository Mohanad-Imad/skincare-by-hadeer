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
    <div className="w-full py-4 md:py-8 bg-muted/30">
      <div className="max-w-5xl mx-auto px-2 md:px-4">
        {/* Mobile View - Vertical */}
        <div className="md:hidden">
          <div className="flex flex-col gap-3">
            {steps.map((step) => {
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;

              return (
                <div
                  key={step.number}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    isCurrent && "bg-primary/10 ring-2 ring-primary/30",
                    isCompleted && "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      "border-2 transition-all",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary scale-110",
                      !isCompleted && !isCurrent && "border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={3} />
                    ) : (
                      <span className="text-base font-bold">{step.number}</span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isCurrent && "text-primary",
                      isCompleted && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop View - Horizontal */}
        <div className="hidden md:flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-muted" style={{ zIndex: 0, left: "10%", right: "10%" }}>
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-in-out rounded-full"
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
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                    "border-4 bg-background shadow-md",
                    isCompleted && "bg-gradient-to-br from-primary to-primary/90 border-primary text-primary-foreground shadow-lg shadow-primary/30",
                    isCurrent && "border-primary text-primary scale-125 shadow-xl shadow-primary/40 ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-7 h-7 animate-scale-in" strokeWidth={3} />
                  ) : (
                    <span className="text-xl font-bold">{step.number}</span>
                  )}
                </div>

                <div className="mt-4 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-all duration-300",
                      isCurrent && "text-primary scale-105 font-bold",
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
