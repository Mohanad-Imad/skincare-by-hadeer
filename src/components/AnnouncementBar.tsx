import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements]);

  if (isLoading || !announcements || announcements.length === 0) return null;

  const current = announcements[currentIndex % announcements.length];

  const handleClick = () => {
    if (current.link_url) {
      if (current.link_url.startsWith("http")) {
        window.open(current.link_url, "_blank");
      } else {
        navigate(current.link_url);
      }
    }
  };

  return (
    <div
      className="w-full py-2 px-4 text-center text-sm font-medium transition-all duration-300"
      style={{
        backgroundColor: current.background_color || "#ec4899",
        color: current.text_color || "#ffffff",
        cursor: current.link_url ? "pointer" : "default",
      }}
      onClick={current.link_url ? handleClick : undefined}
    >
      <div className="container mx-auto">
        <span className="animate-fade-in">
          {current.message_ar}
        </span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
