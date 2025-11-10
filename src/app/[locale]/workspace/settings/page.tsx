'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import apiClient from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';

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
  const locale = useLocale();
  const t = useTranslations('settings');
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
      router.push(`/${locale}/auth/login`);
    }
  }, [user, authLoading, router, locale]);

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
    if (!confirm(t('confirmations.changeRole', { role: newRole }))) return;

    try {
      await apiClient.patch(
        `/workspaces/${activeWorkspace.id}/members/${memberId}/role`,
        { role: newRole }
      );
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || t('errors.failedToUpdateRole'));
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!activeWorkspace) return;
    if (!confirm(t('confirmations.removeMember', { email }))) return;

    try {
      await apiClient.delete(`/workspaces/${activeWorkspace.id}/members/${memberId}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || t('errors.failedToRemoveMember'));
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm(t('confirmations.cancelInvite'))) return;

    try {
      await apiClient.delete(`/invitations/${inviteId}`);
      loadData();
    } catch (error) {
      alert(t('errors.failedToCancelInvitation'));
    }
  };

  const handleUpgrade = async (plan: 'basic' | 'pro') => {

    if (!activeWorkspace) {
      return;
    }

    console.log('🔍 Frontend - Sending checkout request:', { plan, locale });

    try {
      const res = await apiClient.post(`/billing/checkout/${activeWorkspace.id}`, { plan, locale });
      window.location.href = res.data.checkout_url;
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(t('errors.failedToCheckout') + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleManageBilling = async () => {
    if (!activeWorkspace) return;

    try {
      const res = await apiClient.post(`/billing/portal/${activeWorkspace.id}`);
      window.location.href = res.data.portal_url;
    } catch (error) {
      alert(t('errors.failedToOpenBillingPortal'));
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;

    if (!confirm(t('confirmations.deleteWorkspaceConfirm', { name: activeWorkspace.name }))) {
      return;
    }

    const confirmName = prompt(t('confirmations.deleteWorkspacePrompt', { name: activeWorkspace.name }));
    if (confirmName !== activeWorkspace.name) {
      alert(t('confirmations.deleteWorkspaceNoMatch'));
      return;
    }

    try {
      await apiClient.delete(`/workspaces/${activeWorkspace.id}`);
      alert(t('confirmations.workspaceDeleted'));
      // Redirect to documents page (will switch to another workspace)
      window.location.href = `/${locale}/documents`;
    } catch (error: any) {
      alert(error.response?.data?.detail || t('errors.failedToDeleteWorkspace'));
    }
  };

  if (workspaceLoading || !activeWorkspace) {
    return <div className="p-8">{t('loadingWorkspace')}</div>;
  }

  if (loading) return <div className="p-8">{t('loading')}</div>;

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="text-red-600 text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">{t('accessDenied')}</h2>
          <p className="text-gray-600 mb-6">
            {t('accessDeniedMessage')}
          </p>
          <button
            onClick={() => router.push(`/${locale}/documents`)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {t('backToDocuments')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {t('inviteUser')}
          </button>
        </div>

        {/* Members */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">{t('members')} ({members.length})</h2>
          </div>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{member.name || member.email}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {t('joined')} {new Date(member.joined_at).toLocaleDateString()}
                    {member.last_login && ` • ${t('lastLogin')} ${new Date(member.last_login).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="owner">{t('roles.owner')}</option>
                    <option value="editor">{t('roles.editor')}</option>
                    <option value="viewer">{t('roles.viewer')}</option>
                  </select>

                  <button
                    onClick={() => handleRemoveMember(member.id, member.email)}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    {t('remove')}
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
              <h2 className="text-xl font-semibold">{t('pendingInvitations')} ({invitations.length})</h2>
            </div>
            <div className="divide-y">
              {invitations.map((invite) => (
                <div key={invite.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{invite.email}</div>
                    <div className="text-sm text-gray-500">
                      {t(`roles.${invite.role}`)} • {t('invitedBy')} {invite.invited_by_name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {t('expires')} {new Date(invite.expires_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    {t('cancel')}
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
              <h2 className="text-xl font-semibold">{t('billing.title')}</h2>
            </div>

            {loadingBilling ? (
              <div className="p-6">{t('loading')}</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Current Plan */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold capitalize">
                        {subscription?.plan === 'trial' ? t('billing.trialPlanName') : t('billing.planName', { plan: subscription?.plan || 'Trial' })}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        subscription?.status === 'active' || subscription?.status === 'trialing'
                          ? 'bg-green-100 text-green-800'
                          : subscription?.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription?.status === 'trialing' ? t('billing.status.activeTrial') : t(`billing.status.${subscription?.status}`) || t('billing.status.active')}
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
                                  ⏰ {t('billing.trialExpired')}
                                </p>
                              </div>
                            );
                          } else if (daysRemaining <= 3) {
                            return (
                              <div className="inline-block bg-orange-100 border border-orange-300 rounded-lg px-4 py-2">
                                <p className="text-sm text-orange-800 font-semibold">
                                  ⏰ {t('billing.trialDaysLeft', { days: daysRemaining })}
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                  {t('billing.trialEnds')} {new Date(subscription.trial_end).toLocaleDateString()}
                                </p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="inline-block bg-blue-100 border border-blue-300 rounded-lg px-4 py-2">
                                <p className="text-sm text-blue-800 font-semibold">
                                  🎉 {t('billing.trialDaysRemaining', { days: daysRemaining })}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                  {t('billing.trialEnds')} {new Date(subscription.trial_end).toLocaleDateString()}
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                    {subscription?.plan !== 'trial' && subscription?.current_period_end && (
                      <p className="text-sm text-gray-600">
                        {t('billing.renewsOn')} {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {subscription?.plan !== 'trial' && subscription?.plan !== 'free' && (
                    <button
                      onClick={handleManageBilling}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      {t('billing.manageBilling')}
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
                      {subscription?.status === 'expired' ? t('billing.trialExpiredTitle') : t('billing.trialLimitsTitle')}
                    </p>
                    <ul className={`text-sm space-y-1 ${
                      subscription?.status === 'expired' ? 'text-red-800' : 'text-blue-800'
                    }`}>
                      <li>• {t('billing.limits.workspaces')}</li>
                      <li>• {t('billing.limits.documents')}</li>
                      <li>• {t('billing.limits.storage')}</li>
                    </ul>
                    {subscription?.status === 'expired' && (
                      <p className="text-sm text-red-900 font-semibold mt-3">
                        {t('billing.upgradeRequired')}
                      </p>
                    )}
                  </div>
                )}

                {/* Usage Meters */}
                {usage && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">{t('billing.currentUsage')}</h3>
                    <div className="space-y-4">
                      {/* Documents */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">{t('billing.documents')}</span>
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
                          <span className="font-medium">{t('billing.storage')}</span>
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
                          <span className="font-medium">{t('billing.members')}</span>
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
                      {subscription?.status === 'expired' ? t('billing.choosePlan') : t('billing.upgradeYourPlan')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Basic Plan Card */}
                      <div className="border-2 border-blue-200 rounded-lg p-4">
                        <h4 className="font-bold text-lg mb-1">{t('billing.plans.basic.name')}</h4>
                        <p className="text-2xl font-bold text-blue-600 mb-3">{t('billing.plans.basic.price')}</p>
                        <ul className="text-sm space-y-1 mb-4">
                          <li>✓ {t('billing.plans.basic.features.workspaces')}</li>
                          <li>✓ {t('billing.plans.basic.features.documents')}</li>
                          <li>✓ {t('billing.plans.basic.features.storage')}</li>
                          <li>✓ {t('billing.plans.basic.features.pdfExport')}</li>
                        </ul>
                        <button
                          onClick={() => handleUpgrade('basic')}
                          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          {t('billing.upgradeToBasic')}
                        </button>
                      </div>

                      {/* Pro Plan Card */}
                      <div className="border-2 border-purple-200 rounded-lg p-4">
                        <h4 className="font-bold text-lg mb-1">{t('billing.plans.pro.name')}</h4>
                        <p className="text-2xl font-bold text-purple-600 mb-3">{t('billing.plans.pro.price')}</p>
                        <ul className="text-sm space-y-1 mb-4">
                          <li>✓ {t('billing.plans.pro.features.workspaces')}</li>
                          <li>✓ {t('billing.plans.pro.features.unlimited')}</li>
                          <li>✓ {t('billing.plans.pro.features.storage')}</li>
                          <li>✓ {t('billing.plans.pro.features.support')}</li>
                        </ul>
                        <button
                          onClick={() => handleUpgrade('pro')}
                          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                        >
                          {t('billing.upgradeToPro')}
                        </button>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <a
                        href={`/${locale}/pricing`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {t('billing.viewComparison')}
                      </a>
                    </div>
                  </div>
                )}

                {/* Upgrade Options for Basic Plan */}
                {subscription?.plan === 'basic' && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4">{t('billing.upgradeToPro')}</h3>
                    <div className="max-w-md">
                      {/* Pro Plan Card */}
                      <div className="border-2 border-purple-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-2xl mb-1">{t('billing.plans.pro.name')}</h4>
                            <p className="text-3xl font-bold text-purple-600">{t('billing.plans.pro.price')}</p>
                          </div>
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {t('billing.recommended')}
                          </span>
                        </div>
                        <ul className="text-sm space-y-2 mb-6">
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.workspaces')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.editors')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.storage')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.video')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.support')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.branding')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.analytics')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('billing.plans.pro.comparison.api')}</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => handleUpgrade('pro')}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold"
                        >
                          {t('billing.upgradeToPro')}
                        </button>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <a
                        href={`/${locale}/pricing`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {t('billing.viewComparison')}
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
            <h2 className="text-xl font-semibold text-red-700 mb-4">{t('dangerZone.title')}</h2>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{t('dangerZone.deleteWorkspace')}</p>
                <p className="text-sm text-gray-600">
                  {t('dangerZone.deleteDescription')}
                </p>
              </div>

              <button
                onClick={handleDeleteWorkspace}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                {t('dangerZone.deleteWorkspace')}
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
  const t = useTranslations('settings');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email?.trim()) {
      alert(t('invite.errors.emailRequired'));
      return;
    }

    if (!email.includes('@')) {
      alert(t('invite.errors.emailInvalid'));
      return;
    }

    if (!role) {
      alert(t('invite.errors.roleRequired'));
      return;
    }

    setLoading(true);

    try {
      // Send invitation to backend
      const response = await apiClient.post('/invitations/', {
        workspace_id: workspaceId,
        email: email.trim().toLowerCase(),
        role
      });


      // SUCCESS - Show success message
      alert(t('invite.success', { email }));

      // Reset form and close modal
      setEmail('');
      setRole('viewer');
      onSuccess();

    } catch (error: any) {
      // ERROR - Show specific error message
      console.error('❌ Failed to send invitation:', error);

      let errorMessage = t('invite.errors.failed');

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`❌ ${t('errors.error')}: ${errorMessage}`);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{t('invite.title')}</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('invite.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
              placeholder={t('invite.emailPlaceholder')}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">{t('invite.role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="viewer">{t('invite.roles.viewer')}</option>
              <option value="editor">{t('invite.roles.editor')}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('invite.roleNote')}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim() || !role}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('invite.sending')}
                </>
              ) : (
                t('invite.sendInvitation')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
