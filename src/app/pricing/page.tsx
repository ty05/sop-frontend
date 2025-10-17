'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import apiClient from '@/lib/api';

const plans = [
  {
    id: 'trial',
    name: '14-Day Trial',
    price: null,
    trialDays: 14,
    features: [
      '1 workspace',
      '1 workspace owner',
      'Unlimited viewers',
      '10 documents',
      '1GB storage',
      'Basic support'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 20,
    features: [
      '3 workspaces',
      '3 editors per workspace',
      'Unlimited viewers',
      'Unlimited documents',
      '10GB storage',
      '120 min video storage',
      'Email support',
      'PDF export',
      'QR codes'
    ],
    cta: 'Upgrade to Basic',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 50,
    features: [
      '10 workspaces',
      '10 editors per workspace',
      'Unlimited viewers',
      'Unlimited documents',
      '50GB storage',
      '500 min video storage',
      'Priority support',
      'Custom branding',
      'Analytics dashboard',
      'API access'
    ],
    cta: 'Upgrade to Pro',
    popular: false
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('trial');

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
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    // If current plan, go to settings
    if (planId === currentPlan) {
      router.push('/workspace/settings');
      return;
    }

    if (planId === 'trial') {
      // Trial is automatic on signup, just redirect to get started
      router.push('/documents');
      return;
    }

    if (!activeWorkspace) {
      alert('Please select a workspace first');
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
      alert(error.response?.data?.detail || 'Failed to start checkout');
      setUpgrading(null);
    }
  };

  // Helper to determine button text
  const getButtonText = (plan: any) => {
    if (plan.id === currentPlan) {
      return 'Current Plan';
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
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Start with a 14-day free trial, upgrade as you grow
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
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-1">
                  {plan.price === null ? (
                    <>
                      <span className="text-3xl">{plan.trialDays} Days</span>
                      <span className="text-lg text-gray-600 font-normal block mt-1">Free Trial</span>
                    </>
                  ) : (
                    <>
                      ${plan.price}
                      <span className="text-lg text-gray-600 font-normal">/month</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
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
                {upgrading === plan.id ? 'Processing...' : getButtonText(plan)}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade at any time. Changes take effect immediately.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards via Stripe.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Yes! Every new workspace gets a 14-day free trial with access to all trial features.
                After the trial ends, upgrade to Basic or Pro to continue using your workspace.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes, cancel anytime from your workspace settings. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
