import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Upload, X, Edit2, Trash2 } from "lucide-react";
import { AIImageGenerator } from "@/components/menu/AIImageGenerator";

interface AddVariationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItemId: string;
  menuItemName: string;
  onSuccess: () => void;
}

interface Variation {
  id: string;
  name: string;
  description: string;
  price_modifier: number;
  image_url: string | null;
  display_order: number;
}

export function AddVariationDialog({
  open,
  onOpenChange,
  menuItemId,
  menuItemName,
  onSuccess,
}: AddVariationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingVariations, setExistingVariations] = useState<Variation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_modifier: "",
    image_url: "",
  });
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    if (open) {
      fetchExistingVariations();
    }
  }, [open, menuItemId]);

  const fetchExistingVariations = async () => {
    try {
      const { data, error } = await supabase
        .from("item_variations")
        .select("*")
        .eq("menu_item_id", menuItemId)
        .order("display_order");

      if (error) throw error;
      setExistingVariations(data || []);
    } catch (error: any) {
      console.error("Error fetching variations:", error);
    }
  };

  const handleEdit = (variation: Variation) => {
    setEditingId(variation.id);
    setFormData({
      name: variation.name,
      description: variation.description || "",
      price_modifier: variation.price_modifier.toString(),
      image_url: variation.image_url || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this variation?")) return;

    try {
      const { error } = await supabase
        .from("item_variations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Variation deleted",
        description: "The variation has been removed.",
      });

      fetchExistingVariations();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error deleting variation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImageGenerated = (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    setShowAIGenerator(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setGeneratingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `variation-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      toast({
        title: "Image uploaded",
        description: "Variation image uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update existing variation
        const { error } = await supabase
          .from("item_variations")
          .update({
            name: formData.name,
            description: formData.description || "",
            price_modifier: parseFloat(formData.price_modifier) || 0,
            image_url: formData.image_url || null,
          })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Variation updated!",
          description: `${formData.name} has been updated.`,
        });
      } else {
        // Add new variation
        const { data: existingVars } = await supabase
          .from("item_variations")
          .select("display_order")
          .eq("menu_item_id", menuItemId)
          .order("display_order", { ascending: false })
          .limit(1);

        const displayOrder = existingVars && existingVars.length > 0 
          ? existingVars[0].display_order + 1 
          : 0;

        const variationData = {
          menu_item_id: menuItemId,
          name: formData.name,
          description: formData.description || "",
          price_modifier: parseFloat(formData.price_modifier) || 0,
          image_url: formData.image_url || null,
          display_order: displayOrder,
        };

        const { error } = await supabase
          .from("item_variations")
          .insert(variationData);

        if (error) throw error;

        toast({
          title: "Variation added successfully!",
          description: `${formData.name} has been added to ${menuItemName}`,
        });
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        price_modifier: "",
        image_url: "",
      });
      setEditingId(null);

      fetchExistingVariations();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: editingId ? "Error updating variation" : "Error adding variation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Variation" : "Manage Variations"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update" : "Add or edit"} variations for <span className="font-semibold">{menuItemName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Existing Variations */}
        {existingVariations.length > 0 && !editingId && (
          <div className="space-y-3 pb-4 border-b">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Existing Variations</Label>
              <Badge variant="secondary">{existingVariations.length}</Badge>
            </div>
            <div className="grid gap-2 max-h-[250px] overflow-y-auto">
              {existingVariations.map((variation) => (
                <Card key={variation.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {variation.image_url ? (
                        <img
                          src={variation.image_url}
                          alt={variation.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{variation.name}</p>
                        {variation.description && (
                          <p className="text-xs text-muted-foreground truncate">{variation.description}</p>
                        )}
                        <p className="text-xs font-semibold mt-1">
                          {variation.price_modifier > 0 ? "+" : ""}{variation.price_modifier} RWF
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(variation)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(variation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="variation-name">
                Variation Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="variation-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Small, Medium, Large"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="variation-description">Description (Optional)</Label>
              <Textarea
                id="variation-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., 10 oz serving"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price-modifier">
                Price Modifier (RWF) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price-modifier"
                type="number"
                step="0.01"
                value={formData.price_modifier}
                onChange={(e) => setFormData({ ...formData, price_modifier: e.target.value })}
                placeholder="e.g., 0, 1000, -500"
                required
              />
              <p className="text-xs text-muted-foreground">
                Positive for price increase, negative for discount, 0 for same price
              </p>
            </div>

            {/* Image Section */}
            <div className="grid gap-2">
              <Label>Variation Image (Optional)</Label>
              <div className="flex gap-2">
                {formData.image_url && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {!formData.image_url && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIGenerator(true)}
                      disabled={generatingImage}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Generate
                    </Button>
                    <label className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={generatingImage}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Image Generator */}
          {showAIGenerator && (
            <div className="mb-4">
              <AIImageGenerator
                itemName={formData.name || menuItemName}
                onImageGenerated={handleImageGenerated}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (editingId) {
                  setEditingId(null);
                  setFormData({ name: "", description: "", price_modifier: "", image_url: "" });
                } else {
                  onOpenChange(false);
                }
              }}
              disabled={loading}
            >
              {editingId ? "Cancel Edit" : "Close"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update Variation" : "Add Variation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
