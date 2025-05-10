import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Plus, Tag, Pencil, Trash } from 'lucide-react';
import { getTags, createTag, updateTag, deleteTag, Tag as TagType } from '@/services/tagsService';

const colorOptions = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Green', value: '#10B981' },
  { label: 'Yellow', value: '#F59E0B' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Gray', value: '#6B7280' },
];

const TagsPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');
  const [tagDescription, setTagDescription] = useState('');
  const [currentTagId, setCurrentTagId] = useState<string | null>(null);
  
  const { 
    data: tags, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags()
  });

  const resetForm = () => {
    setTagName('');
    setTagColor('#3B82F6');
    setTagDescription('');
    setCurrentTagId(null);
  };

  const handleCreateTag = async () => {
    setIsCreating(true);
    try {
      await createTag({
        name: tagName,
        color: tagColor,
        description: tagDescription
      });
      refetch();
      resetForm();
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!currentTagId) return;
    
    setIsEditing(true);
    try {
      await updateTag(currentTagId, {
        name: tagName,
        color: tagColor,
        description: tagDescription
      });
      refetch();
      resetForm();
    } catch (error) {
      console.error('Error updating tag:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      await deleteTag(id);
      refetch();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const editTag = (tag: TagType) => {
    setCurrentTagId(tag.id);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagDescription(tag.description || '');
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">
            Manage your tags to organize notes
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to categorize your notes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g., Work, Personal, Study"
                />
              </div>
              <div className="space-y-2">
                <Label>Tag Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <div
                      key={color.value}
                      className={`h-8 w-8 rounded-full cursor-pointer border-2 ${
                        tagColor === color.value ? 'border-black dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setTagColor(color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-description">Description (Optional)</Label>
                <Input
                  id="tag-description"
                  value={tagDescription}
                  onChange={(e) => setTagDescription(e.target.value)}
                  placeholder="Enter a description for this tag"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleCreateTag} 
                disabled={isCreating || !tagName}
                type="submit"
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !tags || tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No tags created yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Tags help you organize your notes and find related content more easily.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                {/* Same dialog content as above */}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <Card key={tag.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <CardTitle className="text-lg">{tag.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={() => editTag(tag)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tag</DialogTitle>
                          <DialogDescription>
                            Update your tag details
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-tag-name">Tag Name</Label>
                            <Input
                              id="edit-tag-name"
                              value={tagName}
                              onChange={(e) => setTagName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tag Color</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {colorOptions.map((color) => (
                                <div
                                  key={color.value}
                                  className={`h-8 w-8 rounded-full cursor-pointer border-2 ${
                                    tagColor === color.value ? 'border-black dark:border-white' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  onClick={() => setTagColor(color.value)}
                                  title={color.label}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-tag-description">Description (Optional)</Label>
                            <Input
                              id="edit-tag-description"
                              value={tagDescription}
                              onChange={(e) => setTagDescription(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            onClick={handleUpdateTag} 
                            disabled={isEditing || !tagName}
                            type="submit"
                          >
                            {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600" 
                      onSelect={() => handleDeleteTag(tag.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {tag.description || 'No description provided'}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagsPage;
