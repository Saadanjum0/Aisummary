import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotes, getFavoriteNotes, Note, searchNotes as apiSearchNotes, getRecentlyViewedNotes, toggleFavorite as apiToggleFavorite } from '@/services/notesService';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Search, Upload, FileText, Tags as TagsIcon, DownloadCloud, Edit3, X, Brain, Menu, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotesList from '@/components/notes/NotesList';
import { NoteCardProps } from '@/components/notes/NoteCard';
import { getTags, Tag } from '@/services/tagsService';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Define xxs breakpoint if not already in tailwind.config.js (optional but good for tiny screens)
// If not defined, 'xs' is the smallest default. You can add custom breakpoints in tailwind.config.js
// Example:
// extend: {
//   screens: {
//     'xxs': '320px', // Example: very small phone screens
//     'xs': '480px',  // Example: slightly larger phones
//   }
// }

// Helper to get contrasting text color (remains the same)
const getContrastingTextColor = (hexColor: string): string => {
  if (!hexColor || hexColor.length !== 7 || hexColor[0] !== '#') return '#000000';
  try {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  } catch (e) {
    console.error("Error parsing hex color:", hexColor, e);
    return '#000000'; // Default on error
  }
};

// --- CSS for Hiding Scrollbars ---
// You must add this CSS to your global stylesheet (e.g., styles/globals.css)
// or use a Tailwind CSS plugin (like tailwind-scrollbar-hide).
/*
  In your CSS file (e.g., styles/globals.css):

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;  // IE and Edge
    scrollbar-width: none;     // Firefox
  }
*/


