import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { NoteItem } from '../shared/types';

export const QUERY_KEYS = {
  notes: ['notes'],
  settings: ['settings'],
};

// ==========================================
// HOOKS: NOTES
// ==========================================

export const useNotes = () => {
  return useQuery({
    queryKey: QUERY_KEYS.notes,
    queryFn: api.fetchNotes,
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
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: api.fetchSettings,
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
