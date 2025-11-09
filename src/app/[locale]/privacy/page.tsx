'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');

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

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('lastUpdated')}
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8">
          <p className="text-gray-800">
            <strong>Note:</strong> Full bilingual content for Privacy Policy is being prepared.
            For now, please refer to our Terms of Service for our data handling commitments,
            or contact us at privacy@sopmanual.com for specific privacy inquiries.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We respect your privacy and are committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, and safeguard your information
              when you use SOP Manual.
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>We collect information you provide and usage data</li>
              <li>We use data to provide and improve our service</li>
              <li>We protect your data with industry-standard security</li>
              <li>You have rights to access, correct, and delete your data</li>
              <li>We comply with GDPR, CCPA, and other privacy regulations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">Email: privacy@sopmanual.com</p>
              <p className="text-gray-700 font-medium mt-2">Support: support@sopmanual.com</p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">{t('title')}</Link>
            <Link href="/landing" className="hover:text-white transition">Home</Link>
          </div>
          <p className="text-sm">© 2025 SOP Manual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
