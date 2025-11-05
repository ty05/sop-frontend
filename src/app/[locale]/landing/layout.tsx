import type { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;

  const isJapanese = locale === 'ja';

  return {
    title: isJapanese
      ? '飲食店・クリニック向け業務マニュアル作成ツール | SOP Manual'
      : 'Operation Manual Creation Tool for Restaurants & Clinics | SOP Manual',
    description: isJapanese
      ? '動画・画像に注釈を追加して誰でも簡単に業務マニュアルを作成。14日間無料トライアル。クレジットカード不要。飲食店、クリニック、小売店向けのマニュアル作成SaaS。'
      : 'Create professional operation manuals with video and image annotations. 14-day free trial. No credit card required. Perfect for restaurants, clinics, and retail stores.',
    keywords: isJapanese
      ? '業務マニュアル, SOP, 飲食店, クリニック, 小売店, マニュアル作成, 動画マニュアル, 画像編集, QRコード'
      : 'operation manual, SOP, standard operating procedure, restaurant training, clinic procedures, retail training, video manual, manual creation, documentation',
    openGraph: {
      title: isJapanese
        ? '業務マニュアル作成ツール | SOP Manual'
        : 'Operation Manual Creation Tool | SOP Manual',
      description: isJapanese
        ? '動画・画像で分かりやすいマニュアルを簡単作成'
        : 'Create clear manuals with videos and images',
      type: 'website',
      locale: locale,
      siteName: 'SOP Manual',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'SOP Manual - Operation Manual Creation Tool',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isJapanese
        ? '業務マニュアル作成ツール | SOP Manual'
        : 'Operation Manual Creation Tool | SOP Manual',
      description: isJapanese
        ? '動画・画像で分かりやすいマニュアルを簡単作成。14日間無料トライアル。'
        : 'Create clear manuals with videos and images. 14-day free trial.',
      images: ['/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      languages: {
        'ja': '/ja/landing',
        'en': '/en/landing',
      },
    },
  };
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
