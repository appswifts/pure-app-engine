import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Check, Menu as MenuIcon, Grid3x3, Save, Trash2, Search, Filter, FolderOpen, Tag, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import QRCode from "qrcode";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MenuGroup {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface Table {
  id: string;
  name: string;
  slug: string;
  restaurant_id: string;
}

interface QRCodeData {
  type: 'single' | 'multi' | 'full';
  url: string;
  dataUrl: string;
  name: string;
}

interface SavedQRCode {
  id: string;
  name: string;
  custom_name?: string;
  category?: string;
  type: 'single' | 'multi' | 'full';
  url: string;
  qr_code_data: string;
  table_id: string;
  table_name?: string;
  group_ids?: string[];
  group_names?: string[];
  notes?: string;
  created_at: string;
}

const MenuQRGenerator = () => {
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [qrCodes, setQRCodes] = useState<{
    single: QRCodeData | null;
    multi: QRCodeData | null;
    full: QRCodeData | null;
  }>({
    single: null,
    multi: null,
    full: null,
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [generating, setGenerating] = useState<string | null>(null);
  
  // Organization features
  const [customNames, setCustomNames] = useState<{ single: string; multi: string; full: string }>({
    single: "",
    multi: "",
    full: ""
  });
  const [categories, setCategories] = useState<{ single: string; multi: string; full: string }>({
    single: "Table QR",
    multi: "Event QR",
    full: "Full Menu"
  });
  const [notes, setNotes] = useState<{ single: string; multi: string; full: string }>({
    single: "",
    multi: "",
    full: ""
  });
  const [savedQRCodes, setSavedQRCodes] = useState<SavedQRCode[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      loadMenuGroups();
      loadTables();
      loadRestaurantSlug();
      loadSavedQRCodes();
    }
  }, [restaurantId]);

  const loadMenuGroups = async () => {
    if (!restaurantId) return;
    try {
      const { data, error } = await supabase
        .from("menu_groups")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setMenuGroups(data || []);
      
      // Auto-select first group and all groups by default
      if (data && data.length > 0) {
        setSelectedGroupId(data[0].id);
        setSelectedGroupIds(data.map(g => g.id));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load menu groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    if (!restaurantId) return;
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("id, name, slug, restaurant_id")
        .eq("restaurant_id", restaurantId)
        .order("created_at");

      if (error) throw error;
      setTables(data || []);
      
      // Auto-select first table
      if (data && data.length > 0) {
        setSelectedTableId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive",
      });
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
        description: "Failed to load restaurant details",
        variant: "destructive",
      });
    }
  };

  const generateQRCodeDataUrl = async (url: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 400,
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

  const handleGenerateSingleGroup = async () => {
    if (!selectedGroupId) {
      toast({
        title: "Error",
        description: "Please select a menu group and table",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTableId) {
      toast({
        title: "Error",
        description: "Please select a table for this QR code",
        variant: "destructive",
      });
      return;
    }

    setGenerating('single');
    try {
      const group = menuGroups.find(g => g.id === selectedGroupId);
      const table = tables.find(t => t.id === selectedTableId);
      const groupSlug = (group as any)?.slug || 'menu';
      const url = `${window.location.origin}/menu/${restaurantSlug}/${table?.slug}/group/${groupSlug}`;
      const dataUrl = await generateQRCodeDataUrl(url);
      
      setQRCodes(prev => ({
        ...prev,
        single: {
          type: 'single',
          url,
          dataUrl,
          name: `${group?.name || 'Menu'} - ${table?.name} QR Code`
        }
      }));

      toast({
        title: "Success",
        description: "Single group QR code generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateMultiGroup = async () => {
    if (selectedGroupIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one menu group",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTableId) {
      toast({
        title: "Error",
        description: "Please select a table for this QR code",
        variant: "destructive",
      });
      return;
    }

    setGenerating('multi');
    try {
      const table = tables.find(t => t.id === selectedTableId);
      const selectedGroups = menuGroups.filter(g => selectedGroupIds.includes(g.id));
      const groupSlugs = selectedGroups.map(g => g.slug || 'menu').join(',');
      const url = `${window.location.origin}/menu/${restaurantSlug}/${table?.slug}/select?groups=${groupSlugs}`;
      const dataUrl = await generateQRCodeDataUrl(url);
      
      setQRCodes(prev => ({
        ...prev,
        multi: {
          type: 'multi',
          url,
          dataUrl,
          name: `Multi-Group - ${table?.name} QR Code`
        }
      }));

      toast({
        title: "Success",
        description: "Multi-group QR code generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateFullMenu = async () => {
    if (!selectedTableId) {
      toast({
        title: "Error",
        description: "Please select a table for this QR code",
        variant: "destructive",
      });
      return;
    }

    setGenerating('full');
    try {
      const table = tables.find(t => t.id === selectedTableId);
      const url = `${window.location.origin}/menu/${restaurantSlug}/${table?.slug}`;
      const dataUrl = await generateQRCodeDataUrl(url);
      
      setQRCodes(prev => ({
        ...prev,
        full: {
          type: 'full',
          url,
          dataUrl,
          name: `Full Menu - ${table?.name} QR Code`
        }
      }));

      toast({
        title: "Success",
        description: "Full menu QR code generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadQR = (qrData: QRCodeData) => {
    try {
      const link = document.createElement('a');
      link.download = `${qrData.name.replace(/\s+/g, '-')}.png`;
      link.href = qrData.dataUrl;
      link.click();
      
      toast({
        title: "Downloaded",
        description: `${qrData.name} downloaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const handleSaveQR = async (type: 'single' | 'multi' | 'full') => {
    const qrData = qrCodes[type];
    if (!qrData || !restaurantId) return;

    try {
      const table = tables.find(t => t.id === selectedTableId);
      const customName = customNames[type];
      const category = categories[type];
      const note = notes[type];

      let groupIds: string[] = [];
      let groupNames: string[] = [];

      if (type === 'single') {
        groupIds = [selectedGroupId];
        const group = menuGroups.find(g => g.id === selectedGroupId);
        if (group) groupNames = [group.name];
      } else if (type === 'multi') {
        groupIds = selectedGroupIds;
        groupNames = menuGroups
          .filter(g => selectedGroupIds.includes(g.id))
          .map(g => g.name);
      }

      const { data, error } = await supabase
        .from("saved_qr_codes")
        .insert({
          restaurant_id: restaurantId,
          name: qrData.name,
          custom_name: customName || null,
          category: category || null,
          type: type,
          url: qrData.url,
          qr_code_data: qrData.dataUrl,
          table_id: selectedTableId,
          table_name: table?.name,
          group_ids: groupIds.length > 0 ? groupIds : null,
          group_names: groupNames.length > 0 ? groupNames : null,
          notes: note || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Saved",
        description: "QR code saved to library successfully",
      });

      loadSavedQRCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save QR code",
        variant: "destructive",
      });
    }
  };

  const loadSavedQRCodes = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from("saved_qr_codes")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedQRCodes(data || []);
    } catch (error: any) {
      console.error("Error loading saved QR codes:", error);
    }
  };

  const handleDeleteSavedQR = async (qrId: string) => {
    if (!confirm("Are you sure you want to delete this QR code from the library?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("saved_qr_codes")
        .delete()
        .eq("id", qrId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "QR code removed from library",
      });

      loadSavedQRCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete QR code",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSavedQR = (qr: SavedQRCode) => {
    try {
      const link = document.createElement('a');
      const fileName = qr.custom_name || qr.name;
      link.download = `${fileName.replace(/\s+/g, '-')}.png`;
      link.href = qr.qr_code_data;
      link.click();
      
      toast({
        title: "Downloaded",
        description: `${fileName} downloaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getFilteredQRCodes = () => {
    let filtered = [...savedQRCodes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(qr =>
        (qr.custom_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (qr.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (qr.table_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (qr.group_names?.some(name => name.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(qr => qr.category === filterCategory);
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(qr => qr.type === filterType);
    }

    return filtered;
  };

  const getUniqueCategories = () => {
    const cats = new Set(savedQRCodes.map(qr => qr.category).filter(Boolean));
    return Array.from(cats) as string[];
  };

  if (loading || restaurantLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading menu groups...</p>
      </div>
    );
  }

  if (menuGroups.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MenuIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No menu groups found</h3>
          <p className="text-muted-foreground mb-6">
            Create menu groups in Menu Management to generate QR codes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Menu QR Codes</h2>
        <p className="text-muted-foreground">
          Generate, organize, and manage your QR codes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'generate' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('generate')}
          className="rounded-b-none"
        >
          <QrCode className="h-4 w-4 mr-2" />
          Generate QR Codes
        </Button>
        <Button
          variant={activeTab === 'library' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('library')}
          className="rounded-b-none"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          QR Library ({savedQRCodes.length})
        </Button>
      </div>

      {activeTab === 'generate' ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
        {/* Single Menu Group QR Code */}
        <AccordionItem value="single" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MenuIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Single Menu Group QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Direct link to one specific menu group
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Customers scan and go directly to the selected menu group</li>
                  <li>No group selector appears on the page</li>
                  <li>Perfect for single-cuisine restaurants or specific sections</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Select Table</Label>
                <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Menu Group</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a menu group" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateSingleGroup}
                disabled={!selectedGroupId || !selectedTableId || generating === 'single'}
                variant="gradient"
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {generating === 'single' ? 'Generating...' : 'Generate Single Group QR'}
              </Button>

              {qrCodes.single && (
                <div className="mt-4 p-4 border rounded-lg bg-card space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded border flex-shrink-0">
                      <img
                        src={qrCodes.single.dataUrl}
                        alt="Single group QR code"
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium">{qrCodes.single.name}</p>
                        <p className="text-xs text-muted-foreground break-all">
                          {qrCodes.single.url}
                        </p>
                      </div>

                      {/* Organization Inputs */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Custom Name (Optional)</Label>
                          <Input
                            placeholder="e.g., Lunch Menu - Main Entrance"
                            value={customNames.single}
                            onChange={(e) => setCustomNames(prev => ({ ...prev, single: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Input
                            placeholder="e.g., Table QR, Event QR"
                            value={categories.single}
                            onChange={(e) => setCategories(prev => ({ ...prev, single: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Notes (Optional)</Label>
                          <Textarea
                            placeholder="Add notes about where to place this QR code..."
                            value={notes.single}
                            onChange={(e) => setNotes(prev => ({ ...prev, single: e.target.value }))}
                            className="text-sm resize-none"
                            rows={2}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDownloadQR(qrCodes.single!)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() => handleSaveQR('single')}
                          variant="default"
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save to Library
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Multiple Menu Groups QR Code */}
        <AccordionItem value="multi" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Grid3x3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Multiple Menu Groups QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Shows pre-selection page with multiple options
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Customers see a pre-selection page with chosen groups</li>
                  <li>After selection, displays chosen group with standard design</li>
                  <li>Perfect for multi-cuisine restaurants or event menus</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Select Table</Label>
                <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Menu Groups (multiple)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {menuGroups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => toggleGroupSelection(group.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedGroupIds.includes(group.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center ${
                            selectedGroupIds.includes(group.id)
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {selectedGroupIds.includes(group.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{group.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              <Button
                onClick={handleGenerateMultiGroup}
                disabled={selectedGroupIds.length === 0 || !selectedTableId || generating === 'multi'}
                variant="gradient"
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {generating === 'multi' ? 'Generating...' : 'Generate Multi-Group QR'}
              </Button>

              {qrCodes.multi && (
                <div className="mt-4 p-4 border rounded-lg bg-card space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded border flex-shrink-0">
                      <img
                        src={qrCodes.multi.dataUrl}
                        alt="Multi-group QR code"
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium">{qrCodes.multi.name}</p>
                        <p className="text-xs text-muted-foreground break-all">
                          {qrCodes.multi.url}
                        </p>
                      </div>

                      {/* Organization Inputs */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Custom Name (Optional)</Label>
                          <Input
                            placeholder="e.g., Event Menu - VIP Table"
                            value={customNames.multi}
                            onChange={(e) => setCustomNames(prev => ({ ...prev, multi: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Input
                            placeholder="e.g., Event QR, Catering"
                            value={categories.multi}
                            onChange={(e) => setCategories(prev => ({ ...prev, multi: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Notes (Optional)</Label>
                          <Textarea
                            placeholder="Add notes..."
                            value={notes.multi}
                            onChange={(e) => setNotes(prev => ({ ...prev, multi: e.target.value }))}
                            className="text-sm resize-none"
                            rows={2}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDownloadQR(qrCodes.multi!)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() => handleSaveQR('multi')}
                          variant="default"
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save to Library
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Full Restaurant Menu QR Code */}
        <AccordionItem value="full" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Full Restaurant Menu QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Shows complete menu with all groups
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Shows pre-selection page with all menu groups</li>
                  <li>Customer chooses which group to view</li>
                  <li>Perfect for comprehensive menu access</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Select Table</Label>
                <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateFullMenu}
                disabled={!selectedTableId || generating === 'full'}
                variant="gradient"
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {generating === 'full' ? 'Generating...' : 'Generate Full Menu QR'}
              </Button>

              {qrCodes.full && (
                <div className="mt-4 p-4 border rounded-lg bg-card space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded border flex-shrink-0">
                      <img
                        src={qrCodes.full.dataUrl}
                        alt="Full menu QR code"
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium">{qrCodes.full.name}</p>
                        <p className="text-xs text-muted-foreground break-all">
                          {qrCodes.full.url}
                        </p>
                      </div>

                      {/* Organization Inputs */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Custom Name (Optional)</Label>
                          <Input
                            placeholder="e.g., Full Menu - Main Entrance"
                            value={customNames.full}
                            onChange={(e) => setCustomNames(prev => ({ ...prev, full: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Input
                            placeholder="e.g., Full Menu, General Access"
                            value={categories.full}
                            onChange={(e) => setCategories(prev => ({ ...prev, full: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Notes (Optional)</Label>
                          <Textarea
                            placeholder="Add notes..."
                            value={notes.full}
                            onChange={(e) => setNotes(prev => ({ ...prev, full: e.target.value }))}
                            className="text-sm resize-none"
                            rows={2}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDownloadQR(qrCodes.full!)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() => handleSaveQR('full')}
                          variant="default"
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save to Library
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      ) : (
        /* QR Library View */
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search QR codes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getUniqueCategories().map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="single">Single Group</SelectItem>
                      <SelectItem value="multi">Multi-Group</SelectItem>
                      <SelectItem value="full">Full Menu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Grid */}
          {getFilteredQRCodes().length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No QR codes found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterCategory !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Generate and save your first QR code'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredQRCodes().map((qr) => (
                <Card key={qr.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-1">
                          {qr.custom_name || qr.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {qr.table_name && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {qr.table_name}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        qr.type === 'single' ? 'default' :
                        qr.type === 'multi' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {qr.type === 'single' ? 'Single' :
                         qr.type === 'multi' ? 'Multi' : 'Full'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* QR Code Preview */}
                    <div className="p-3 bg-white rounded border flex items-center justify-center">
                      <img
                        src={qr.qr_code_data}
                        alt={qr.custom_name || qr.name}
                        className="w-full h-auto max-w-[200px]"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-xs">
                      {qr.category && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          <span>{qr.category}</span>
                        </div>
                      )}
                      {qr.group_names && qr.group_names.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MenuIcon className="h-3 w-3" />
                          <span className="line-clamp-1">
                            {qr.group_names.join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(qr.created_at).toLocaleDateString()}</span>
                      </div>
                      {qr.notes && (
                        <p className="text-muted-foreground italic line-clamp-2">
                          "{qr.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleDownloadSavedQR(qr)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleDeleteSavedQR(qr.id)}
                        variant="outline"
                        size="sm"
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
      )}
    </div>
  );
};

export default MenuQRGenerator;
