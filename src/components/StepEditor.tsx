'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Step } from '@/types';
import { stepsAPI, assetsAPI } from '@/lib/api';
import ImageEditor from './ImageEditor';
import VideoUpload from './VideoUpload';
import VideoPlayer from './VideoPlayer';
import VideoTrimmer from './VideoTrimmer';
import ChapterEditor from './ChapterEditor';
import VideoOverlayEditor from './VideoOverlayEditor';

interface StepEditorProps {
  step: Step;
  onUpdate: () => void;
  readOnly?: boolean;
}

export default function StepEditor({ step, onUpdate, readOnly = false }: StepEditorProps) {
  const { session } = useAuth();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(step.title || '');
  const [body, setBody] = useState(step.body || '');
  const [checklistItems, setChecklistItems] = useState(step.checklist_items || []);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showOverlayEditor, setShowOverlayEditor] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageBlobUrls, setImageBlobUrls] = useState<Record<string, string>>({});
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoAsset, setVideoAsset] = useState<any>(null);

  // Sync local state when step changes
  useEffect(() => {
    setTitle(step.title || '');
    setBody(step.body || '');
    setChecklistItems(step.checklist_items || []);
  }, [step]);

  // Load images - use embedded CDN URLs (optimized - no API calls!)
  useEffect(() => {
    if (step.type === 'image' && step.images && step.images.length > 0) {
      const newBlobUrls: Record<string, string> = {};

      // Use embedded image data - no API calls needed!
      for (const image of step.images) {
        newBlobUrls[image.id] = image.cdn_url;
      }

      setImageBlobUrls(newBlobUrls);
    }

    // Cleanup blob URLs on unmount (only for blob: URLs)
    return () => {
      Object.values(imageBlobUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [step.images]);

  // Load video asset metadata
  useEffect(() => {
    const loadVideoAsset = async () => {
      if (step.type === 'video' && step.video_id) {
        try {
          const response = await assetsAPI.get(step.video_id);
          setVideoAsset(response.data);
          setVideoDuration(response.data.duration_sec || 0);
        } catch (error) {
          console.error('Failed to load video asset:', error);
        }
      }
    };

    loadVideoAsset();
  }, [step.video_id]);

  const handleSave = async () => {
    try {
      const updateData: any = { title, body };
      if (step.type === 'checklist') {
        updateData.checklist_items = checklistItems;
      }
      await stepsAPI.update(step.id, updateData);
      setEditing(false);
      onUpdate();
    } catch (error) {
      alert('Failed to update step');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this step?')) return;

    try {
      await stepsAPI.delete(step.id);
      onUpdate();
    } catch (error) {
      alert('Failed to delete step');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      // Get presigned URL
      const response = await assetsAPI.getUploadURL(file.name, file.type, 'image');
      const { asset_id, upload_url } = response.data;

      // Upload to S3/MinIO
      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Mark upload as complete
      await assetsAPI.complete(asset_id);

      // Update step with image ID
      const currentImageIds = step.image_ids || [];
      await stepsAPI.update(step.id, {
        image_ids: [...currentImageIds, asset_id],
      });

      onUpdate();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageEdit = async (imageId: string) => {
    try {
      // Get image URL from loaded images (already embedded - no API call!)
      let imageUrl = imageBlobUrls[imageId];

      if (!imageUrl) {
        throw new Error('Image URL not available');
      }

      // For editing, we need to convert to blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setEditingImageUrl(blobUrl);
      setShowImageEditor(true);
    } catch (error) {
      console.error('Failed to load image for editing:', error);
      alert('Failed to load image for editing');
    }
  };

  const handleImageSave = async (blob: Blob) => {
    try {
      console.log('Saving edited image for step:', step.id);
      
      setUploading(true);

      // 1. Upload new image using existing upload flow
      const formData = new FormData();
      formData.append('file', blob, 'edited-image.png');
      formData.append('type', 'image');

      const uploadResponse = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const newImageId = uploadData.id;
      console.log('New image uploaded:', newImageId);

      // 2. Get old image IDs (to delete later)
      const oldImageIds = step.image_ids || [];
      console.log('Old image IDs:', oldImageIds);

      // 3. Update step with ONLY the new image (replace, not append)
      await stepsAPI.update(step.id, {
        image_ids: [newImageId], // CRITICAL: Replace array, not append
      });

      console.log('Step updated with new image');

      // 4. Delete old images from storage
      if (oldImageIds.length > 0) {
        for (const oldId of oldImageIds) {
          try {
            await assetsAPI.delete(oldId);
            console.log('Deleted old image:', oldId);
          } catch (err) {
            console.warn('Failed to delete old image:', oldId, err);
            // Continue even if delete fails
          }
        }
      }

      // 5. Clean up and refresh
      if (editingImageUrl && editingImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(editingImageUrl);
      }
      
      setShowImageEditor(false);
      setEditingImageUrl(null);
      setUploading(false);
      
      // Refresh parent to show new image
      onUpdate();
      
      console.log('Image save complete');
    } catch (error) {
      console.error('Failed to save edited image:', error);
      alert('Failed to save edited image. Please try again.');
      setUploading(false);
    }
  };

  const handleVideoUploadComplete = async (assetId: string) => {
    try {
      await stepsAPI.update(step.id, {
        video_id: assetId,
      });

      setShowVideoUpload(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update step with video:', error);
      alert('Failed to update step with video');
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('Remove this image? This will permanently delete the file.')) return;

    try {
      // Remove from step's image_ids
      const updatedImageIds = (step.image_ids || []).filter(id => id !== imageId);
      await stepsAPI.update(step.id, {
        image_ids: updatedImageIds,
      });

      // Delete the asset and file from R2
      try {
        await assetsAPI.delete(imageId);
      } catch (error) {
        console.error('Failed to delete asset from storage:', error);
        // Continue even if deletion fails - the reference is already removed
      }

      onUpdate();
    } catch (error) {
      alert('Failed to remove image');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {editing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold w-full border-b pb-1"
              placeholder="Step title"
            />
          ) : (
            <h3 className="text-xl font-semibold">{step.title}</h3>
          )}
          <span className="text-sm text-gray-500 mt-1 block">
            {step.type.toUpperCase()}
          </span>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm bg-gray-300 px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-600"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-sm text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {step.type === 'text' && (
        <div>
          {editing ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border rounded p-2 min-h-[100px]"
              placeholder="Enter step content..."
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{step.body}</p>
          )}
        </div>
      )}

      {step.type === 'checklist' && (
        <div>
          <ul className="space-y-2">
            {checklistItems.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" disabled />
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const newItems = [...checklistItems];
                        newItems[index] = { ...newItems[index], text: e.target.value };
                        setChecklistItems(newItems);
                      }}
                      className="flex-1 border rounded px-2 py-1"
                      placeholder="Item text"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={item.required}
                        onChange={(e) => {
                          const newItems = [...checklistItems];
                          newItems[index] = { ...newItems[index], required: e.target.checked };
                          setChecklistItems(newItems);
                        }}
                        className="w-3 h-3"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => {
                        const newItems = checklistItems.filter((_, i) => i !== index);
                        setChecklistItems(newItems);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm px-2"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <span>{item.text}</span>
                    {item.required && (
                      <span className="text-xs text-red-600">*required</span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <button
              onClick={() => {
                setChecklistItems([...checklistItems, { text: '', required: false }]);
              }}
              className="mt-3 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              + Add Item
            </button>
          )}
        </div>
      )}

      {step.type === 'image' && (
        <div>
          {!readOnly && (
            <div className="mb-4">
              <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
                {uploading ? 'Uploading...' : '+ Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          {step.image_ids && step.image_ids.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {step.image_ids.map((imageId, index) => (
                <div key={imageId} className="relative border rounded-lg overflow-hidden">
                  {imageBlobUrls[imageId] ? (
                    <img
                      src={imageBlobUrls[imageId]}
                      alt={`Image ${index + 1}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">Loading image...</p>
                    </div>
                  )}
                  {!readOnly && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => handleImageEdit(imageId)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        disabled={!imageBlobUrls[imageId]}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveImage(imageId)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic text-center py-8 border-2 border-dashed rounded">
              No images uploaded yet. Click &quot;Upload Image&quot; to add one.
            </div>
          )}
        </div>
      )}

      {step.type === 'video' && (
        <div>
          {step.video_id ? (
            <div className="space-y-4">
              <VideoPlayer
                video={step.video}
                videoId={step.video_id}
                startTime={step.video_start_sec}
                enablePiP={true}
              />

              {!readOnly && editing && (
                <>
                  <VideoTrimmer
                    videoId={step.video_id}
                    currentStart={step.video_start_sec || 0}
                    currentEnd={step.video_end_sec}
                    duration={videoDuration || 300}
                    onSave={(start, end) => {
                      stepsAPI.update(step.id, {
                        video_start_sec: start,
                        video_end_sec: end
                      }).then(() => {
                        alert('Trim points saved!');
                        onUpdate();
                      }).catch(() => {
                        alert('Failed to save trim points');
                      });
                    }}
                  />

                  <ChapterEditor
                    videoId={step.video_id}
                    duration={videoDuration || 300}
                  />

                  <div className="mt-4">
                    <button
                      onClick={() => setShowOverlayEditor(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Add Text & Shapes
                    </button>
                  </div>
                </>
              )}

              {!readOnly && (
                <button
                  onClick={() => setShowVideoUpload(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Replace Video
                </button>
              )}
            </div>
          ) : (
            <div>
              {!readOnly && (
                <button
                  onClick={() => setShowVideoUpload(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + Upload Video
                </button>
              )}
              {!showVideoUpload && (
                <div className="text-gray-500 italic text-center py-8 border-2 border-dashed rounded mt-4">
                  No video uploaded yet.
                </div>
              )}
            </div>
          )}

          {showVideoUpload && (
            <div className="mt-4">
              <VideoUpload
                onUploadComplete={handleVideoUploadComplete}
                onCancel={() => setShowVideoUpload(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Image Editor Modal */}
      {showImageEditor && editingImageUrl && (
        <ImageEditor
          imageUrl={editingImageUrl}
          onSave={handleImageSave}
          onCancel={() => {
            // Clean up blob URL to avoid memory leak
            if (editingImageUrl.startsWith('blob:')) {
              URL.revokeObjectURL(editingImageUrl);
            }
            setShowImageEditor(false);
            setEditingImageUrl(null);
          }}
        />
      )}

      {/* Video Overlay Editor Modal */}
      {showOverlayEditor && step.video_id && (
        <VideoOverlayEditor
          videoId={step.video_id}
          duration={videoDuration || 300}
          onClose={() => {
            setShowOverlayEditor(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}
