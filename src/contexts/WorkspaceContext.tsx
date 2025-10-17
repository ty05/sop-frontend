'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  created_at: string;
  role: 'owner' | 'editor' | 'viewer';
  member_count?: number;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  loading: boolean;
  error: string | null;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && session) {
      loadWorkspaces();
    } else {
      // User is not authenticated, don't try to load workspaces
      setLoading(false);
    }
  }, [user, session]);

  const loadWorkspaces = async () => {
    if (!session) {
      // User is not authenticated, don't try to load workspaces
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/workspaces/');
      const workspacesList = response.data;
      setWorkspaces(workspacesList);

      // Set active workspace from localStorage or first workspace
      const savedWorkspaceId = localStorage.getItem('active_workspace_id');
      const workspace = savedWorkspaceId
        ? workspacesList.find((w: Workspace) => w.id === savedWorkspaceId)
        : workspacesList[0];

      if (workspace) {
        setActiveWorkspaceState(workspace);
      } else if (workspacesList.length === 0) {
        // No workspaces available - this is OK, user needs to create one
        setError('No workspaces found. Please create one to get started.');
      }
    } catch (error: any) {
      console.error('Failed to load workspaces:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to load workspaces';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    localStorage.setItem('active_workspace_id', workspace.id);
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    const response = await apiClient.post('/workspaces/', { name, description });
    const newWorkspace = response.data;

    // Refresh workspace list
    await refreshWorkspaces();

    // Automatically switch to the new workspace
    setActiveWorkspace(newWorkspace);

    return newWorkspace;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        loading,
        error,
        refreshWorkspaces,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
