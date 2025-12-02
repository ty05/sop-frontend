'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Blog posts - English and Japanese titles/excerpts handled via translations
const blogPosts = [
  {
    slug: 'stop-repeated-questions',
    titleKey: 'stopRepeatedQuestions',
    excerptKey: 'stopRepeatedQuestionsExcerpt',
    date: '2025-02-01',
    author: 'SOP Manual Team',
    category: 'Training',
    image: 'https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/video.png'
  },
  {
    slug: 'why-manuals-fail',
    titleKey: 'whyManualsFail',
    excerptKey: 'whyManualsFailExcerpt',
    date: '2025-01-25',
    author: 'SOP Manual Team',
    category: 'Best Practices',
    image: 'https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/image.png'
  },
  {
    slug: 'restaurant-qr-code-success',
    titleKey: 'restaurantUseCase',
    excerptKey: 'restaurantUseCaseExcerpt',
    date: '2025-01-20',
    author: 'SOP Manual Team',
    category: 'Case Study',
    image: 'https://pub-1b9280c6db204bccb8b235db599be438.r2.dev/uploads/qr.png'
  }
];

export default function BlogPage() {
  const t = useTranslations('blog');

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

      {/* Blog Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            >
              {/* Post Image */}
              <div className="aspect-video overflow-hidden bg-gray-100">
                <img
                  src={post.image}
                  alt={t(`posts.${post.titleKey}`)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Post Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {t(`posts.${post.titleKey}`)}
                </h2>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {t(`posts.${post.excerptKey}`)}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{post.author}</span>
                  <span className="text-blue-600 font-semibold text-sm group-hover:gap-2 inline-flex items-center">
                    {t('readMore')}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Posts Message (if empty) */}
        {blogPosts.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('noPosts')}</h2>
            <p className="text-gray-600">{t('noPostsDescription')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/legal" className="hover:text-white transition">Legal Notice</Link>
            <Link href="/landing" className="hover:text-white transition">Home</Link>
          </div>
          <p className="text-sm">© 2025 SOP Manual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
