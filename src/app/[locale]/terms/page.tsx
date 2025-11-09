'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function TermsOfServicePage() {
  const t = useTranslations('terms');

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

      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('lastUpdated')}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* 1. Agreement to Terms */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.agreement.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.agreement.content')}
            </p>
          </section>

          {/* 2. Description of Service */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.description.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.description.content')}
            </p>
          </section>

          {/* 3. User Accounts */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.accounts.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.accounts.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.accounts.requirements') as string[]).map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.accounts.ageRequirement')}
            </p>
          </section>

          {/* 4. Subscription and Payment */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.payment.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.payment.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.payment.terms') as string[]).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </section>

          {/* 5. User Content */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.userContent.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.userContent.ownership')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.userContent.warranties')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.userContent.warrantyList') as string[]).map((warranty, idx) => (
                <li key={idx}>{warranty}</li>
              ))}
            </ul>
          </section>

          {/* 6. Prohibited Uses */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.prohibited.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.prohibited.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.prohibited.list') as string[]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 7. Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.intellectual.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.intellectual.content')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.intellectual.restrictions')}
            </p>
          </section>

          {/* 8. Data Privacy */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.privacy.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.privacy.content')}
            </p>
          </section>

          {/* 9. Termination */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.termination.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.termination.ourRights')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.termination.effect')}
            </p>
          </section>

          {/* 10. Disclaimer of Warranties */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.disclaimer.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.disclaimer.asIs')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.disclaimer.noWarranty')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.disclaimer.list') as string[]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 11. Limitation of Liability */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.limitation.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.limitation.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.limitation.scenarios') as string[]).map((scenario, idx) => (
                <li key={idx}>{scenario}</li>
              ))}
            </ul>
          </section>

          {/* 12. Indemnification */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.indemnification.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.indemnification.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.indemnification.scenarios') as string[]).map((scenario, idx) => (
                <li key={idx}>{scenario}</li>
              ))}
            </ul>
          </section>

          {/* 13. Changes to Terms */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.changes.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.changes.modification')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.changes.continued')}
            </p>
          </section>

          {/* 14. Governing Law */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.governing.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.governing.content')}
            </p>
          </section>

          {/* 15. Contact Us */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.contact.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.contact.intro')}
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">{t('sections.contact.email')}</p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/terms" className="hover:text-white transition">
              {t('title')}
            </Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/landing" className="hover:text-white transition">Home</Link>
          </div>
          <p className="text-sm">© 2025 SOP Manual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
