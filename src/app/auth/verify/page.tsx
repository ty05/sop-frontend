'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI, invitationsAPI } from '@/lib/api';
import { saveTokens } from '@/lib/auth';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No token provided');
      return;
    }

    authAPI.verifyToken(token)
      .then(async (response) => {
        saveTokens(response.data);

        // Check if there's a pending invitation to accept
        const pendingInvitationToken = localStorage.getItem('pending_invitation_token');
        if (pendingInvitationToken) {
          // Redirect to accept invitation page with the token
          window.location.href = `/invite/accept?token=${pendingInvitationToken}`;
          return;
        }

        // Small delay to ensure token is set in axios interceptor
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if user has pending invitations (for first-time login)
        try {
          console.log('Checking for pending invitations...');
          const invitationsResponse = await invitationsAPI.getMyInvitations();
          console.log('Invitations response:', invitationsResponse.data);

          if (invitationsResponse.data && invitationsResponse.data.length > 0) {
            // User has pending invitations, redirect to invitations page
            console.log('User has pending invitations, redirecting to /invitations');
            window.location.href = '/invitations';
            return;
          }
        } catch (error) {
          console.error('Failed to check invitations:', error);
          // Don't block login if invitation check fails
        }

        // No pending invitations, go to documents
        console.log('No pending invitations, redirecting to /documents');
        window.location.href = '/documents';
      })
      .catch((error) => {
        console.error('Verification error:', error);
        setError('Invalid or expired token');
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Verifying...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Verifying...</h2>
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
