import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "أضف إلى السلة", labelEn: "Add to Cart" },
  { number: 2, label: "إتمام الطلب", labelEn: "Complete Order" },
  { number: 3, label: "تأكيد الطلب", labelEn: "Order Confirmation" },
];

export const CheckoutStepper = ({ currentStep }: CheckoutStepperProps) => {
  return (
    <div className="w-full py-4 md:py-8 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div 
            className="absolute top-4 md:top-6 h-0.5 md:h-1 bg-muted rounded-full" 
            style={{ zIndex: 0, left: "16.66%", right: "16.66%" }}
          >
            <div
              className="h-full bg-gradient-to-r from-primary to-primary transition-all duration-700 ease-out rounded-full"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps */}
          {steps.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isLastStepCompleted = isCurrent && step.number === steps.length;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center relative flex-1"
                style={{ zIndex: 1 }}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500",
                    "border-2 md:border-[3px] bg-background shadow-md",
                    (isCompleted || isLastStepCompleted) && "bg-gradient-to-br from-primary to-primary/80 border-primary text-primary-foreground shadow-lg",
                    isCurrent && !isLastStepCompleted && "border-primary text-primary scale-110 md:scale-125 shadow-xl ring-2 md:ring-4 ring-primary/30",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted || isLastStepCompleted ? (
                    <Check className="w-4 h-4 md:w-6 md:h-6" strokeWidth={3} />
                  ) : (
                    <span className="text-xs md:text-base font-bold">{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-1.5 md:mt-3 text-center px-1">
                  <p
                    className={cn(
                      "text-[10px] md:text-sm font-semibold transition-all duration-300 leading-tight whitespace-nowrap",
                      (isCurrent || isCompleted || isLastStepCompleted) && "text-primary",
                      !isCompleted && !isCurrent && !isLastStepCompleted && "text-muted-foreground"
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
