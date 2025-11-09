import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Supabase auth token
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    }

    // Handle 402 Payment Required - Trial expired or limit reached
    if (error.response?.status === 402) {
      const detail = error.response.data?.detail;
      const message = detail?.message || 'Please upgrade to continue';
      const trialEnded = detail?.trial_ended;

      // Trigger a custom event that the app layout will listen to
      window.dispatchEvent(new CustomEvent('trial-expired', {
        detail: { message, trialEnded }
      }));

      // Don't redirect here - let the modal handle it
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Auth API (kept for backward compatibility, but Supabase handles auth directly)
export const authAPI = {
  // Note: Authentication is now handled by Supabase directly via AuthContext
  // However, magic link verification still uses the backend endpoint
  verifyToken: (token: string) => apiClient.get(`/auth/verify?token=${token}`),
};

// Documents API
export const documentsAPI = {
  list: (workspaceId: string, queryString?: string) => {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (queryString) {
      const additionalParams = new URLSearchParams(queryString);
      additionalParams.forEach((value, key) => params.append(key, value));
    }
    return apiClient.get(`/documents?${params.toString()}`);
  },

  create: (data: { title: string; description?: string; workspace_id?: string; folder_id?: string | null }) =>
    apiClient.post('/documents/', data),

  get: (id: string) => apiClient.get(`/documents/${id}`),

  update: (id: string, data: Partial<{ title: string; description: string; status: string }>) =>
    apiClient.patch(`/documents/${id}`, data),

  delete: (id: string) => apiClient.delete(`/documents/${id}`),

  move: (documentId: string, folderId: string | null) =>
    apiClient.patch(`/documents/${documentId}/move`, null, {
      params: { folder_id: folderId || '' }
    }),
};

// Steps API
export const stepsAPI = {
  list: (documentId: string) =>
    apiClient.get(`/steps/?document_id=${documentId}`),

  create: (documentId: string, data: any) =>
    apiClient.post(`/steps/?document_id=${documentId}`, data),

  get: (id: string) => apiClient.get(`/steps/${id}`),

  update: (id: string, data: any) =>
    apiClient.patch(`/steps/${id}`, data),

  delete: (id: string) => apiClient.delete(`/steps/${id}`),

  reorder: (documentId: string, stepIds: string[]) =>
    apiClient.put(`/steps/reorder?document_id=${documentId}`, { step_ids: stepIds }),
};

// Assets API
export const assetsAPI = {
  getUploadURL: (filename: string, mimeType: string, type: 'image' | 'video', workspaceId: string) =>
    apiClient.post('/assets/upload-url', { filename, mime_type: mimeType, type, workspace_id: workspaceId }),

  get: (id: string) => apiClient.get(`/assets/${id}`),

  proxy: (assetId: string) => apiClient.get(`/assets/${assetId}/proxy`, { responseType: 'blob' }),

  uploadEdited: (assetId: string, workspaceId: string, blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'edited.png');
    return apiClient.post(`/assets/${assetId}/upload-edited?workspace_id=${workspaceId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  complete: (assetId: string) => apiClient.post(`/assets/${assetId}/complete`),

  delete: (assetId: string) => apiClient.delete(`/assets/${assetId}`),
};

// Video API
export const videoAPI = {
  addOverlay: (videoId: string, data: any) =>
    apiClient.post(`/videos/${videoId}/overlays`, data),

  listOverlays: (videoId: string) =>
    apiClient.get(`/videos/${videoId}/overlays`),

  deleteOverlay: (videoId: string, overlayId: string) =>
    apiClient.delete(`/videos/${videoId}/overlays/${overlayId}`),

  addSubtitles: (videoId: string, data: any) =>
    apiClient.post(`/videos/${videoId}/subtitles`, data),

  getSubtitles: (videoId: string) =>
    apiClient.get(`/videos/${videoId}/subtitles`),

  updateSubtitles: (videoId: string, subtitleId: string, data: any) =>
    apiClient.patch(`/videos/${videoId}/subtitles/${subtitleId}`, data),
};

// Progress API
export const progressAPI = {
  updateChecklistItem: (data: { step_id: string; item_index: number; checked: boolean }) =>
    apiClient.post('/progress/checklist', data),

  getChecklistProgress: (stepId: string) =>
    apiClient.get(`/progress/checklist/${stepId}`),

  resetChecklistProgress: (stepId: string) =>
    apiClient.delete(`/progress/checklist/${stepId}`),
};

// Chapters API
export const chaptersAPI = {
  list: (videoId: string) => apiClient.get(`/chapters/${videoId}/chapters`),

  save: (videoId: string, chapters: Array<{ start_sec: number; title: string }>) =>
    apiClient.post(`/chapters/${videoId}/chapters`, chapters),
};

// Folders API
export const foldersAPI = {
  list: (workspaceId: string, parentId?: string) => {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (parentId) params.append('parent_id', parentId);
    return apiClient.get(`/folders?${params.toString()}`);
  },

  tree: (workspaceId: string) =>
    apiClient.get(`/folders/tree?workspace_id=${workspaceId}`),

  get: (folderId: string) =>
    apiClient.get(`/folders/${folderId}`),

  create: (data: { workspace_id: string; name: string; description?: string; parent_id?: string | null }) =>
    apiClient.post('/folders/', data),

  update: (folderId: string, data: { name?: string; description?: string }) =>
    apiClient.patch(`/folders/${folderId}`, data),

  delete: (folderId: string) =>
    apiClient.delete(`/folders/${folderId}`),

  breadcrumb: (folderId: string) =>
    apiClient.get(`/folders/${folderId}/breadcrumb`),
};

// Invitations API
export const invitationsAPI = {
  getMyInvitations: () =>
    apiClient.get('/invitations/my-invitations'),

  acceptInvitation: (token: string) =>
    apiClient.post('/invitations/accept', null, { params: { token } }),

  acceptInvitationById: (invitationId: string) =>
    apiClient.post(`/invitations/${invitationId}/accept`),
};

// Export API
export const exportAPI = {
  exportPdf: (documentId: string) =>
    apiClient.post(`/export/pdf/${documentId}`, null, {
      responseType: 'blob'
    }),

  exportPdfAsync: (documentId: string) =>
    apiClient.post(`/export/pdf/${documentId}/async`),

  getExportJob: (jobId: string) =>
    apiClient.get(`/export/jobs/${jobId}`),
};
