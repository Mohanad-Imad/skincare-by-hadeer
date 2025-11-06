import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun } from "lucide-react";

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-3 px-2 py-2">
      <Label className="text-sm font-medium">المظهر</Label>
      <RadioGroup value={theme} onValueChange={setTheme} className="gap-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer font-normal">
            <Sun className="h-4 w-4" />
            <span>وضع نهاري</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer font-normal">
            <Moon className="h-4 w-4" />
            <span>وضع ليلي</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
