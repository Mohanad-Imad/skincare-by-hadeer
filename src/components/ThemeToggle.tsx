import { Moon, Sun, Star, Cloud } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-7 w-24 rounded-full bg-gradient-to-r from-primary/20 to-accent dark:from-accent dark:to-muted transition-all duration-500 overflow-hidden shadow-sm hover:shadow-md border border-border"
      aria-label="Toggle theme"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 transition-opacity duration-500">
        {/* Day mode clouds */}
        <div className={`absolute transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
          <Cloud className="absolute top-1 right-6 h-2 w-2 text-primary/40" />
        </div>
        
        {/* Night mode stars */}
        <div className={`absolute transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
          <Star className="absolute top-1 right-6 h-1 w-1 text-foreground fill-foreground" />
          <Star className="absolute top-2 left-7 h-0.5 w-0.5 text-foreground/60 fill-foreground/60" />
        </div>
      </div>

      {/* Toggle circle */}
      <div
        className={`absolute top-0.5 ${
          isDark ? 'right-0.5' : 'left-0.5'
        } h-6 w-6 rounded-full shadow-sm transition-all duration-500 flex items-center justify-center ${
          isDark 
            ? 'bg-card border border-border' 
            : 'bg-primary'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-foreground" />
        ) : (
          <Sun className="h-3 w-3 text-primary-foreground" />
        )}
      </div>

      {/* Label */}
      <span className={`absolute top-1/2 -translate-y-1/2 text-[10px] font-medium transition-all duration-500 ${
        isDark 
          ? 'left-7 text-foreground' 
          : 'right-7 text-foreground'
      }`}>
        {isDark ? 'ليلي' : 'نهاري'}
      </span>
    </button>
  );
};
