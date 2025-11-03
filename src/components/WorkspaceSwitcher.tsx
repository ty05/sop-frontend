'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import apiClient from '@/lib/api';

interface WorkspaceLimits {
  current: number;
  limit: number;
  remaining: number;
  can_create: boolean;
  plan: string;
  upgrade_available: boolean;
}

export default function WorkspaceSwitcher() {
  const t = useTranslations('workspace');
  const tNav = useTranslations('nav');
  const { session } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(true); // Open by default
  const [limits, setLimits] = useState<WorkspaceLimits | null>(null);

  useEffect(() => {
    if (session) {
      loadLimits();
    }
  }, [session]);

  const loadLimits = async () => {
    // Check if user is authenticated before trying to load limits
    if (!session) return;

    try {
      const response = await apiClient.get('/workspaces/limits');
      setLimits(response.data);
    } catch (error) {
      console.error('Failed to load limits:', error);
    }
  };

  const handleCreateClick = () => {
    if (limits && !limits.can_create) {
      alert(t('workspaceLimitReached', { current: limits.current, limit: limits.limit }));
      return;
    }
    setShowCreateModal(true);
  };

  if (!activeWorkspace && workspaces.length === 0) {
    return (
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-400 text-sm">{t('noWorkspacesYet')}</p>
          </div>
          <button
            onClick={handleCreateClick}
            disabled={!!(limits && !limits.can_create)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:bg-gray-400"
          >
            + {t('createWorkspace')}
          </button>
        </div>
        {showCreateModal && (
          <CreateWorkspaceModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              refreshWorkspaces();
              loadLimits();
            }}
          />
        )}
      </div>
    );
  }

  if (!activeWorkspace) {
    return null; // Should not happen, but TypeScript needs this
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen md:relative fixed inset-y-0 left-0 z-40">
      {/* Workspace Selector */}
      <div className="p-4 border-b border-gray-700">
        {/* Limit indicator */}
        {limits && (
          <div className="text-xs text-gray-400 mb-2">
            {limits.limit === -1
              ? `${limits.current} ${t('workspaces')}`
              : `${limits.current} / ${limits.limit} ${t('workspaces')}`
            }
          </div>
        )}

        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-3 rounded transition"
        >
          <div className="flex-1 text-left">
            <div className="font-semibold truncate">{activeWorkspace.name}</div>
            <div className="text-xs text-gray-400">{t(`role.${activeWorkspace.role}`)}</div>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="mt-2 bg-gray-800 rounded shadow-lg max-h-64 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  setActiveWorkspace(workspace);
                  setShowDropdown(false);
                }}
                className={`w-full text-left p-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 ${
                  workspace.id === activeWorkspace.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="font-medium truncate">{workspace.name}</div>
                <div className="text-xs text-gray-400">{t(`role.${workspace.role}`)}</div>
                {workspace.member_count && (
                  <div className="text-xs text-gray-500">{workspace.member_count} {t('members')}</div>
                )}
              </button>
            ))}

            <button
              onClick={() => {
                setShowDropdown(false);
                handleCreateClick();
              }}
              disabled={!!(limits && !limits.can_create)}
              className={`w-full text-left p-3 font-medium ${
                limits && !limits.can_create
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'hover:bg-gray-700 text-blue-400'
              }`}
            >
              {limits && !limits.can_create ? `🔒 ${t('upgradeToCreate')}` : `+ ${t('createWorkspace')}`}
            </button>
          </div>
        )}
      </div>

      {/* Workspace Actions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          <div className="text-xs text-gray-400 uppercase font-semibold mb-2">{t('quickActions')}</div>
          <Link
            href="/documents"
            className="block px-3 py-2 hover:bg-gray-800 rounded text-sm"
          >
            📄 {tNav('documents')}
          </Link>
          <Link
            href="/workspace/settings"
            className="block px-3 py-2 hover:bg-gray-800 rounded text-sm"
          >
            ⚙️ {tNav('settings')}
          </Link>
        </div>

        {activeWorkspace.description && (
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-1">{t('about')}</div>
            <div className="text-sm text-gray-300">{activeWorkspace.description}</div>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refreshWorkspaces();
            loadLimits();
          }}
        />
      )}
    </div>
  );
}

// Create Workspace Modal Component
function CreateWorkspaceModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('workspace');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/workspaces/', { name, description: description || undefined });
      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 402) {
        // Payment required (limit reached)
        const detail = error.response.data.detail;
        setError(detail.message || t('workspaceLimitReached', { current: '?', limit: '?' }));
      } else {
        setError(error.response?.data?.detail || t('failedToCreateWorkspace'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900">{t('createWorkspace')}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">{t('nameRequired')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3 py-2 border rounded text-gray-900"
              placeholder={t('myWorkspace')}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t('descriptionOptional')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border rounded text-gray-900"
              placeholder={t('workspaceDescription')}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              {loading ? t('creating') : t('createWorkspace')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
