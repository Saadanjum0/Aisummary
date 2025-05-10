import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MoreVertical, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteNote as apiDeleteNote, toggleFavorite as apiToggleFavorite } from "@/services/notesService";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NoteCardProps {
  id: string;
  title: string;
  summary?: string;
  content: string;
  tags: Tag[];
  updatedAt: Date;
  createdAt: Date;
  isFavorite?: boolean;
}

interface NoteCardPropsExtension {
  onNoteDeleted: () => void;
  onToggleFavorite: (noteId: string, currentIsFavorite: boolean) => void;
}

const getContrastingTextColor = (hexColor: string): string => {
  if (!hexColor || hexColor.length < 6) return '#000000';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#374151' : '#FFFFFF'; // Dark gray for light BG, white for dark
};

const NoteCard = ({
  id,
  title,
  summary,
  content,
  tags,
  updatedAt,
  createdAt,
  isFavorite = false,
  onNoteDeleted,
  onToggleFavorite
}: NoteCardProps & NoteCardPropsExtension) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.delete-menu-trigger')) {
      return;
    }
    navigate(`/notes/${id}`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this note?");
    if (confirmed) {
      setIsDeleting(true);
      const success = await apiDeleteNote(id);
      if (success) {
        toast.success("Note deleted.");
        onNoteDeleted();
      } else {
        toast.error("Failed to delete note.");
      }
      setIsDeleting(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTogglingFavorite(true);
    await onToggleFavorite(id, isFavorite);
    setIsTogglingFavorite(false);
  };

  return (
    <Card
      className={cn(
        "glass h-full transition-all duration-300 relative group",
        isHovered && "shadow-lg scale-[1.02]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="absolute top-2 right-2 flex items-center space-x-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 delete-menu-trigger" onClick={handleToggleFavorite} disabled={isTogglingFavorite}>
          <Star className={cn("h-4 w-4", isFavorite ? "fill-yellow-400 text-yellow-500" : "text-gray-400 hover:text-yellow-400")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="delete-menu-trigger">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/notes/edit/${id}`) }}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={isDeleting} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              {isDeleting ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div onClick={() => navigate(`/notes/${id}`)} className="cursor-pointer p-4 flex flex-col h-full">
        <CardHeader className="pb-2 pt-0 px-0">
          <CardTitle className="text-md font-semibold line-clamp-2 text-gray-700 hover:text-purple-600">
          {title}
        </CardTitle>
      </CardHeader>
        <CardContent className="space-y-2 px-0 pb-0 flex-grow">
          {(summary || (content && content.trim() !== '<p><br></p>' && content.trim() !== '')) && (
            <p className="text-xs text-gray-500 line-clamp-3 mb-2">
              {summary ? truncateText(summary, 120) : truncateText(content.replace(/<[^>]+>/g, ''), 120)}
          </p>
        )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.slice(0, 3).map((tag) => {
                const bgColor = tag.color || '#E0E7FF';
                const textColor = getContrastingTextColor(bgColor);
                return (
            <Badge
              key={tag.id}
                    variant="outline"
                    className="text-xxs font-medium rounded-full px-2 py-0.5 border"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      borderColor: bgColor === '#E0E7FF' ? '#C7D2FE' : '#A0AEC0'
                    }}
            >
              {tag.name}
            </Badge>
                );
              })}
          {tags.length > 3 && (
                <Badge variant="outline" className="text-xxs font-medium rounded-full px-2 py-0.5 bg-gray-100 text-gray-600 border-gray-300">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
          )}
        </CardContent>
        <div className="flex items-center text-xxs text-gray-400 pt-2 mt-auto px-0">
          <Clock className="h-3 w-3 mr-1.5" />
          <span>{formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
        </div>
      </div>
    </Card>
  );
};

export default NoteCard;
