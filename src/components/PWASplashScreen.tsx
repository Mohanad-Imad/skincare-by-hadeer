import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PWASplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center animate-in fade-in will-change-transform">
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-500 will-change-transform">
        {storeSettings?.logo_url ? (
          <img 
            src={storeSettings.logo_url} 
            alt="Logo" 
            className="h-24 w-24 mx-auto animate-pulse"
          />
        ) : (
          <div className="h-24 w-24 mx-auto bg-primary/20 rounded-2xl animate-pulse" />
        )}
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground animate-in slide-in-from-bottom-3 duration-700">
            {storeSettings?.store_name || 'متجر هدير'}
          </h1>
          <p className="text-sm text-muted-foreground animate-in slide-in-from-bottom-4 duration-1000">
            للعناية بالبشرة
          </p>
        </div>
        
        <div className="flex justify-center gap-1">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};
