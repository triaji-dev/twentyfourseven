import { supabase } from '../lib/supabase';
import { NoteItem, ActivityKey, NoteType } from '../shared/types';

// ==========================================
// ACTIVITIES
// ==========================================

export interface ActivityRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  hour: number;
  value: ActivityKey;
}

export const api = {
  // Fetch all activities for a specific month
  async fetchActivities(year: number, month: number) {
    // Construct start and end dates for the month
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return data as ActivityRecord[];
  },

  async saveActivity(year: number, month: number, day: number, hour: number, value: ActivityKey) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not logged in');

    if (value === '') {
      // Delete if empty
      const { error } = await supabase
        .from('activities')
        .delete()
        .match({ user_id: user.id, date: dateStr, hour });
      
      if (error) throw error;
    } else {
      // Upsert (Insert or Update)
      const { error } = await supabase
        .from('activities')
        .upsert({
          user_id: user.id,
          date: dateStr,
          hour,
          value
        }, { onConflict: 'user_id,date,hour' });

      if (error) throw error;
    }
  },

  // ==========================================
  // NOTES
  // ==========================================

  async fetchNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .is('deleted_at', null) // Only active notes
      .order('is_pinned', { ascending: false }) // Pinned first
      .order('created_at', { ascending: false }); // Newest first

    if (error) throw error;
    
    // Map DB fields to Frontend fields if necessary (snake_case -> camelCase)
    // Currently relying on TS to handle it, but DB returns snake_case.
    // We should map it manually to be safe and match NoteItem interface.
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
      .insert({
        user_id: user.id,
        content: note.content || '',
        type: note.type || 'text',
        is_completed: note.isDone || false,
        is_pinned: note.isPinned || false,
        created_at: note.createdAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(id: string, updates: Partial<NoteItem>) {
     // Transform updates to snake_case
    const dbUpdates: any = {};
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.isDone !== undefined) dbUpdates.is_completed = updates.isDone; 
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;
    if (updates.deletedAt !== undefined) dbUpdates.deleted_at = updates.deletedAt; // use this for soft delete

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

    if (error && error.code !== 'PGRST116') { // PGRST116 = JSON object not found (no settings yet)
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
      });

    if (error) throw error;
  }
};
