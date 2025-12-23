import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

export const FestiveEffects = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (settings?.festive_theme_enabled) {
      // Generate snowflakes
      const flakes: Snowflake[] = [];
      for (let i = 0; i < 50; i++) {
        flakes.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 10,
          duration: 5 + Math.random() * 10,
          size: 4 + Math.random() * 8,
          opacity: 0.4 + Math.random() * 0.6,
        });
      }
      setSnowflakes(flakes);
    } else {
      setSnowflakes([]);
    }
  }, [settings?.festive_theme_enabled]);

  if (!settings?.festive_theme_enabled) return null;

  return (
    <>
      {/* Snowfall */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute animate-snowfall"
            style={{
              left: `${flake.x}%`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-blue-100 dark:text-blue-200"
            >
              <path d="M12 0L13.5 6L20 4.5L15 9L21 12L15 15L20 19.5L13.5 18L12 24L10.5 18L4 19.5L9 15L3 12L9 9L4 4.5L10.5 6L12 0Z" />
            </svg>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
        
        .animate-snowfall {
          animation: snowfall linear infinite;
        }
      `}</style>
    </>
  );
};
