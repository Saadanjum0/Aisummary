import { supabase } from '@/integrations/supabase/client';
import { getNoteTagIds } from './tagsService';
import { toast } from 'sonner';
import { getTags as getAllGlobalTags, Tag } from './tagsService';
import type { FlashcardData } from './gemini'; // Import type if defined in gemini.ts

export interface AISuggestedTag {
  name: string;
  category?: string;
}

export interface AISuggestedLink {
  note_id: string;
  note_title: string;
  reason: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_favorite: boolean | null;
  is_archived: boolean | null;
  is_imported: boolean | null;
  status: string | null;
  metadata?: any;
  source_file_path?: string;
  source_file_type?: string;
  ai_processed?: boolean;
  ai_summary?: string | null;
  ai_key_points?: any[];
  ai_suggested_tags?: AISuggestedTag[];
  ai_suggested_links?: AISuggestedLink[];
  ai_summary_keywords?: string[];
  ai_flashcards?: FlashcardData[];
  last_viewed_at?: string | null;
  tags?: string[] | Tag[];
}

// Create a new note with the given title and content
export async function createNote(noteData: { 
  title: string; 
  content: string; 
  status: string; 
  is_favorite: boolean; 
  is_archived: boolean;
}) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...noteData,
        user_id: userData.user.id
      })
      .select();

    if (error) {
      throw error;
    }

    toast.success("Note created");
    return data[0] as Note;
  } catch (error: any) {
    console.error("Error creating note:", error);
    toast.error(error.message || "Failed to create note");
    return null;
  }
}

// Get all notes for the current user
export async function getNotes(): Promise<Note[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // 1. Fetch all notes for the user
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (notesError) throw notesError;
    if (!notesData) return [];

    // 2. Fetch all note-tag relationships for these notes (or for the user)
    const noteIds = notesData.map(n => n.id);
    const { data: noteTagsData, error: noteTagsError } = await supabase
      .from('note_tags')
      .select('note_id, tag_id')
      .in('note_id', noteIds); // Fetch relationships only for the notes retrieved

    if (noteTagsError) throw noteTagsError;

    // 3. Fetch all global tags (if not already available or to ensure freshness)
    const allGlobalTags = await getAllGlobalTags(); // Uses the existing getTags function

    // 4. Map tags to notes
    const notesWithTags = notesData.map(note => {
      const currentNoteTagRelations = noteTagsData?.filter(nt => nt.note_id === note.id) || [];
      const tagIdsForCurrentNote = currentNoteTagRelations.map(ntr => ntr.tag_id);
      const populatedTags = allGlobalTags.filter(globalTag => tagIdsForCurrentNote.includes(globalTag.id));
      return {
        ...note,
        tags: populatedTags, // Ensure this is Tag[]
      };
    });
    // console.log("[notesService] getNotes processed notesWithTags:", notesWithTags); // REMOVE
    return notesWithTags as Note[];

  } catch (error: any) {
    console.error("Error fetching notes with tags:", error);
    toast.error(error.message || "Failed to fetch notes");
    return [];
  }
}

// Get a single note by ID
export async function getNoteById(id: string): Promise<Note | null> {
  try {
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (noteError) {
      throw noteError;
    }
    if (!noteData) return null;

    // Fetch associated tag IDs for this note
    const tagIds = await getNoteTagIds(id); 
    // console.log(`[notesService] getNoteById(${id}) - Fetched tagIds:`, tagIds); // REMOVE

    let populatedTags: Tag[] = [];
    if (tagIds && tagIds.length > 0) {
      // Fetch full tag objects for these IDs
      // This could be optimized by fetching only specific tags if getAllGlobalTags is too heavy
      // or if getTags could take an array of IDs.
      // For now, fetch all and filter.
      const allGlobalTags = await getAllGlobalTags(); 
      populatedTags = allGlobalTags.filter(globalTag => tagIds.includes(globalTag.id));
    }
    // console.log(`[notesService] getNoteById(${id}) - Populated Tags:`, populatedTags); // REMOVE

    // Update last_viewed_at timestamp
    updateLastViewed(id);
    
    const noteWithTags: Note = {
      ...noteData,
      tags: populatedTags,
    };
    
    return noteWithTags;

  } catch (error: any) {
    console.error(`Error fetching note by ID (${id}):`, error);
    toast.error(error.message || "Failed to fetch note");
    return null;
  }
}

// Update a note's last_viewed_at timestamp
export async function updateLastViewed(id: string) {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error("Error updating last_viewed_at:", error);
    }
  } catch (error) {
    console.error("Error updating last_viewed_at:", error);
  }
}

// Get archived notes for the current user
export async function getArchivedNotes() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Note[];
  } catch (error: any) {
    console.error("Error fetching archived notes:", error);
    toast.error(error.message || "Failed to fetch archived notes");
    return [];
  }
}

// Get favorite notes for the current user
export async function getFavoriteNotes() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('is_favorite', true)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Note[];
  } catch (error: any) {
    console.error("Error fetching favorite notes:", error);
    toast.error(error.message || "Failed to fetch favorite notes");
    return [];
  }
}

