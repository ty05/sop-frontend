'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import apiClient from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';

export default function PricingPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('pricing');
  const { user, loading } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('trial');

  const plans = [
    {
      id: 'trial',
      name: t('plans.trial.name'),
      price: null,
      trialDays: 14,
      features: Object.values(t.raw('plans.trial.features') as Record<string, string>),
      cta: t('getStarted'),
      popular: false
    },
    {
      id: 'basic',
      name: t('plans.basic.name'),
      price: 20,
      features: Object.values(t.raw('plans.basic.features') as Record<string, string>),
      cta: t('upgradeToBasic'),
      popular: true
    },
    {
      id: 'pro',
      name: t('plans.pro.name'),
      price: 50,
      features: Object.values(t.raw('plans.pro.features') as Record<string, string>),
      cta: t('upgradeToPro'),
      popular: false
    }
  ];

  // Fetch current subscription when workspace is available
  useEffect(() => {
    if (activeWorkspace) {
      fetchSubscription();
    }
  }, [activeWorkspace]);

  const fetchSubscription = async () => {
    if (!activeWorkspace) return;

    try {
      const res = await apiClient.get(`/billing/subscription/${activeWorkspace.id}`);
      setCurrentPlan(res.data.plan || 'trial');
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setCurrentPlan('trial');
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/pricing`);
      return;
    }

    // If current plan, go to settings
    if (planId === currentPlan) {
      router.push(`/${locale}/workspace/settings`);
      return;
    }

    if (planId === 'trial') {
      // Trial is automatic on signup, just redirect to get started
      router.push(`/${locale}/documents`);
      return;
    }

    if (!activeWorkspace) {
      alert(t('selectWorkspaceFirst'));
      return;
    }

    setUpgrading(planId);

    try {
      const res = await apiClient.post(
        `/billing/checkout/${activeWorkspace.id}`,
        { plan: planId }
      );
      window.location.href = res.data.checkout_url;
    } catch (error: any) {
      alert(error.response?.data?.detail || t('failedToCheckout'));
      setUpgrading(null);
    }
  };

  // Helper to determine button text
  const getButtonText = (plan: any) => {
    if (plan.id === currentPlan) {
      return t('currentPlan');
    }
    return plan.cta;
  };

  // Helper to check if plan should be disabled
  const isPlanDisabled = (plan: any) => {
    return plan.id === currentPlan || upgrading === plan.id;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {t('mostPopular')}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-1">
                  {plan.price === null ? (
                    <>
                      <span className="text-3xl">{plan.trialDays} {t('days')}</span>
                      <span className="text-lg text-gray-600 font-normal block mt-1">{t('freeTrial')}</span>
                    </>
                  ) : (
                    <>
                      ${plan.price}
                      <span className="text-lg text-gray-600 font-normal">{t('perMonth')}</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isPlanDisabled(plan)}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.id === currentPlan
                    ? 'bg-green-100 text-green-800 border-2 border-green-600'
                    : plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {upgrading === plan.id ? t('processing') : getButtonText(plan)}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('faq.title')}
          </h2>

          <div className="space-y-6">
            {['q1', 'q2', 'q3', 'q4'].map((q) => (
              <div key={q} className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-semibold text-lg mb-2">{t(`faq.${q}.question`)}</h3>
                <p className="text-gray-600">
                  {t(`faq.${q}.answer`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
