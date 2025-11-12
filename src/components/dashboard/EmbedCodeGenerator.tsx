import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, 
  Copy, 
  Eye, 
  Globe, 
  Smartphone, 
  Monitor,
  ExternalLink,
  Settings,
  Palette
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
}

interface EmbedCodeGeneratorProps {
  restaurant: Restaurant;
}

export default function EmbedCodeGenerator({ restaurant }: EmbedCodeGeneratorProps) {
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("600px");
  const [embedStyle, setEmbedStyle] = useState("responsive");
  const [previewMode, setPreviewMode] = useState("desktop");
  const { toast } = useToast();

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${restaurant.slug}`;

  const generateEmbedCode = (format: string) => {
    const width = embedStyle === "responsive" ? "100%" : embedWidth;
    const height = embedStyle === "responsive" ? "600px" : embedHeight;

    switch (format) {
      case "html":
        return `<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  scrolling="auto"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
</iframe>`;

      case "responsive":
        return `<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%; overflow: hidden;">
  <iframe 
    src="${embedUrl}" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;"
    frameborder="0" 
    scrolling="auto">
  </iframe>
</div>`;

      case "wordpress":
        return `[iframe src="${embedUrl}" width="${width}" height="${height}"]`;

      case "react":
        return `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameBorder="0"
  scrolling="auto"
  style={{
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }}
/>`;

      default:
        return generateEmbedCode("html");
    }
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${format} embed code copied to clipboard`,
      });
    });
  };

  const openPreview = () => {
    window.open(embedUrl, '_blank', 'width=800,height=600');
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case "mobile":
        return { width: "375px", height: "600px" };
      case "tablet":
        return { width: "768px", height: "600px" };
      default:
        return { width: "100%", height: "600px" };
    }
  };

  const previewDimensions = getPreviewDimensions();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="embed-code" className="border rounded-lg">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Embed Code Generator</div>
              <p className="text-sm text-muted-foreground font-normal">
                Generate embed codes to display your menu on any website
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-6 pb-6 space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="embed-style">Embed Style</Label>
              <Select value={embedStyle} onValueChange={setEmbedStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsive">Responsive (Recommended)</SelectItem>
                  <SelectItem value="fixed">Fixed Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {embedStyle === "fixed" && (
              <>
                <div>
                  <Label htmlFor="embed-width">Width</Label>
                  <Input
                    id="embed-width"
                    value={embedWidth}
                    onChange={(e) => setEmbedWidth(e.target.value)}
                    placeholder="800px or 100%"
                  />
                </div>
                <div>
                  <Label htmlFor="embed-height">Height</Label>
                  <Input
                    id="embed-height"
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(e.target.value)}
                    placeholder="600px"
                  />
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Embed Codes */}
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="responsive">Responsive</TabsTrigger>
              <TabsTrigger value="wordpress">WordPress</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Standard HTML Embed</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateEmbedCode("html"), "HTML")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={generateEmbedCode("html")}
                  readOnly
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
            </TabsContent>

            <TabsContent value="responsive" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Responsive HTML Embed</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateEmbedCode("responsive"), "Responsive HTML")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={generateEmbedCode("responsive")}
                  readOnly
                  className="font-mono text-sm"
                  rows={8}
                />
              </div>
            </TabsContent>

            <TabsContent value="wordpress" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>WordPress Shortcode</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateEmbedCode("wordpress"), "WordPress")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={generateEmbedCode("wordpress")}
                  readOnly
                  className="font-mono text-sm"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="react" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>React Component</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateEmbedCode("react"), "React")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={generateEmbedCode("react")}
                  readOnly
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Preview Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Preview:</Label>
              <div className="flex gap-1">
                <Button
                  variant={previewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("tablet")}
                >
                  <Smartphone className="h-4 w-4 rotate-90" />
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button onClick={openPreview} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>

          {/* Live Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-center">
              <div 
                style={{ 
                  width: previewDimensions.width, 
                  height: previewDimensions.height,
                  maxWidth: "100%"
                }}
                className="border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="auto"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Integration Guide */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Integration Guide
            </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Popular Platforms</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>WordPress</span>
                  <Badge variant="secondary">Shortcode</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wix</span>
                  <Badge variant="secondary">HTML Embed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Squarespace</span>
                  <Badge variant="secondary">Code Block</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shopify</span>
                  <Badge variant="secondary">HTML/Liquid</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Features</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Fully responsive design</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time menu updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>WhatsApp ordering integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Custom branding & colors</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Direct Link</h4>
            <p className="text-sm text-blue-800 mb-3">
              You can also share your menu directly using this link:
            </p>
            <div className="flex gap-2">
              <Input
                value={embedUrl}
                readOnly
                className="font-mono text-sm bg-white"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(embedUrl, "Direct link")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
