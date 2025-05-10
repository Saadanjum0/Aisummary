
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Loader2, FileText, X } from 'lucide-react';
import { performOCR } from '@/services/aiService';
import { toast } from 'sonner';

interface OCRUploaderProps {
  onTextExtracted: (text: string) => void;
}

const OCRUploader = ({ onTextExtracted }: OCRUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 5MB.");
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Only image files are supported.");
      return;
    }
    
    // Generate preview
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };
  
  const handleExtractText = async () => {
    if (!previewUrl) return;
    
    setIsProcessing(true);
    try {
      const text = await performOCR(previewUrl);
      if (text) {
        setExtractedText(text);
      }
    } catch (error) {
      console.error("Error performing OCR:", error);
      toast.error("Failed to extract text from image");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUseText = () => {
    if (!extractedText) return;
    onTextExtracted(extractedText);
    handleReset();
  };
  
  const handleReset = () => {
    setPreviewUrl(null);
    setExtractedText(null);
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            Extract Text from Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-8">
              <Image className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Upload an image to extract text</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="ocr-file-input"
              />
              <Button asChild>
                <label htmlFor="ocr-file-input">Select Image</label>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full max-h-64 object-contain rounded-md" 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute top-2 right-2 bg-background/80" 
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {!extractedText ? (
                <Button 
                  onClick={handleExtractText} 
                  disabled={isProcessing} 
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting Text...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Extract Text
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <Textarea 
                    value={extractedText} 
                    onChange={(e) => setExtractedText(e.target.value)}
                    rows={8}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleUseText} className="flex-1">
                      Use This Text
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OCRUploader;
