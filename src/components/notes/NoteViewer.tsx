import { useState } from "react"; // Keep useState for the local favorite toggle display feedback
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, ArrowLeft, Star, Trash, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils"; // Assuming you have cn utility

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface NoteViewerProps {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: Tag[];
  updatedAt: Date;
  createdAt: Date;
  isFavorite: boolean; // Should reflect parent state
  onEdit?: () => void;
  onDelete: () => void; // onDelete should probably be required
  onToggleFavorite: (noteId: string, currentIsFavorite: boolean) => Promise<void>; // Add toggle handler prop
}

const NoteViewer = ({
  id,
  title,
  content,
  summary,
  tags,
  updatedAt,
  createdAt,
  isFavorite, // Use prop directly
  onEdit,
  onDelete,
  onToggleFavorite, // Destructure the prop
}: NoteViewerProps) => {
  const navigate = useNavigate();
  // Removed local 'favorite' state - use 'isFavorite' prop directly
  // const [favorite, setFavorite] = useState(isFavorite); // Remove this line

  const handleFavoriteToggle = async () => {
      // Optimistically update UI feedback immediately
      // This toast should probably happen *after* the async toggle call succeeds
      // toast.success(isFavorite ? "Removing from favorites..." : "Adding to favorites...");

      try {
          // Call the parent handler which makes the API call and invalidates cache
          await onToggleFavorite(id, isFavorite);
          // Toast handled in parent Dashboard component's onToggleFavorite
      } catch (error) {
          // Error toast handled in parent Dashboard component
          console.error("Failed to toggle favorite:", error);
      }
  };


  const handleDeleteClick = () => { // Renamed to avoid conflict with prop
    if (onDelete) {
      onDelete(); // Call the parent handler
    } else {
       // This fallback might not be needed if onDelete is required
      toast.success("Note deleted (client-side only)");
      navigate(-1);
    }
  };

  const handleGenerateFlashcards = () => {
    // Placeholder for future functionality
    toast.info("Generating flashcards (feature coming soon)...");
  };

  // Helper to get contrasting text color (remains same)
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


  return (
    // Outer container for max-width and centering on larger screens
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-6"> {/* Added max-w, mx-auto, vertical padding */}
      <Card className="glass h-full"> {/* h-full added to fill parent height */}
        <CardHeader className="pb-4 px-4 sm:px-6"> {/* Adjusted padding */}
          {/* Top row: Back button and Action buttons */}
          <div className="flex justify-between items-center mb-4"> {/* Added mb-4 for space below */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center text-muted-foreground hover:text-foreground -ml-3 sm:-ml-4" // Adjusted negative margin
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex space-x-1 sm:space-x-2 flex-shrink-0"> {/* Added flex-shrink-0 to buttons container */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteToggle}
                className={isFavorite ? "text-yellow-500 hover:bg-yellow-100/50" : "text-muted-foreground hover:bg-gray-100/50"} // Use prop, add hover styles
                 aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} /> {/* Use prop for fill */}
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-gray-100/50" aria-label="Share document"> {/* Added hover styles, aria-label */}
                <Share2 className="h-5 w-5" />
              </Button>
              {/* Optional: Add more header actions here if needed */}
            </div>
          </div>

          {/* Title, Timestamp, Tags */}
          {/* This section stacks naturally below the top row flex */}
          <CardTitle className="text-xl sm:text-2xl font-bold break-words leading-tight">{title}</CardTitle> {/* Increased font size on sm+, Added break-words, leading-tight */}

          <div className="text-xs sm:text-sm text-muted-foreground mt-1"> {/* Adjusted font size */}
            Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
          </div>

          {tags && tags.length > 0 && ( // Only render tag container if tags exist
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3"> {/* Adjusted gap */}
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  className="tag-chip text-xs sm:text-sm px-2 py-0.5 rounded-full whitespace-nowrap" // Adjusted badge styles for size, padding, rounding, no wrap
                  style={{ backgroundColor: `${tag.color}30`, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-4 px-4 sm:px-6"> {/* Adjusted padding */}
          {summary && (
            <div className="glass-card bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-md"> {/* Added padding and rounding */}
              <h3 className="font-semibold mb-2 text-base sm:text-lg">AI Summary</h3> {/* Adjusted font weight, size */}
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{summary}</p> {/* Adjusted font size, added leading-relaxed */}
            </div>
          )}

          {/* Use dangerouslySetInnerHTML if content is HTML/Markdown rendered,
              otherwise keep split("\n").map for simple paragraphs */}
          <div className="prose prose-sm sm:prose max-w-none dark:prose-invert"> {/* Adjusted prose size for sm, removed max-w-none if card handles it */}
             {/* Assuming content is plain text with newlines as paragraphs */}
             {content.split("\n").map((paragraph, i) => (
               // Add a key for list items
               <p key={i}>{paragraph}</p>
             ))}
             {/* If content is HTML/Markdown, uncomment below and adjust types */}
             {/* <div dangerouslySetInnerHTML={{ __html: content }} /> */}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row sm:justify-between border-t pt-5 mt-6 px-4 sm:px-6 gap-4"> {/* Responsive flex, adjusted padding, added gap */}
          {/* Left button group: Delete, Edit */}
          <div className="flex gap-2 flex-wrap"> {/* Use gap for spacing, allow wrapping */}
            <Button variant="outline" onClick={handleDeleteClick} className="text-destructive"> {/* Use specific click handler */}
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
            {/* Only show edit button if onEdit prop is provided */}
            {onEdit && (
                 <Button variant="outline" onClick={onEdit}>
                   <Edit className="h-4 w-4 mr-1" />
                   Edit
                 </Button>
            )}
             {/* Fallback edit button if onEdit is not provided but we have the ID */}
             {!onEdit && id && (
                 <Button variant="outline" onClick={() => navigate(`/notes/edit/${id}`)}>
                   <Edit className="h-4 w-4 mr-1" />
                   Edit
                 </Button>
             )}
          </div>

          {/* Right button group: Export, Generate Flashcards */}
          <div className="flex gap-2 flex-wrap"> {/* Use gap for spacing, allow wrapping */}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button onClick={handleGenerateFlashcards}>
              Generate Flashcards
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NoteViewer;