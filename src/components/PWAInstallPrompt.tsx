'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold">Install SOP Manual</p>
          <p className="text-sm opacity-90">Add to home screen for quick access</p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-4 py-2 rounded font-medium"
          >
            Install
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-white px-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
