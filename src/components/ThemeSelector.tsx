import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Star, Cloud } from "lucide-react";

export const ThemeSelector = () => {
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
    <div className="px-2 py-2">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground px-1">المظهر</span>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative h-9 w-full rounded-full bg-gradient-to-r from-sky-400 to-sky-200 dark:from-slate-800 dark:to-slate-900 transition-all duration-500 overflow-hidden shadow-md hover:shadow-lg"
          aria-label="Toggle theme"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 transition-opacity duration-500">
            {/* Day mode clouds */}
            <div className={`absolute transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
              <Cloud className="absolute top-1.5 right-12 h-3 w-3 text-white/60" />
              <Cloud className="absolute top-2 right-16 h-2 w-2 text-white/40" />
            </div>
            
            {/* Night mode stars */}
            <div className={`absolute transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
              <Star className="absolute top-1.5 right-12 h-1.5 w-1.5 text-white fill-white" />
              <Star className="absolute top-3 right-16 h-1 w-1 text-white/70 fill-white/70" />
              <Star className="absolute top-2 left-16 h-1.5 w-1.5 text-white/60 fill-white/60" />
            </div>
          </div>

          {/* Toggle circle */}
          <div
            className={`absolute top-0.5 ${
              isDark ? 'right-0.5' : 'left-0.5'
            } h-8 w-8 rounded-full bg-gradient-to-br shadow-md transition-all duration-500 flex items-center justify-center ${
              isDark 
                ? 'from-slate-300 to-slate-400' 
                : 'from-yellow-300 to-yellow-400'
            }`}
          >
            {isDark ? (
              <div className="relative">
                <Moon className="h-4 w-4 text-slate-600" />
                <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-slate-400/50" />
              </div>
            ) : (
              <Sun className="h-4 w-4 text-yellow-600" />
            )}
          </div>

          {/* Label */}
          <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-medium transition-all duration-500 ${
            isDark 
              ? 'left-11 text-slate-200' 
              : 'right-11 text-sky-700'
          }`}>
            {isDark ? 'ليلي' : 'نهاري'}
          </span>
        </button>
      </div>
    </div>
  );
};
