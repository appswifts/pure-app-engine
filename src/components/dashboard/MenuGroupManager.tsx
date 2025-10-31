import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, GripVertical, Globe } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import errorHandler from '@/services/errorHandlingService';
import type { Database } from "@/integrations/supabase/types";

type MenuGroup = Database["public"]["Tables"]["menu_groups"]["Row"];

interface MenuGroupManagerProps {
  restaurantId: string;
  onMenuGroupSelect?: (menuGroupId: string | null) => void;
  selectedMenuGroupId?: string | null;
}

const MenuGroupManager = ({ restaurantId, onMenuGroupSelect, selectedMenuGroupId }: MenuGroupManagerProps) => {
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "",
    is_active: true 
  });
  const { toast } = useToast();

  useEffect(() => {
    if (restaurantId) {
      loadMenuGroups();
    }
  }, [restaurantId]);

  const loadMenuGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_groups")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order");

      if (error) throw error;
      setMenuGroups(data || []);
      
      // Auto-select first group if none selected
      if (data && data.length > 0 && !selectedMenuGroupId) {
        onMenuGroupSelect?.(data[0].id);
      }
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'fetch menu groups');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingGroup) {
        // Update existing menu group
        const { error } = await supabase
          .from("menu_groups")
          .update({ 
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active
          })
          .eq("id", editingGroup.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu group updated successfully",
        });
      } else {
        // Create new menu group
        const { error } = await supabase
          .from("menu_groups")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            restaurant_id: restaurantId,
            display_order: menuGroups.length,
            is_active: formData.is_active
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu group created successfully",
        });
      }

      loadMenuGroups();
      handleCloseDialog();
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'save menu group');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (group: MenuGroup) => {
    setEditingGroup(group);
    setFormData({ 
      name: group.name,
      description: group.description || "",
      is_active: group.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this menu group? All categories in this group will also be affected.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("menu_groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu group deleted successfully",
      });

      loadMenuGroups();
      
      // Reset selection if deleted group was selected
      if (selectedMenuGroupId === groupId) {
        onMenuGroupSelect?.(null);
      }
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'delete menu group');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGroup(null);
    setFormData({ name: "", description: "", is_active: true });
  };

  const toggleActive = async (groupId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("menu_groups")
        .update({ is_active: !currentStatus })
        .eq("id", groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Menu group ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      loadMenuGroups();
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'update menu group status');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading menu groups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Menu Groups (Cuisines)
          </h2>
          <p className="text-muted-foreground">Organize menus by cuisine type</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Cuisine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Menu Group" : "Add New Menu Group"}
              </DialogTitle>
              <DialogDescription>
                {editingGroup 
                  ? "Update the menu group details below." 
                  : "Create a new menu group to organize menus by cuisine type (e.g., Rwandan, Chinese, Italian)."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Cuisine Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rwandan, Chinese, Italian, Continental"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this cuisine menu"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  {editingGroup ? "Update" : "Create"} Menu Group
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {menuGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No menu groups yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first cuisine menu group
            </p>
            <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Cuisine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {menuGroups.map((group) => (
            <Card 
              key={group.id} 
              className={`shadow-card hover:shadow-elevated transition-all cursor-pointer ${
                selectedMenuGroupId === group.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onMenuGroupSelect?.(group.id)}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{group.name}</h3>
                      {group.is_active ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Order: {group.display_order + 1}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={group.is_active ?? true}
                    onCheckedChange={() => toggleActive(group.id, group.is_active ?? true)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(group);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(group.id);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuGroupManager;