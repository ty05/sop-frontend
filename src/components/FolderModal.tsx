'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

interface FolderModalProps {
  workspaceId: string;
  parentId?: string | null;
  folderId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FolderModal({
  workspaceId,
  parentId = null,
  folderId = null,
  isOpen,
  onClose,
  onSuccess
}: FolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (folderId && isOpen) {
      loadFolder();
    } else if (isOpen) {
      setName('');
      setDescription('');
    }
  }, [folderId, isOpen]);

  const loadFolder = async () => {
    if (!folderId) return;

    try {
      const response = await apiClient.get(`/folders/${folderId}`);
      setName(response.data.name);
      setDescription(response.data.description || '');
    } catch (error) {
      console.error('Failed to load folder:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (folderId) {
        // Update
        await apiClient.patch(`/folders/${folderId}`, { name, description });
      } else {
        // Create
        await apiClient.post('/folders/', {
          workspace_id: workspaceId,
          parent_id: parentId,
          name,
          description
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save folder');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {folderId ? 'Edit Folder' : 'New Folder'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Folder Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Pickup Operations"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : folderId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
