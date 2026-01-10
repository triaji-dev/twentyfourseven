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

  async saveActivitiesBulk(records: { year: number, month: number, day: number, hour: number, value: ActivityKey }[]) {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('User not logged in');

     if (records.length === 0) return;

     // Transform to DB format
     const dbRecords = records.map(r => ({
       user_id: user.id,
       date: `${r.year}-${String(r.month + 1).padStart(2, '0')}-${String(r.day).padStart(2, '0')}`,
       hour: r.hour,
       value: r.value
     })).filter(r => r.value !== ''); // Ensure we don't insert empty values

     // Perform bulk upsert
     // Note: Splitting into chunks of 1000 to be safe
     const chunkSize = 1000;
     for (let i = 0; i < dbRecords.length; i += chunkSize) {
        const chunk = dbRecords.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('activities')
          .upsert(chunk, { onConflict: 'user_id,date,hour' });
        
        if (error) {
            console.error('Bulk save error:', error);
            throw error;
        }
     }
  },

  // ==========================================
  // NOTES
  // ==========================================

  async fetchNotes() {
    // 1. Lazy Cleanup: Delete notes older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Fire and forget cleanup (don't await to block render)
    supabase
      .from('notes')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', sevenDaysAgo.toISOString())
      .then(({ error }) => {
        if (error) console.error('Auto-cleanup failed:', error);
      });

    // 2. Fetch ALL notes (including deleted ones for Recycle Bin)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      // .is('deleted_at', null) // REMOVED: Fetch everything so client can filter
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

    // Use upsert to allow overwriting/restoring notes with same ID
    const { data, error } = await supabase
      .from('notes')
      .upsert({
        user_id: user.id,
        // If ID provided (restore), use it. Otherwise Supabase generates one?
        // upsert requires Primary Key for conflict. 
        // If note.id is missing, upsert works as insert if we let DB auto-gen?
        // Supabase/PG upsert works on conflict. If no ID, it inserts.
        // But we need to pass ID if it exists.
        ...(note.id ? { id: note.id } : {}), 
        content: note.content || '',
        type: note.type || 'text',
        is_completed: note.isDone || false,
        is_pinned: note.isPinned || false,
        created_at: note.createdAt || new Date().toISOString(),
        completed_at: note.completedAt,
        updated_at: note.updatedAt,
        deleted_at: note.deletedAt
      }, { onConflict: 'id' }) // Conflict on 'id'
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
      }, { onConflict: 'user_id' }); // Explicitly state conflict target

    if (error) throw error;
  }
};
