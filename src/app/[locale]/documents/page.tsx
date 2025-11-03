'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { documentsAPI, invitationsAPI } from '@/lib/api';
import { Document } from '@/types';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';
import SearchBar from '@/components/SearchBar';
import FolderTree from '@/components/FolderTree';
import FolderModal from '@/components/FolderModal';

export default function DocumentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeWorkspace, loading: workspaceLoading, error: workspaceError, refreshWorkspaces } = useWorkspace();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (activeWorkspace) {
      loadDocuments();
      checkPendingInvitations();
    }
  }, [selectedFolderId, activeWorkspace]);

  const checkPendingInvitations = async () => {
    try {
      const response = await invitationsAPI.getMyInvitations();
      setPendingInvitationsCount(response.data.length);
    } catch (error) {
      console.error('Failed to check invitations:', error);
    }
  };

  const loadDocuments = async () => {
    if (!activeWorkspace) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFolderId) {
        params.append('folder_id', selectedFolderId);
      }

      const response = await documentsAPI.list(activeWorkspace.id, params.toString());
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!activeWorkspace) return;

    const title = prompt('Document title:');
    if (!title) return;

    try {
      const response = await documentsAPI.create({
        workspace_id: activeWorkspace.id,
        title,
        folder_id: selectedFolderId
      });
      router.push(`/documents/${response.data.id}`);
    } catch (error) {
      alert('Failed to create document');
    }
  };

  const handleDelete = async (documentId: string, documentTitle: string, e: React.MouseEvent) => {
    // Prevent navigation when clicking delete button
    e.stopPropagation();

    const confirmed = confirm(`Are you sure you want to delete "${documentTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await documentsAPI.delete(documentId);
      // Reload documents after deletion
      loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  // Show error state
  if (workspaceError) {
    return (
      <div className="flex h-screen">
        <WorkspaceSwitcher />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Error Loading Workspaces</h2>
            <p className="text-gray-600 mb-6">{workspaceError}</p>
            <button
              onClick={() => refreshWorkspaces()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state only if actually loading
  if (workspaceLoading) {
    return (
      <div className="flex h-screen">
        <WorkspaceSwitcher />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show "no workspace" state if no active workspace
  if (!activeWorkspace) {
    return (
      <div className="flex h-screen">
        <WorkspaceSwitcher />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-4">👈</div>
            <h2 className="text-2xl font-bold mb-2">Create or Select a Workspace</h2>
            <p className="text-gray-600">
              Workspaces help you organize your documents. Create your first workspace to get started!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Workspace Switcher Sidebar - Hidden on mobile by default */}
      <div className="hidden md:block">
        <WorkspaceSwitcher />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        {/* Pending Invitations Banner */}
        {pendingInvitationsCount > 0 && (
          <div className="bg-blue-600 text-white px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <span className="text-lg">✉️</span>
                <span>
                  You have {pendingInvitationsCount} pending workspace invitation{pendingInvitationsCount > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => router.push('/invitations')}
                className="bg-white text-blue-600 px-4 py-1 rounded hover:bg-blue-50 font-medium"
              >
                View Invitations
              </button>
            </div>
          </div>
        )}

        {/* Header with Search */}
        <div className="bg-white border-b">
          <div className="p-4">
            <SearchBar workspaceId={activeWorkspace.id} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Left Sidebar - Folder Tree - Hidden on mobile */}
              <div className="hidden md:block md:w-64 flex-shrink-0">
                <FolderTree
                  workspaceId={activeWorkspace.id}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  onCreateFolder={() => setShowFolderModal(true)}
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-4 md:mb-6 gap-2">
              <h1 className="text-xl md:text-3xl font-bold truncate">
                {selectedFolderId ? 'Folder Documents' : 'All Documents'}
              </h1>
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded hover:bg-blue-700 text-sm md:text-base whitespace-nowrap"
              >
                + New
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="grid gap-4">
                <div className="text-xs text-gray-500 mb-2">
                  DEBUG: documents.length = {documents.length}, loading = {loading ? 'true' : 'false'}
                </div>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{doc.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                      </div>
                      {(doc.status === 'ARCHIVED' || doc.status === 'DRAFT') && (
                        <button
                          onClick={(e) => handleDelete(doc.id, doc.title, e)}
                          className="ml-2 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                          title="Delete document"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {doc.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated {new Date(doc.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {documents.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No documents in this folder. Create your first one!
                  </div>
                )}
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Folder Modal */}
      <FolderModal
        workspaceId={activeWorkspace.id}
        parentId={selectedFolderId}
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSuccess={() => {
          loadDocuments();
          // Force folder tree refresh
          window.location.reload();
        }}
      />
    </div>
  );
}
