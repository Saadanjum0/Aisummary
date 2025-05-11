import { useState, useEffect } from "react"; // Added useEffect
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileText, File, X, Check, Image, Loader2 } from "lucide-react"; // Added Loader2
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { createNote } from "@/services/notesService"; // Assuming this returns a Promise
import { processNoteWithAI, registerTagsUpdateCallback } from "@/services/aiService"; // Added registerTagsUpdateCallback
import mammoth from 'mammoth';
import { performOCRWithGemini } from '@/services/gemini'; // Assuming this returns a Promise
import { GlobalWorkerOptions, getDocument, PDFDocumentProxy, PDFPageProxy, TextContent } from 'pdfjs-dist'; // Typed pdfjs-dist items
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient

// Import useAuth to check authentication state
import { useAuth } from "@/context/AuthContext";

// Set workerSrc for pdfjs-dist. This should ideally be done once, e.g., in App.tsx or a config file.
// For pdfjs-dist v3.x and above, the worker is often bundled or needs a different path.
// For v2.16.105 as you used:
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
// If using a newer pdfjs-dist (e.g., installed via npm), it might be:
// import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
// GlobalWorkerOptions.workerSrc = pdfjsWorker;


const ImportPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Changed from 'uploading' for clarity
  const [fileProgress, setFileProgress] = useState<Record<string, { status: 'pending' | 'processing' | 'completed' | 'error', message?: string }>>({});
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const queryClient = useQueryClient(); // Add QueryClient

  // Register the tags update callback
  useEffect(() => {
    registerTagsUpdateCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    });
  }, [queryClient]);

  // Redirect if user is not authenticated (e.g., session expired during a long stay on this page)
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Your session has expired. Please log in again.");
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFilesArray = Array.from(e.target.files);
      const newFilesWithStatus = newFilesArray.reduce((acc, file) => {
        acc[file.name] = { status: 'pending' };
        return acc;
      }, {} as Record<string, { status: 'pending' }>);
      
      setFiles(prevFiles => [...prevFiles, ...newFilesArray]);
      setFileProgress(prevProgress => ({...prevProgress, ...newFilesWithStatus}));
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) setDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files) {
      const newFilesArray = Array.from(e.dataTransfer.files);
      const newFilesWithStatus = newFilesArray.reduce((acc, file) => {
        acc[file.name] = { status: 'pending' };
        return acc;
      }, {} as Record<string, { status: 'pending' }>);

      setFiles(prevFiles => [...prevFiles, ...newFilesArray]);
      setFileProgress(prevProgress => ({...prevProgress, ...newFilesWithStatus}));
    }
  };

  const removeFile = (fileNameToRemove: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.name !== fileNameToRemove));
    setFileProgress(prevProgress => {
      const updatedProgress = {...prevProgress};
      delete updatedProgress[fileNameToRemove];
      return updatedProgress;
    });
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return <FileText className="h-6 w-6 text-red-500" />;
    if (["doc", "docx"].includes(extension || "")) return <FileText className="h-6 w-6 text-blue-500" />;
    if (["txt", "md"].includes(extension || "")) return <File className="h-6 w-6 text-gray-500" />;
    if (["png", "jpg", "jpeg", "bmp", "gif"].includes(extension || "")) return <Image className="h-6 w-6 text-green-500" />;
    return <File className="h-6 w-6 text-purple-500" />;
  };

  const processSingleFile = async (file: File): Promise<void> => {
    let content = '';
    const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name; // Use filename without extension as title

    setFileProgress(prev => ({ ...prev, [file.name]: { status: 'processing' } }));

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (["txt", "md"].includes(extension || "")) {
        content = await file.text();
      } else if (extension === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf: PDFDocumentProxy = await getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page: PDFPageProxy = await pdf.getPage(pageNum);
          const contentObj: TextContent = await page.getTextContent();
          // Ensure 'item.str' is accessed correctly, it was 'item: any' before
          text += contentObj.items.map((item: any) => item.str).join(" ") + "\n";
        }
        content = text.trim();
      } else if (extension === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const { value: text } = await mammoth.extractRawText({ arrayBuffer });
        content = text;
      } else if (["png", "jpg", "jpeg", "bmp", "gif"].includes(extension || "")) {
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64WithPrefix = e.target?.result as string;
              if (!base64WithPrefix) {
                reject(new Error("File reader did not produce a result."));
                return;
              }
              const base64 = base64WithPrefix.split(',')[1];
              if (!base64) {
                reject(new Error("Could not extract base64 data from file."));
                return;
              }
              const ocrText = await performOCRWithGemini(base64, file.type);
              resolve(ocrText || '');
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (error) => reject(new Error(`File reader error: ${error}`));
          reader.readAsDataURL(file);
        });
      } else {
        // For unsupported files, we could skip or save them differently.
        // For now, let's create a note saying it's an unsupported import.
        // content = `Unsupported file type: ${file.name}`;
        toast.warn(`Unsupported file type: ${file.name}. Skipped.`);
        setFileProgress(prev => ({ ...prev, [file.name]: { status: 'error', message: 'Unsupported type' } }));
        return; // Skip creating a note for unsupported types
      }

      if (!content.trim()) {
        toast.warn(`No content extracted from ${file.name}. Skipped note creation.`);
        setFileProgress(prev => ({ ...prev, [file.name]: { status: 'completed', message: 'No content' } }));
        return;
      }

      // Ensure user is still authenticated before making Supabase calls
      if (!user) {
        throw new Error("User session expired. Please log in again.");
      }

      console.log(`[ImportPage] Creating note for: ${title}`);
      const noteData = await createNote({
        title,
        content,
        status: "active",
        is_favorite: false,
        is_archived: false,
        // Ensure your createNote service passes the auth token if needed,
        // or relies on supabase-js client to do so.
      });

      if (noteData && noteData.id) {
        console.log(`[ImportPage] Processing note with AI: ${noteData.id}`);
        await processNoteWithAI(noteData.id); // Make sure this also handles auth
        setFileProgress(prev => ({ ...prev, [file.name]: { status: 'completed' } }));
        toast.success(`Successfully imported and processed: ${file.name}`);
      } else {
        throw new Error("Failed to create note entry in the database.");
      }

    } catch (err: any) {
      console.error(`[ImportPage] Error processing file ${file.name}:`, err);
      toast.error(`Failed importing ${file.name}: ${err.message || 'Unknown error'}`);
      setFileProgress(prev => ({ ...prev, [file.name]: { status: 'error', message: err.message || 'Unknown error' } }));
      // Do not re-throw here if you want to continue with other files
    }
  };

  const handleImport = async () => {
    if (files.length === 0) {
      toast.error("Please select files to import");
      return;
    }
    if (!user && !authLoading) { // Double check auth before starting
        toast.error("You are not logged in. Please log in to import files.");
        navigate("/login", { replace: true });
        return;
    }

    setIsProcessing(true);
    let allSuccessful = true;

    // Process files one by one to avoid overwhelming the browser or hitting API rate limits quickly
    // For parallel processing, you'd use Promise.all with a concurrency limiter.
    for (const file of files) {
      // Re-check auth status before processing each file if operations are very long
      if (!user) {
        toast.error("Session expired during import. Some files may not have been processed.");
        allSuccessful = false;
        break; // Stop processing further files
      }
      await processSingleFile(file);
      if (fileProgress[file.name]?.status === 'error') {
        allSuccessful = false;
      }
    }
    
    setIsProcessing(false);

    // Invalidate tags and notes queries to ensure fresh data on dashboard
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['notes'] });

    if (allSuccessful && files.length > 0) {
      toast.success(`All ${files.length} selected files processed!`);
    } else if (files.length > 0) {
      toast.info("File processing finished. Check notifications for details on any errors.");
    }
    
    // Navigate to dashboard only if user is still authenticated
    if (user) {
      navigate("/app", { replace: true }); // Navigate to /app (dashboard)
    } else {
      navigate("/", { replace: true }); // Or to login if user got logged out
    }
    setFiles([]); // Clear files after processing
    setFileProgress({});
  };


  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="ml-2">Loading authentication...</p>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto py-8 px-2 sm:px-4 md:px-6 space-y-6 animate-fade-in">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center text-muted-foreground hover:text-foreground -ml-3 mr-4"
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-300">
          Import Notes
        </h1>
      </div>
      
      <Card className="glass shadow-lg dark:bg-gray-800">
        <CardHeader className="pb-4 border-b dark:border-gray-700">
          <CardTitle className="text-xl text-gray-800 dark:text-gray-100">Upload Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isProcessing ? "cursor-not-allowed opacity-70" : "",
              dragging
                ? "border-purple-400 bg-purple-50/50 dark:bg-purple-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50/30 dark:hover:border-purple-700 dark:hover:bg-purple-900/10"
            )}
            onDragEnter={isProcessing ? undefined : handleDragEnter}
            onDragLeave={isProcessing ? undefined : handleDragLeave}
            onDragOver={isProcessing ? undefined : handleDragOver}
            onDrop={isProcessing ? undefined : handleDrop}
            onClick={isProcessing ? undefined : () => document.getElementById("file-upload")?.click()}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.txt,.doc,.docx,.md,.png,.jpg,.jpeg,.bmp,.gif"
              disabled={isProcessing}
            />
            <Upload className="h-12 w-12 mx-auto text-purple-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Drag and drop files here</h3>
            <p className="text-muted-foreground mb-4">
              Or click to browse your computer
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, TXT, DOC, DOCX, MD, PNG, JPG, JPEG, BMP, GIF
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Selected Files ({files.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {files.map((file) => (
                  <div
                    key={file.name} // Use file.name as key if unique, or combine with index if names can repeat
                    className="glass p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      {fileProgress[file.name]?.status === 'processing' && (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      )}
                      {fileProgress[file.name]?.status === 'completed' && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {fileProgress[file.name]?.status === 'error' && (
                        <X className="h-4 w-4 text-red-500" title={fileProgress[file.name]?.message} />
                      )}
                      {!isProcessing && fileProgress[file.name]?.status !== 'processing' && (
                        <Button
                          variant="ghost"
                          size="icon" // Make it an icon button for compactness
                          onClick={() => removeFile(file.name)}
                          className="text-muted-foreground hover:text-destructive h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3 pt-2">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isProcessing}
          className="glass"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={files.length === 0 || isProcessing || authLoading}
          className="bg-purple-500 hover:bg-purple-600 min-w-[120px]" // Added min-width
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : "Import & Process"}
        </Button>
      </div>
    </div>
  );
};

export default ImportPage;