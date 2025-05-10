
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { searchNotes, Note } from '@/services/notesService';
import NotesList from '@/components/notes/NotesList';
import { useQuery } from '@tanstack/react-query';
import { getTags, Tag } from '@/services/tagsService';
import { NoteCardProps } from '@/components/notes/NoteCard';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const {
    data: tags = [],
    isLoading: isLoadingTags
  } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags(),
  });
  
  const {
    data: searchResults,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: searchPerformed && !!searchQuery,
  });
  
  // Transform search results for NotesList component
  const transformedResults = searchResults?.map((note: Note): NoteCardProps => ({
    id: note.id,
    title: note.title,
    content: note.content || '',
    summary: note.ai_summary || undefined,
    tags: ((note.tags as string[] | undefined) || []).map(tagName => {
      const foundTag = tags?.find(t => t.name === tagName);
      return {
        id: foundTag?.id || tagName,
        name: tagName,
        color: foundTag?.color || '#3B82F6'
      };
    }),
    updatedAt: new Date(note.updated_at || Date.now()),
    createdAt: new Date(note.created_at || Date.now()),
    isFavorite: note.is_favorite || false
  })) || [];
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearchPerformed(true);
    refetch();
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Search Notes</h1>
        <p className="text-muted-foreground">
          Search through your notes by title or content
        </p>
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Type keywords to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-lg"
        />
        <Button type="submit" disabled={!searchQuery.trim() || isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
      </form>
      
      {searchPerformed && (
        <Card>
          <CardHeader>
            <CardTitle>
              {searchResults && searchResults.length > 0
                ? `Search results for "${searchQuery}"`
                : `No results found for "${searchQuery}"`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <NotesList notes={transformedResults} tags={tags || []} />
            ) : (
              <div className="text-center py-8 space-y-4">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-xl font-semibold">No matching notes found</p>
                  <p className="text-muted-foreground">
                    Try different keywords or check your spelling
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;
