import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "أضف إلى السلة", labelEn: "Add to Cart" },
  { number: 2, label: "إتمام الطلب", labelEn: "Complete Order" },
  { number: 3, label: "معلومات التوصيل", labelEn: "Delivery Info" },
];

export const CheckoutStepper = ({ currentStep }: CheckoutStepperProps) => {
  return (
    <div className="w-full py-6 md:py-8 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-3xl mx-auto px-3 md:px-6">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div 
            className="absolute top-5 md:top-6 h-1 bg-muted rounded-full overflow-hidden" 
            style={{ zIndex: 0, left: "8%", right: "8%" }}
          >
            <div
              className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-1000 ease-out"
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
                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500",
                    "border-[3px] bg-background shadow-lg",
                    (isCompleted || isLastStepCompleted) && "bg-gradient-to-br from-primary to-primary/80 border-primary text-primary-foreground shadow-primary/30 animate-scale-in",
                    isCurrent && !isLastStepCompleted && "border-primary text-primary scale-125 shadow-xl ring-4 ring-primary/30",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted || isLastStepCompleted ? (
                    <Check className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
                  ) : (
                    <span className="text-sm md:text-base font-bold">{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 md:mt-3 text-center max-w-[90px] md:max-w-[110px]">
                  <p
                    className={cn(
                      "text-[11px] md:text-sm font-semibold transition-all duration-300 leading-tight",
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
