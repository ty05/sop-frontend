'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import apiClient from '@/lib/api';

interface QRCodeGeneratorProps {
  documentId?: string;
  stepId?: string;
  timecode?: number;
}

export default function QRCodeGenerator({ documentId, stepId, timecode }: QRCodeGeneratorProps) {
  const t = useTranslations('qrCode');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    setLoading(true);
    try {
      const endpoint = stepId
        ? `/qr/step/${stepId}${timecode ? `?timecode=${timecode}` : ''}`
        : `/qr/document/${documentId}`;

      const response = await apiClient.get(endpoint, {
        responseType: 'blob'
      });

      const url = URL.createObjectURL(response.data);
      setQrUrl(url);
    } catch (error) {
      console.error('Failed to generate QR:', error);
      alert(t('failedToGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrUrl) return;

    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${stepId || documentId}.png`;
    a.click();
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-3">{t('title')}</h4>

      {!qrUrl ? (
        <button
          onClick={generateQR}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
        >
          {loading ? t('generating') : t('generateQrCode')}
        </button>
      ) : (
        <div className="space-y-3">
          <img src={qrUrl} alt={t('title')} className="w-full max-w-xs mx-auto" />
          <button
            onClick={downloadQR}
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            {t('downloadQrCode')}
          </button>
          <button
            onClick={() => setQrUrl('')}
            className="bg-gray-300 px-4 py-2 rounded w-full text-sm"
          >
            {t('generateNew')}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        {t('printMessage')}
      </p>
    </div>
  );
}
