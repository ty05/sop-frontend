'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CommercialTransactionPage() {
  const t = useTranslations('commerce');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/landing" className="text-xl md:text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
              SOP Manual
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/landing"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              {t('backToHome')}
            </Link>
          </div>
        </nav>
      </header>

      {/* Commercial Transaction Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('lastUpdated')}
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8">
          <p className="text-gray-800">
            <strong>Note:</strong> Full bilingual content for Commercial Transaction Act is being prepared.
            For now, please contact us at support@sopmanual.com for billing and transaction inquiries.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          {/* Business Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Business Name</p>
                <p className="text-gray-900 font-medium">SOP Manual</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Contact Email</p>
                <p className="text-gray-900 font-medium">support@sopmanual.com</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Billing Email</p>
                <p className="text-gray-900 font-medium">billing@sopmanual.com</p>
              </div>
            </div>
          </section>

          {/* Pricing Summary */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">Free Trial</h3>
                <p className="text-gray-700 mb-2">Price: $0 for 14 days</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">Basic Plan</h3>
                <p className="text-gray-700 mb-2">Price: $29/month or $290/year</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">Pro Plan</h3>
                <p className="text-gray-700 mb-2">Price: $99/month or $990/year</p>
              </div>
            </div>
          </section>

          {/* Refund Policy */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We offer a 30-day money-back guarantee for first-time subscribers.
              Refund requests can be submitted to support@sopmanual.com.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div>
                <p className="text-gray-600 text-sm">General Support</p>
                <p className="text-gray-900 font-medium">support@sopmanual.com</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Billing Inquiries</p>
                <p className="text-gray-900 font-medium">billing@sopmanual.com</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/commerce" className="hover:text-white transition">{t('title')}</Link>
            <Link href="/landing" className="hover:text-white transition">Home</Link>
          </div>
          <p className="text-sm">© 2025 SOP Manual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
