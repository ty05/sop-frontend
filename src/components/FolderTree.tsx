'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  document_count: number;
  children?: Folder[];
}

interface FolderTreeProps {
  workspaceId: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder?: (parentId: string | null) => void;
}

export default function FolderTree({
  workspaceId,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder
}: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, [workspaceId]);

  const loadFolders = async () => {
    try {
      const response = await apiClient.get(`/folders/tree?workspace_id=${workspaceId}`);
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
            hover:bg-gray-100 transition-colors
            ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="w-4 h-4 flex items-center justify-center"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className="w-4" />}

          <span className="text-xl">📁</span>
          <span className="flex-1">{folder.name}</span>
          <span className="text-xs text-gray-500">({folder.document_count})</span>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading folders...</div>;
  }

  return (
    <div className="bg-white rounded-lg border p-2">
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="font-semibold text-sm text-gray-700">Folders</h3>
        {onCreateFolder && (
          <button
            onClick={() => onCreateFolder(null)}
            className="text-blue-600 text-sm hover:text-blue-700"
          >
            + New
          </button>
        )}
      </div>

      {/* All Documents (root) */}
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer mb-1
          hover:bg-gray-100 transition-colors
          ${selectedFolderId === null ? 'bg-blue-50 text-blue-700 font-medium' : ''}
        `}
        onClick={() => onSelectFolder(null)}
      >
        <span className="text-xl">📄</span>
        <span>All Documents</span>
      </div>

      <div className="space-y-0.5">
        {folders.map((folder) => renderFolder(folder))}
      </div>

      {folders.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No folders yet
        </div>
      )}
    </div>
  );
}
