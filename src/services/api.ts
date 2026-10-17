import { supabase } from '../lib/supabase';
import { NoteItem, NoteType } from '../shared/types';

// ==========================================
// NOTES
// ==========================================

export const api = {
  async fetchNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    supabase
      .from('notes')
      .delete()
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', sevenDaysAgo.toISOString())
      .then(({ error }) => {
        if (error) console.error('Auto-cleanup failed:', error);
      });

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((d: any) => ({
      id: d.id,
      content: d.content,
      type: d.type as NoteType,
      isDone: d.is_completed,
      isPinned: d.is_pinned,
      createdAt: d.created_at,
      completedAt: d.completed_at,
      updatedAt: d.updated_at,
      deletedAt: d.deleted_at,
    })) as NoteItem[];
  },

  async createNote(note: Partial<NoteItem>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { data, error } = await supabase
      .from('notes')
      .upsert({
        ...(note.id ? { id: note.id } : {}),
        user_id: user.id,
        content: note.content || '',
        type: note.type || 'text',
        is_completed: note.isDone || false,
        is_pinned: note.isPinned || false,
        created_at: note.createdAt || new Date().toISOString(),
        completed_at: note.completedAt,
        updated_at: note.updatedAt,
        deleted_at: note.deletedAt
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(id: string, updates: Partial<NoteItem>) {
    const dbUpdates: any = {};
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.isDone !== undefined) dbUpdates.is_completed = updates.isDone;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;
    if (updates.deletedAt !== undefined) dbUpdates.deleted_at = updates.deletedAt;

    const { data, error } = await supabase
      .from('notes')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNotePermanently(id: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // SETTINGS
  // ==========================================

  async fetchSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
    }
    return data;
  },

  async saveSettings(categories: any[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { error } = await supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        categories: categories,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
  }
};
