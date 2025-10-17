import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown } from "lucide-react";

const statusLabels = {
  new: "جديد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

interface OrderStatusSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function OrderStatusSelect({ value, onValueChange }: OrderStatusSelectProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-40 justify-between">
            {statusLabels[value as keyof typeof statusLabels]}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>تغيير حالة الطلب</SheetTitle>
            <SheetDescription>
              اختر الحالة الجديدة للطلب
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-2">
            {Object.entries(statusLabels).map(([statusValue, label]) => (
              <SheetClose key={statusValue} asChild>
                <Button
                  variant={value === statusValue ? "default" : "outline"}
                  className="w-full justify-start text-base py-6"
                  onClick={() => onValueChange(statusValue)}
                >
                  {label}
                </Button>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={5} align="start">
        {Object.entries(statusLabels).map(([statusValue, label]) => (
          <SelectItem key={statusValue} value={statusValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