// Update a note
export async function updateNote(id: string, noteData: Partial<Note>) {
  try {
    const { error } = await supabase
      .from('notes')
      .update(noteData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    toast.success("Note updated");
    return true;
  } catch (error: any) {
    console.error("Error updating note:", error);
    toast.error(error.message || "Failed to update note");
    return false;
  }
}

// Toggle a note's favorite status
export async function toggleFavorite(id: string, currentValue: boolean) {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ is_favorite: !currentValue })
      .eq('id', id);

    if (error) {
      throw error;
    }

    toast.success(currentValue ? "Removed from favorites" : "Added to favorites");
    return true;
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    toast.error(error.message || "Failed to update favorite status");
    return false;
  }
}

// Toggle a note's archive status
export async function toggleArchive(id: string, currentValue: boolean) {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ is_archived: !currentValue })
      .eq('id', id);

    if (error) {
      throw error;
    }

    toast.success(currentValue ? "Note unarchived" : "Note archived");
    return true;
  } catch (error: any) {
    console.error("Error toggling archive:", error);
    toast.error(error.message || "Failed to update archive status");
    return false;
  }
}

// Delete a note and its associations in note_tags
export async function deleteNote(id: string): Promise<boolean> {
  console.log(`[notesService] Attempting to delete note_tags for note ID: ${id}`);
  try {
    // Step 1: Delete associations from note_tags table
    const { data: deletedNoteTags, error: noteTagsError } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', id)
      .select(); // Adding select to see what was targeted/deleted if possible (or just count)

    if (noteTagsError) {
      console.error(`[notesService] Error deleting tag associations for note ${id}:`, noteTagsError);
      toast.error("Failed to remove note\'s tags. Note deletion aborted."); 
      return false; 
    }
    console.log(`[notesService] Successfully targeted/deleted ${deletedNoteTags?.length || 0} associations for note ${id} from note_tags. Response:`, deletedNoteTags);

    // Step 2: Delete the note itself from the notes table
    console.log(`[notesService] Attempting to delete note ${id} from notes table.`);
    const { data: deletedNote, error: noteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .select(); // Adding select for similar logging

    if (noteError) {
      console.error(`[notesService] Error deleting note ${id}:`, noteError);
      toast.error(noteError.message || "Failed to delete note.");
      return false;
    }
    console.log(`[notesService] Successfully deleted note ${id} from notes. Response:`, deletedNote);

    toast.success("Note and its tag associations deleted successfully.");
    return true;
  } catch (error: any) {
    console.error(`[notesService] Critical error in deleteNote function for note ${id}:`, error);
    toast.error(error.message || "Failed to delete note and/or its associations.");
    return false;
  }
}

// Search notes by query
export async function searchNotes(query: string) {
  if (!query.trim()) return [];

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userData.user.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Note[];
  } catch (error: any) {
    console.error("Error searching notes:", error);
    toast.error(error.message || "Failed to search notes");
    return [];
  }
}

// New function to get all note titles and IDs for the current user
export async function getAllNoteTitlesAndIds(): Promise<{ id: string; title: string }[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error("User not authenticated for fetching all note titles.");
      return [];
    }

    const { data, error } = await supabase
      .from('notes')
      .select('id, title')
      .eq('user_id', userData.user.id)
      .order('title'); // Or order by last updated, etc.

    if (error) {
      console.error("Error fetching all note titles:", error);
      return [];
    }
    return data as { id: string; title: string }[];
  } catch (error) {
    console.error("Exception fetching all note titles:", error);
    return [];
  }
}

export async function getRecentlyViewedNotes(limit: number = 10): Promise<Note[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated for fetching recently viewed notes.");
    }

    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('is_archived', false) // Typically non-archived
      .not('last_viewed_at', 'is', null) // Ensure last_viewed_at is not null
      .order('last_viewed_at', { ascending: false })
      .limit(limit);

    if (notesError) throw notesError;
    if (!notesData) return [];

    // Similar to getNotes, we need to populate tags for these notes
    const noteIds = notesData.map(n => n.id);
    if (noteIds.length === 0) return [] as Note[];

    const { data: noteTagsData, error: noteTagsError } = await supabase
      .from('note_tags')
      .select('note_id, tag_id')
      .in('note_id', noteIds);

    if (noteTagsError) throw noteTagsError;

    const allGlobalTags = await getAllGlobalTags(); 

    const notesWithTags = notesData.map(note => {
      const currentNoteTagRelations = noteTagsData?.filter(nt => nt.note_id === note.id) || [];
      const tagIdsForCurrentNote = currentNoteTagRelations.map(ntr => ntr.tag_id);
      const populatedTags = allGlobalTags.filter(globalTag => tagIdsForCurrentNote.includes(globalTag.id));
      return {
        ...note,
        tags: populatedTags,
      };
    });
    return notesWithTags as Note[];

  } catch (error: any) {
    console.error("Error fetching recently viewed notes:", error);
    toast.error(error.message || "Failed to fetch recently viewed notes");
    return [];
  }
}
