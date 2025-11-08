'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { videoAPI, assetsAPI } from '@/lib/api';
import VideoTimeline from './VideoTimeline';
import { useTranslations } from 'next-intl';

interface Overlay {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'arrow' | 'mosaic';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color: string;
  startTime: number;
  endTime: number;
  pixelSize?: number; // For mosaic effect
}

interface VideoOverlayEditorProps {
  videoId: string;
  duration: number;
  onClose: () => void;
}

export default function VideoOverlayEditor({
  videoId,
  duration,
  onClose
}: VideoOverlayEditorProps) {
  const { session } = useAuth();
  const t = useTranslations('videoEditor');
  const tCommon = useTranslations('common');
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [overlayHistory, setOverlayHistory] = useState<Overlay[][]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rectangle' | 'circle' | 'arrow' | 'mosaic'>('select');
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingArrow, setIsResizingArrow] = useState<'start' | 'end' | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w' for rectangles/circles
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState('#FF0000');
  const [fontSize, setFontSize] = useState(24);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textResizeStartFontSize, setTextResizeStartFontSize] = useState<number | null>(null);
  const [textResizeStartX, setTextResizeStartX] = useState<number | null>(null);
  const [defaultDurationMode, setDefaultDurationMode] = useState<'short' | 'full'>('short');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load existing overlays
  useEffect(() => {
    loadOverlays();
    loadVideoBlob();
  }, [videoId]);

  // Cleanup blob URL on unmount (only if it's a blob URL)
  useEffect(() => {
    return () => {
      if (videoBlobUrl && videoBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = (e: any) => {
      console.error('Video error:', video.error);
    };

    video.addEventListener('error', handleError);
    return () => video.removeEventListener('error', handleError);
  }, []);

  // Redraw canvas continuously to show video
  useEffect(() => {
    const animate = () => {
      drawCanvas();
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [overlays, selectedOverlay, currentTime]);


  const loadVideoBlob = async () => {
    try {
      const assetResponse = await assetsAPI.get(videoId);
      const videoUrl = assetResponse.data.cdn_url || assetResponse.data.playback_url;

      if (videoUrl) {
        setVideoBlobUrl(videoUrl);
      } else {
        throw new Error('No video URL available');
      }
    } catch (error: any) {
      console.error('Failed to load video:', error);
      alert(`Failed to load video: ${error?.message || error}`);
    }
  };

  const getOverlayDuration = () => {
    if (defaultDurationMode === 'full') {
      return { startTime: 0, endTime: duration };
    } else {
      return { startTime: currentTime, endTime: Math.min(currentTime + 5, duration) };
    }
  };

  const applyFullVideoDuration = () => {
    if (!selectedOverlay) return;
    setOverlays(overlays.map(o =>
      o.id === selectedOverlay
        ? { ...o, startTime: 0, endTime: duration }
        : o
    ));
  };

  const loadOverlays = async () => {
    try {
      const response = await videoAPI.listOverlays(videoId);
      if (response.data) {
        const mappedOverlays = response.data.map((o: any) => {
          // Map backend type to frontend type
          let frontendType: 'text' | 'rectangle' | 'circle' | 'arrow' | 'mosaic';
          if (o.type === 'shape') {
            frontendType = o.config.shape || 'rectangle';
          } else {
            frontendType = o.type;
          }

          return {
            id: o.id,
            type: frontendType,
            x: o.config.x,
            y: o.config.y,
            width: o.config.width,
            height: o.config.height,
            text: o.config.text,
            fontSize: o.config.fontSize,
            color: o.config.color,
            startTime: o.start_sec,
            endTime: o.end_sec,
            pixelSize: o.config.pixelSize
          };
        });
        setOverlays(mappedOverlays);
      }
    } catch (error) {
      console.error('Failed to load overlays:', error);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame (whether playing or paused)
    if (video.readyState >= 2) {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.error('Failed to draw video frame:', e);
      }
    } else {
      // Draw placeholder when video is not ready
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Loading video...', canvas.width / 2, canvas.height / 2);
    }

    // Draw overlays that are visible at current time
    overlays.forEach(overlay => {
      if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
        drawOverlay(ctx, overlay, overlay.id === selectedOverlay);
      }
    });
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D, overlay: Overlay, isSelected: boolean) => {
    // Draw selection highlight first (if selected)
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#3B82F6'; // Blue selection color
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]); // Dashed outline

      switch (overlay.type) {
        case 'text':
          if (overlay.text) {
            ctx.font = `${overlay.fontSize || 24}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            const metrics = ctx.measureText(overlay.text);
            const textWidth = metrics.width;
            const textHeight = overlay.fontSize || 24;
            ctx.strokeRect(overlay.x - 8, overlay.y - textHeight - 8, textWidth + 16, textHeight + 16);
          }
          break;
        case 'rectangle':
        case 'mosaic':
          if (overlay.width && overlay.height) {
            ctx.strokeRect(overlay.x - 5, overlay.y - 5, overlay.width + 10, overlay.height + 10);
          }
          break;
        case 'circle':
          if (overlay.width) {
            const radius = overlay.width / 2;
            ctx.beginPath();
            ctx.arc(overlay.x + radius, overlay.y + radius, radius + 5, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
      }

      ctx.setLineDash([]); // Reset dash
      ctx.restore();
    }

    // Draw the actual overlay
    ctx.strokeStyle = overlay.color;
    ctx.fillStyle = overlay.color;
    ctx.lineWidth = isSelected ? 4 : 2;

    switch (overlay.type) {
      case 'text':
        ctx.font = `${overlay.fontSize || 24}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(overlay.text || '', overlay.x, overlay.y);
        if (isSelected) {
          const metrics = ctx.measureText(overlay.text || '');
          const textWidth = metrics.width;
          const textHeight = overlay.fontSize || 24;
          ctx.strokeRect(overlay.x - 5, overlay.y - textHeight - 5, textWidth + 10, textHeight + 10);

          // Draw resize handles for text (corner handles)
          const handleRadius = 6;
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;

          // Bottom right corner handle (for font size adjustment)
          ctx.beginPath();
          ctx.arc(overlay.x + textWidth + 5, overlay.y + 5, handleRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (overlay.width && overlay.height) {
          ctx.strokeRect(overlay.x, overlay.y, overlay.width, overlay.height);
          if (isSelected) {
            ctx.fillStyle = overlay.color + '33'; // 20% opacity
            ctx.fillRect(overlay.x, overlay.y, overlay.width, overlay.height);

            // Draw resize handles at corners
            const handleRadius = 6;
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;

            const corners = [
              { x: overlay.x, y: overlay.y }, // nw
              { x: overlay.x + overlay.width, y: overlay.y }, // ne
              { x: overlay.x + overlay.width, y: overlay.y + overlay.height }, // se
              { x: overlay.x, y: overlay.y + overlay.height } // sw
            ];

            corners.forEach(corner => {
              ctx.beginPath();
              ctx.arc(corner.x, corner.y, handleRadius, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            });
          }
        }
        break;

      case 'circle':
        if (overlay.width) {
          const radius = overlay.width / 2;
          const centerX = overlay.x + radius;
          const centerY = overlay.y + radius;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.stroke();
          if (isSelected) {
            ctx.fillStyle = overlay.color + '33';
            ctx.fill();

            // Draw resize handles at cardinal points
            const handleRadius = 6;
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;

            const handles = [
              { x: overlay.x + overlay.width, y: centerY }, // right
              { x: overlay.x, y: centerY }, // left
              { x: centerX, y: overlay.y }, // top
              { x: centerX, y: overlay.y + overlay.width } // bottom
            ];

            handles.forEach(handle => {
              ctx.beginPath();
              ctx.arc(handle.x, handle.y, handleRadius, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            });
          }
        }
        break;

      case 'mosaic':
        if (overlay.width && overlay.height) {
          // Apply mosaic/pixelation effect
          const pixelSize = overlay.pixelSize || 15;
          const video = videoRef.current;

          if (video && video.readyState >= 2) {
            // Save current context state
            ctx.save();

            // Create a temporary canvas for the mosaic effect
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            if (tempCtx) {
              // Set temp canvas size to the overlay region
              tempCanvas.width = overlay.width;
              tempCanvas.height = overlay.height;

              // Calculate the video source coordinates
              const canvas = canvasRef.current;
              if (canvas) {
                const scaleX = video.videoWidth / canvas.width;
                const scaleY = video.videoHeight / canvas.height;
                const srcX = overlay.x * scaleX;
                const srcY = overlay.y * scaleY;
                const srcWidth = overlay.width * scaleX;
                const srcHeight = overlay.height * scaleY;

                // Draw the video region to temp canvas
                tempCtx.drawImage(
                  video,
                  srcX, srcY, srcWidth, srcHeight,
                  0, 0, overlay.width, overlay.height
                );

                // Apply pixelation by scaling down and up
                const scaledWidth = Math.max(1, Math.floor(overlay.width / pixelSize));
                const scaledHeight = Math.max(1, Math.floor(overlay.height / pixelSize));

                // Draw scaled down version
                tempCtx.drawImage(
                  tempCanvas,
                  0, 0, overlay.width, overlay.height,
                  0, 0, scaledWidth, scaledHeight
                );

                // Disable image smoothing for pixelated effect
                ctx.imageSmoothingEnabled = false;

                // Draw scaled up version back to main canvas
                ctx.drawImage(
                  tempCanvas,
                  0, 0, scaledWidth, scaledHeight,
                  overlay.x, overlay.y, overlay.width, overlay.height
                );

                // Re-enable image smoothing
                ctx.imageSmoothingEnabled = true;
              }
            }

            ctx.restore();
          }

          // Draw border if selected
          if (isSelected) {
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            ctx.strokeRect(overlay.x, overlay.y, overlay.width, overlay.height);

            // Draw resize handles at corners
            const handleRadius = 6;
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;

            const corners = [
              { x: overlay.x, y: overlay.y }, // nw
              { x: overlay.x + overlay.width, y: overlay.y }, // ne
              { x: overlay.x + overlay.width, y: overlay.y + overlay.height }, // se
              { x: overlay.x, y: overlay.y + overlay.height } // sw
            ];

            corners.forEach(corner => {
              ctx.beginPath();
              ctx.arc(corner.x, corner.y, handleRadius, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            });
          }
        }
        break;

      case 'arrow':
        if (overlay.width !== undefined && overlay.height !== undefined) {
          const toX = overlay.x + overlay.width;
          const toY = overlay.y + overlay.height;

          // Draw line
          ctx.beginPath();
          ctx.moveTo(overlay.x, overlay.y);
          ctx.lineTo(toX, toY);
          ctx.stroke();

          // Draw arrowhead
          const headlen = 15;
          const angle = Math.atan2(overlay.height, overlay.width);
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6),
                    toY - headlen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6),
                    toY - headlen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();

          // Draw resize handles if selected
          if (isSelected) {
            const handleRadius = 6;
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;

            // Start point handle
            ctx.beginPath();
            ctx.arc(overlay.x, overlay.y, handleRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // End point handle
            ctx.beginPath();
            ctx.arc(toX, toY, handleRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        }
        break;
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'select') {
      // First check if clicking on a selected overlay's resize handle
      if (selectedOverlay) {
        const selectedOverlayData = overlays.find(o => o.id === selectedOverlay);
        if (selectedOverlayData) {
          if (selectedOverlayData.type === 'arrow') {
            const handle = isPointNearArrowHandle(x, y, selectedOverlayData);
            if (handle) {
              setIsResizingArrow(handle);
              return;
            }
          } else {
            const handle = isPointNearResizeHandle(x, y, selectedOverlayData);
            if (handle) {
              setIsResizing(handle);
              // Store initial values for text resize
              if (selectedOverlayData.type === 'text') {
                setTextResizeStartFontSize(selectedOverlayData.fontSize || 24);
                setTextResizeStartX(x);
              }
              return;
            }
          }
        }
      }

      // Check if clicking on an existing overlay
      const clickedOverlay = overlays.find(overlay =>
        currentTime >= overlay.startTime &&
        currentTime <= overlay.endTime &&
        isPointInOverlay(x, y, overlay)
      );

      if (clickedOverlay) {
        setSelectedOverlay(clickedOverlay.id);

        // Check if clicking on resize handle
        if (clickedOverlay.type === 'arrow') {
          const handle = isPointNearArrowHandle(x, y, clickedOverlay);
          if (handle) {
            setIsResizingArrow(handle);
            return;
          }
        } else {
          const handle = isPointNearResizeHandle(x, y, clickedOverlay);
          if (handle) {
            setIsResizing(handle);
            // Store initial values for text resize
            if (clickedOverlay.type === 'text') {
              setTextResizeStartFontSize(clickedOverlay.fontSize || 24);
              setTextResizeStartX(x);
            }
            return;
          }
        }

        // Start dragging if not clicking on a handle
        setIsDragging(true);
        // Calculate offset from overlay origin
        setDragOffset({
          x: x - clickedOverlay.x,
          y: y - clickedOverlay.y
        });
      } else {
        setSelectedOverlay(null);
      }
    } else if (selectedTool === 'text') {
      // Position for text input
      setTextPosition({ x, y });
      setIsAddingText(true);
      setTextInput('');
    } else {
      // Start drawing new overlay
      setIsDrawing(true);
      setDrawStart({ x, y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle resizing shapes (rectangle, circle, text)
    if (isResizing && selectedOverlay) {
      setOverlays(overlays.map(overlay => {
        if (overlay.id === selectedOverlay) {
          if (overlay.type === 'rectangle' || overlay.type === 'mosaic') {
            const newOverlay = { ...overlay };

            // Handle corner resizing for rectangles and mosaics
            if (isResizing === 'se') {
              // Southeast: resize from bottom-right corner
              newOverlay.width = Math.max(10, x - overlay.x);
              newOverlay.height = Math.max(10, y - overlay.y);
            } else if (isResizing === 'nw') {
              // Northwest: resize from top-left corner
              const newWidth = Math.max(10, (overlay.x + overlay.width!) - x);
              const newHeight = Math.max(10, (overlay.y + overlay.height!) - y);
              newOverlay.x = overlay.x + overlay.width! - newWidth;
              newOverlay.y = overlay.y + overlay.height! - newHeight;
              newOverlay.width = newWidth;
              newOverlay.height = newHeight;
            } else if (isResizing === 'ne') {
              // Northeast: resize from top-right corner
              const newHeight = Math.max(10, (overlay.y + overlay.height!) - y);
              newOverlay.y = overlay.y + overlay.height! - newHeight;
              newOverlay.width = Math.max(10, x - overlay.x);
              newOverlay.height = newHeight;
            } else if (isResizing === 'sw') {
              // Southwest: resize from bottom-left corner
              const newWidth = Math.max(10, (overlay.x + overlay.width!) - x);
              newOverlay.x = overlay.x + overlay.width! - newWidth;
              newOverlay.width = newWidth;
              newOverlay.height = Math.max(10, y - overlay.y);
            }

            return newOverlay;
          } else if (overlay.type === 'circle') {
            // For circles, resize the radius based on distance from center
            const radius = overlay.width! / 2;
            const centerX = overlay.x + radius;
            const centerY = overlay.y + radius;

            let newRadius = radius;
            if (isResizing === 'e' || isResizing === 'w') {
              newRadius = Math.abs(x - centerX);
            } else if (isResizing === 'n' || isResizing === 's') {
              newRadius = Math.abs(y - centerY);
            }

            newRadius = Math.max(5, newRadius); // Minimum radius
            const newWidth = newRadius * 2;

            return {
              ...overlay,
              x: centerX - newRadius,
              y: centerY - newRadius,
              width: newWidth,
              height: newWidth
            };
          } else if (overlay.type === 'text') {
            // For text, adjust font size based on drag distance from initial position
            if (textResizeStartFontSize && textResizeStartX !== null) {
              const dragDistance = x - textResizeStartX;
              const newFontSize = Math.max(12, Math.min(72, textResizeStartFontSize + dragDistance * 0.5));
              return { ...overlay, fontSize: Math.round(newFontSize) };
            }
          }
        }
        return overlay;
      }));
      return;
    }

    // Handle resizing arrow endpoints
    if (isResizingArrow && selectedOverlay) {
      setOverlays(overlays.map(overlay => {
        if (overlay.id === selectedOverlay && overlay.type === 'arrow') {
          if (isResizingArrow === 'start') {
            // Moving the start point - adjust x, y, width, height
            const newWidth = (overlay.x + overlay.width!) - x;
            const newHeight = (overlay.y + overlay.height!) - y;
            return { ...overlay, x, y, width: newWidth, height: newHeight };
          } else if (isResizingArrow === 'end') {
            // Moving the end point - adjust width and height
            const newWidth = x - overlay.x;
            const newHeight = y - overlay.y;
            return { ...overlay, width: newWidth, height: newHeight };
          }
        }
        return overlay;
      }));
      return;
    }

    // Handle dragging overlays
    if (isDragging && selectedOverlay && dragOffset) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setOverlays(overlays.map(overlay =>
        overlay.id === selectedOverlay
          ? { ...overlay, x: newX, y: newY }
          : overlay
      ));
      return;
    }

    // Handle drawing new overlays
    if (!isDrawing || !drawStart) return;

    // Preview drawing
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCanvas(); // Redraw everything

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (selectedTool === 'rectangle') {
      ctx.strokeRect(drawStart.x, drawStart.y, x - drawStart.x, y - drawStart.y);
    } else if (selectedTool === 'mosaic') {
      // Draw preview for mosaic (just a dashed rectangle)
      ctx.strokeRect(drawStart.x, drawStart.y, x - drawStart.x, y - drawStart.y);
      ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
      ctx.fillRect(drawStart.x, drawStart.y, x - drawStart.x, y - drawStart.y);
    } else if (selectedTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - drawStart.x, 2) + Math.pow(y - drawStart.y, 2)) / 2;
      ctx.beginPath();
      ctx.arc(drawStart.x, drawStart.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (selectedTool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(drawStart.x, drawStart.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle end of resizing (shapes)
    if (isResizing) {
      saveToHistory([...overlays]);
      setIsResizing(null);
      setTextResizeStartFontSize(null);
      setTextResizeStartX(null);
      return;
    }

    // Handle end of arrow resizing
    if (isResizingArrow) {
      saveToHistory([...overlays]);
      setIsResizingArrow(null);
      return;
    }

    // Handle end of dragging
    if (isDragging) {
      // Save the dragged position to history
      saveToHistory([...overlays]);
      setIsDragging(false);
      setDragOffset(null);
      return;
    }

    // Handle end of drawing
    if (!isDrawing || !drawStart || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let newOverlay: Overlay | null = null;
    const overlayDuration = getOverlayDuration();

    if (selectedTool === 'rectangle' || selectedTool === 'circle') {
      newOverlay = {
        id: `overlay-${Date.now()}`,
        type: selectedTool,
        x: drawStart.x,
        y: drawStart.y,
        width: Math.abs(x - drawStart.x),
        height: Math.abs(y - drawStart.y),
        color,
        ...overlayDuration
      };
    } else if (selectedTool === 'mosaic') {
      newOverlay = {
        id: `overlay-${Date.now()}`,
        type: selectedTool,
        x: drawStart.x,
        y: drawStart.y,
        width: Math.abs(x - drawStart.x),
        height: Math.abs(y - drawStart.y),
        color,
        pixelSize: 15, // Default pixel size for mosaic effect
        ...overlayDuration
      };
    } else if (selectedTool === 'arrow') {
      // For arrows, allow negative width/height to support all directions
      newOverlay = {
        id: `overlay-${Date.now()}`,
        type: selectedTool,
        x: drawStart.x,
        y: drawStart.y,
        width: x - drawStart.x,  // Can be negative
        height: y - drawStart.y, // Can be negative
        color,
        ...overlayDuration
      };
    }

    if (newOverlay) {
      saveToHistory([...overlays, newOverlay]);
      setSelectedOverlay(newOverlay.id);
    }

    setIsDrawing(false);
    setDrawStart(null);
  };

  const handleAddText = () => {
    if (!textPosition || !textInput.trim()) return;

    const overlayDuration = getOverlayDuration();
    const newOverlay: Overlay = {
      id: `overlay-${Date.now()}`,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
      fontSize,
      color,
      ...overlayDuration
    };

    saveToHistory([...overlays, newOverlay]);
    setSelectedOverlay(newOverlay.id);
    setIsAddingText(false);
    setTextInput('');
    setTextPosition(null);
  };

  const isPointInOverlay = (x: number, y: number, overlay: Overlay): boolean => {
    if (overlay.type === 'text') {
      // Measure actual text width for accurate hit detection
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && overlay.text) {
        ctx.font = `${overlay.fontSize || 24}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const metrics = ctx.measureText(overlay.text);
        const textWidth = metrics.width;
        const textHeight = overlay.fontSize || 24;
        return x >= overlay.x && x <= overlay.x + textWidth &&
               y >= overlay.y - textHeight && y <= overlay.y;
      }
      return false;
    } else if (overlay.width !== undefined && overlay.height !== undefined) {
      if (overlay.type === 'arrow') {
        // For arrows, check if near the line
        const toX = overlay.x + overlay.width;
        const toY = overlay.y + overlay.height;
        const distance = Math.abs(
          (toY - overlay.y) * x - (toX - overlay.x) * y + toX * overlay.y - toY * overlay.x
        ) / Math.sqrt(Math.pow(toY - overlay.y, 2) + Math.pow(toX - overlay.x, 2));
        return distance < 10; // 10px tolerance
      } else {
        // For rectangles and circles
        return x >= overlay.x && x <= overlay.x + overlay.width &&
               y >= overlay.y && y <= overlay.y + overlay.height;
      }
    }
    return false;
  };

  const isPointNearArrowHandle = (x: number, y: number, overlay: Overlay): 'start' | 'end' | null => {
    if (overlay.type !== 'arrow' || overlay.width === undefined || overlay.height === undefined) {
      return null;
    }

    const handleRadius = 8; // Slightly larger than visual radius for easier clicking
    const toX = overlay.x + overlay.width;
    const toY = overlay.y + overlay.height;

    // Check start handle
    const distToStart = Math.sqrt(Math.pow(x - overlay.x, 2) + Math.pow(y - overlay.y, 2));
    if (distToStart <= handleRadius) {
      return 'start';
    }

    // Check end handle
    const distToEnd = Math.sqrt(Math.pow(x - toX, 2) + Math.pow(y - toY, 2));
    if (distToEnd <= handleRadius) {
      return 'end';
    }

    return null;
  };

  const isPointNearResizeHandle = (x: number, y: number, overlay: Overlay): string | null => {
    const handleRadius = 8;

    if ((overlay.type === 'rectangle' || overlay.type === 'mosaic') && overlay.width !== undefined && overlay.height !== undefined) {
      const corners = [
        { x: overlay.x, y: overlay.y, handle: 'nw' },
        { x: overlay.x + overlay.width, y: overlay.y, handle: 'ne' },
        { x: overlay.x + overlay.width, y: overlay.y + overlay.height, handle: 'se' },
        { x: overlay.x, y: overlay.y + overlay.height, handle: 'sw' }
      ];

      for (const corner of corners) {
        const dist = Math.sqrt(Math.pow(x - corner.x, 2) + Math.pow(y - corner.y, 2));
        if (dist <= handleRadius) {
          return corner.handle;
        }
      }
    } else if (overlay.type === 'circle' && overlay.width !== undefined) {
      const radius = overlay.width / 2;
      const centerX = overlay.x + radius;
      const centerY = overlay.y + radius;

      const handles = [
        { x: overlay.x + overlay.width, y: centerY, handle: 'e' },
        { x: overlay.x, y: centerY, handle: 'w' },
        { x: centerX, y: overlay.y, handle: 'n' },
        { x: centerX, y: overlay.y + overlay.width, handle: 's' }
      ];

      for (const handle of handles) {
        const dist = Math.sqrt(Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2));
        if (dist <= handleRadius) {
          return handle.handle;
        }
      }
    } else if (overlay.type === 'text') {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.font = `${overlay.fontSize || 24}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const metrics = ctx.measureText(overlay.text || '');
        const textWidth = metrics.width;

        // Check bottom right corner (font size handle)
        const handleX = overlay.x + textWidth + 5;
        const handleY = overlay.y + 5;
        const dist = Math.sqrt(Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2));
        if (dist <= handleRadius) {
          return 'se'; // Southeast corner for text resizing
        }
      }
    }

    return null;
  };

  const handleSaveOverlays = async () => {
    try {
      // Only save new overlays (those with temporary IDs starting with "overlay-")
      const newOverlays = overlays.filter(o => o.id.startsWith('overlay-'));

      for (const overlay of newOverlays) {
        // Map frontend types to backend types
        let backendType: 'shape' | 'text' | 'arrow' | 'mosaic';
        if (overlay.type === 'rectangle' || overlay.type === 'circle') {
          backendType = 'shape';
        } else if (overlay.type === 'mosaic') {
          backendType = 'mosaic';
        } else {
          backendType = overlay.type as 'text' | 'arrow';
        }

        await videoAPI.addOverlay(videoId, {
          type: backendType,
          start_sec: overlay.startTime,
          end_sec: overlay.endTime,
          config: {
            shape: overlay.type === 'rectangle' ? 'rectangle' : overlay.type === 'circle' ? 'circle' : overlay.type === 'mosaic' ? 'mosaic' : undefined,
            x: overlay.x,
            y: overlay.y,
            width: overlay.width,
            height: overlay.height,
            text: overlay.text,
            fontSize: overlay.fontSize,
            color: overlay.color,
            pixelSize: overlay.pixelSize
          }
        });
      }

      if (newOverlays.length > 0) {
        alert(t('overlaysSaved', { count: newOverlays.length }));
      } else {
        alert(t('noNewOverlays'));
      }
      onClose();
    } catch (error) {
      console.error('Failed to save overlays:', error);
      alert(t('failedToSaveOverlays'));
    }
  };

  const handleDeleteOverlay = () => {
    if (!selectedOverlay) {
      return;
    }
    if (confirm(t('deleteOverlayConfirm'))) {
      const newOverlays = overlays.filter(o => o.id !== selectedOverlay);
      saveToHistory(newOverlays);
      setSelectedOverlay(null);
    }
  };

  const saveToHistory = (newOverlays: Overlay[]) => {
    setOverlayHistory(prev => [...prev, overlays]);
    setOverlays(newOverlays);
  };

  const handleUndo = () => {
    if (overlayHistory.length === 0) return;

    const previousState = overlayHistory[overlayHistory.length - 1];
    setOverlays(previousState);
    setOverlayHistory(prev => prev.slice(0, -1));
    setSelectedOverlay(null);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error('Play prevented:', e));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in text input
      if (isAddingText || e.target instanceof HTMLInputElement) {
        return;
      }

      // Undo with Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Delete with Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedOverlay) {
        e.preventDefault();
        handleDeleteOverlay();
        return;
      }

      // Spacebar for play/pause
      if (e.code === 'Space' && e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAddingText, overlayHistory, overlays, selectedOverlay]);

  const selectedOverlayData = overlays.find(o => o.id === selectedOverlay);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 border-r p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">{t('toolsHeader')}</h3>
            <div className="space-y-2 mb-6">
              {[
                { tool: 'select', label: t('tools.select'), icon: '↖️' },
                { tool: 'text', label: t('tools.text'), icon: 'T' },
                { tool: 'rectangle', label: t('tools.rectangle'), icon: '▢' },
                { tool: 'circle', label: t('tools.circle'), icon: '○' },
                { tool: 'arrow', label: t('tools.arrow'), icon: '→' },
                { tool: 'mosaic', label: t('tools.mosaic') || 'Mosaic', icon: '◫' }
              ].map(({ tool, label, icon }) => (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool as any)}
                  className={`w-full px-3 py-2 rounded text-left flex items-center gap-2 ${
                    selectedTool === tool
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <h3 className="font-semibold mb-3">{t('propertiesHeader')}</h3>
            <div className="space-y-3">
              {/* Default Duration Mode */}
              <div className="border-b pb-3">
                <label className="text-sm text-gray-600 block mb-2">
                  {t('defaultDuration') || 'Default Duration'}
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setDefaultDurationMode('short')}
                    className={`w-full px-3 py-2 rounded text-xs font-medium ${
                      defaultDurationMode === 'short'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {t('shortDuration') || 'Short (5s)'}
                  </button>
                  <button
                    onClick={() => setDefaultDurationMode('full')}
                    className={`w-full px-3 py-2 rounded text-xs font-medium ${
                      defaultDurationMode === 'full'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {t('fullVideo') || 'Full Video'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('defaultDurationHelp') || 'Default duration for new overlays'}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">{t('color')}</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 rounded"
                />
              </div>

              {selectedTool === 'text' && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">{t('fontSize')}</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full border rounded px-2 py-1"
                    min="12"
                    max="72"
                  />
                </div>
              )}

              {/* Overlays List */}
              {overlays.length > 0 && (
                <div className="pt-3 border-t mt-4">
                  <h4 className="text-sm font-semibold mb-2">{t('overlays')} ({overlays.length})</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {overlays.map((overlay, index) => (
                      <div
                        key={overlay.id}
                        onClick={() => setSelectedOverlay(overlay.id)}
                        className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between ${
                          selectedOverlay === overlay.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span>
                            {overlay.type === 'text' && '📝'}
                            {overlay.type === 'rectangle' && '▢'}
                            {overlay.type === 'circle' && '○'}
                            {overlay.type === 'arrow' && '→'}
                            {overlay.type === 'mosaic' && '◫'}
                          </span>
                          <span className="font-medium truncate">
                            {overlay.type === 'text'
                              ? (overlay.text?.substring(0, 15) || 'Text')
                              : overlay.type.charAt(0).toUpperCase() + overlay.type.slice(1)
                            }
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOverlay(overlay.id);
                            setTimeout(() => handleDeleteOverlay(), 0);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 ml-2"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOverlayData && (
                <>
                  <div className="pt-3 border-t">
                    <h4 className="text-sm font-semibold mb-2">{t('selectedOverlay')}</h4>
                    <div className="text-xs text-gray-600 mb-2">
                      {t('type')}: {selectedOverlayData.type}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">{t('startTime')}</label>
                      <input
                        type="number"
                        value={selectedOverlayData.startTime}
                        onChange={(e) => {
                          setOverlays(overlays.map(o =>
                            o.id === selectedOverlay
                              ? { ...o, startTime: Number(e.target.value) }
                              : o
                          ));
                        }}
                        className="w-full border rounded px-2 py-1"
                        step="0.1"
                        min="0"
                        max={duration}
                      />
                    </div>
                    <div className="mt-2">
                      <label className="text-sm text-gray-600 block mb-1">{t('endTime')}</label>
                      <input
                        type="number"
                        value={selectedOverlayData.endTime}
                        onChange={(e) => {
                          setOverlays(overlays.map(o =>
                            o.id === selectedOverlay
                              ? { ...o, endTime: Number(e.target.value) }
                              : o
                          ));
                        }}
                        className="w-full border rounded px-2 py-1"
                        step="0.1"
                        min="0"
                        max={duration}
                      />
                    </div>

                    {/* Quick action to apply full video duration */}
                    {(selectedOverlayData.startTime !== 0 || selectedOverlayData.endTime !== duration) && (
                      <button
                        onClick={applyFullVideoDuration}
                        className="w-full mt-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium"
                        title={t('applyToFullVideo') || 'Apply to entire video'}
                      >
                        <span>⏱️</span>
                        {t('applyToFullVideo') || 'Apply to Full Video'}
                      </button>
                    )}

                    <button
                      onClick={handleDeleteOverlay}
                      className="w-full mt-3 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2 font-semibold shadow-md"
                      title={t('deleteOverlay')}
                    >
                      <span className="text-lg">🗑️</span>
                      {t('deleteOverlay')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col p-4 bg-gray-100">
            <div className="flex-1 flex items-center justify-center mb-4">
              <div className="relative bg-black inline-block">
                <video
                  ref={videoRef}
                  src={videoBlobUrl || ''}
                  className="hidden"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  loop
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className={`border-2 border-gray-400 block ${
                    isDragging || isResizingArrow || isResizing ? 'cursor-grabbing' :
                    selectedTool === 'select' ? 'cursor-pointer' : 'cursor-crosshair'
                  }`}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                />

                {/* Text Input Overlay */}
                {isAddingText && textPosition && (
                  <div
                    className="absolute bg-white border-2 border-blue-500 rounded shadow-lg p-2"
                    style={{
                      left: `${textPosition.x}px`,
                      top: `${textPosition.y}px`,
                      zIndex: 1000
                    }}
                  >
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddText();
                        } else if (e.key === 'Escape') {
                          setIsAddingText(false);
                          setTextInput('');
                          setTextPosition(null);
                        }
                      }}
                      placeholder="Type text..."
                      autoFocus
                      className="border px-2 py-1 text-sm"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={handleAddText}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingText(false);
                          setTextInput('');
                          setTextPosition(null);
                        }}
                        className="bg-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={togglePlayPause}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold shadow-md"
              >
                {isPlaying ? (
                  <>
                    <span className="text-xl">⏸</span>
                    {t('pause')}
                  </>
                ) : (
                  <>
                    <span className="text-xl">▶</span>
                    {t('play')}
                  </>
                )}
              </button>
              <button
                onClick={handleUndo}
                disabled={overlayHistory.length === 0}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-md ${
                  overlayHistory.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                title={t('undo')}
              >
                <span className="text-xl">↶</span>
                {t('undo')}
              </button>
              <button
                onClick={handleDeleteOverlay}
                disabled={selectedOverlay === null}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-md ${
                  selectedOverlay === null
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                title={selectedOverlay ? t('deleteOverlay') : t('selectOverlayToDelete')}
              >
                <span className="text-lg">🗑️</span>
                {t('delete')}
              </button>
              <span className="text-sm text-gray-600">{t('keyboardShortcuts')}</span>
            </div>

            {/* Timeline */}
            <VideoTimeline
              duration={duration}
              currentTime={currentTime}
              markers={overlays.map(o => ({
                id: o.id,
                time: o.startTime,
                type: 'overlay',
                label: o.type
              }))}
              onSeek={(time) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = time;
                  setCurrentTime(time);
                }
              }}
              onMarkerClick={(marker) => setSelectedOverlay(marker.id)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleSaveOverlays}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('saveOverlays')}
          </button>
        </div>
      </div>
    </div>
  );
}
