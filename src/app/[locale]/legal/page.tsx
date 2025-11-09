'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LegalNoticePage() {
  const t = useTranslations('legal');

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
            <LanguageSwitcher />
            <Link
              href="/landing"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              {t('backToHome')}
            </Link>
          </div>
        </nav>
      </header>

      {/* Legal Notice Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('lastUpdated')}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* 1. Business Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.business.title')}</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div>
                <p className="text-gray-600 text-sm">{t('sections.business.name')}</p>
                <p className="text-gray-900 font-medium">{t('sections.business.nameValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.business.representative')}</p>
                <p className="text-gray-900 font-medium">{t('sections.business.representativeValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.business.address')}</p>
                <p className="text-gray-900 font-medium whitespace-pre-line">{t('sections.business.addressValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.business.email')}</p>
                <p className="text-gray-900 font-medium">{t('sections.business.emailValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.business.phone')}</p>
                <p className="text-gray-900 font-medium">{t('sections.business.phoneValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.business.hours')}</p>
                <p className="text-gray-900 font-medium">{t('sections.business.hoursValue')}</p>
              </div>
            </div>
          </section>

          {/* 2. Service Description */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.service.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.service.intro')}
            </p>
            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.service.featuresTitle')}</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.service.features') as string[]).map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </section>

          {/* 3. Pricing and Payment Terms */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.pricing.title')}</h2>

            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('sections.pricing.plansTitle')}</h3>
            <div className="space-y-4 mb-6">
              {/* Free Trial */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">{t('sections.pricing.trial.name')}</h4>
                <p className="text-gray-700 mb-2">{t('sections.pricing.trial.duration')}</p>
                <p className="text-gray-600 text-sm mb-2">{t('sections.pricing.trial.features')}</p>
                <p className="text-gray-600 text-sm mb-2">{t('sections.pricing.trial.cardRequired')}</p>
                <p className="text-gray-700 font-semibold mt-3 mb-2">{t('sections.pricing.trial.limits')}</p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  {(t.raw('sections.pricing.trial.limitsList') as string[]).map((limit, idx) => (
                    <li key={idx}>{limit}</li>
                  ))}
                </ul>
              </div>

              {/* Basic Plan */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">{t('sections.pricing.basic.name')}</h4>
                <p className="text-gray-700 mb-2">{t('sections.pricing.basic.priceMonthly')}</p>
                <p className="text-gray-700 mb-2">{t('sections.pricing.basic.priceYearly')}</p>
                <p className="text-gray-700 font-semibold mt-3 mb-2">{t('sections.pricing.basic.featuresTitle')}</p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  {(t.raw('sections.pricing.basic.features') as string[]).map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">{t('sections.pricing.pro.name')}</h4>
                <p className="text-gray-700 mb-2">{t('sections.pricing.pro.priceMonthly')}</p>
                <p className="text-gray-700 mb-2">{t('sections.pricing.pro.priceYearly')}</p>
                <p className="text-gray-700 font-semibold mt-3 mb-2">{t('sections.pricing.pro.featuresTitle')}</p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  {(t.raw('sections.pricing.pro.features') as string[]).map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.pricing.methodsTitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.pricing.methodsIntro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.pricing.methods') as string[]).map((method, idx) => (
                <li key={idx}>{method}</li>
              ))}
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.pricing.termsTitle')}</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.pricing.terms') as string[]).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </section>

          {/* 4. Cancellation and Refund Policy */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.refund.title')}</h2>

            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('sections.refund.cancellationTitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.refund.cancellationIntro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.refund.cancellationTerms') as string[]).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.refund.refundTitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.refund.refundIntro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.refund.refundTerms') as string[]).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </section>

          {/* 5. Customer Support */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.support.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.support.intro')}
            </p>

            <div className="space-y-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">{t('sections.support.email.title')}</h4>
                <p className="text-gray-700 mb-1">{t('sections.support.email.contact')}</p>
                <p className="text-gray-600 text-sm">{t('sections.support.email.response')}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.support.hours.title')}</h3>
            <p className="text-gray-700">{t('sections.support.hours.schedule')}</p>
          </section>

          {/* 6. Delivery Period */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.deliveryPeriod.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.deliveryPeriod.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.deliveryPeriod.terms') as string[]).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </section>

          {/* 7. Business Registration Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.registration.title')}</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div>
                <p className="text-gray-600 text-sm">{t('sections.registration.corporateNumber')}</p>
                <p className="text-gray-900 font-medium">{t('sections.registration.corporateNumberValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.registration.invoiceNumber')}</p>
                <p className="text-gray-900 font-medium">{t('sections.registration.invoiceNumberValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.registration.antiqueDealer')}</p>
                <p className="text-gray-900 font-medium">{t('sections.registration.antiqueDealerValue')}</p>
              </div>
            </div>
          </section>

          {/* 8. Service Provision Timing */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.serviceProvision.title')}</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.serviceProvision.terms') as string[]).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </section>

          {/* 9. Disclaimer */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.disclaimer.title')}</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.disclaimer.terms') as string[]).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </section>

          {/* 10. Contact Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.contact.title')}</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <p className="text-gray-600 text-sm font-semibold">{t('sections.contact.generalSupport')}</p>
                <p className="text-gray-900 font-medium">{t('sections.contact.generalEmail')}</p>
                <p className="text-gray-700 text-sm">{t('sections.contact.generalHours')}</p>
                <p className="text-gray-600 text-sm">{t('sections.contact.generalNote')}</p>
              </div>
              <div className="border-t border-gray-300 pt-4">
                <p className="text-gray-600 text-sm font-semibold">{t('sections.contact.billing')}</p>
                <p className="text-gray-900 font-medium">{t('sections.contact.billingEmail')}</p>
              </div>
              <div className="border-t border-gray-300 pt-4">
                <p className="text-gray-600 text-sm">{t('sections.contact.addressLabel')}</p>
                <p className="text-gray-900 font-medium whitespace-pre-line">{t('sections.contact.addressValue')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t('sections.contact.phoneLabel')}</p>
                <p className="text-gray-900 font-medium">{t('sections.contact.phoneValue')}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">{t('sections.contact.lastUpdated')}</p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/legal" className="hover:text-white transition">{t('title')}</Link>
            <Link href="/landing" className="hover:text-white transition">Home</Link>
          </div>
          <p className="text-sm">© 2025 SOP Manual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
