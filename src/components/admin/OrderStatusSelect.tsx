import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-40 justify-between">
            {statusLabels[value as keyof typeof statusLabels]}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>تغيير حالة الطلب</DrawerTitle>
            <DrawerDescription>
              اختر الحالة الجديدة للطلب
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-2">
            {Object.entries(statusLabels).map(([statusValue, label]) => (
              <DrawerClose key={statusValue} asChild>
                <Button
                  variant={value === statusValue ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => onValueChange(statusValue)}
                >
                  {label}
                </Button>
              </DrawerClose>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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
