'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('lastUpdated')}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* 1. Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.introduction.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.introduction.welcome')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.introduction.agreement')}
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.infoCollect.title')}</h2>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.infoCollect.provided.subtitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.infoCollect.provided.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.infoCollect.provided.when') as string[]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.infoCollect.provided.mayInclude')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.infoCollect.provided.includes') as string[]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.infoCollect.automatic.subtitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.infoCollect.automatic.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.infoCollect.automatic.list') as string[]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.howWeUse.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeUse.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.howWeUse.purposes') as string[]).map((purpose, idx) => (
                <li key={idx}>{purpose}</li>
              ))}
            </ul>
          </section>

          {/* 4. How We Share Your Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.howWeShare.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeShare.intro')}
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.howWeShare.consent.subtitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeShare.consent.content')}
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.howWeShare.providers.subtitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeShare.providers.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.howWeShare.providers.list') as string[]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeShare.providers.compliance')}
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.howWeShare.paymentHandling.subtitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeShare.paymentHandling.content')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeShare.paymentHandling.stripePolicy')}
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{t('sections.howWeShare.legal.subtitle')}</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.howWeShare.legal.content')}
            </p>
          </section>

          {/* 5. Data Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.dataSecurity.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.dataSecurity.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.dataSecurity.measures') as string[]).map((measure, idx) => (
                <li key={idx}>{measure}</li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.dataSecurity.disclaimer')}
            </p>
          </section>

          {/* 6. Your Rights and Choices */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.yourRights.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.yourRights.intro')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.yourRights.rights') as string[]).map((right, idx) => (
                <li key={idx}>{right}</li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.yourRights.contact')}
            </p>
          </section>

          {/* 7. Cookies and Tracking Technologies */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('sections.cookies.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.cookies.intro')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.cookies.types')}
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              {(t.raw('sections.cookies.typesList') as string[]).map((type, idx) => (
                <li key={idx}>{type}</li>
              ))}
            </ul>
          </section>

          {/* 8. Contact Us */}
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
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">{t('title')}</Link>
            <Link href="/legal" className="hover:text-white transition">Legal Notice</Link>
            <Link href="/landing" className="hover:text-white transition">Home</Link>
          </div>
          <p className="text-sm">© 2025 SOP Manual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
