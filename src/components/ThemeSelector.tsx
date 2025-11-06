import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="px-2 py-2">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <>
            <Sun className="h-4 w-4" />
            <span>وضع نهاري</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span>وضع ليلي</span>
          </>
        )}
      </Button>
    </div>
  );
};
