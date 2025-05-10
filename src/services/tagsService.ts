import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_auto_generated?: boolean;
}

// Get all tags for the current user
export async function getTags() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data as Tag[];
  } catch (error) {
    console.error("Error fetching tags:", error);
    toast.error("Failed to fetch tags");
    return [];
  }
}

// Create a new tag
export async function createTag(tagData: { name: string; color?: string; description?: string }) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('tags')
      .insert({
        ...tagData,
        user_id: userData.user.id,
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    toast.success(`Tag "${tagData.name}" created`);
    return data[0] as Tag;
  } catch (error) {
    console.error("Error creating tag:", error);
    toast.error("Failed to create tag");
    return null;
  }
}

// Update an existing tag
export async function updateTag(id: string, tagData: { name?: string; color?: string; description?: string }) {
  try {
    const { data, error } = await supabase
      .from('tags')
      .update(tagData)
      .eq('id', id)
      .select();
    
    if (error) {
      throw error;
    }
    
    toast.success(`Tag "${tagData.name || 'Tag'}" updated`);
    return data[0] as Tag;
  } catch (error) {
    console.error("Error updating tag:", error);
    toast.error("Failed to update tag");
    return null;
  }
}

// Delete a tag
export async function deleteTag(id: string) {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    toast.success("Tag deleted");
    return true;
  } catch (error) {
    console.error("Error deleting tag:", error);
    toast.error("Failed to delete tag");
    return false;
  }
}

// Get tag IDs for a specific note
export async function getNoteTagIds(noteId: string) {
  try {
    const { data, error } = await supabase
      .from('note_tags')
      .select('tag_id')
      .eq('note_id', noteId);
    
    if (error) {
      throw error;
    }
    
    return data.map(item => item.tag_id);
  } catch (error) {
    console.error("Error fetching note tag IDs:", error);
    return [];
  }
}

// Add a tag to a note
export async function addTagToNote(noteId: string, tagId: string) {
  try {
    const { error } = await supabase
      .from('note_tags')
      .insert({
        note_id: noteId,
        tag_id: tagId
      });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error adding tag to note:", error);
    return false;
  }
}

// Remove a tag from a note
export async function removeTagFromNote(noteId: string, tagId: string) {
  try {
    const { error } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error removing tag from note:", error);
    return false;
  }
}
