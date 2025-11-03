'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL (e.g., expired link)
        // Supabase can send errors in either hash (#) or query (?)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        const errorCode = hashParams.get('error_code') || searchParams.get('error_code');

        if (errorDescription) {
          let userFriendlyError = errorDescription.replace(/\+/g, ' ');

          // Make error messages more user-friendly
          if (errorCode === 'otp_expired') {
            userFriendlyError = 'This magic link has expired or was already used. Please request a new one.';
          }

          setError(userFriendlyError);
          setTimeout(() => router.push('/auth/login'), 5000);
          return;
        }

        // Wait for Supabase to process the session from URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        if (session) {
          // Successfully authenticated
          // Check if this is an invitation signup
          const invitationId = session.user.user_metadata?.invitation_id;

          if (invitationId) {
            // The user was invited - redirect to invitations page
            // The invitations page will show the pending invitation and they can accept it
            router.push('/invitations');
          } else {
            // Check if there's a pending invitation token stored
            const pendingToken = localStorage.getItem('pending_invitation_token');

            if (pendingToken) {
              router.push(`/invite/accept?token=${pendingToken}`);
            } else {
              // Normal login, go to documents
              router.push('/documents');
            }
          }
        } else {
          // No session found, redirect to login
          setTimeout(() => router.push('/auth/login'), 1000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred during authentication');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
