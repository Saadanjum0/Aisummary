
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  storage_used: number;
  created_at?: string;
  updated_at?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notification_enabled: boolean;
    [key: string]: any;
  };
}

// Get the profile of the current user
export async function getProfile(): Promise<Profile | null> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Default preferences if none are set
    const defaultPreferences = {
      theme: 'light' as const,
      notification_enabled: true,
    };

    const profile: Profile = {
      id: data.id,
      email: userData.user.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      storage_used: data.storage_used || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      preferences: data.preferences 
        ? { ...defaultPreferences, ...(data.preferences as any) } 
        : defaultPreferences
    };
    
    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    toast.error("Failed to fetch profile");
    return null;
  }
}

// Update the user's profile
export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    const defaultPreferences = {
      theme: 'light' as const,
      notification_enabled: true,
    };
    
    const updatedProfile: Profile = {
      id: data.id,
      email: userData.user.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      storage_used: data.storage_used || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      preferences: data.preferences 
        ? { ...defaultPreferences, ...(data.preferences as any) }
        : defaultPreferences
    };
    
    toast.success("Profile updated successfully");
    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile:", error);
    toast.error("Failed to update profile");
    return null;
  }
}

// Update theme preference
export async function updateThemePreference(theme: 'light' | 'dark' | 'system'): Promise<boolean> {
  try {
    const profile = await getProfile();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    const preferences = {
      ...profile.preferences,
      theme
    };
    
    await updateProfile({ preferences });
    
    return true;
  } catch (error) {
    console.error("Error updating theme preference:", error);
    toast.error("Failed to update theme preference");
    return false;
  }
}

// Upload a profile avatar
export async function uploadAvatar(file: File): Promise<string | null> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (error) {
      throw error;
    }
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    const publicUrl = data.publicUrl;
    
    // Update the user's profile with the new avatar URL
    await updateProfile({ avatar_url: publicUrl });
    
    toast.success("Profile picture updated");
    return publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    toast.error("Failed to upload avatar");
    return null;
  }
}
