'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import apiClient from '@/lib/api';

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
  last_login: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  invited_by_name: string;
}

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (activeWorkspace) {
      loadData();
    }
  }, [activeWorkspace]);

  const loadData = async () => {
    if (!activeWorkspace) return;

    try {
      const [membersRes, invitesRes, subRes, usageRes] = await Promise.all([
        apiClient.get(`/workspaces/${activeWorkspace.id}/members`),
        apiClient.get(`/invitations/workspace/${activeWorkspace.id}`),
        apiClient.get(`/billing/subscription/${activeWorkspace.id}`),
        apiClient.get(`/billing/usage/${activeWorkspace.id}`)
      ]);

      setMembers(membersRes.data);
      setInvitations(invitesRes.data);
      setSubscription(subRes.data);
      setUsage(usageRes.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
      setLoadingBilling(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!activeWorkspace) return;
    if (!confirm(`Change role to ${newRole}?`)) return;

    try {
      await apiClient.patch(
        `/workspaces/${activeWorkspace.id}/members/${memberId}/role`,
        { role: newRole }
      );
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!activeWorkspace) return;
    if (!confirm(`Remove ${email} from workspace?`)) return;

    try {
      await apiClient.delete(`/workspaces/${activeWorkspace.id}/members/${memberId}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Cancel this invitation?')) return;

    try {
      await apiClient.delete(`/invitations/${inviteId}`);
      loadData();
    } catch (error) {
      alert('Failed to cancel invitation');
    }
  };

  const handleUpgrade = async (plan: 'basic' | 'pro') => {
    console.log('🔵 handleUpgrade called with plan:', plan);
    console.log('🔵 activeWorkspace:', activeWorkspace);

    if (!activeWorkspace) {
      console.log('❌ No active workspace');
      return;
    }

    try {
      console.log('🔵 Calling API:', `/billing/checkout/${activeWorkspace.id}`);
      const res = await apiClient.post(`/billing/checkout/${activeWorkspace.id}`, { plan });
      console.log('✅ API response:', res.data);
      window.location.href = res.data.checkout_url;
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      console.error('❌ Error response:', error.response?.data);
      alert('Failed to start checkout: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleManageBilling = async () => {
    if (!activeWorkspace) return;

    try {
      const res = await apiClient.post(`/billing/portal/${activeWorkspace.id}`);
      window.location.href = res.data.portal_url;
    } catch (error) {
      alert('Failed to open billing portal');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;

    if (!confirm(`Delete workspace "${activeWorkspace.name}"? This cannot be undone!`)) {
      return;
    }

    const confirmName = prompt(`Type "${activeWorkspace.name}" to confirm deletion:`);
    if (confirmName !== activeWorkspace.name) {
      alert('Workspace name did not match. Deletion canceled.');
      return;
    }

    try {
      await apiClient.delete(`/workspaces/${activeWorkspace.id}`);
      alert('Workspace deleted');
      // Redirect to documents page (will switch to another workspace)
      window.location.href = '/documents';
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete workspace');
    }
  };

  if (workspaceLoading || !activeWorkspace) {
    return <div className="p-8">Loading workspace...</div>;
  }

  if (loading) return <div className="p-8">Loading...</div>;

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="text-red-600 text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You need Owner role to access workspace settings.
          </p>
          <button
            onClick={() => router.push('/documents')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Workspace Settings</h1>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Invite User
          </button>
        </div>

        {/* Members */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Members ({members.length})</h2>
          </div>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{member.name || member.email}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                    {member.last_login && ` • Last login ${new Date(member.last_login).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="owner">Owner</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  <button
                    onClick={() => handleRemoveMember(member.id, member.email)}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Pending Invitations ({invitations.length})</h2>
            </div>
            <div className="divide-y">
              {invitations.map((invite) => (
                <div key={invite.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{invite.email}</div>
                    <div className="text-sm text-gray-500">
                      {invite.role} • Invited by {invite.invited_by_name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Section */}
        {activeWorkspace.role === 'owner' && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Billing & Subscription</h2>
            </div>

            {loadingBilling ? (
              <div className="p-6">Loading...</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Current Plan */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold capitalize">
                        {subscription?.plan === 'trial' ? '14-Day Trial' : `${subscription?.plan || 'Trial'} Plan`}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        subscription?.status === 'active' || subscription?.status === 'trialing'
                          ? 'bg-green-100 text-green-800'
                          : subscription?.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription?.status === 'trialing' ? 'Active Trial' : subscription?.status || 'Active'}
                      </span>
                    </div>
                    {subscription?.plan === 'trial' && subscription?.trial_end && (
                      <div className="mt-3">
                        {(() => {
                          const daysRemaining = Math.ceil(
                            (new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                          );
                          if (daysRemaining <= 0) {
                            return (
                              <div className="inline-block bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                                <p className="text-sm text-red-800 font-semibold">
                                  ⏰ Trial expired - Please upgrade to continue
                                </p>
                              </div>
                            );
                          } else if (daysRemaining <= 3) {
                            return (
                              <div className="inline-block bg-orange-100 border border-orange-300 rounded-lg px-4 py-2">
                                <p className="text-sm text-orange-800 font-semibold">
                                  ⏰ Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your trial!
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                  Trial ends {new Date(subscription.trial_end).toLocaleDateString()}
                                </p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="inline-block bg-blue-100 border border-blue-300 rounded-lg px-4 py-2">
                                <p className="text-sm text-blue-800 font-semibold">
                                  🎉 {daysRemaining} days remaining in your trial
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Trial ends {new Date(subscription.trial_end).toLocaleDateString()}
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                    {subscription?.plan !== 'trial' && subscription?.current_period_end && (
                      <p className="text-sm text-gray-600">
                        Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {subscription?.plan !== 'trial' && subscription?.plan !== 'free' && (
                    <button
                      onClick={handleManageBilling}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Manage Billing
                    </button>
                  )}
                </div>

                {/* Plan Limits for Trial */}
                {subscription?.plan === 'trial' && (
                  <div className={`border rounded-lg p-4 ${
                    subscription?.status === 'expired'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`font-semibold mb-2 ${
                      subscription?.status === 'expired' ? 'text-red-900' : 'text-blue-900'
                    }`}>
                      {subscription?.status === 'expired' ? 'Trial Expired' : '14-Day Trial Limits:'}
                    </p>
                    <ul className={`text-sm space-y-1 ${
                      subscription?.status === 'expired' ? 'text-red-800' : 'text-blue-800'
                    }`}>
                      <li>• 1 workspace maximum</li>
                      <li>• 10 documents maximum</li>
                      <li>• 1GB storage</li>
                    </ul>
                    {subscription?.status === 'expired' && (
                      <p className="text-sm text-red-900 font-semibold mt-3">
                        Upgrade to a paid plan to continue using your workspace
                      </p>
                    )}
                  </div>
                )}

                {/* Usage Meters */}
                {usage && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Current Usage</h3>
                    <div className="space-y-4">
                      {/* Documents */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Documents</span>
                          <span className="text-gray-600">
                            {usage.documents_count} / {usage.documents_limit === -1 ? '∞' : usage.documents_limit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: usage.documents_limit === -1
                                ? '0%'
                                : `${Math.min((usage.documents_count / usage.documents_limit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Storage */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Storage</span>
                          <span className="text-gray-600">
                            {usage.storage_used_gb.toFixed(2)} GB / {usage.storage_limit_gb} GB
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((usage.storage_used_gb / usage.storage_limit_gb) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Members */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Members</span>
                          <span className="text-gray-600">
                            {usage.members_count} / {usage.members_limit === -1 ? '∞' : usage.members_limit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{
                              width: usage.members_limit === -1
                                ? '0%'
                                : `${Math.min((usage.members_count / usage.members_limit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upgrade Options for Trial Plan */}
                {subscription?.plan === 'trial' && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4">
                      {subscription?.status === 'expired' ? 'Choose a Plan to Continue' : 'Upgrade Your Plan'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Basic Plan Card */}
                      <div className="border-2 border-blue-200 rounded-lg p-4">
                        <h4 className="font-bold text-lg mb-1">Basic</h4>
                        <p className="text-2xl font-bold text-blue-600 mb-3">$20/mo</p>
                        <ul className="text-sm space-y-1 mb-4">
                          <li>✓ 3 workspaces</li>
                          <li>✓ Unlimited documents</li>
                          <li>✓ 10GB storage</li>
                          <li>✓ PDF export</li>
                        </ul>
                        <button
                          onClick={() => handleUpgrade('basic')}
                          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          Upgrade to Basic
                        </button>
                      </div>

                      {/* Pro Plan Card */}
                      <div className="border-2 border-purple-200 rounded-lg p-4">
                        <h4 className="font-bold text-lg mb-1">Pro</h4>
                        <p className="text-2xl font-bold text-purple-600 mb-3">$50/mo</p>
                        <ul className="text-sm space-y-1 mb-4">
                          <li>✓ 10 workspaces</li>
                          <li>✓ Unlimited everything</li>
                          <li>✓ 50GB storage</li>
                          <li>✓ Priority support</li>
                        </ul>
                        <button
                          onClick={() => handleUpgrade('pro')}
                          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <a
                        href="/pricing"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View detailed plan comparison →
                      </a>
                    </div>
                  </div>
                )}

                {/* Upgrade Options for Basic Plan */}
                {subscription?.plan === 'basic' && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4">Upgrade to Pro</h3>
                    <div className="max-w-md">
                      {/* Pro Plan Card */}
                      <div className="border-2 border-purple-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-2xl mb-1">Pro</h4>
                            <p className="text-3xl font-bold text-purple-600">$50/mo</p>
                          </div>
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                            Recommended
                          </span>
                        </div>
                        <ul className="text-sm space-y-2 mb-6">
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>10 workspaces (vs 3 on Basic)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>10 editors per workspace</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>50GB storage (vs 10GB on Basic)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>500 min video storage</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Priority support</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Custom branding</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Analytics dashboard</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>API access</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => handleUpgrade('pro')}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <a
                        href="/pricing"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View detailed plan comparison →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Danger Zone - Owner Only */}
        {activeWorkspace.role === 'owner' && (
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
            <h2 className="text-xl font-semibold text-red-700 mb-4">Danger Zone</h2>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Delete Workspace</p>
                <p className="text-sm text-gray-600">
                  Permanently delete this workspace and all its data
                </p>
              </div>

              <button
                onClick={handleDeleteWorkspace}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          workspaceId={activeWorkspace.id}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Invite Modal Component
function InviteModal({
  workspaceId,
  onClose,
  onSuccess
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/invitations/', {
        workspace_id: workspaceId,
        email,
        role
      });

      alert('Invitation sent! Check backend console for the link.');
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Invite User</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
              placeholder="user@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="viewer">Viewer (Read only)</option>
              <option value="editor">Editor (Can create/edit)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Only Owners can invite other Owners
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
