'use client';

import { useState } from 'react';
import { assetsAPI } from '@/lib/api';

interface VideoUploadProps {
  onUploadComplete: (assetId: string) => void;
  onCancel?: () => void;
  workspaceId: string;
}

export default function VideoUpload({ onUploadComplete, onCancel, workspaceId }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 500MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Get presigned URL from backend
      const response = await assetsAPI.getUploadURL(
        file.name,
        file.type,
        'video',
        workspaceId
      );

      const { asset_id, upload_url } = response.data;

      // Upload using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = (e.loaded / e.total) * 100;
          setProgress(percentage);
        }
      });

      // Handle completion
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200 || xhr.status === 204) {

          // Mark as complete
          try {
            await assetsAPI.complete(asset_id);
          } catch (error) {
            console.error('Failed to mark asset as complete:', error);
          }

          setProgress(100);
          setUploading(false);
          onUploadComplete(asset_id);
        } else {
          console.error('Upload failed with status:', xhr.status);
          setUploading(false);
          setError(`Upload failed with status ${xhr.status}. Please try again.`);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('Upload failed');
        setUploading(false);
        setError('Upload failed. Please check your connection and try again.');
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        setUploading(false);
        setError('Upload was cancelled.');
      });

      // Start upload
      xhr.open('PUT', upload_url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      setUploading(false);
      setError('Failed to start upload. Please try again.');
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Upload Video</h3>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="mb-4 w-full"
        disabled={uploading}
      />

      {file && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">File:</span> {file.name}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Type:</span> {file.type}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center text-gray-600">
            Uploading... {progress.toFixed(1)}%
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={uploading}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Supported formats: MP4, MOV, AVI, WebM</p>
        <p>• Maximum file size: 500MB</p>
        <p>• Upload progress is tracked in real-time</p>
      </div>
    </div>
  );
}
