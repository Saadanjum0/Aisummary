import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Sparkles,
  AlertCircle,
  PlusCircle,
  FileText as FileTextIcon,
  Layers as LayersIcon,
  MoreVertical,
  ExternalLink,
  Download,
  ThumbsUp,
  MessageSquare,
  Tag as TagIcon,
  X as XIcon,
  Trash2 as TrashIcon
} from "lucide-react";
import SummaryViewer from '@/components/notes/SummaryViewer';
import { getNoteById, updateNote, deleteNote as apiDeleteNote, Note, AISuggestedTag, AISuggestedLink } from "@/services/notesService";
import { getTags, Tag, addTagToNote as apiAddTagToNote, createTag as apiCreateTag, removeTagFromNote as apiRemoveTagFromNote } from "@/services/tagsService";
import { processNoteWithAI } from "@/services/aiService";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { generateFlashcardsFromSummary, FlashcardData } from "@/services/gemini";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const getContrastingTextColor = (hexColor: string): string => {
  if (!hexColor || hexColor.length < 6) return '#000000';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const renderFormattedText = (text: string | string[], keyPrefix: string) => {
  const lines = Array.isArray(text) ? text : text.split('\n');
  const renderedElements: JSX.Element[] = [];
  let currentListItems: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];
  let lastH3Content: string | null = null;

  const flushListItems = (listKeySuffix: string) => {
    if (currentListItems.length > 0) {
      renderedElements.push(
        <ul key={`${keyPrefix}-ul-${listKeySuffix}`} className="list-disc space-y-1 pl-6 my-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  const flushCodeBlock = (blockKeySuffix: string) => {
    if (codeBlockContent.length > 0) {
      renderedElements.push(
        <pre key={`${keyPrefix}-codeblock-${blockKeySuffix}`} className="bg-gray-100 dark:bg-gray-800 p-3 my-2 rounded-md overflow-x-auto text-sm whitespace-pre-wrap font-mono">
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      );
      codeBlockContent = [];
      codeBlockLang = '';
    }
    inCodeBlock = false;
  };

  lines.forEach((line, index) => {
    const key = `${keyPrefix}-${index}`;
    const trimmedLine = line.trimEnd();

    if (trimmedLine.startsWith("```")) {
      flushListItems(`pre-code-toggle-${index}`);
      if (inCodeBlock) {
        flushCodeBlock(`block-end-${index}`);
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmedLine.substring(3).trim();
      }
      return;
    }
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    const trulyTrimmedLine = trimmedLine.trim();

    if (trulyTrimmedLine === "" && !line.includes('\n\n')) {
        flushListItems(`break-${index}`);
        return; 
    }

    if (trulyTrimmedLine.startsWith('### ')) {
      flushListItems(`pre-h3-${index}`);
      const h3Content = trulyTrimmedLine.substring(4);
      if (h3Content !== lastH3Content) {
        renderedElements.push(<h3 key={key} className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3 border-b pb-1 dark:border-gray-700">{h3Content}</h3>);
        lastH3Content = h3Content;
      } else {
        lastH3Content = h3Content;
      }
      return;
    }
    if (trulyTrimmedLine.startsWith('#### ')) {
      flushListItems(`pre-h4-${index}`);
      renderedElements.push(<h4 key={key} className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-1.5 ml-1">{trulyTrimmedLine.substring(5)}</h4>);
      lastH3Content = null;
      return;
    }
    const boldTermMatch = trulyTrimmedLine.match(/^\*\*(.*?)\*\*[: ]\s*(.*)$/);
    if (boldTermMatch) {
      flushListItems(`pre-bold-${index}`);
      renderedElements.push(
        <div key={key} className="mt-3 mb-1.5">
          <p className="text-sm leading-relaxed">
            <strong className="text-md font-semibold text-gray-700 dark:text-gray-300 block mb-0.5">{boldTermMatch[1]}:</strong> 
            {boldTermMatch[2] && <span className="text-gray-600 dark:text-gray-400 ml-1">{boldTermMatch[2]}</span>}
          </p>
        </div>
      );
      lastH3Content = null;
      return;
    }
    if (trulyTrimmedLine.toLowerCase().startsWith('example:')) {
        flushListItems(`pre-example-${index}`);
        renderedElements.push(
            <p key={key} className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-0.5 ml-2 italic">
                {trulyTrimmedLine}
            </p>
        );
        lastH3Content = null;
        return;
    }
    const bulletMatch = trulyTrimmedLine.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      currentListItems.push(<li key={key} className="text-sm leading-relaxed">{bulletMatch[1]}</li>);
      lastH3Content = null;
      return;
    }
    
    flushListItems(`pre-p-${index}`);
    if (trulyTrimmedLine) { 
      renderedElements.push(<p key={key} className="text-sm text-gray-600 dark:text-gray-400 my-1 leading-relaxed">{trulyTrimmedLine}</p>);
    }
    lastH3Content = null;
  });

  flushListItems('final'); 
  flushCodeBlock('final');
  return renderedElements;
};

const NoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("ai-summary");
  const [newTag, setNewTag] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editableSummary, setEditableSummary] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const flashcardContainerRef = useRef<HTMLDivElement>(null);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

  const { data: note, isLoading, isError, refetch: refetchNote } = useQuery<Note | undefined>({
    queryKey: ["note", id],
    queryFn: async () => {
      if (!id) return undefined;
      const fetchedNote = await getNoteById(id);
      if (fetchedNote) {
        fetchedNote.ai_suggested_tags = fetchedNote.ai_suggested_tags || [];
        fetchedNote.ai_suggested_links = fetchedNote.ai_suggested_links || [];
        fetchedNote.tags = fetchedNote.tags || []; 
        setEditableSummary(fetchedNote.ai_summary || "");
        setFlashcards(fetchedNote.ai_flashcards || []);
        setCurrentFlashcardIndex(0);
        setShowFlashcardAnswer(false);
      }
      return fetchedNote;
    },
    enabled: !!id,
  });

  const { data: allTags = [], isLoading: isLoadingAllTags, refetch: refetchAllTags } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const tags = await getTags();
      return tags;
    },
  });

  const handleAddTag = async (tagName: string) => {
    if (!note || !tagName.trim()) return;
    setIsAddingTag(true);
    let tagToAdd = allTags.find(t => t.name.toLowerCase() === tagName.trim().toLowerCase());
    if (!tagToAdd) {
      const createdTag = await apiCreateTag({ name: tagName.trim(), color: getRandomColor() });
      if (createdTag) {
        tagToAdd = createdTag;
        await refetchAllTags();
      } else {
        toast.error(`Failed to create tag: ${tagName}`);
        setIsAddingTag(false);
        return;
      }
    }
    const noteHasTag = documentTags.some(nt => nt.id === tagToAdd!.id);
    if (noteHasTag) {
        toast.info(`Tag "${tagName}" is already added.`);
        setIsAddingTag(false);
        setNewTag("");
        return;
    }

    const success = await apiAddTagToNote(note.id, tagToAdd.id);
    if (success) {
      toast.success(`Tag "${tagName}" added`);
      await refetchNote();
      setNewTag("");
    } else {
      toast.error(`Failed to add tag: ${tagName}`);
    }
    setIsAddingTag(false);
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!note) return;
    const success = await apiRemoveTagFromNote(note.id, tagId);
    if (success) {
        toast.success("Tag removed");
        refetchNote();
    } else {
        toast.error("Failed to remove tag");
    }
  }

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleProcessWithAI = async () => {
    if (!id) return;
    setIsProcessing(true);
    setAiError(null);
    try {
      const processedNote = await processNoteWithAI(id);
      if (processedNote) {
        refetchNote();
        toast.success("AI processing complete!");
      } else {
        setAiError("Failed to process document. The content may be too short or the AI service is unavailable.");
        toast.error("AI processing failed.");
      }
    } catch (error) {
      console.error("Error processing document with AI:", error);
      setAiError("An unexpected error occurred while processing with AI.");
      toast.error("An unexpected error occurred during AI processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!note) return;

    const confirmed = window.confirm("Are you sure you want to delete this note? This action cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    const success = await apiDeleteNote(note.id);
    if (success) {
      toast.success("Note deleted successfully.");
      navigate("/app");
    } else {
      toast.error("Failed to delete note.");
    }
    setIsDeleting(false);
  };

  const handleEditSummary = () => {
    setEditableSummary(note?.ai_summary || "");
    setIsEditingSummary(true);
  };

  const handleCancelEditSummary = () => {
    setEditableSummary(note?.ai_summary || "");
    setIsEditingSummary(false);
  };

  const handleSaveSummary = async () => {
    if (!note) return;
    setIsSavingSummary(true);
    const success = await updateNote(note.id, { ai_summary: editableSummary });
    if (success) {
      toast.success("AI summary updated.");
      await refetchNote();
      setIsEditingSummary(false);
    } else {
      toast.error("Failed to update AI summary.");
    }
    setIsSavingSummary(false);
  };

  const handleGenerateFlashcards = async () => {
    if (!note || !note.ai_summary) {
        toast.error("Cannot generate flashcards without an AI summary.");
        return;
    }
    setIsGeneratingFlashcards(true);
    try {
        const generatedFlashcardsArray = await generateFlashcardsFromSummary(note.ai_summary);
        if (generatedFlashcardsArray && generatedFlashcardsArray.length > 0) {
            setFlashcards(generatedFlashcardsArray);
            setActiveTab("flashcards");
            setCurrentFlashcardIndex(0);
            setShowFlashcardAnswer(false);
            toast.success("Flashcards generated successfully!");
        } else if (generatedFlashcardsArray && generatedFlashcardsArray.length === 0) {
            toast.info("No distinct flashcard points could be extracted from the summary.");
        } else {
            toast.error("Failed to generate flashcards.");
        }
    } catch (error) {
        toast.error("An error occurred while generating flashcards.");
        console.error("Flashcard generation error:", error);
    }
    setIsGeneratingFlashcards(false);
  };

  const handleDownloadFlashcardsPDF = async () => {
    if (!flashcardContainerRef.current || flashcards.length === 0) {
        toast.error("No flashcards to download.");
        return;
    }
    toast.info("Preparing PDF...");
    const pdf = new jsPDF('p', 'mm', 'a4');
    const cardWidth = 85;
    const cardHeight = 55;
    const margin = 10;
    const cardsPerPage = 8;
    let x = margin;
    let y = margin;
    let cardsOnPage = 0;

    for (let i = 0; i < flashcards.length; i++) {
        if (cardsOnPage > 0 && cardsOnPage % cardsPerPage === 0) {
            pdf.addPage();
            x = margin;
            y = margin;
            cardsOnPage = 0;
        }
        
        const cardDiv = document.createElement('div');
        cardDiv.style.width = `${cardWidth}mm`;
        cardDiv.style.height = `${cardHeight}mm`;
        cardDiv.style.border = '0.5px solid #ccc';
        cardDiv.style.padding = '5mm';
        cardDiv.style.margin = '2mm';
        cardDiv.style.backgroundColor = 'white';
        cardDiv.style.fontSize = '8pt';
        cardDiv.style.fontFamily = 'helvetica, sans-serif';
        cardDiv.style.boxSizing = 'border-box';
        cardDiv.style.overflowWrap = 'break-word';
        cardDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 3mm; border-bottom: 0.3px solid #eee; padding-bottom: 2mm;">FRONT: ${flashcards[i].front.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            <div>BACK: ${flashcards[i].back.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        `;
        document.body.appendChild(cardDiv);

        const canvas = await html2canvas(cardDiv, { scale: 2 });
        document.body.removeChild(cardDiv);
        const imgData = canvas.toDataURL('image/png');

        pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
        
        x += cardWidth + 5;
        if ((cardsOnPage + 1) % 2 === 0) {
            x = margin;
            y += cardHeight + 5;
        }
        cardsOnPage++;
    }
    pdf.save(`${note?.title || 'flashcards'}_flashcards.pdf`);
    toast.success("Flashcards PDF downloaded!");
  };

  const handleExportFlashcardsForAnki = () => {
    if (!note || flashcards.length === 0) {
        toast.error("No flashcards to export for Anki.");
        return;
    }

    const ankiNoteTags = documentTags.map(tag => tag.name.replace(/\s+/g, '_'));

    const ankiExportData = {
        notes: flashcards.map(fc => ({
            deckName: note.title ? `SmartSummarizer::${note.title}` : "SmartSummarizer Deck",
            modelName: "Basic",
            fields: {
                Front: fc.front,
                Back: fc.back
            },
            tags: ankiNoteTags
        }))
    };

    const jsonString = JSON.stringify(ankiExportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeTitle = note.title ? note.title.replace(/[^a-z0-9_]/gi, '_').toLowerCase() : 'flashcards';
    link.download = `${safeTitle}_anki_import.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success("Anki JSON export file prepared for download.");
  };

  const documentTags: Tag[] = useMemo(() => {
    if (!note || !note.tags || !Array.isArray(note.tags)) {
        return [];
    }
    const derived = (note.tags as Array<string | Tag>).map(tagOrIdOrObj => {
        if (typeof tagOrIdOrObj === 'string') {
            const foundTag = allTags.find(t => t.id === tagOrIdOrObj || t.name.toLowerCase() === tagOrIdOrObj.toLowerCase());
            return foundTag || { id: tagOrIdOrObj, name: tagOrIdOrObj, color: '#cccccc' }; 
        }
        return tagOrIdOrObj as Tag; 
    }).filter(Boolean) as Tag[];
    return derived;
  }, [note, allTags]);

  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
        toast.error("Please enter your suggestion.");
        return;
    }
    setIsSubmittingSuggestion(true);
    console.log("Suggestion Submitted:", { noteId: note?.id, suggestion: suggestionText });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Thank you for your feedback!");
    setIsSubmittingSuggestion(false);
    setSuggestionText("");
    setIsSuggestionModalOpen(false);
  };

  const handleEdit = () => {
    navigate(`/notes/edit/${id}`);
  };

  if (isLoading || isLoadingAllTags || !note) {
    return (
      <div className="flex flex-col h-screen">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 p-6 space-y-6"><Skeleton className="h-96 w-full" /></main>
            <aside className="w-1/3 max-w-sm border-l bg-white p-6 space-y-6"><Skeleton className="h-96 w-full" /></aside>
        </div>
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            Error loading document. It might have been deleted or an issue occurred.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/app")} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const aiSuggestedTags: string[] = (note as any).ai_suggested_tags || ["Extreme Programming", "Sprint Planning", "User Stories", "Continuous Integration", "Test-Driven Development"];
  
  const relatedDocuments: { title: string; similarity: string }[] = (note as any).related_documents || [
    { title: "Scrum Framework Overview.pdf", similarity: "85% similar" },
    { title: "Extreme Programming Practices.pdf", similarity: "72% similar" },
    { title: "Kanban for Software Teams.pdf", similarity: "68% similar" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "ai-summary":
  return (
    <div className="space-y-6">
            {!note.ai_processed && !isProcessing && (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-purple-500 mb-3" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">AI Summary Not Generated</h3>
                  <p className="text-gray-500 mb-4 text-sm">
                    This document hasn't been processed by AI yet. Process it to get an overview, key concepts, and generate flashcards.
                  </p>
                  <Button onClick={handleProcessWithAI} disabled={isProcessing} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      <><Sparkles className="mr-2 h-5 w-5" /> Generate AI Summary</>
                    )}
                  </Button>
                  {aiError && (
                    <Alert variant="destructive" className="mt-4 text-left text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{aiError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
            {isProcessing && (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-12 w-12 mx-auto text-purple-500 animate-spin mb-3" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">Generating AI Summary...</h3>
                  <p className="text-gray-500 text-sm">Please wait while we analyze your document.</p>
                </CardContent>
              </Card>
            )}
            {note.ai_processed && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-xl font-semibold text-gray-800">AI Summary</CardTitle>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-end w-full">
                      {!isEditingSummary && (
                        <Button variant="outline" size="sm" onClick={handleEditSummary} className="text-xs">
                          <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Summary
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-end w-full">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleGenerateFlashcards} 
                        disabled={isGeneratingFlashcards || !note?.ai_summary}
                        className="text-xs bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                      >
                        {isGeneratingFlashcards ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <LayersIcon className="mr-1.5 h-3.5 w-3.5" />} 
                        {flashcards.length > 0 ? "Re-generate Flashcards" : "Generate Flashcards"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isEditingSummary ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editableSummary}
                        onChange={(e) => setEditableSummary(e.target.value)}
                        placeholder="Enter AI summary..."
                        className="min-h-[200px] text-sm"
                        rows={10}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={handleCancelEditSummary} disabled={isSavingSummary}>Cancel</Button>
                        <Button onClick={handleSaveSummary} disabled={isSavingSummary}>
                          {isSavingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Summary
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <SummaryViewer 
                      summary={note.ai_summary || 'No AI summary overview available.'}
                      keyPoints={note.ai_key_points as string[] || []}
                    />
                  )}
                </CardContent>
                {!isEditingSummary && note.ai_processed && (
                    <CardFooter className="flex flex-col sm:flex-row sm:justify-between border-t pt-5 mt-6 px-4 sm:px-6 gap-4 bg-gray-50 dark:bg-gray-800 overflow-x-hidden no-scrollbar w-full">
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <p className="text-gray-600 dark:text-gray-300 mr-2 whitespace-nowrap">Summary is Helpful?</p>
                        <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 flex items-center gap-1 rounded-xl px-3 py-1">
                          <ThumbsUp className="mr-1.5 h-4 w-4" /> Helpful
                        </Button>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 flex items-center gap-1 rounded-xl px-3 py-1" onClick={() => setIsSuggestionModalOpen(true)}>
                            <MessageSquare className="mr-1.5 h-4 w-4" /> Suggest Improvements
                            </Button>
                        </DialogTrigger>
                        </div>
                    </CardFooter>
                )}
              </Card>
            )}
          </div>
        );
      case "original-document":
        return (
          <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">Original Document</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                {note.content ? (
                  note.content.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))
                ) : (
                    <p className="text-gray-500">This document has no content.</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case "flashcards":
        return (
            <Card className="shadow-sm">
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-semibold text-gray-800">Flashcards ({flashcards.length})</CardTitle>
                        <div className="flex items-center space-x-2">
                            {flashcards.length > 0 && (
                                <>
                                    <Button onClick={handleExportFlashcardsForAnki} variant="outline" size="sm" className="text-xs">
                                        <FileTextIcon className="mr-1.5 h-3.5 w-3.5" /> Export for Anki
                                    </Button>
                                    <Button onClick={handleDownloadFlashcardsPDF} variant="outline" size="sm" className="text-xs">
                                        <Download className="mr-1.5 h-3.5 w-3.5" /> Export as PDF
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6" ref={flashcardContainerRef}>
                    {isGeneratingFlashcards && <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-purple-500"/><p className="ml-2">Generating flashcards...</p></div>}
                    {!isGeneratingFlashcards && flashcards.length === 0 && (
                        <div className="text-center py-12">
                            <LayersIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                No flashcards generated yet. Click "Generate Flashcards" in the AI Summary tab to create flashcards from the summary.
                            </p>
                        </div>
                    )}
                    {!isGeneratingFlashcards && flashcards.length > 0 && (
                <div className="space-y-4">
                            <div 
                                className="p-6 border rounded-lg shadow-md cursor-pointer bg-white dark:bg-gray-700 min-h-[150px] flex flex-col justify-center items-center text-center relative select-none"
                                onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                            >
                                <p className="text-xs text-gray-400 dark:text-gray-500 absolute top-2 right-2">Card {currentFlashcardIndex + 1} of {flashcards.length}</p>
                                <div className="text-lg font-medium text-gray-800 dark:text-gray-100">
                                    {flashcards[currentFlashcardIndex]?.front}
                                </div>
                                {showFlashcardAnswer && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 w-full">
                                        <p className="text-md text-purple-600 dark:text-purple-400">
                                            {flashcards[currentFlashcardIndex]?.back}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => {setCurrentFlashcardIndex(prev => Math.max(0, prev - 1)); setShowFlashcardAnswer(false);}}
                                    disabled={currentFlashcardIndex === 0}
                                >
                                    Previous
                                </Button>
                  <Button 
                                    variant="outline" 
                                    onClick={() => {setCurrentFlashcardIndex(prev => Math.min(flashcards.length - 1, prev + 1)); setShowFlashcardAnswer(false);}}
                                    disabled={currentFlashcardIndex === flashcards.length - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isSuggestionModalOpen} onOpenChange={setIsSuggestionModalOpen}>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-30 gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Back to Dashboard</span>
                    </Button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate max-w-xs sm:max-w-md">{note.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs sm:max-w-md">
                            Last updated: {new Date(note.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, {new Date(note.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}
                        </p>
                    </div>
                </div>
          <div className="flex items-center gap-2 flex-wrap mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" className="text-sm" onClick={handleDeleteNote} disabled={isDeleting}> 
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrashIcon className="mr-2 h-4 w-4 text-red-500" />} 
                        Delete
                    </Button>
                </div>
            </header>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 overflow-x-auto no-scrollbar">
                        {[
                            { id: "ai-summary", label: "AI Summary", icon: <Sparkles className="mr-1.5 h-4 w-4" /> },
                            { id: "original-document", label: "Original Document", icon: <FileTextIcon className="mr-1.5 h-4 w-4" /> },
                            { id: "flashcards", label: "Flashcards", icon: <LayersIcon className="mr-1.5 h-4 w-4" /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium focus:outline-none whitespace-nowrap rounded-t-md transition-colors duration-200
                                    ${activeTab === tab.id 
                      ? "bg-white dark:bg-gray-800 border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 shadow-sm" 
                      : "text-gray-500 dark:text-gray-300 hover:text-purple-600 hover:bg-white/50 dark:hover:bg-gray-800/50"}
                                `}
                            >
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-1">
                        {renderTabContent()}
                    </div>
                </main>

          {/* Sidebar - Responsive: below main on mobile, right on desktop */}
          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-white dark:bg-gray-900 p-4 sm:p-6 space-y-6 overflow-y-auto no-scrollbar flex-shrink-0">
                    <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document Tags ({documentTags.length})</h3>
                        {documentTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {documentTags.map(tag => {
                                    const bgColor = tag.color || '#E0E7FF'; 
                                    const textColor = getContrastingTextColor(bgColor);
                                    return (
                                        <Badge 
                                            key={tag.id} 
                                            variant="secondary"
                                            className="text-xs font-medium rounded-md px-2 py-0.5 border group relative"
                                            style={{ backgroundColor: bgColor, color: textColor, borderColor: bgColor === '#E0E7FF' ? '#C7D2FE' : bgColor }}
                                        >
                                            {tag.name}
                                            <button onClick={() => handleRemoveTag(tag.id)} className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <XIcon className="h-2.5 w-2.5" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No tags added yet. AI will attempt to add tags during processing.</p>
                        )}
                        {documentTags.length === 0 && (
                            <div className="flex items-center gap-2 pt-2">
                                <Input 
                                    placeholder="Add or create tag..." 
                                    className="h-8 text-xs flex-grow"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && newTag.trim()) {
                                            handleAddTag(newTag.trim());
                                        }
                                    }} 
                                />
                                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => newTag.trim() && handleAddTag(newTag.trim())} disabled={isAddingTag}>
                                    {isAddingTag ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                  </Button>
                </div>
              )}
                    </div>

                    {note.ai_suggested_links && note.ai_suggested_links.length > 0 && (
                        <div className="space-y-3 pt-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">AI Suggested Links</h3>
                            <ul className="space-y-2.5">
                                {note.ai_suggested_links.map((link, index) => (
                    <li key={`link-${index}-${link.note_id}`} className="p-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-start">
                        <Link to={`/notes/${link.note_id}`} className="text-xs font-medium text-purple-600 hover:underline hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                                                {link.note_title}
                                            </Link>
                                        </div>
                      <p className="text-xxs text-gray-500 dark:text-gray-400 mt-0.5">Reason: {link.reason}</p>
                                    </li>
                  ))}
                </ul>
                        </div>
          )}
                </aside>
        </div>

        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Suggest Improvements for AI Summary</DialogTitle>
                <DialogDescription>
                    Your feedback helps us improve the AI. Please describe what could be better or any inaccuracies you found.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="suggestion-text" className="text-right col-span-1">
                        Suggestion
                    </Label>
                    <Textarea
                        id="suggestion-text"
                        value={suggestionText}
                        onChange={(e) => setSuggestionText(e.target.value)}
                        placeholder="Type your feedback here..."
                        className="col-span-3 min-h-[100px]"
                    />
      </div>
    </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSuggestionModalOpen(false)} disabled={isSubmittingSuggestion}>Cancel</Button>
                <Button type="submit" onClick={handleSubmitSuggestion} disabled={isSubmittingSuggestion}>
                    {isSubmittingSuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Feedback
                </Button>
            </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default NoteDetailPage;
