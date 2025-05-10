
import { Badge } from "@/components/ui/badge";

interface Tag {
  id: string;
  name: string;
  color: string;
  count?: number;
}

interface TagsListProps {
  tags: Tag[];
  onTagClick?: (tagId: string) => void;
  selectedTags?: string[];
  className?: string;
}

const TagsList = ({
  tags,
  onTagClick,
  selectedTags = [],
  className = "",
}: TagsListProps) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <Badge
            key={tag.id}
            className={`tag-chip cursor-pointer transition-all duration-200 ${
              isSelected
                ? "ring-2 ring-offset-2 ring-offset-background"
                : "opacity-80 hover:opacity-100"
            }`}
            style={{
              backgroundColor: isSelected ? tag.color : `${tag.color}30`,
              color: isSelected ? "white" : tag.color,
            }}
            onClick={() => onTagClick?.(tag.id)}
          >
            {tag.name}
            {tag.count !== undefined && (
              <span className="ml-1 text-xs opacity-80">({tag.count})</span>
            )}
          </Badge>
        );
      })}
      
      {tags.length === 0 && (
        <div className="text-sm text-muted-foreground py-2">
          No tags available
        </div>
      )}
    </div>
  );
};

export default TagsList;
