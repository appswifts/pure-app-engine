import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  itemName?: string;
}

export function AIImageGenerator({ onImageGenerated, itemName }: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState(itemName ? `delicious ${itemName}, food photography, professional lighting, high quality` : "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // IMPORTANT: Always use supabase.functions.invoke() for Edge Functions
      // Never use manual fetch() - it causes 401 errors
      // See EDGE_FUNCTIONS_GUIDE.md for details
      const { data, error } = await supabase.functions.invoke('generate-food-image', {
        body: { prompt },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate image");
      }

      if (!data?.imageUrl) {
        throw new Error("No image URL in response");
      }
      
      setGeneratedImage(data.imageUrl);
      onImageGenerated(data.imageUrl);
      
      toast({
        title: "Image generated!",
        description: "Your AI-generated image is ready",
      });

    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const useGeneratedImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      toast({
        title: "Image applied!",
        description: "The generated image has been added to your item",
      });
    }
  };

  const regenerate = () => {
    setGeneratedImage(null);
    generateImage();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold">AI Image Generator</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-prompt">Image Description</Label>
        <Input
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., delicious grilled chicken with vegetables, food photography"
          disabled={isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          Describe what you want to see. More details = better results!
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={generateImage}
          disabled={isGenerating || !prompt.trim()}
          className="flex-1"
          type="button"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>
        
        {generatedImage && (
          <Button
            onClick={regenerate}
            variant="outline"
            disabled={isGenerating}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Live Generation Preview */}
      {isGenerating && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 animate-pulse">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-sm font-medium">Creating your image...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take 10-30 seconds</p>
          </div>
        </div>
      )}

      {/* Generated Image Preview */}
      {generatedImage && !isGenerating && (
        <div className="space-y-2">
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            onClick={useGeneratedImage}
            variant="default"
            className="w-full"
            type="button"
          >
            Use This Image
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>💡 Tips for better results:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Include "food photography" in your prompt</li>
          <li>Mention lighting: "professional lighting" or "natural light"</li>
          <li>Add style keywords: "high quality", "appetizing", "detailed"</li>
        </ul>
      </div>
    </div>
  );
}
