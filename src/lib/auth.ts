// DEPRECATED: This file is kept for backward compatibility only
// Use AuthContext from @/contexts/AuthContext instead

import { supabase } from './supabase';

// These functions are deprecated but kept to avoid breaking existing code
export const saveTokens = (tokens: any) => {
  console.warn('saveTokens is deprecated. Authentication is now handled by Supabase.');
};

export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

export const clearTokens = async () => {
  await supabase.auth.signOut();
};

export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};
