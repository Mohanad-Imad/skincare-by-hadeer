import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isInStandaloneMode = () => {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
         (window.navigator as any).standalone === true;
};

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isInStandaloneMode()) {
      console.log('Already in standalone mode');
      return;
    }

    const iOS = isIOS();
    console.log('Is iOS device:', iOS);
    setIsIOSDevice(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    console.log('Previously dismissed:', dismissed);
    
    if (iOS) {
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => {
        if (!dismissed) {
          console.log('Showing iOS prompt');
          setShowPrompt(true);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      // Android/Desktop - listen for beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        
        if (!dismissed) {
          setShowPrompt(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            {isIOSDevice ? (
              <Share className="h-5 w-5 text-primary" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">أضف التطبيق للشاشة الرئيسية</h3>
            {isIOSDevice ? (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>لتثبيت التطبيق على آيفون:</p>
                <ol className="list-decimal list-inside space-y-0.5 mr-2">
                  <li>اضغط على زر المشاركة <Share className="inline h-3 w-3" /> في الأسفل</li>
                  <li>اختر "إضافة إلى الشاشة الرئيسية"</li>
                  <li>اضغط "إضافة"</li>
                </ol>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                استمتع بتجربة أفضل وأسرع مع تطبيقنا على شاشتك الرئيسية
              </p>
            )}
          </div>
        </div>
        
        {!isIOSDevice && (
          <Button 
            onClick={handleInstallClick}
            className="w-full"
            size="sm"
          >
            تثبيت التطبيق
          </Button>
        )}
      </div>
    </div>
  );
};
