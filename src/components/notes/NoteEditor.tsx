
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, X, Plus, Image } from "lucide-react";
import { toast } from "sonner";
import TagsList from "./TagsList";
import OCRUploader from "./OCRUploader";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface NoteEditorProps {
  id?: string;
  initialTitle?: string;
  initialContent?: string;
  availableTags: Tag[];
  initialSelectedTags?: string[];
  isEditing?: boolean;
}

const NoteEditor = ({
  id,
  initialTitle = "",
  initialContent = "",
  availableTags = [],
  initialSelectedTags = [],
  isEditing = false,
}: NoteEditorProps) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [isSaving, setIsSaving] = useState(false);
  const [showOCR, setShowOCR] = useState(false);

  useEffect(() => {
    // Only set values if they change from props
    if (initialTitle !== title) setTitle(initialTitle);
    if (initialContent !== content) setContent(initialContent);
    if (initialSelectedTags !== selectedTags) setSelectedTags(initialSelectedTags);
  }, [initialTitle, initialContent, initialSelectedTags]);

  const handleTagClick = (tagId: string) => {
    setSelectedTags((prevSelectedTags) =>
      prevSelectedTags.includes(tagId)
        ? prevSelectedTags.filter((id) => id !== tagId)
        : [...prevSelectedTags, tagId]
    );
  };

  const handleAddTag = () => {
    toast("Tag creation will be available soon!");
  };

  const handleOCRTextExtracted = (text: string) => {
    setContent((prevContent) => {
      // If there's already content, add a separator
      if (prevContent.trim()) {
        return `${prevContent}\n\n--- Extracted from image ---\n\n${text}`;
      }
      return text;
    });
    setShowOCR(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    setIsSaving(true);

    try {
      // This will be implemented when connected to Supabase
      console.log("Saving note:", { title, content, selectedTags });
      
      // Mock save for now
      setTimeout(() => {
        toast.success(isEditing ? "Note updated successfully!" : "Note created successfully!");
        navigate(id ? `/notes/${id}` : "/");
      }, 1000);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || title.trim()) {
      // Add confirmation dialog later
      if (confirm("Discard changes?")) {
        navigate(id ? `/notes/${id}` : "/");
      }
    } else {
      navigate(id ? `/notes/${id}` : "/");
    }
  };

  return (
    <Card className="glass w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center text-muted-foreground hover:text-foreground -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <CardTitle className="text-xl font-semibold">
            {isEditing ? "Edit Note" : "Create Note"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="glass-input"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2 items-center">
            <TagsList
              tags={availableTags}
              onTagClick={handleTagClick}
              selectedTags={selectedTags}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="glass"
              onClick={handleAddTag}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Tag
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Dialog open={showOCR} onOpenChange={setShowOCR}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Image className="h-4 w-4 mr-2" />
                  Extract Text from Image
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <OCRUploader onTextExtracted={handleOCRTextExtracted} />
              </DialogContent>
            </Dialog>
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note content here..."
            rows={15}
            className="glass-input resize-none"
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Note"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NoteEditor;
