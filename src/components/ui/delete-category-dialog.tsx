import * as React from "react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    id: string;
    name: string;
  };
  availableCategories: Array<{ id: string; name: string }>;
  itemCount: number;
  onSuccess: () => void;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  availableCategories,
  itemCount,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const { toast } = useToast();
  const [action, setAction] = useState<"reassign" | "delete">("reassign");
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const otherCategories = availableCategories.filter((c) => c.id !== category.id);

  const handleDelete = async () => {
    if (action === "reassign" && !targetCategoryId && itemCount > 0) {
      toast({
        title: "Please select a category",
        description: "Choose which category to move the items to",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);

      if (action === "reassign" && itemCount > 0) {
        // Reassign items to the target category
        const { error: updateError } = await supabase
          .from("menu_items")
          .update({ category_id: targetCategoryId })
          .eq("category_id", category.id);

        if (updateError) throw updateError;
      }
      // If action is "delete", items will be cascade deleted via foreign key

      // Delete the category
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Category deleted",
        description: action === "reassign" 
          ? `Items moved to another category` 
          : `Category and ${itemCount} item(s) deleted`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Category: {category.name}
          </DialogTitle>
          <DialogDescription>
            This category has <strong>{itemCount} item(s)</strong>. What would you like to do
            with them?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={action} onValueChange={(v) => setAction(v as "reassign" | "delete")}>
            {/* Reassign Option */}
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="reassign" id="reassign" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="reassign" className="font-medium cursor-pointer">
                  Move items to another category
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keep all menu items and assign them to a different category
                </p>
                {action === "reassign" && (
                  <div className="mt-3">
                    <Label htmlFor="target-category">Select Target Category</Label>
                    <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                      <SelectTrigger id="target-category" className="mt-1">
                        <SelectValue placeholder="Choose a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {otherCategories.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No other categories available
                          </div>
                        ) : (
                          otherCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Option */}
            <div className="flex items-start space-x-3 space-y-0 pt-3 border-t">
              <RadioGroupItem value="delete" id="delete" />
              <div className="flex-1">
                <Label htmlFor="delete" className="font-medium cursor-pointer text-destructive">
                  Delete all items with this category
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete the category and all <strong>{itemCount}</strong> menu item(s).
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={
              isDeleting ||
              (action === "reassign" && !targetCategoryId && itemCount > 0) ||
              (action === "reassign" && otherCategories.length === 0 && itemCount > 0)
            }
          >
            {isDeleting
              ? "Deleting..."
              : action === "reassign"
              ? "Move & Delete Category"
              : "Delete All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
