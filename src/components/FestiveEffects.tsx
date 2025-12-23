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

      {/* Corner Decorations */}
      <div className="fixed top-0 left-0 pointer-events-none z-40">
        <div className="relative">
          {/* Top Left Decoration */}
          <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Pine branches */}
              <g fill="#1a5f1a" className="dark:fill-emerald-700">
                <path d="M0 0 L100 30 L80 50 L120 70 L60 80 L100 100 L40 110 L80 130 L20 150 L0 100 Z" />
                <path d="M0 0 L30 100 L50 80 L70 120 L80 60 L100 100 L110 40 L130 80 L150 20 L100 0 Z" />
              </g>
              {/* Ornaments */}
              <circle cx="60" cy="90" r="12" fill="#c41e3a" className="animate-pulse" />
              <circle cx="90" cy="60" r="10" fill="#ffd700" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
              <circle cx="45" cy="55" r="8" fill="#c41e3a" className="animate-pulse" style={{ animationDelay: '1s' }} />
              {/* Star */}
              <polygon
                points="30,15 33,25 44,25 35,32 38,42 30,36 22,42 25,32 16,25 27,25"
                fill="#ffd700"
                className="animate-twinkle"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Top Right Decoration */}
      <div className="fixed top-0 right-0 pointer-events-none z-40">
        <div className="relative">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 transform scale-x-[-1]">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Pine branches */}
              <g fill="#1a5f1a" className="dark:fill-emerald-700">
                <path d="M0 0 L100 30 L80 50 L120 70 L60 80 L100 100 L40 110 L80 130 L20 150 L0 100 Z" />
                <path d="M0 0 L30 100 L50 80 L70 120 L80 60 L100 100 L110 40 L130 80 L150 20 L100 0 Z" />
              </g>
              {/* Ornaments */}
              <circle cx="60" cy="90" r="12" fill="#ffd700" className="animate-pulse" />
              <circle cx="90" cy="60" r="10" fill="#c41e3a" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
              <circle cx="45" cy="55" r="8" fill="#ffd700" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
              {/* Star */}
              <polygon
                points="30,15 33,25 44,25 35,32 38,42 30,36 22,42 25,32 16,25 27,25"
                fill="#ffd700"
                className="animate-twinkle"
                style={{ animationDelay: '0.5s' }}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom decorative ribbon */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-40">
        <div className="h-2 bg-gradient-to-r from-red-600 via-green-600 to-red-600 opacity-80" />
      </div>

      {/* Festive lights string effect */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-40">
        <div className="flex justify-around py-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-4 rounded-full animate-twinkle"
              style={{
                backgroundColor: ['#ff0000', '#00ff00', '#ffd700', '#0066ff', '#ff00ff'][i % 5],
                animationDelay: `${i * 0.2}s`,
                boxShadow: `0 0 10px ${['#ff0000', '#00ff00', '#ffd700', '#0066ff', '#ff00ff'][i % 5]}`,
              }}
            />
          ))}
        </div>
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
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
        
        .animate-snowfall {
          animation: snowfall linear infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};
