import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const DynamicMetadata = () => {
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-metadata'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('store_name, logo_url')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // Update favicon dynamically
    if (storeSettings?.logo_url) {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      
      if (favicon) {
        favicon.href = storeSettings.logo_url;
      }
      if (appleTouchIcon) {
        appleTouchIcon.href = storeSettings.logo_url;
      }
    }

    // Update PWA manifest dynamically
    if (storeSettings?.store_name || storeSettings?.logo_url) {
      const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (manifestLink) {
        // Create dynamic manifest
        const manifest = {
          name: storeSettings?.store_name || 'متجر هدير للعناية بالبشرة',
          short_name: storeSettings?.store_name?.split(' ')[0] || 'هدير',
          description: 'متجر للعناية بالبشرة يقدم منتجات أصلية وفعالة',
          theme_color: '#EC4899',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'ar',
          dir: 'rtl',
          icons: [
            {
              src: storeSettings?.logo_url || '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: storeSettings?.logo_url || '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: storeSettings?.logo_url || '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: storeSettings?.logo_url || '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        };

        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(manifestBlob);
        manifestLink.href = manifestURL;
      }
    }
  }, [storeSettings]);

  return (
    <Helmet>
      <title>{storeSettings?.store_name || 'متجر هدير للعناية بالبشرة'}</title>
      <meta property="og:title" content={storeSettings?.store_name || 'متجر هدير للعناية بالبشرة'} />
      <meta name="twitter:title" content={storeSettings?.store_name || 'متجر هدير للعناية بالبشرة'} />
      <meta name="apple-mobile-web-app-title" content={storeSettings?.store_name?.split(' ')[0] || 'هدير'} />
    </Helmet>
  );
};
