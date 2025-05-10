import { useState, useEffect } from "react";
import NoteCard, { NoteCardProps } from "./NoteCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Grid, List } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotesListProps {
  notes: (NoteCardProps & { onNoteDeleted: () => void; onToggleFavorite: (noteId: string, currentIsFavorite: boolean) => void; })[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

const NotesList = ({ 
  notes: initialNotes, 
  isLoading = false, 
  emptyMessage = "No notes found", 
  emptyAction 
}: NotesListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<(NoteCardProps & { onNoteDeleted: () => void; onToggleFavorite: (noteId: string, currentIsFavorite: boolean) => void; })[]>(initialNotes);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "title">("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let result = [...initialNotes];
    
    if (searchTerm) {
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (note.summary && note.summary.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    result = result.sort((a, b) => {
      if (sortBy === "updated_at") {
        return sortDirection === "desc" 
          ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() 
          : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === "created_at") {
        return sortDirection === "desc" 
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() 
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return sortDirection === "desc" 
          ? b.title.localeCompare(a.title) 
          : a.title.localeCompare(b.title);
      }
    });
    
    setFilteredNotes(result);
  }, [searchTerm, initialNotes, sortBy, sortDirection]);

  if (isLoading) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-input rounded-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={`glass ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' : ''}`}
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`glass ${viewMode === 'list' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' : ''}`}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="glass">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={sortBy === "updated_at"}
                onCheckedChange={() => setSortBy("updated_at")}
              >
                Date Updated
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={sortBy === "created_at"}
                onCheckedChange={() => setSortBy("created_at")}
              >
                Date Created (Added)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={sortBy === "title"}
                onCheckedChange={() => setSortBy("title")}
              >
                Title
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Direction</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                checked={sortDirection === "desc"}
                onCheckedChange={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
              >
                {sortDirection === "desc" ? "Newest First" : "Oldest First"}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredNotes.length === 0 && searchTerm ? (
         <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
            No notes match your search "{searchTerm}".
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-card text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">
            {emptyMessage}
          </p>
          {emptyAction && (
            <div className="mt-4">{emptyAction}</div>
          )}
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        }`}>
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} {...note} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;
