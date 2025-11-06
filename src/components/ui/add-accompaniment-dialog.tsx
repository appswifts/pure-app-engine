import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UtensilsCrossed, Sparkles, Upload, X, Edit2, Trash2 } from "lucide-react";
import { AIImageGenerator } from "@/components/menu/AIImageGenerator";

interface AddAccompanimentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItemId: string;
  menuItemName: string;
  restaurantId: string;
  onSuccess: () => void;
  formatPrice: (price: number) => string;
}

interface AccompanimentItem {
  id: string;
  name: string;
  base_price: number;
  image_url: string | null;
}

interface ExistingAccompaniment {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_required: boolean;
}

export function AddAccompanimentDialog({
  open,
  onOpenChange,
  menuItemId,
  menuItemName,
  restaurantId,
  onSuccess,
  formatPrice,
}: AddAccompanimentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accompanimentItems, setAccompanimentItems] = useState<AccompanimentItem[]>([]);
  const [existingAccompaniments, setExistingAccompaniments] = useState<ExistingAccompaniment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image_url: "",
  });
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  // Fetch items marked as accompaniments and existing accompaniments
  useEffect(() => {
    if (open && restaurantId) {
      fetchAccompanimentItems();
      fetchExistingAccompaniments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, restaurantId, menuItemId]);

  const fetchAccompanimentItems = async () => {
    try {
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, base_price, image_url")
        .eq("restaurant_id", restaurantId)
        .eq("is_accompaniment", true)
        .eq("is_available", true)
        .order("name")
        .returns<AccompanimentItem[]>();

      if (error) throw error;
      setAccompanimentItems(data || []);
    } catch (error: any) {
      console.error("Error fetching accompaniment items:", error);
    }
  };

  const fetchExistingAccompaniments = async () => {
    try {
      const { data, error } = await supabase
        .from("accompaniments")
        .select("*")
        .eq("menu_item_id", menuItemId)
        .order("name");

      if (error) throw error;
      setExistingAccompaniments(data || []);
    } catch (error: any) {
      console.error("Error fetching existing accompaniments:", error);
    }
  };

  const handleSelectItem = (item: AccompanimentItem) => {
    setFormData({
      name: item.name,
      price: item.base_price.toString(),
      image_url: item.image_url || "",
    });
  };

  const handleEdit = (accompaniment: ExistingAccompaniment) => {
    setEditingId(accompaniment.id);
    setFormData({
      name: accompaniment.name,
      price: accompaniment.price.toString(),
      image_url: accompaniment.image_url || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this accompaniment?")) return;

    try {
      const { error } = await supabase
        .from("accompaniments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Accompaniment deleted",
        description: "The accompaniment has been removed.",
      });

      fetchExistingAccompaniments();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error deleting accompaniment",
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
      const filePath = `accompaniment-images/${fileName}`;

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
        description: "Accompaniment image uploaded successfully.",
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
        // Update existing accompaniment
        const { error } = await supabase
          .from("accompaniments")
          .update({
            name: formData.name,
            price: parseInt(formData.price),
            image_url: formData.image_url || null,
          })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Accompaniment updated!",
          description: `${formData.name} has been updated.`,
        });
      } else {
        // Add new accompaniment
        const accompanimentData = {
          restaurant_id: restaurantId,
          menu_item_id: menuItemId,
          name: formData.name,
          price: parseInt(formData.price),
          image_url: formData.image_url || null,
          is_required: false,
        };

        const { error } = await supabase
          .from("accompaniments")
          .insert(accompanimentData);

        if (error) throw error;

        toast({
          title: "Accompaniment added successfully!",
          description: `${formData.name} has been added to ${menuItemName}`,
        });
      }

      // Reset form
      setFormData({
        name: "",
        price: "",
        image_url: "",
      });
      setEditingId(null);

      fetchExistingAccompaniments();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: editingId ? "Error updating accompaniment" : "Error adding accompaniment",
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
          <DialogTitle>{editingId ? "Edit Accompaniment/Extra" : "Manage Accompaniments/Extras"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update" : "Add or edit"} accompaniments for <span className="font-semibold">{menuItemName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Existing Accompaniments */}
        {existingAccompaniments.length > 0 && !editingId && (
          <div className="space-y-3 pb-4 border-b">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Current Accompaniments</Label>
              <Badge variant="secondary">{existingAccompaniments.length}</Badge>
            </div>
            <div className="grid gap-2 max-h-[200px] overflow-y-auto">
              {existingAccompaniments.map((acc) => (
                <Card key={acc.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {acc.image_url ? (
                        <img
                          src={acc.image_url}
                          alt={acc.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{acc.name}</p>
                        <p className="text-xs text-primary font-semibold">
                          {formatPrice(acc.price)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(acc)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(acc.id)}
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

        {/* Selection from existing accompaniment items */}
        {accompanimentItems.length > 0 && !editingId && (
          <div className="space-y-3 pb-4 border-b">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select from Menu Items</Label>
              <Badge variant="secondary">{accompanimentItems.length} available</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
              {accompanimentItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                  onClick={() => handleSelectItem(item)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-primary font-semibold">
                          {formatPrice(item.base_price)}
                        </p>
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
            {accompanimentItems.length > 0 && (
              <div className="flex items-center justify-center">
                <span className="text-sm font-semibold text-muted-foreground">OR Create New</span>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="accompaniment-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accompaniment-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., French Fries, Extra Cheese"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accompaniment-price">
                Price (RWF) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accompaniment-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 3000"
                required
              />
            </div>

            {/* Image Section */}
            <div className="grid gap-2">
              <Label>Image (Optional)</Label>
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
                  setFormData({ name: "", price: "", image_url: "" });
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
              {editingId ? "Update Accompaniment" : "Add Accompaniment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
