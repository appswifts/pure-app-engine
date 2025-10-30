import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Download, Plus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { useRestaurant } from "@/hooks/useRestaurant";

interface Table {
  id: string;
  name: string;
  slug: string;
  restaurant_id: string;
  qr_code_url: string | null;
  created_at: string;
}

interface QRGeneratorProps {
  user: User;
}

const QRGenerator = ({ user }: QRGeneratorProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableName, setNewTableName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      loadTables();
      loadRestaurantSlug();
    }
  }, [restaurantId]);

  const loadTables = async () => {
    if (!restaurantId) return;
    try {
      const { data: tablesData, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at");

      if (error) throw error;
      setTables(tablesData || []);
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

  const loadRestaurantSlug = async () => {
    if (!restaurantId) return;
    try {
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("slug")
        .eq("id", restaurantId)
        .single();

      if (error) throw error;
      if (restaurant?.slug) {
        setRestaurantSlug(restaurant.slug);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load restaurant details for QR code generation.",
        variant: "destructive",
      });
    }
  };

  const generateQRCodeData = async (restaurantSlug: string, tableSlug: string) => {
    // Use current domain for menu URL
    const menuUrl = `${window.location.origin}/menu/${restaurantSlug}/${tableSlug}`;
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw error;
    }
  };

  const handleSaveTable = async (formData: FormData) => {
    const name = formData.get("name") as string;
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Table name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTable) {
        // Update existing table
        const { error } = await supabase
          .from("tables")
          .update({ name })
          .eq("id", editingTable.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Table updated successfully",
        });
      } else {
        // Create new table with slug
        const slug = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
          
        const { data: newTable, error } = await supabase
          .from("tables")
          .insert({
            name,
            slug,
            restaurant_id: restaurantId,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Table created successfully",
        });
      }

      setDialogOpen(false);
      setEditingTable(null);
      loadTables();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGenerateQR = async (table: Table) => {
    // RULE: Only generate QR if table doesn't have one already
    if (table.qr_code_url) {
      toast({
        title: "QR Code Already Exists",
        description: "This table already has a QR code. Delete it first to regenerate.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingQR(table.id);
    try {
      // Get restaurant slug first
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("slug")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      const qrCodeDataUrl = await generateQRCodeData(restaurant.slug, table.slug);
      
      // Update table with QR code URL
      const { error } = await supabase
        .from("tables")
        .update({ qr_code_url: qrCodeDataUrl })
        .eq("id", table.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "QR code generated successfully",
      });
      loadTables();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setGeneratingQR(null);
    }
  };

  const handleDownloadQR = async (table: Table) => {
    if (!table.qr_code_url) {
      await handleGenerateQR(table);
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = `${table.name}-QR-Code.png`;
      link.href = table.qr_code_url;
      link.click();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQR = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this QR code? The link will become invalid.")) {
      return;
    }

    try {
      // Remove QR code URL, making the link invalid
      const { error } = await supabase
        .from("tables")
        .update({ qr_code_url: null })
        .eq("id", tableId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "QR code deleted successfully. The link is now invalid.",
      });
      loadTables();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table? This will also delete its QR code and make the link invalid.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", tableId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Table deleted successfully",
      });
      loadTables();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
          <h2 className="text-2xl font-bold">Table QR Codes</h2>
          <p className="text-muted-foreground">Generate and manage QR codes for your restaurant tables</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" onClick={() => setEditingTable(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTable ? "Edit Table" : "Add New Table"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveTable(formData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="name">Table Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingTable?.name || ""}
                  placeholder="e.g., Table 1, Patio A, VIP Room"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="gradient">
                  {editingTable ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingTable(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
            <p className="text-muted-foreground mb-6">Create your first table to generate QR codes for customers</p>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tables.map((table) => (
            <Card key={table.id} className="shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold truncate pr-2">{table.name}</CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setEditingTable(table);
                        setDialogOpen(true);
                      }}
                      title="Edit Table"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                      onClick={() => handleDeleteTable(table.id)}
                      title="Delete Table"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-3">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  {table.qr_code_url ? (
                    <div className="p-2 bg-white rounded border">
                      <img 
                        src={table.qr_code_url} 
                        alt={`QR code for ${table.name}`}
                        className="w-20 h-20"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">No QR</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu URL */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Table URL:</p>
                  <a 
                    href={`${window.location.origin}/menu/${restaurantSlug}/${table.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded block truncate hover:bg-muted/80 transition-colors cursor-pointer" title={`${window.location.origin}/menu/${restaurantSlug}/${table.slug}`}>
                      .../menu/.../
                      <span className="font-medium">{table.slug}</span>
                    </code>
                  </a>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  {!table.qr_code_url ? (
                    <Button 
                      onClick={() => handleGenerateQR(table)}
                      disabled={generatingQR === table.id}
                      variant="gradient"
                      size="sm"
                      className="w-full h-7 text-xs"
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      {generatingQR === table.id ? "Generating..." : "Generate"}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      <Button 
                        onClick={() => handleDownloadQR(table)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        title="Download QR Code"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteQR(table.id)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 hover:bg-destructive/10"
                        title="Delete QR Code"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            How QR Codes Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">1</div>
            <div>
              <p className="font-medium">Create Tables</p>
              <p className="text-muted-foreground">Add tables for your restaurant (Table 1, Patio A, etc.)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">2</div>
            <div>
              <p className="font-medium">Generate QR Codes</p>
              <p className="text-muted-foreground">Each QR code links to your menu with the specific table ID</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">3</div>
            <div>
              <p className="font-medium">Print & Place</p>
              <p className="text-muted-foreground">Download and print QR codes, then place them on tables</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">4</div>
            <div>
              <p className="font-medium">Customer Experience</p>
              <p className="text-muted-foreground">Customers scan, view menu, and order via WhatsApp</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRGenerator;