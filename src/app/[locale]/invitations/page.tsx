'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { invitationsAPI } from '@/lib/api';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  invited_by_name: string;
  workspace: {
    id: string;
    name: string;
  };
}

export default function InvitationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    try {
      const response = await invitationsAPI.getMyInvitations();
      setInvitations(response.data);
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await invitationsAPI.acceptInvitationById(invitationId);
      // Redirect to documents page to see the new workspace
      window.location.href = '/documents';
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      alert(error.response?.data?.detail || 'Failed to accept invitation');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Pending Invitations</h1>
          <p className="text-gray-600 mb-6">
            You have been invited to join the following workspaces
          </p>

          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">✉️</div>
              <p className="text-gray-600 mb-6">No pending invitations</p>
              <button
                onClick={() => router.push('/documents')}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Go to Documents
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border rounded-lg p-6 hover:border-blue-300 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        {invitation.workspace.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Invited by <span className="font-medium">{invitation.invited_by_name}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                      {invitation.role}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    <p>To: {invitation.email}</p>
                    <p>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</p>
                  </div>

                  <button
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Accept Invitation
                  </button>
                </div>
              ))}

              <div className="pt-4 text-center">
                <button
                  onClick={() => router.push('/documents')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Skip for now →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
