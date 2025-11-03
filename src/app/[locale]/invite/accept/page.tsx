'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { invitationsAPI } from '@/lib/api';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('');

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;

    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link - no token provided');
      return;
    }

    // Check if user is logged in

    if (!user) {
      // Store the invitation token and redirect to login
      localStorage.setItem('pending_invitation_token', token);
      router.push('/auth/login');
      return;
    }

    acceptInvitation(token);
  }, [user, authLoading, searchParams, router]);

  const acceptInvitation = async (token: string) => {
    try {
      const response = await invitationsAPI.acceptInvitation(token);

      setStatus('success');
      setMessage('Invitation accepted! Redirecting...');
      setWorkspaceId(response.data.workspace_id);

      // Clear any stored invitation token
      localStorage.removeItem('pending_invitation_token');

      // Use window.location for full reload to refresh workspace context
      setTimeout(() => {
        window.location.href = '/documents';
      }, 2000);
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      console.error('Error response:', error.response?.data);

      setStatus('error');
      const detail = error.response?.data?.detail;

      if (typeof detail === 'string') {
        setMessage(detail);
      } else {
        setMessage('Failed to accept invitation. The link may have expired or already been used.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Processing invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/invitations')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View Invitations
              </button>
              <button
                onClick={() => router.push('/documents')}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Go to Documents
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
