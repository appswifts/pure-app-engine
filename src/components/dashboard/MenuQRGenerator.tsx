import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Menu as MenuIcon, Grid3x3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import QRCode from "qrcode";
import { BASE_URL, QR_CODE_OPTIONS } from "@/lib/constants";
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
  
  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (!restaurantLoading && restaurantId) {
      loadData();
    }
  }, [restaurantId, restaurantLoading]);

  const loadData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      
      // Load restaurant info
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("slug")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurantSlug(restaurantData.slug);

      // Load menu groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("menu_groups")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("display_order");

      if (groupsError) throw groupsError;
      setMenuGroups(groupsData || []);

      // Load tables
      const { data: tablesData, error: tablesError } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");

      if (tablesError) throw tablesError;
      setTables(tablesData || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeDataUrl = async (url: string): Promise<string> => {
    return await QRCode.toDataURL(url, QR_CODE_OPTIONS);
  };

  const handleGenerateSingleGroup = async () => {
    if (!selectedGroupId || !selectedTableId) {
      toast({
        title: "Missing Selection",
        description: "Please select both a menu group and a table",
        variant: "destructive"
      });
      return;
    }

    try {
      setGenerating('single');
      const selectedGroup = menuGroups.find(g => g.id === selectedGroupId);
      const selectedTable = tables.find(t => t.id === selectedTableId);
      
      if (!selectedGroup || !selectedTable) return;

      const url = `${BASE_URL}/public-menu/${restaurantSlug}/${selectedTable.slug}?group=${selectedGroupId}`;
      const dataUrl = await generateQRCodeDataUrl(url);

      setQRCodes(prev => ({
        ...prev,
        single: {
          type: 'single',
          url,
          dataUrl,
          name: `${selectedTable.name} - ${selectedGroup.name}`
        }
      }));

      toast({
        title: "QR Code Generated",
        description: `Single menu group QR code created successfully`
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateMultipleGroups = async () => {
    if (selectedGroupIds.length === 0 || !selectedTableId) {
      toast({
        title: "Missing Selection",
        description: "Please select at least one menu group and a table",
        variant: "destructive"
      });
      return;
    }

    try {
      setGenerating('multi');
      const selectedTable = tables.find(t => t.id === selectedTableId);
      if (!selectedTable) return;

      const groupParams = selectedGroupIds.join(',');
      const url = `${BASE_URL}/menu-select/${restaurantSlug}/${selectedTable.slug}?groups=${groupParams}`;
      const dataUrl = await generateQRCodeDataUrl(url);

      const selectedNames = menuGroups
        .filter(g => selectedGroupIds.includes(g.id))
        .map(g => g.name)
        .join(', ');

      setQRCodes(prev => ({
        ...prev,
        multi: {
          type: 'multi',
          url,
          dataUrl,
          name: `${selectedTable.name} - ${selectedNames}`
        }
      }));

      toast({
        title: "QR Code Generated",
        description: `Multiple menu groups QR code created successfully`
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateFullMenu = async () => {
    if (!selectedTableId) {
      toast({
        title: "Missing Selection",
        description: "Please select a table",
        variant: "destructive"
      });
      return;
    }

    try {
      setGenerating('full');
      const selectedTable = tables.find(t => t.id === selectedTableId);
      if (!selectedTable) return;

      const url = `${BASE_URL}/public-menu/${restaurantSlug}/${selectedTable.slug}?mode=full`;
      const dataUrl = await generateQRCodeDataUrl(url);

      setQRCodes(prev => ({
        ...prev,
        full: {
          type: 'full',
          url,
          dataUrl,
          name: `${selectedTable.name} - Full Menu`
        }
      }));

      toast({
        title: "QR Code Generated",
        description: `Full menu QR code created successfully`
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const downloadQRCode = (qrData: QRCodeData) => {
    const link = document.createElement('a');
    link.download = `${qrData.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
    link.href = qrData.dataUrl;
    link.click();

    toast({
      title: "Download Started",
      description: `QR code downloaded successfully`
    });
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <QrCode className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading QR Generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate QR codes for your menu with different configurations
        </p>
      </div>

      {/* Table Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            Select Table
          </CardTitle>
          <CardDescription>Choose which table this QR code is for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Table</Label>
            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
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
        </CardContent>
      </Card>

      {/* QR Code Types */}
      <Accordion type="single" collapsible className="space-y-4">
        {/* Single Menu Group */}
        <AccordionItem value="single" className="border rounded-lg px-6">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <MenuIcon className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Single Menu Group QR Code</div>
                <div className="text-sm text-muted-foreground">Direct customers to one specific menu section</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Menu Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose menu group" />
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
              disabled={generating === 'single' || !selectedGroupId || !selectedTableId}
              className="w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {generating === 'single' ? 'Generating...' : 'Generate QR Code'}
            </Button>

            {qrCodes.single && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center space-y-4">
                  <img
                    src={qrCodes.single.dataUrl}
                    alt="QR Code"
                    className="mx-auto w-64 h-64 border-4 border-background rounded-lg shadow-lg"
                  />
                  <div>
                    <p className="font-semibold">{qrCodes.single.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">{qrCodes.single.url}</p>
                  </div>
                  <Button onClick={() => downloadQRCode(qrCodes.single!)} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Multiple Menu Groups */}
        <AccordionItem value="multi" className="border rounded-lg px-6">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Grid3x3 className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Multiple Menu Groups QR Code</div>
                <div className="text-sm text-muted-foreground">Let customers choose from selected menu sections</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Menu Groups</Label>
              <div className="grid gap-2">
                {menuGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => toggleGroupSelection(group.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedGroupIds.includes(group.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{group.name}</span>
                      {selectedGroupIds.includes(group.id) && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedGroupIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedGroupIds.length} group(s) selected
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerateMultipleGroups}
              disabled={generating === 'multi' || selectedGroupIds.length === 0 || !selectedTableId}
              className="w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {generating === 'multi' ? 'Generating...' : 'Generate QR Code'}
            </Button>

            {qrCodes.multi && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center space-y-4">
                  <img
                    src={qrCodes.multi.dataUrl}
                    alt="QR Code"
                    className="mx-auto w-64 h-64 border-4 border-background rounded-lg shadow-lg"
                  />
                  <div>
                    <p className="font-semibold">{qrCodes.multi.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">{qrCodes.multi.url}</p>
                  </div>
                  <Button onClick={() => downloadQRCode(qrCodes.multi!)} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Full Menu */}
        <AccordionItem value="full" className="border rounded-lg px-6">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <MenuIcon className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Full Restaurant Menu QR Code</div>
                <div className="text-sm text-muted-foreground">Show all menu groups together</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              This QR code will display your complete menu with all menu groups visible.
            </p>

            <Button
              onClick={handleGenerateFullMenu}
              disabled={generating === 'full' || !selectedTableId}
              className="w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {generating === 'full' ? 'Generating...' : 'Generate QR Code'}
            </Button>

            {qrCodes.full && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center space-y-4">
                  <img
                    src={qrCodes.full.dataUrl}
                    alt="QR Code"
                    className="mx-auto w-64 h-64 border-4 border-background rounded-lg shadow-lg"
                  />
                  <div>
                    <p className="font-semibold">{qrCodes.full.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">{qrCodes.full.url}</p>
                  </div>
                  <Button onClick={() => downloadQRCode(qrCodes.full!)} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Single Group:</strong> Direct customers to one specific menu (e.g., Drinks only)</li>
            <li><strong>Multiple Groups:</strong> Let customers choose between selected menus (e.g., Lunch or Dinner)</li>
            <li><strong>Full Menu:</strong> Show everything at once - best for comprehensive browsing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuQRGenerator;
