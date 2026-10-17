import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { NoteItem } from '../shared/types';
import { useAuth } from '../features/auth/AuthProvider';

export const QUERY_KEYS = {
  notes: ['notes'] as const,
  userNotes: (userId?: string) => ['notes', userId ?? 'anonymous'] as const,
  settings: ['settings'] as const,
  userSettings: (userId?: string) => ['settings', userId ?? 'anonymous'] as const,
};

// ==========================================
// HOOKS: NOTES
// ==========================================

export const useNotes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.userNotes(user?.id),
    queryFn: api.fetchNotes,
    enabled: !!user?.id,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: Partial<NoteItem>) => api.createNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; updates: Partial<NoteItem> }) =>
      api.updateNote(variables.id, variables.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteNotePermanently(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes });
    },
  });
};

// ==========================================
// HOOKS: SETTINGS
// ==========================================

export const useSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.userSettings(user?.id),
    queryFn: api.fetchSettings,
    enabled: !!user?.id,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categories: any[]) => api.saveSettings(categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
    },
  });
};
