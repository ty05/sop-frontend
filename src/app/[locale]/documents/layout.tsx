'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import TrialExpiredModal from '@/components/TrialExpiredModal';

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trialExpired, setTrialExpired] = useState<{
    message: string;
    trialEnded?: string;
  } | null>(null);

  useEffect(() => {
    // Listen for trial-expired events from API interceptor
    const handleTrialExpired = (event: CustomEvent) => {
      setTrialExpired({
        message: event.detail.message,
        trialEnded: event.detail.trialEnded
      });
    };

    window.addEventListener('trial-expired', handleTrialExpired as EventListener);

    return () => {
      window.removeEventListener('trial-expired', handleTrialExpired as EventListener);
    };
  }, []);

  return (
    <>
      <Header />
      {children}

      {/* Full-page blocking modal when trial expires */}
      {trialExpired && (
        <TrialExpiredModal
          message={trialExpired.message}
          trialEnded={trialExpired.trialEnded}
        />
      )}
    </>
  );
}
