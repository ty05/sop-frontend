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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  current_version: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ImageDetail {
  id: string;
  cdn_url: string;
  filename: string;
  mime_type?: string;
  width?: number;
  height?: number;
}

export interface VideoDetail {
  id: string;
  cdn_url: string;
  filename: string;
  mime_type?: string;
  duration_sec?: number;
  width?: number;
  height?: number;
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
  images?: ImageDetail[];  // NEW: Embedded image details
  video_id?: string;
  video?: VideoDetail;  // NEW: Embedded video details
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