const Dashboard = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeFilterTagIds, setActiveFilterTagIds] = useState<string[]>([]);
  const [activeDocumentTab, setActiveDocumentTab] = useState<"all" | "favorites" | "recent">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile sidebar

  // --- Hooks for data fetching and debouncing (remain largely the same) ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm.trim() !== "") {
        setActiveFilterTagIds([]); // Clear tag filters when searching
      }
    }, 250); 
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { 
    data: allNotes = [], 
    isLoading: isLoadingAllNotes,
    refetch: refetchAllNotes,
    isFetching: isFetchingAllNotes // Added for more accurate loading state
  } = useQuery<Note[]>({ queryKey: ['notes'], queryFn: getNotes });

  const { 
    data: favoriteNotes = [], 
    isLoading: isLoadingFavorites,
    refetch: refetchFavorites,
    isFetching: isFetchingFavorites
  } = useQuery<Note[]>({
    queryKey: ['favorite-notes'],
    queryFn: getFavoriteNotes,
    enabled: activeDocumentTab === "favorites", // Only fetch when tab is active
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  const { 
    data: titleContentSearchedNotes, 
    isLoading: isLoadingTitleContentSearch,
    isFetching: isFetchingTitleContentSearch,
    refetch: refetchTitleContentSearch 
  } = useQuery<Note[]>({ 
    queryKey: ['titleContentSearchedNotes', debouncedSearchTerm], 
    queryFn: () => apiSearchNotes(debouncedSearchTerm), 
    enabled: !!debouncedSearchTerm, // Only run query if there's a search term
    keepPreviousData: true, // Keep previous data while fetching new search results
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const {
    data: tags = [],
    isLoading: isLoadingTags
  } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => getTags(),
    staleTime: 24 * 60 * 60 * 1000, // Tags don't change often, long stale time
    cacheTime: 7 * 24 * 60 * 60 * 1000, // Keep tags cached for a week
  });

  const { 
    data: recentlyViewedNotes = [], 
    isLoading: isLoadingRecent,
    isFetching: isFetchingRecent,
    refetch: refetchRecent 
  } = useQuery<Note[]>({ 
    queryKey: ['recentlyViewedNotes'], 
    queryFn: () => getRecentlyViewedNotes(10), // Limit recent notes
    enabled: activeDocumentTab === "recent", // Only fetch when tab is active
    staleTime: 60 * 1000, // Recent notes change more often
    cacheTime: 5 * 60 * 1000,
  });

  const handleNoteDeleted = () => {
    // Invalidate relevant queries instead of refetching everything manually
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['favorite-notes'] });
    queryClient.invalidateQueries({ queryKey: ['recentlyViewedNotes'] });
    if (debouncedSearchTerm) {
         queryClient.invalidateQueries({ queryKey: ['titleContentSearchedNotes', debouncedSearchTerm] });
    }
    toast.success("Document deleted.");
  };

  const handleToggleFavorite = async (noteId: string, currentIsFavorite: boolean) => {
    // Optimistic update
    queryClient.setQueryData<Note[]>(['notes'], (oldNotes) =>
      oldNotes?.map(note =>
        note.id === noteId ? { ...note, is_favorite: !currentIsFavorite } : note
      )
    );
     // Optimistically add/remove from favorite-notes cache if it exists
    queryClient.setQueryData<Note[]>(['favorite-notes'], (oldFavNotes) => {
        if (!oldFavNotes) return undefined; // Cache doesn't exist, no optimistic update needed
        if (currentIsFavorite) { // Was favorite, now unfavoriting
            return oldFavNotes.filter(note => note.id !== noteId);
        } else { // Was not favorite, now favoriting
             // Find the note in allNotes cache to get full details
            const noteToAdd = queryClient.getQueryData<Note[]>(['notes'])?.find(note => note.id === noteId);
            return noteToAdd ? [...oldFavNotes, { ...noteToAdd, is_favorite: true }] : oldFavNotes;
        }
    });


    const success = await apiToggleFavorite(noteId, currentIsFavorite);

    if (success) {
      // Invalidate to refetch and sync state with the server if optimistic update wasn't perfect
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-notes'] }); // Always invalidate favorites as status changed
      toast.success(`Document ${currentIsFavorite ? 'unfavorited' : 'favorited'}.`);
    } else {
      // Rollback optimistic update on failure
       queryClient.setQueryData<Note[]>(['notes'], (oldNotes) =>
            oldNotes?.map(note =>
                note.id === noteId ? { ...note, is_favorite: currentIsFavorite } : note
            )
        );
         queryClient.setQueryData<Note[]>(['favorite-notes'], (oldFavNotes) => {
            if (!oldFavNotes) return undefined;
            if (currentIsFavorite) { // Failed to unfavorite, put it back
                const noteToAdd = queryClient.getQueryData<Note[]>(['notes'])?.find(note => note.id === noteId);
                return noteToAdd ? [...oldFavNotes, { ...noteToAdd, is_favorite: true }] : oldFavNotes;
            } else { // Failed to favorite, remove it
                return oldFavNotes.filter(note => note.id !== noteId);
            }
         });
      toast.error("Failed to update favorite status.");
    }
  };


  const transformNoteToCardProps = useMemo(() => (note: Note): NoteCardProps & { onNoteDeleted: () => void; onToggleFavorite: (noteId: string, currentIsFavorite: boolean) => void; } => {
    // Ensure tags are always an array of Tag objects for consistent rendering
    const noteFullTags: Tag[] = (note.tags && Array.isArray(note.tags) ? note.tags.map(tagOrId => {
        if (typeof tagOrId === 'string') {
            // Find the full tag object from the global tags list
            const foundTag = tags.find(t => t.id === tagOrId || t.name.toLowerCase() === tagOrId.toLowerCase());
            // If found, use it. Otherwise, create a minimal tag object.
            return foundTag || { id: tagOrId, name: String(tagOrId), color: '#718096' }; // Default color for unresolved tags
        }
        return tagOrId as Tag; // Already a Tag object
    }).filter(Boolean) as Tag[] // Remove any null/undefined entries
    : []); // Default to empty array if note.tags is not an array

    return {
      id: note.id,
      title: note.title,
      content: note.content || '', // Ensure content is not null/undefined
      summary: note.ai_summary || undefined,
      tags: noteFullTags,
      updatedAt: new Date(note.updated_at || Date.now()),
      createdAt: new Date(note.created_at || Date.now()),
      isFavorite: note.is_favorite || false,
      onNoteDeleted: handleNoteDeleted,
      onToggleFavorite: handleToggleFavorite
    };
  }, [tags, handleNoteDeleted, handleToggleFavorite]); // Depend on tags, handlers

  const handleTagFilterClick = (tagId: string) => {
    // Clear search when tag filtering starts
    setSearchTerm(""); 
    setDebouncedSearchTerm(""); // Immediately clear debounced term too

    setActiveFilterTagIds(prevIds => {
      const newIds = prevIds.includes(tagId) 
        ? prevIds.filter(id => id !== tagId) 
        : [...prevIds, tagId];
      return newIds;
    });

    // Close sidebar on mobile after tag selection for better UX
    // Check window.innerWidth *only* if you are in a client-side environment (like a browser)
    // In Next.js or SSR, you might need to use a state variable or a hook for window size.
    if (typeof window !== 'undefined' && window.innerWidth < 768) { // md breakpoint
        setIsSidebarOpen(false);
    }
  };

  const clearTagFilters = () => {
    setActiveFilterTagIds([]);
  };
  
  const displayedNotes = useMemo(() => {
    // Determine the base list of notes based on the active tab
    let baseNotes: Note[] = [];
    if (activeDocumentTab === "favorites") {
        baseNotes = favoriteNotes;
    } else if (activeDocumentTab === "recent") {
        baseNotes = recentlyViewedNotes;
    } else { // 'all' tab
        baseNotes = allNotes;
    }

    let filteredNotes = baseNotes;

    // Apply search filter if active
    if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        filteredNotes = filteredNotes.filter(note =>
            note.title?.toLowerCase().includes(lowerSearchTerm) ||
            note.content?.toLowerCase().includes(lowerSearchTerm) ||
            note.ai_summary?.toLowerCase().includes(lowerSearchTerm) ||
            (note.tags && (note.tags as Tag[]).some(tag => tag.name?.toLowerCase().includes(lowerSearchTerm))) ||
            (note.ai_summary_keywords && note.ai_summary_keywords.some(kw => kw?.toLowerCase().includes(lowerSearchTerm)))
        );
    }

    // Apply tag filters if active
    if (activeFilterTagIds.length > 0) {
      filteredNotes = filteredNotes.filter(note => {
        if (!note) return false; // Skip potentially null notes
        return activeFilterTagIds.some(filterTagId => {
          // Find the full tag object for the filter ID to get its name
          const activeGlobalTagObj = tags.find(t => t.id === filterTagId);
          if (!activeGlobalTagObj) return false; // Should not happen if tags data is correct
          const filterTagNameLower = activeGlobalTagObj.name.toLowerCase();

          // Check if the note has the tag by ID or Name (formal tags)
          if (note.tags && Array.isArray(note.tags)) {
            const hasFormalTag = note.tags.some(tag => 
              (typeof tag === 'string' && tag === filterTagId) || // Check by ID string
              (typeof tag === 'string' && tag.toLowerCase() === filterTagNameLower) || // Check by Name string (fallback)
              (typeof tag === 'object' && (tag as Tag).id === filterTagId) // Check by ID object
            );
            if (hasFormalTag) return true;
          }
           // Check if the filter tag name exists in AI keywords
          if (note.ai_summary_keywords && Array.isArray(note.ai_summary_keywords)) {
            if (note.ai_summary_keywords.some(keyword => keyword?.toLowerCase() === filterTagNameLower)) {
              return true;
            }
          }
          return false; // Note doesn't match this filter tag
        });
      });
    }

    // Sort recent notes by view time (already handled by API/query, but ensuring here)
     if (activeDocumentTab === "recent") {
         filteredNotes.sort((a,b) => new Date(b.last_viewed_at || 0).getTime() - new Date(a.last_viewed_at || 0).getTime());
     }


    // Transform the final list of filtered notes into NoteCardProps
    return filteredNotes.map(transformNoteToCardProps);

  }, [
    activeDocumentTab, allNotes, favoriteNotes, recentlyViewedNotes, tags, // Dependencies for data sources
    debouncedSearchTerm, activeFilterTagIds, // Dependencies for filters
    transformNoteToCardProps // Dependency for transformation function
  ]);

  // Decide what loading state to show based on active tab/search
  const isLoadingDisplay = isLoadingAllNotes || 
                           (activeDocumentTab === 'favorites' && (isLoadingFavorites || isFetchingFavorites)) ||
                           (activeDocumentTab === 'recent' && (isLoadingRecent || isFetchingRecent)) ||
                           (!!debouncedSearchTerm && (isLoadingTitleContentSearch || isFetchingTitleContentSearch)) ||
                           isLoadingTags ||
                           isFetchingAllNotes; // Consider fetching state for 'all' tab


  const handleRefresh = () => {
    // Invalidate all relevant queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['favorite-notes'] });
    queryClient.invalidateQueries({ queryKey: ['recentlyViewedNotes'] });
     // Only invalidate search query if there's a term
    if (debouncedSearchTerm) {
         queryClient.invalidateQueries({ queryKey: ['titleContentSearchedNotes', debouncedSearchTerm] });
    }
     queryClient.invalidateQueries({ queryKey: ['tags'] });
    toast.info("Refreshing documents...");
  };

    // Placeholder for actual recent activity data if you implement it
  const actualRecentActivity: { icon: React.ElementType; action: string; item?: string; subItems?: string[]; time: string; }[] = [];


  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden"> {/* Prevent horizontal scroll on the main container */}
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between gap-2 sticky top-0 z-50 shadow-sm min-w-0"> {/* Added dark mode */}
        {/* Left side: Menu Button, Icon, Name */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0"> {/* flex-shrink-0 to keep it from shrinking, min-w-0 allows text truncation if necessary */}
          {/* Mobile Menu Button - Toggles state */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0" // Hide on md+, flex-shrink-0
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} // Toggle state
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"} // Update ARIA label
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5 text-gray-600" /> // Show X when sidebar is open
            ) : (
              <Menu className="h-5 w-5 text-gray-600" /> // Show Menu when sidebar is closed
            )}
          </Button>
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" /> {/* Prevent icon shrink */}
          {/* Title: Conditional based on screen size */}
          {/* Full Title for md and larger */}
          <h1 className="text-base sm:text-lg font-bold text-gray-800 whitespace-nowrap hidden md:block flex-shrink-0">SmartSummarizer</h1>
          {/* Shorter Title for screens smaller than md */}
          <h1 className="text-base font-bold text-gray-800 whitespace-nowrap md:hidden flex-shrink-0">SS</h1>
        </div>

        {/* Right side: Search, Import, Refresh */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-grow justify-end"> {/* Use gap instead of space-x, min-w-0, flex-grow */}
          {/* Search Input Container - Allows input to take available space */}
          <div className="relative flex-grow min-w-[100px] max-w-sm"> {/* flex-grow allows it to grow, min-w ensures a minimum, max-w limits large size */}
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 w-4 text-gray-400 pointer-events-none" /> {/* Added pointer-events-none */}
            <Input 
              placeholder="Search documents..." // More descriptive placeholder
              className="pl-7 sm:pl-9 pr-7 sm:pr-9 py-1.5 sm:py-2 w-full text-xs sm:text-sm rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 min-w-0" // Full width within container, improved focus style, added min-w-0
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search documents"
            />
            {searchTerm && (
                <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8" onClick={() => setSearchTerm("")} aria-label="Clear search">
                    <X className="h-3 w-3 sm:h-3.5 w-3.5 text-gray-400 hover:text-gray-600"/>
          </Button>
            )}
          </div>
          {/* Import Button */}
          <Link to="/import" className="flex-shrink-0"> {/* Prevent import button from shrinking */}
            <Button variant="outline" size="sm" className="text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-1.5 whitespace-nowrap flex items-center"> {/* Adjusted padding, added flex items-center for icon+text alignment */}
              <Upload className="mr-1 h-3.5 w-3.5 sm:h-4 w-4" />
              Import
            </Button>
          </Link>
           {/* Refresh Button */}
           <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            aria-label="Refresh documents"
            className="flex-shrink-0" // Prevent refresh button from shrinking
           >
            <RefreshCw className={cn("h-4 w-4 sm:h-5 w-5 text-gray-600", isLoadingDisplay ? 'animate-spin' : '')} /> {/* Spin while loading */}
           </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden"> {/* This flex container is key for sidebar + main layout */}
        {/* Sidebar - Conditional rendering and positioning for mobile */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-6 overflow-y-auto transition-transform duration-300 ease-in-out no-scrollbar",
            "md:static md:translate-x-0 md:z-auto md:block md:flex-shrink-0",
            isSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
          )}
        >
          {/* Close button for mobile sidebar */}
          <div className="flex justify-between items-center md:hidden mb-4">
            <h2 className="text-lg font-semibold text-purple-600">Menu</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tag Explorer */}
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">TAG EXPLORER</h2>
              {activeFilterTagIds.length > 0 && (
                  <Button variant="link" className="text-xs text-purple-600 hover:text-purple-800 p-0 h-auto flex items-center" onClick={clearTagFilters}>
                      <X className="h-3 w-3 mr-0.5" /> Clear
                  </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Filter by tags</p> {/* Changed text */}
            {isLoadingTags ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />)} {/* Skeleton for tags */}
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2"> {/* Smaller gap for mobile */}
                {tags.slice(0, 20).map(tag => { // Limit number of tags shown
                  const isActive = activeFilterTagIds.includes(tag.id);
                  let bgColor = tag.color || '#E9D5FF'; // Default purple-ish
                  if (isActive) bgColor = '#BEF264'; // Active lime-ish
                  const textColor = getContrastingTextColor(bgColor);
                  return (
                    <button 
                      key={tag.id} 
                      onClick={() => handleTagFilterClick(tag.id)}
                      title={`Filter by tag: ${tag.name}`}
                      className={cn(
                        "px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium rounded-full cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap", // Added whitespace-nowrap
                        "focus:outline-none focus:ring-2 focus:ring-offset-1",
                        isActive ? 'ring-purple-600 shadow-md' : 'hover:opacity-80 hover:shadow-sm'
                      )}
                      style={{ backgroundColor: bgColor, color: textColor, borderColor: isActive ? '#A78BFA' : 'transparent' }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                 {tags.length > 20 && ( // Add a button if there are more tags
                     <button
                       onClick={() => { /* Add logic to show all tags, maybe a modal */ toast.info("Showing only the first 20 tags. Future feature: See all tags."); }}
                       className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium rounded-full cursor-pointer text-gray-600 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                     >
                        +{tags.length - 20} more
                     </button>
                 )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No tags found.</p>
            )}
      </div>

          {/* Recent Activity - Added conditional rendering based on actual data */}
          {actualRecentActivity.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">RECENT ACTIVITY</h2>
                <ul className="space-y-2 sm:space-y-3">
                  {/* Example structure - replace with actual data mapping */}
                   {/*
                   <li>
                       <div className="flex items-start space-x-2 text-sm text-gray-600">
                           <FileText className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5"/>
                    <div>
                               <p>You <strong>created</strong> a document.</p>
                               <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                    </div>
                  </li>
                   */}
              </ul>
            </div>
            )}
        </aside>

        {/* Overlay for mobile sidebar - Closes sidebar on click */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true" // Hide overlay from screen readers
          ></div>
        )}

        {/* Document List Area */}
        <main className="flex-1 p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto no-scrollbar bg-gray-50 dark:bg-gray-900"> {/* Added no-scrollbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0">Your Documents</h2>
                {/* Tab styling adjusted for better mobile view */}
                <div
                  role="tablist"
                  className="flex space-x-0.5 xxs:space-x-1 rounded-md p-1 overflow-x-auto no-scrollbar mb-4" // Added rounded-md, p-1, no-scrollbar, mb-4
                   // Glassmorphic styles applied to the container
                   style={{
                       backgroundColor: 'rgba(255, 255, 255, 0.3)',
                       backdropFilter: 'blur(10px)',
                       WebkitBackdropFilter: 'blur(10px)', // For Safari
                       border: '1px solid rgba(255, 255, 255, 0.2)',
                       boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                       minWidth: 'fit-content', // Prevent container from shrinking below content size
                   }}
                >
                    <button
                        role="tab"
                        aria-selected={activeDocumentTab === 'all'}
                        onClick={() => setActiveDocumentTab('all')}
                        className={`px-3 py-1 xxs:px-4 sm:py-1.5 text-xs xxs:text-sm font-medium focus:outline-none whitespace-nowrap rounded-sm transition-colors duration-200
                           ${activeDocumentTab === 'all'
                            ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm' // Active state: more solid background
                            : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-white/50 dark:hover:bg-gray-800/50'}
                        `} // Adjusted padding, added rounded-sm, active/inactive styles
                    >All</button>
                     <button
                        role="tab"
                        aria-selected={activeDocumentTab === 'recent'}
                        onClick={() => setActiveDocumentTab('recent')}
                         className={`px-3 py-1 xxs:px-4 sm:py-1.5 text-xs xxs:text-sm font-medium focus:outline-none whitespace-nowrap rounded-sm transition-colors duration-200
                           ${activeDocumentTab === 'recent'
                            ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-white/50 dark:hover:bg-gray-800/50'}
                        `}
                    >Recent</button>
                    <button
                        role="tab"
                        aria-selected={activeDocumentTab === 'favorites'}
                        onClick={() => setActiveDocumentTab('favorites')}
                         className={`px-3 py-1 xxs:px-4 sm:py-1.5 text-xs xxs:text-sm font-medium focus:outline-none whitespace-nowrap rounded-sm transition-colors duration-200
                           ${activeDocumentTab === 'favorites'
                            ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-white/50 dark:hover:bg-gray-800/50'}
                        `}
                    >Favorites</button>
                </div>
            </div>
          </div>
          
          {isLoadingDisplay && (
            <div className="flex-1 flex items-center justify-center py-10 sm:py-16">
              <div className="w-full max-w-4xl space-y-3 sm:space-y-4 px-4"> {/* Added max-width and padding */}
                <Skeleton className="h-20 sm:h-24 w-full rounded-lg" />
                <Skeleton className="h-20 sm:h-24 w-full rounded-lg" />
                <Skeleton className="h-20 sm:h-24 w-full rounded-lg" />
              </div>
        </div>
      )}

          {!isLoadingDisplay && displayedNotes.length === 0 && (
            <div className="text-center py-10 sm:py-16 px-4"> {/* Added padding */}
              <FileText className="h-10 w-10 sm:h-12 w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">
                  {debouncedSearchTerm 
                      ? `No documents matching "${debouncedSearchTerm}"` // Improved message
                      : (activeDocumentTab === 'favorites' 
                          ? 'No favorite documents yet'
                          : (activeDocumentTab === 'recent'
                              ? 'No recently viewed documents'
                              : (activeFilterTagIds.length > 0 
                                  ? `No documents match the selected tag${activeFilterTagIds.length > 1 ? 's' : ''}` // Improved tag message
                                  : "No documents yet")
                            )
                        )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                  {debouncedSearchTerm 
                      ? "Try a different search term."
                      : (activeFilterTagIds.length > 0 
                          ? "Adjust your tag filters or clear them."
                          : "Get started by importing your first document.")}
              </p>
              {(!debouncedSearchTerm && activeFilterTagIds.length === 0 && activeDocumentTab === 'all') && ( // Show import button only on 'All' tab if empty and not filtering/searching
                <Button asChild className="mt-4 sm:mt-6 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-md"> {/* Added rounded-md */}
                  <Link to="/import">
                    <Upload className="mr-1.5 h-3.5 w-3.5 sm:h-4 w-4" /> Import Document
                  </Link>
              </Button>
              )}
            </div>
          )}

          {!isLoadingDisplay && displayedNotes.length > 0 && (
              <NotesList notes={displayedNotes} /> 
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;