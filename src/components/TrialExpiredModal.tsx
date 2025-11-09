'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface TrialExpiredModalProps {
  message: string;
  trialEnded?: string;
}

export default function TrialExpiredModal({ message, trialEnded }: TrialExpiredModalProps) {
  const router = useRouter();
  const locale = useLocale();

  const handleUpgrade = () => {
    router.push(`/${locale}/workspace/settings`);
  };

  // Prevent any clicks on the background
  const handleBackgroundClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
      onClick={handleBackgroundClick}
      onKeyDown={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 text-center">
        {/* Lock Icon */}
        <div className="mb-6">
          <svg
            className="mx-auto h-20 w-20 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Trial Expired
        </h2>

        {/* Message */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {message || 'Your 14-day trial has expired. Please upgrade to continue accessing your content.'}
        </p>

        {/* Trial End Date */}
        {trialEnded && (
          <p className="text-sm text-gray-500 mb-6">
            Trial ended: {new Date(trialEnded).toLocaleDateString()}
          </p>
        )}

        {/* CTA Button - Cannot be dismissed, must upgrade */}
        <button
          onClick={handleUpgrade}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors shadow-lg"
        >
          Upgrade Now
        </button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 mt-6">
          You'll be redirected to select a plan
        </p>
      </div>
    </div>
  );
}
