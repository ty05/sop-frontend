export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  current_version: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Step {
  id: string;
  document_id: string;
  order: number;
  title?: string;
  type: 'text' | 'checklist' | 'image' | 'video';
  body?: string;
  checklist_items?: ChecklistItem[];
  image_ids?: string[];
  video_id?: string;
  video_start_sec?: number;
  video_end_sec?: number;
  created_at: string;
}

export interface ChecklistItem {
  text: string;
  required: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
