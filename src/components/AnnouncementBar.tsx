import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface Announcement {
  id: string;
  message_ar: string;
  message_en: string | null;
  link_url: string | null;
  background_color: string | null;
  text_color: string | null;
}

const AnnouncementBar = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcement-bar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_bar")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Auto-rotate announcements
  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;

    const activeAnnouncements = announcements.filter(
      (a) => !dismissed.includes(a.id)
    );
    if (activeAnnouncements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements, dismissed]);

  if (isLoading || !announcements || announcements.length === 0) return null;

  const activeAnnouncements = announcements.filter(
    (a) => !dismissed.includes(a.id)
  );

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[currentIndex % activeAnnouncements.length];

  const handleClick = () => {
    if (current.link_url) {
      if (current.link_url.startsWith("http")) {
        window.open(current.link_url, "_blank");
      } else {
        navigate(current.link_url);
      }
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed((prev) => [...prev, current.id]);
    setCurrentIndex(0);
  };

  return (
    <div
      className="relative w-full py-2 px-4 text-center text-sm font-medium transition-all duration-300"
      style={{
        backgroundColor: current.background_color || "#ec4899",
        color: current.text_color || "#ffffff",
        cursor: current.link_url ? "pointer" : "default",
      }}
      onClick={current.link_url ? handleClick : undefined}
    >
      <div className="container mx-auto flex items-center justify-center gap-2">
        <span className="flex-1 text-center animate-fade-in">
          {current.message_ar}
        </span>
        {activeAnnouncements.length > 1 && (
          <div className="flex gap-1 mx-2">
            {activeAnnouncements.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex % activeAnnouncements.length
                    ? "bg-white"
                    : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
        <button
          onClick={handleDismiss}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
