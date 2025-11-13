import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QrCode, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import QRCode from "qrcode";
import { BASE_URL, QR_CODE_OPTIONS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Table {
  id: string;
  name: string;
  slug: string;
}

const SimpleMenuQRGenerator = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [qrCodeUrl, setQRCodeUrl] = useState<string>("");
  const [qrCodeDataUrl, setQRCodeDataUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  
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
      
      // Load restaurant info and tables in parallel
      const [restaurantResult, tablesResult] = await Promise.all([
        supabase
          .from("restaurants")
          .select("slug")
          .eq("id", restaurantId)
          .single(),
        supabase
          .from("tables")
          .select("id, name, slug")
          .eq("restaurant_id", restaurantId)
          .order("name")
      ]);

      if (restaurantResult.error) throw restaurantResult.error;
      if (tablesResult.error) throw tablesResult.error;

      setRestaurantSlug(restaurantResult.data.slug);
      setTables(tablesResult.data || []);
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

  const generateQR = async () => {
    if (!selectedTableId) {
      toast({
        title: "Missing Selection",
        description: "Please select a table",
        variant: "destructive"
      });
      return;
    }

    try {
      setGenerating(true);
      const selectedTable = tables.find(t => t.id === selectedTableId);
      
      if (!selectedTable) return;

      // Simple URL - /menu/{restaurant}/{table}
      const menuUrl = `${BASE_URL}/menu/${restaurantSlug}/${selectedTable.slug}`;

      // Generate QR code
      const dataUrl = await QRCode.toDataURL(menuUrl, QR_CODE_OPTIONS);

      setQRCodeUrl(menuUrl);
      setQRCodeDataUrl(dataUrl);

      toast({
        title: "QR Code Generated",
        description: `Menu QR code for ${selectedTable.name} created successfully`,
      });
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

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const selectedTable = tables.find(t => t.id === selectedTableId);
    const link = document.createElement('a');
    link.download = `menu-qr-${selectedTable?.name || 'table'}.png`;
    link.href = qrCodeDataUrl;
    link.click();

    toast({
      title: "Downloaded",
      description: "QR code image downloaded successfully",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generate Menu QR Code</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Generate Menu QR Code
        </CardTitle>
        <CardDescription>
          Create a QR code for your menu. If you have menu groups, the first group will be shown automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Table Selection */}
        <div className="space-y-2">
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
          {tables.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tables found. Please create tables first.
            </p>
          )}
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateQR} 
          disabled={!selectedTableId || generating}
          className="w-full"
        >
          {generating ? "Generating..." : "Generate QR Code"}
        </Button>

        {/* QR Code Display */}
        {qrCodeDataUrl && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Menu QR Code" 
                  className="w-64 h-64"
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {tables.find(t => t.id === selectedTableId)?.name}
                </p>
                <p className="text-xs text-muted-foreground break-all max-w-md">
                  {qrCodeUrl}
                </p>
              </div>

              <Button 
                onClick={handleDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-muted/50 p-4 rounded-lg text-sm">
          <p className="font-medium mb-2">How it works:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Scan QR code → Opens your menu</li>
            <li>• If you have groups → First group shown automatically</li>
            <li>• If no groups → All menu items shown</li>
            <li>• Simple and consistent experience for customers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleMenuQRGenerator;
