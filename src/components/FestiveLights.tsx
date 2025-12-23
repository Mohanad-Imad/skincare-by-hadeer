import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FestiveLights = () => {
  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("festive_theme_enabled")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  if (!settings?.festive_theme_enabled) return null;

  return (
    <div className="w-full py-4 overflow-hidden">
      <div className="flex justify-around">
        {[...Array(15)].map((_, i) => (
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
      <style>{`
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
        .animate-twinkle {
          animation: twinkle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
