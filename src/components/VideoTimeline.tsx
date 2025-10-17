'use client';

import { useState, useRef, useEffect } from 'react';

interface TimelineMarker {
  id: string;
  time: number;
  type: 'overlay' | 'subtitle';
  label: string;
}

interface VideoTimelineProps {
  duration: number;
  currentTime: number;
  markers?: TimelineMarker[];
  onSeek: (time: number) => void;
  onMarkerClick?: (marker: TimelineMarker) => void;
  onAddMarker?: (time: number) => void;
}

export default function VideoTimeline({
  duration,
  currentTime,
  markers = [],
  onSeek,
  onMarkerClick,
  onAddMarker
}: VideoTimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    onSeek(Math.max(0, Math.min(duration, newTime)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleTimelineClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleAddMarkerClick = () => {
    if (onAddMarker) {
      onAddMarker(currentTime);
    }
  };

  const progressPercentage = (currentTime / duration) * 100;

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        {onAddMarker && (
          <button
            onClick={handleAddMarkerClick}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Add Marker
          </button>
        )}
      </div>

      <div
        ref={timelineRef}
        className="relative h-12 bg-gray-300 rounded cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Progress bar */}
        <div
          className="absolute h-full bg-blue-500 rounded-l transition-all"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Markers */}
        {markers.map((marker) => {
          const markerPosition = (marker.time / duration) * 100;
          return (
            <div
              key={marker.id}
              className="absolute top-0 bottom-0 cursor-pointer group"
              style={{ left: `${markerPosition}%` }}
              onClick={(e) => {
                e.stopPropagation();
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              }}
            >
              {/* Marker line */}
              <div
                className={`w-1 h-full ${
                  marker.type === 'overlay' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />

              {/* Marker label (on hover) */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {marker.label}
                  <div className="text-gray-400">{formatTime(marker.time)}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-red-500 pointer-events-none"
          style={{ left: `${progressPercentage}%` }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
          </div>
        </div>
      </div>

      {/* Time ticks */}
      <div className="relative h-4 mt-1">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const time = duration * fraction;
          return (
            <div
              key={fraction}
              className="absolute text-xs text-gray-500"
              style={{ left: `${fraction * 100}%`, transform: 'translateX(-50%)' }}
            >
              {formatTime(time)}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {markers.length > 0 && (
        <div className="mt-3 flex gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Overlays</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>Subtitles</span>
          </div>
        </div>
      )}
    </div>
  );
}
