import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile, updateThemePreference, uploadAvatar } from '@/services/profileService';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, User, LogOut } from 'lucide-react';

// Utility function to format bytes to human readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Add refetch interval to keep storage usage up to date
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setIsDarkMode(profile.preferences?.theme === 'dark');
      setIsNotificationsEnabled(profile.preferences?.notification_enabled ?? true);
    }
  }, [profile]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    setIsLoading(true);
    
    try {
      const url = await uploadAvatar(file);
      if (url) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name: string }) => {
      return updateProfile({ full_name: data.full_name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error}`);
    }
  });

  const updateThemeMutation = useMutation({
    mutationFn: (theme: 'light' | 'dark' | 'system') => {
      return updateThemePreference(theme);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const handleToggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    const theme = checked ? 'dark' : 'light';
    updateThemeMutation.mutate(theme);
    
    // Update the document theme
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleNotifications = (checked: boolean) => {
    setIsNotificationsEnabled(checked);
    
    if (profile) {
      updateProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          notification_enabled: checked
        }
      });
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ full_name: fullName });
  };

  const calculateStorageUsagePercent = () => {
    // Assuming a 100MB limit for simplicity
    const storageLimit = 100 * 1024 * 1024; // 100MB in bytes
    const usedStorage = profile?.storage_used || 0;
    return Math.min((usedStorage / storageLimit) * 100, 100);
  };

  const handleSignOut = async () => {
    await signOut();
    // Navigation to /login is handled within the signOut function in AuthContext
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 px-2 sm:px-4 md:px-6">
      <h1 className="text-3xl font-bold">Profile & Settings</h1>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your email address is associated with your account and cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Manage your app preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={handleToggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-700/10 dark:hover:text-red-400" 
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">
                You will be returned to the login page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
