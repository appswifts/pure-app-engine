import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs, HomeBreadcrumb } from "@/components/ui/breadcrumbs";
import { Plus, Pencil, Trash2, Grid3x3, QrCode, Download, LayoutGrid, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import QRCodeLib from "qrcode";
import { BASE_URL, QR_CODE_OPTIONS } from "@/lib/constants";

interface TableData {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  qr_code_url: string | null;
  qr_code_data: string | null;
  created_at: string;
}

interface SavedQRCode {
  id: string;
  restaurant_id: string;
  name: string;
  custom_name: string | null;
  category: string;
  type: "single" | "multi" | "full"; // DB constraint: only these values allowed
  url: string;
  qr_code_data: string;
  table_id: string | null;
  table_name: string | null;
  created_at: string;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

const TablesAndQR = () => {
  const location = useLocation();
  const [tables, setTables] = useState<TableData[]>([]);
  const [savedQRCodes, setSavedQRCodes] = useState<SavedQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    seats: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);

  // Restaurant management
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // Determine default tab based on URL
  const getDefaultTab = () => {
    return location.pathname === "/dashboard/qr" ? "qr-codes" : "tables";
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();



  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);

  const loadRestaurants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, slug")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      setRestaurants(data || []);

      // Auto-select the first restaurant or the one from useRestaurant hook
      if (data && data.length > 0) {
        const defaultRestaurant = data.find(r => r.id === restaurantId) || data[0];
        setSelectedRestaurantId(defaultRestaurant.id);
        setCurrentRestaurant(defaultRestaurant);
      }
    } catch (error: any) {
      console.error("Error loading restaurants:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    }
  };

  const handleRestaurantChange = (restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      console.log("Changing restaurant to:", restaurant.name, restaurantId);
      setSelectedRestaurantId(restaurantId);
      setCurrentRestaurant(restaurant);
      setSelectedTableId(""); // Reset table selection
      // Clear current data immediately
      setTables([]);
      setSavedQRCodes([]);
    }
  };

  const loadData = async (targetRestaurantId: string) => {
    if (!targetRestaurantId) {
      console.log("loadData called with empty restaurantId");
      return;
    }

    console.log("Loading data for restaurant:", targetRestaurantId);

    try {
      setLoading(true);

      // Load restaurant info, tables, and saved QR codes in parallel
      // @ts-ignore - Supabase type generation issue
      const [restaurantResult, tablesResult, qrCodesResult] = await Promise.all([
        supabase
          .from("restaurants")
          .select("slug")
          .eq("id", targetRestaurantId)
          .single(),
        // @ts-ignore - tables not in generated types
        (supabase as any)
          .from("tables")
          .select("*")
          .eq("restaurant_id", targetRestaurantId)
          .order("name"),
        // @ts-ignore - saved_qr_codes not in generated types
        (supabase as any)
          .from("saved_qr_codes")
          .select("*")
          .eq("restaurant_id", targetRestaurantId)
          .order("created_at", { ascending: false })
      ]);

      if (restaurantResult.error) throw restaurantResult.error;
      if (tablesResult.error) throw tablesResult.error;
      if (qrCodesResult.error) throw qrCodesResult.error;

      console.log("Loaded tables:", tablesResult.data?.length || 0);
      console.log("Loaded QR codes:", qrCodesResult.data?.length || 0);

      setRestaurantSlug(restaurantResult.data.slug);
      // @ts-ignore - Type mismatch with generated types
      setTables(tablesResult.data || []);
      // @ts-ignore - Type mismatch with generated types
      setSavedQRCodes(qrCodesResult.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load all restaurants when component mounts
  useEffect(() => {
    if (restaurantId) {
      loadRestaurants();
    }
  }, [restaurantId]);

  // Load data when selected restaurant changes
  useEffect(() => {
    console.log("selectedRestaurantId changed to:", selectedRestaurantId);
    if (selectedRestaurantId) {
      loadData(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Table Management Functions
  const handleOpenTableDialog = (table?: TableData) => {
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
    setIsTableDialogOpen(true);
  };

  const handleCloseTableDialog = () => {
    setIsTableDialogOpen(false);
    setEditingTable(null);
    setFormData({
      name: "",
      seats: "",
      location: "",
    });
  };

  const handleSaveTable = async () => {
    if (!selectedRestaurantId || !formData.name.trim()) {
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
        // @ts-ignore - tables not in generated types
        const { error } = await (supabase as any)
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
        // @ts-ignore - tables not in generated types
        const { error } = await (supabase as any)
          .from("tables")
          .insert({
            restaurant_id: selectedRestaurantId,
            name: formData.name,
            slug: slug,
            qr_code_data: `${selectedRestaurantId}/${slug}`,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Table created successfully",
        });
      }

      handleCloseTableDialog();
      loadData(selectedRestaurantId);
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

  const handleDeleteTable = async (table: TableData) => {
    if (!confirm(`Are you sure you want to delete "${table.name}"? This will also delete any associated QR codes.`)) {
      return;
    }

    try {
      // @ts-ignore - tables not in generated types
      const { error } = await (supabase as any)
        .from("tables")
        .delete()
        .eq("id", table.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Table deleted successfully",
      });

      loadData(selectedRestaurantId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete table",
        variant: "destructive",
      });
    }
  };

  // QR Code Generation Functions
  const generateQRCode = async () => {
    if (!selectedTableId) {
      toast({
        title: "Missing Selection",
        description: "Please select a table",
        variant: "destructive"
      });
      return;
    }

    if (!selectedRestaurantId) {
      toast({
        title: "Error",
        description: "No restaurant selected",
        variant: "destructive"
      });
      return;
    }

    try {
      setGenerating(true);
      const selectedTable = tables.find(t => t.id === selectedTableId);

      if (!selectedTable) return;

      const menuUrl = `${BASE_URL}/menu/${restaurantSlug}/${selectedTable.slug}`;

      // Generate QR code
      const qrDataUrl = await QRCodeLib.toDataURL(menuUrl, QR_CODE_OPTIONS);

      // Save to database (table_id is required, type must be 'single', 'multi', or 'full')
      // @ts-ignore - saved_qr_codes not in generated types
      const { error } = await (supabase as any)
        .from("saved_qr_codes")
        .insert({
          restaurant_id: selectedRestaurantId,
          table_id: selectedTable.id,
          name: `${selectedTable.name} QR Code`,
          type: "single", // Must be 'single', 'multi', or 'full' per DB constraint
          url: menuUrl,
          qr_code_data: qrDataUrl,
          table_name: selectedTable.name,
          category: "table",
        });

      if (error) {
        console.error("Database error details:", error);
        throw error;
      }

      toast({
        title: "QR Code Generated",
        description: `Menu QR code for ${selectedTable.name} created and saved`,
      });

      // Reload saved QR codes
      loadData(selectedRestaurantId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = (qrCode: SavedQRCode) => {
    const link = document.createElement('a');
    link.download = `${qrCode.custom_name || qrCode.name || 'qr-code'}.png`;
    link.href = qrCode.qr_code_data;
    link.click();

    toast({
      title: "Downloaded",
      description: "QR code downloaded successfully",
    });
  };

  const handleDeleteQR = async (qrCode: SavedQRCode) => {
    if (!confirm(`Are you sure you want to delete this QR code?`)) {
      return;
    }

    try {
      // @ts-ignore - saved_qr_codes not in generated types
      const { error } = await (supabase as any)
        .from("saved_qr_codes")
        .delete()
        .eq("id", qrCode.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "QR code deleted successfully",
      });

      loadData(selectedRestaurantId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete QR code",
        variant: "destructive",
      });
    }
  };

  if (loading || restaurantLoading) {
    return (
      <ModernDashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </ModernDashboardLayout>
    );
  }

  const breadcrumbItems = [
    HomeBreadcrumb(),
    {
      label: "Tables & QR Codes",
    }
  ];

  return (
    <ModernDashboardLayout>
      <div className="space-y-6 p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Restaurant Selector */}
        {restaurants.length > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <Label htmlFor="restaurant-select" className="mb-0">Select Restaurant:</Label>
                </div>
                <Select value={selectedRestaurantId} onValueChange={handleRestaurantChange}>
                  <SelectTrigger id="restaurant-select" className="w-[300px]">
                    <SelectValue placeholder="Choose a restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {currentRestaurant?.name || 'Tables & QR Codes'}
          </h1>
          <p className="text-muted-foreground">
            Manage your restaurant tables and generate QR codes
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="qr-codes" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Codes ({savedQRCodes.length})
            </TabsTrigger>
          </TabsList>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Table Management</h2>
                <p className="text-sm text-muted-foreground">
                  Create and manage tables for your restaurant
                </p>
              </div>
              <Button onClick={() => handleOpenTableDialog()} variant="default">
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
                  <Button onClick={() => handleOpenTableDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Table
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Tables ({tables.length})</CardTitle>
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
                        <TableHead>Status</TableHead>
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
                            <Badge variant="secondary">Active</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenTableDialog(table)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTable(table)}
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
          </TabsContent>

          {/* QR Codes Tab */}
          <TabsContent value="qr-codes" className="space-y-4">
            {/* QR Generator Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Generate New QR Code
                </CardTitle>
                <CardDescription>
                  Create a QR code for any of your tables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="table-select">Select Table</Label>
                    <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                      <SelectTrigger id="table-select">
                        <SelectValue placeholder="Choose a table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={generateQRCode}
                      disabled={!selectedTableId || generating}
                    >
                      {generating ? "Generating..." : "Generate QR Code"}
                    </Button>
                  </div>
                </div>

                {tables.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No tables found. Please create tables first in the Tables tab.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Saved QR Codes Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Saved QR Codes</h2>
                  <p className="text-sm text-muted-foreground">
                    All your generated QR codes
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {savedQRCodes.length} QR Code{savedQRCodes.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {savedQRCodes.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <LayoutGrid className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No QR codes yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Generate your first QR code using the form above
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {savedQRCodes.map((qrCode) => (
                    <Card key={qrCode.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        {/* QR Code Image */}
                        <div className="bg-white p-3 rounded-lg border">
                          <img
                            src={qrCode.qr_code_data}
                            alt={qrCode.name}
                            className="w-full h-auto"
                          />
                        </div>

                        {/* Info */}
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-sm truncate">
                              {qrCode.custom_name || qrCode.name}
                            </p>
                            {qrCode.table_name && (
                              <p className="text-xs text-muted-foreground">
                                {qrCode.table_name}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {qrCode.type}
                            </Badge>
                            {qrCode.category && (
                              <Badge variant="secondary" className="text-xs capitalize">
                                {qrCode.category}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground truncate">
                            {qrCode.url}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDownloadQR(qrCode)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteQR(qrCode)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Table Dialog */}
        <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
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
                  placeholder="e.g., Main Dining Room, Patio"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseTableDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveTable} disabled={saving || !formData.name.trim()}>
                {saving ? "Saving..." : editingTable ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernDashboardLayout>
  );
};

export default TablesAndQR;
