'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { trackPageView, trackCTAClick } from '@/lib/analytics';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const t = useTranslations('landing');
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeUseCase, setActiveUseCase] = useState<'restaurant' | 'clinic' | 'retail'>('restaurant');

  const ctaLink = user ? '/documents' : '/auth/login?redirect=/documents';

  // Track page view on mount
  useEffect(() => {
    trackPageView('Landing Page');
  }, []);

  // Helper to track CTA clicks
  const handleCTAClick = (position: string) => {
    trackCTAClick('Start Free Trial', position);
  };

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

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Pricing
            </a>
            <a href="#faq" className="text-gray-700 hover:text-blue-600 transition font-medium">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Login
            </Link>
            <Link
              href={ctaLink}
              onClick={() => handleCTAClick('header')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t('hero.headline')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('hero.subheadline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={ctaLink}
              onClick={() => handleCTAClick('hero')}
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              {t('hero.ctaPrimary')}
            </Link>
            {/* <Link
              href="#how-it-works"
              className="w-full sm:w-auto bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition border-2 border-blue-600"
            >
              {t('hero.ctaSecondary')}
            </Link> */}
          </div>
          <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('hero.trustBadge')}
          </p>

          {/* Hero Image Placeholder */}
          {/* <div className="mt-12 rounded-xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 aspect-video flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 font-medium">Product Demo Video</p>
              </div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('problem.title')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {['pain1', 'pain2', 'pain3', 'pain4'].map((pain, idx) => (
              <div key={pain} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">
                  {t(`problem.${pain}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(`problem.${pain}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution/Features Section */}
      <section id="features" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('solution.title')}
          </h2>
          <div className="space-y-16">
            {['feature1', 'feature2', 'feature3'].map((feature, featureIdx) => (
              <div
                key={feature}
                className={`flex flex-col ${
                  featureIdx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-8 items-center`}
              >
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                    {t(`solution.${feature}.title`)}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {t(`solution.${feature}.description`)}
                  </p>
                </div>
                <div className="flex-1 w-full">
                  <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                    {featureIdx === 0 && (
                      <img
                        src="https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/video.png"
                        alt={t(`solution.${feature}.title`)}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {featureIdx === 1 && (
                      <img
                        src="https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/image.png"
                        alt={t(`solution.${feature}.title`)}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {featureIdx === 2 && (
                      <img
                        src="https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/qr.png"
                        alt={t(`solution.${feature}.title`)}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      {/* <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('useCases.title')}
          </h2>

         
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {(['restaurant', 'clinic', 'retail'] as const).map((useCase) => (
              <button
                key={useCase}
                onClick={() => setActiveUseCase(useCase)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  activeUseCase === useCase
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t(`useCases.${useCase}.title`)}
              </button>
            ))}
          </div>

          
          <div className="bg-white rounded-xl p-8 md:p-12 shadow-lg">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
              {t(`useCases.${activeUseCase}.example`)}
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {t(`useCases.${activeUseCase}.description`)}
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg aspect-video flex items-center justify-center">
              <p className="text-gray-500 font-medium">Use Case Illustration</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* How It Works Section */}
      {/* <section id="how-it-works" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('howItWorks.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {['step1', 'step2', 'step3'].map((step, idx) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t(`howItWorks.${step}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(`howItWorks.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            {t('pricing.subtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {(['trial', 'basic', 'pro'] as const).map((plan) => (
              <div
                key={plan}
                className={`relative bg-white rounded-xl p-8 shadow-lg ${
                  plan === 'basic' ? 'ring-2 ring-blue-600 transform md:scale-105' : ''
                }`}
              >
                {plan === 'basic' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {t('pricing.basic.popular')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    {t(`pricing.${plan}.name`)}
                  </h3>
                  <div className="text-4xl font-bold mb-1 text-gray-900">
                    {t(`pricing.${plan}.price`)}
                    {plan !== 'trial' && (
                      <span className="text-lg text-gray-600 font-normal">
                        {t(`pricing.${plan}.period`)}
                      </span>
                    )}
                  </div>
                  {plan === 'trial' && (
                    <p className="text-sm text-gray-600">{t('pricing.trial.period')}</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {Object.entries(t.raw(`pricing.${plan}.features`) as Record<string, string>).map(([key, feature]) => (
                    <li key={key} className="flex items-start gap-2">
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

                <Link
                  href={ctaLink}
                  onClick={() => handleCTAClick(`pricing_${plan}`)}
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition ${
                    plan === 'basic'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {t(`pricing.${plan}.cta`)}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600">
            <svg className="w-5 h-5 inline mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('pricing.annualDiscount')}
          </p>
        </div>
      </section>

      {/* Social Proof Section */}
      {/* <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('socialProof.title')}
          </h2>

          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {(['users', 'satisfaction', 'timeReduction'] as const).map((stat) => (
              <div key={stat} className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {t(`socialProof.stats.${stat}`)}
                </div>
                <p className="text-gray-600">{t(`socialProof.stats.${stat}Label`)}</p>
              </div>
            ))}
          </div>

          
          <div className="grid md:grid-cols-3 gap-8">
            {['testimonial1', 'testimonial2', 'testimonial3'].map((testimonial) => (
              <div key={testimonial} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {t(`socialProof.${testimonial}.quote`)}
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">
                    {t(`socialProof.${testimonial}.author`)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t(`socialProof.${testimonial}.company`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto bg-white">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('faq.title')}
          </h2>
          <div className="space-y-4">
            {['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((q, idx) => (
              <div key={q} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {t(`faq.${q}.question`)}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      activeFaq === idx ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {t(`faq.${q}.answer`)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('finalCta.title')}
          </h2>
          <p className="text-lg md:text-xl mb-8 text-blue-100">
            {t('finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={ctaLink}
              onClick={() => handleCTAClick('final_cta')}
              className="w-full sm:w-auto bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
            >
              {t('finalCta.ctaPrimary')}
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            {t('finalCta.trustBadge')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-white mb-4">{t('footer.company')}</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="hover:text-white transition">{t('footer.contact')}</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">{t('footer.blog')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:text-white transition">{t('footer.terms')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">{t('footer.privacy')}</Link></li>
              <li><Link href="/legal" className="hover:text-white transition">{t('footer.legalNotice')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">SOP Manual</h3>
            <p className="text-sm mb-4">
              Create professional operation manuals with video and image annotations.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
