'use client';

import { useRef, useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { VideoDetail } from '@/types';

interface Chapter {
  id: string;
  start_sec: number;
  title: string;
}

interface Overlay {
  id: string;
  type: 'shape' | 'text' | 'arrow';
  start_sec: number;
  end_sec: number;
  config: any;
}

interface VideoPlayerProps {
  videoId?: string;  // Optional now - used as fallback
  video?: VideoDetail;  // Embedded video data (preferred)
  startTime?: number;
  onTimeUpdate?: (time: number) => void;
  enablePiP?: boolean;
}

export default function VideoPlayer({
  videoId,
  video,
  startTime = 0,
  onTimeUpdate,
  enablePiP = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPiP, setIsPiP] = useState(false);

  useEffect(() => {
    loadVideoData();
  }, [videoId, video]);

  useEffect(() => {
    if (videoRef.current && startTime > 0) {
      videoRef.current.currentTime = startTime;
    }
  }, [startTime, playbackUrl]);

  // Handle PiP events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [playbackUrl]);

  const loadVideoData = async () => {
    // Use embedded video data if available (no API call!)
    if (video) {
      setPlaybackUrl(video.cdn_url);
    } else if (videoId) {
      // Fallback: fetch video asset if no embedded data provided
      try {
        const assetResponse = await apiClient.get(`/assets/${videoId}`);
        setPlaybackUrl(assetResponse.data.playback_url);
      } catch (error) {
        console.error('Failed to load video asset:', error);
      }
    }

    // Get the ID for loading chapters/overlays
    const effectiveVideoId = video?.id || videoId;
    if (!effectiveVideoId) return;

    // Load chapters (non-blocking)
    try {
      const chaptersResponse = await apiClient.get(`/chapters/${effectiveVideoId}/chapters`);
      setChapters(chaptersResponse.data);
    } catch (error) {
      console.error('Failed to load chapters:', error);
      // Chapters are optional, so we don't fail the whole load
    }

    // Load overlays (non-blocking)
    try {
      const overlaysResponse = await apiClient.get(`/videos/${effectiveVideoId}/overlays`);
      setOverlays(overlaysResponse.data.filter((o: any) => o.type !== 'chapter'));
    } catch (error) {
      console.error('Failed to load overlays:', error);
      // Overlays are optional, so we don't fail the whole load
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Draw overlays on canvas
      drawOverlays(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const drawOverlays = (time: number) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw active overlays
    const activeOverlays = overlays.filter(
      o => o.start_sec <= time && time <= o.end_sec
    );

    activeOverlays.forEach(overlay => {
      const config = overlay.config;

      switch (overlay.type) {
        case 'arrow':
          ctx.strokeStyle = config.color || '#ff0000';
          ctx.lineWidth = 3;

          // Arrow format: x, y is start point, width/height are offsets to end point
          const startX = config.x;
          const startY = config.y;
          const endX = config.x + config.width;
          const endY = config.y + config.height;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Draw arrowhead
          const angle = Math.atan2(endY - startY, endX - startX);
          const headlen = 15;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headlen * Math.cos(angle - Math.PI / 6),
            endY - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headlen * Math.cos(angle + Math.PI / 6),
            endY - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          break;

        case 'text':
          ctx.font = `${config.fontSize || 24}px Arial`;
          ctx.fillStyle = config.color || '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeText(config.text, config.x, config.y);
          ctx.fillText(config.text, config.x, config.y);
          break;

        case 'shape':
          ctx.strokeStyle = config.color || '#ff0000';
          ctx.lineWidth = 2;
          if (config.shape === 'rectangle') {
            // Rectangle: x, y is top-left corner
            ctx.strokeRect(config.x, config.y, config.width, config.height);
          } else if (config.shape === 'circle') {
            // Circle: x, y is top-left corner, width is diameter
            const radius = config.width / 2;
            const centerX = config.x + radius;
            const centerY = config.y + radius;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
      }
    });
  };

  const jumpToChapter = (startSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) {
      console.error('Video element not found');
      return;
    }

    // Check if PiP is supported
    if (!document.pictureInPictureEnabled) {
      alert('Picture-in-Picture is not supported in your browser');
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        // Exit PiP
        await document.exitPictureInPicture();
      } else {
        // Check if video is ready
        if (video.readyState < 2) {
          alert('Please wait for the video to load');
          return;
        }

        // Request PiP
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed:', error);
      alert('Failed to enable Picture-in-Picture. Make sure the video is playing.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {playbackUrl ? (
          <>
            <video
              ref={videoRef}
              src={playbackUrl}
              className="w-full h-full"
              controls
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />

            {/* Overlay canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Chapters</h4>
          <div className="space-y-1">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => jumpToChapter(chapter.start_sec)}
                className={`
                  w-full text-left px-3 py-2 rounded text-sm
                  ${currentTime >= chapter.start_sec
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-gray-500 mr-2">
                  {formatTime(chapter.start_sec)}
                </span>
                {chapter.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PiP Button */}
      {enablePiP && (
        <button
          onClick={togglePiP}
          className="mt-2 bg-purple-600 text-white px-4 py-2 rounded text-sm"
        >
          {isPiP ? '📺 Exit PiP' : '📺 Enable PiP'}
        </button>
      )}
    </div>
  );
}
