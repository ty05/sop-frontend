'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Step } from '@/types';
import { progressAPI } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';

interface RunModeProps {
  steps: Step[];
  documentId: string;
  onExit: () => void;
}

export default function RunMode({ steps, documentId, onExit }: RunModeProps) {
  const { session } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [imageBlobUrls, setImageBlobUrls] = useState<Record<string, string>>({});
  const [loadingAssets, setLoadingAssets] = useState(false);

  const currentStep = steps.length > 0 ? steps[currentIndex] : null;

  // Load checklist progress when step changes
  useEffect(() => {
    if (!currentStep) return;
    const loadProgress = async () => {
      if (currentStep.type === 'checklist' && currentStep.id) {
        setLoadingProgress(true);
        try {
          const response = await progressAPI.getChecklistProgress(currentStep.id);
          const progressMap: Record<number, boolean> = {};
          response.data.items.forEach((item: any) => {
            progressMap[item.index] = item.checked;
          });
          setCheckedItems(progressMap);
        } catch (error) {
          console.error('Failed to load checklist progress:', error);
          setCheckedItems({});
        } finally {
          setLoadingProgress(false);
        }
      } else {
        setCheckedItems({});
      }
    };

    loadProgress();
  }, [currentIndex, currentStep?.id, currentStep?.type]);

  // Load images and video when step changes
  useEffect(() => {
    if (!currentStep) return;

    const loadAssets = async () => {
      setLoadingAssets(true);

      // Clean up previous blob URLs
      Object.values(imageBlobUrls).forEach(url => URL.revokeObjectURL(url));
      setImageBlobUrls({});

      try {
        const token = session?.access_token;
        if (!token) {
          console.error('No access token found');
          setLoadingAssets(false);
          return;
        }

        // Load images
        if (currentStep.type === 'image' && currentStep.image_ids && currentStep.image_ids.length > 0) {
          const newBlobUrls: Record<string, string> = {};

          for (const imageId of currentStep.image_ids) {
            try {
              const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
              const response = await fetch(`${apiUrl}/assets/${imageId}/stream`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                newBlobUrls[imageId] = blobUrl;
              } else {
                console.error(`Failed to load image ${imageId}: ${response.status}`);
              }
            } catch (error) {
              console.error(`Error loading image ${imageId}:`, error);
            }
          }

          setImageBlobUrls(newBlobUrls);
        }
      } catch (error) {
        console.error('Error loading assets:', error);
      } finally {
        setLoadingAssets(false);
      }
    };

    loadAssets();

    // Cleanup on unmount or step change
    return () => {
      // Clean up blob URLs when component unmounts or step changes
      setImageBlobUrls(prev => {
        Object.values(prev).forEach(url => URL.revokeObjectURL(url));
        return {};
      });
    };
  }, [currentIndex, currentStep?.type, currentStep?.image_ids]);

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleCheckItem = async (index: number) => {
    if (!currentStep) return;

    const newCheckedState = !checkedItems[index];

    // Optimistically update UI
    setCheckedItems({
      ...checkedItems,
      [index]: newCheckedState
    });

    // Persist to backend
    try {
      await progressAPI.updateChecklistItem({
        step_id: currentStep.id,
        item_index: index,
        checked: newCheckedState
      });
    } catch (error) {
      console.error('Failed to update checklist progress:', error);
      // Revert on error
      setCheckedItems({
        ...checkedItems,
        [index]: !newCheckedState
      });
    }
  };

  if (steps.length === 0 || !currentStep) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No steps available</p>
          <button
            onClick={onExit}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg"
          >
            Exit Run Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header with exit button */}
      <div className="max-w-4xl mx-auto mb-4">
        <button
          onClick={onExit}
          className="text-gray-400 hover:text-white flex items-center gap-2"
        >
          ← Exit Run Mode
        </button>
      </div>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Step {currentIndex + 1} of {steps.length}</span>
          <span className="text-sm">{Math.round(((currentIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-6">{currentStep.title}</h2>

        {currentStep.type === 'text' && (
          <div className="text-xl leading-relaxed whitespace-pre-wrap">
            {currentStep.body}
          </div>
        )}

        {currentStep.type === 'checklist' && (
          <div className="space-y-4">
            {currentStep.checklist_items?.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  className="w-6 h-6"
                  id={`check-${index}`}
                  checked={checkedItems[index] || false}
                  onChange={() => handleCheckItem(index)}
                />
                <label htmlFor={`check-${index}`} className="text-xl flex-1 cursor-pointer">
                  {item.text}
                  {item.required && <span className="text-red-500 ml-2">*</span>}
                </label>
              </div>
            ))}
          </div>
        )}

        {currentStep.type === 'image' && currentStep.image_ids && currentStep.image_ids.length > 0 && (
          <div className="grid gap-4">
            {loadingAssets ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="mt-4 text-gray-400">Loading images...</p>
              </div>
            ) : (
              currentStep.image_ids.map((imageId, index) => (
                <div key={index} className="bg-black rounded-lg overflow-hidden">
                  {imageBlobUrls[imageId] ? (
                    <img
                      src={imageBlobUrls[imageId]}
                      alt={`Step image ${index + 1}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                      <p>Failed to load image</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {currentStep.type === 'video' && currentStep.video_id && (
          <VideoPlayer videoId={currentStep.video_id} enablePiP={true} />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {currentIndex === steps.length - 1 ? (
            <button
              onClick={onExit}
              className="bg-green-600 hover:bg-green-500 px-8 py-4 rounded-lg text-xl"
            >
              Complete ✓
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg text-xl"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
