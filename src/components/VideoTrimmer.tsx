'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface VideoTrimmerProps {
  videoId: string;
  currentStart?: number;
  currentEnd?: number;
  duration: number;
  onSave: (startSec: number, endSec: number) => void;
}

export default function VideoTrimmer({
  videoId,
  currentStart = 0,
  currentEnd,
  duration,
  onSave
}: VideoTrimmerProps) {
  const t = useTranslations('videoTrimmer');
  const [startSec, setStartSec] = useState(currentStart);
  const [endSec, setEndSec] = useState(currentEnd || duration);

  const handleSave = () => {
    onSave(startSec, endSec);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h4 className="font-semibold mb-4">{t('title')}</h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('startTime')}: {formatTime(startSec)}
          </label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={startSec}
            onChange={(e) => setStartSec(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('endTime')}: {formatTime(endSec)}
          </label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={endSec}
            onChange={(e) => setEndSec(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="text-sm text-gray-600">
          {t('selectedDuration')}: {formatTime(endSec - startSec)}
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {t('saveTrimPoints')}
        </button>
      </div>
    </div>
  );
}
