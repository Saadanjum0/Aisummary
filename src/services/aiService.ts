import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Note } from './notesService';
import { processNoteSummaryWithGemini, generateTagsAndLinks } from './gemini';
import { getNoteById, getAllNoteTitlesAndIds } from './notesService';
import { Tag, getTags, createTag, addTagToNote } from './tagsService';

// Helper function for random color - consider moving to a shared util or tagService
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export async function processNoteWithAI(noteId: string) {
  try {
    toast.info("Processing note with AI for summary...");
    let note = await getNoteById(noteId); 
    if (!note || !note.content) {
      toast.error("Note not found or content is empty for summarization.");
      return null;
    }
    
    // 1. Generate Summary
    const summaryResult = await processNoteSummaryWithGemini(noteId, note.content);
    let currentAiSummary = ""; // To pass to tag generator
    
    if (summaryResult && summaryResult.summary && summaryResult.keyPoints) {
        toast.success("Summary content generated successfully!");
        currentAiSummary = summaryResult.summary; // Store for use in tag generation
        const {error: summaryUpdateError} = await supabase
            .from('notes')
            .update({
                ai_summary: summaryResult.summary,
                ai_key_points: summaryResult.keyPoints,
                ai_processed: true 
            })
            .eq('id', noteId);
        if (summaryUpdateError) {
            console.error("Error updating note with summary:", summaryUpdateError);
            toast.error("Failed to save AI summary to note.");
        } else {
            if (note) {
                note.ai_summary = summaryResult.summary;
                note.ai_key_points = summaryResult.keyPoints;
                note.ai_processed = true;
            }
        }
    } else {
        toast.warn("Could not generate summary details from AI.");
        currentAiSummary = note.ai_summary || ""; // Use existing summary if generation failed but content exists
    }

    // 2. Generate Tags, Keywords & Links (and auto-add tags)
    toast.info("Attempting to generate tags, keywords, and links...");
    const allNotes = await getAllNoteTitlesAndIds();
    const otherNotes = allNotes.filter(n => n.id !== noteId); 
    
    let currentNoteTagNames: string[] = [];
    if (note && note.tags && Array.isArray(note.tags)) {
        currentNoteTagNames = note.tags.map((tag: string | Tag) => typeof tag === 'string' ? tag.toLowerCase() : tag.name.toLowerCase());
    }

    const suggestionsResult = await generateTagsAndLinks(
      note.content, 
      currentAiSummary, // Pass the generated or existing AI summary
      currentNoteTagNames, 
      otherNotes
    );

    let dbUpdatePayload: Partial<Note> = {};

    if (suggestionsResult) {
        // console.log("AI Suggestions Received:", suggestionsResult); // Remove for production
        toast.success("AI suggestions for tags, keywords, and links generated!");

        dbUpdatePayload.ai_suggested_tags = suggestionsResult.suggested_tags || [];
        dbUpdatePayload.ai_suggested_links = suggestionsResult.suggested_links || [];
        dbUpdatePayload.ai_summary_keywords = suggestionsResult.summary_keywords || [];

        if (suggestionsResult.suggested_tags && suggestionsResult.suggested_tags.length > 0) {
            const allGlobalTags = await getTags(); 
            let newTagsAddedToNoteCount = 0;
            for (const suggestedTag of suggestionsResult.suggested_tags) { // Iterate over correct field
                const normalizedSuggestedTagName = suggestedTag.name.trim().toLowerCase();
                if (!normalizedSuggestedTagName) continue;
                let existingGlobalTag = allGlobalTags.find(t => t.name.toLowerCase() === normalizedSuggestedTagName);
                let tagIdToAdd: string;
                if (!existingGlobalTag) {
                    const newGlobalTag = await createTag({ name: suggestedTag.name.trim(), color: getRandomColor(), description: suggestedTag.category || 'AI Suggested' });
                    if (newGlobalTag) {
                        tagIdToAdd = newGlobalTag.id;
                        allGlobalTags.push(newGlobalTag); 
                    } else {
                        toast.warn(`Could not create new global tag: ${suggestedTag.name}`);
                        continue;
                    }
                } else {
                    tagIdToAdd = existingGlobalTag.id;
                }
                const currentNoteTags = note ? (note.tags || []) as (string[] | Tag[]) : [];
                const noteAlreadyHasTag = currentNoteTags.some(tag => 
                    (typeof tag === 'string' && tag.toLowerCase() === normalizedSuggestedTagName) || 
                    (typeof tag === 'object' && (tag as Tag).id === tagIdToAdd) ||
                    (typeof tag === 'object' && (tag as Tag).name.toLowerCase() === normalizedSuggestedTagName)
                );
                if (!noteAlreadyHasTag) {
                    const added = await addTagToNote(noteId, tagIdToAdd);
                    if (added) newTagsAddedToNoteCount++;
                    else toast.warn(`Could not add tag '${suggestedTag.name}' to note.`);
                }
            }
            if (newTagsAddedToNoteCount > 0) {
                toast.success(`${newTagsAddedToNoteCount} new unique tag(s) auto-added.`);
                note = await getNoteById(noteId); 
            }
        }
    } else {
      toast.warn("Could not generate AI suggestions for tags, keywords, and links.");
    }
    
    if (Object.keys(dbUpdatePayload).length > 0) {
        const { error: updateSuggestionsError } = await supabase
            .from('notes')
            .update(dbUpdatePayload)
            .eq('id', noteId);
        if (updateSuggestionsError) {
            console.error("Error saving AI suggestions (tags, links, keywords) to DB:", updateSuggestionsError);
            toast.error("Failed to save some AI suggestions."); // Keep this user-facing error
        }
        // else { toast.info("Raw AI suggestions reference saved."); } // Optional: too noisy for prod
    }
    
    if (note) return note; 
    return null;

  } catch (error: any) {
    console.error("Error in processNoteWithAI:", error);
    toast.error(error.message || "Failed to process note with AI services.");
    return null;
  }
}

// Function for OCR using Gemini vision capabilities
export async function performOCR(imageBase64: string) {
  try {
    toast.info("Analyzing image...");
    
    const { data, error } = await supabase.functions.invoke('ocr-image', {
      body: { image: imageBase64 }
    });

    if (error) {
      console.error("Error analyzing image:", error);
      toast.error("Failed to extract text from image", {
        action: {
          label: "Try Again",
          onClick: () => performOCR(imageBase64)
        }
      });
      return null;
    }
    
    if (data.error) {
      console.error("Error from edge function:", data.error);
      toast.error("Failed to extract text from image", {
        action: {
          label: "Try Again",
          onClick: () => performOCR(imageBase64)
        }
      });
      return null;
    }
    
    toast.success("Text extracted successfully from image");
    return data.text;
  } catch (error) {
    console.error("Error analyzing image:", error);
    toast.error("Failed to extract text from image", {
      action: {
        label: "Try Again",
        onClick: () => performOCR(imageBase64)
      }
    });
    return null;
  }
}
