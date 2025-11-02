import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Grid3x3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";

interface TableData {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  qr_code_url: string | null;
  qr_code_data: string | null;
  created_at: string;
}

const TableManager = () => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    seats: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      loadTables();
    }
  }, [restaurantId]);

  const loadTables = async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");

      if (error) throw error;
      setTables(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOpenDialog = (table?: TableData) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        name: table.name,
        seats: "",
        location: "",
      });
    } else {
      setEditingTable(null);
      setFormData({
        name: "",
        seats: "",
        location: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTable(null);
    setFormData({
      name: "",
      seats: "",
      location: "",
    });
  };

  const handleSave = async () => {
    if (!restaurantId || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Table name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const slug = generateSlug(formData.name);

      if (editingTable) {
        // Update existing table
        const { error } = await supabase
          .from("tables")
          .update({
            name: formData.name,
            slug: slug,
          })
          .eq("id", editingTable.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Table updated successfully",
        });
      } else {
        // Create new table
        const { error } = await supabase
          .from("tables")
          .insert({
            restaurant_id: restaurantId,
            name: formData.name,
            slug: slug,
            qr_code_data: `${restaurantId}/${slug}`,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Table created successfully",
        });
      }

      handleCloseDialog();
      loadTables();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save table",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: TableData) => {
    if (!confirm(`Are you sure you want to delete "${table.name}"? This will also delete any associated QR codes.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", table.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Table deleted successfully",
      });

      loadTables();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete table",
        variant: "destructive",
      });
    }
  };

  if (loading || restaurantLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading tables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Table Management</h2>
          <p className="text-muted-foreground">
            Create and manage tables for your restaurant
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Grid3x3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first table to start generating QR codes
            </p>
            <Button onClick={() => handleOpenDialog()} variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tables ({tables.length})</CardTitle>
            <CardDescription>
              Manage your restaurant tables and seating arrangements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {table.slug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {table.qr_code_url ? (
                        <Badge variant="default">Generated</Badge>
                      ) : (
                        <Badge variant="secondary">Not Generated</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(table)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(table)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? "Edit Table" : "Add New Table"}
            </DialogTitle>
            <DialogDescription>
              {editingTable
                ? "Update the table information"
                : "Create a new table for your restaurant"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Table Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Table 1, Patio Table 5"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              {formData.name && (
                <p className="text-xs text-muted-foreground">
                  Slug: {generateSlug(formData.name)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Number of Seats (Optional)</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                placeholder="e.g., 4"
                value={formData.seats}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, seats: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Main Dining Room, Patio, Window Seat"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? "Saving..." : editingTable ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManager;
