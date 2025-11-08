import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { RestaurantSidebar } from "@/components/RestaurantSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Phone, 
  MapPin, 
  MessageSquare,
  Mail,
  Save
} from "lucide-react";
import { LoadingTracker } from "@/utils/debugUtils";

interface RestaurantData {
  name: string;
  email: string;
  phone: string | null;
  whatsapp_number: string;
  logo_url: string | null;
}

const Restaurants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [restaurantData, setRestaurantData] = useState<RestaurantData>({
    name: "",
    email: "",
    phone: "",
    whatsapp_number: "",
    logo_url: ""
  });

  useEffect(() => {
    loadRestaurantData();
  }, [user]);

  const loadRestaurantData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    LoadingTracker.startLoading('Restaurants');
    try {
      console.log('Loading restaurant data for user:', user.id);
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('name, email, phone, whatsapp_number, logo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Restaurant data loaded:', data);

      if (data) {
        setRestaurantData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          whatsapp_number: data.whatsapp_number || "",
          logo_url: data.logo_url || ""
        });
      } else {
        console.log('No restaurant data found for user:', user.id);
        toast({
          title: "No restaurant data found",
          description: "Please ensure your restaurant profile is set up correctly",
          variant: "destructive"
        });
      }
      LoadingTracker.endLoading('Restaurants', true);
    } catch (error: any) {
      LoadingTracker.endLoading('Restaurants', false);
      console.error('Error loading restaurant data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load restaurant data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      setSaving(false);
      return;
    }

    try {
      console.log('Updating restaurant data for user:', user.id);
      console.log('Update data:', {
        name: restaurantData.name,
        phone: restaurantData.phone,
        whatsapp_number: restaurantData.whatsapp_number,
        logo_url: restaurantData.logo_url
      });

      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name: restaurantData.name,
          phone: restaurantData.phone,
          whatsapp_number: restaurantData.whatsapp_number,
          logo_url: restaurantData.logo_url
        })
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Restaurant data updated successfully:', data);

      toast({
        title: "Profile Updated",
        description: "Your restaurant profile has been updated successfully."
      });
    } catch (error: any) {
      console.error('Error updating restaurant data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <RestaurantSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Restaurant Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your restaurant information and contact details</p>
            </div>
          </header>

          <div className="flex-1 space-y-6 p-4 pt-6">
            {loading ? (
              <div className="text-center">Loading restaurant data...</div>
            ) : (
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Restaurant Information
                  </CardTitle>
                  <CardDescription>
                    Update your restaurant information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Restaurant Name *
                        </Label>
                        <Input
                          id="name"
                          value={restaurantData.name}
                          onChange={(e) => setRestaurantData(prev => ({...prev, name: e.target.value}))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={restaurantData.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed. Contact support if needed.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={restaurantData.phone || ""}
                          onChange={(e) => setRestaurantData(prev => ({...prev, phone: e.target.value}))}
                          placeholder="+1234567890"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          WhatsApp Number *
                        </Label>
                        <Input
                          id="whatsapp_number"
                          value={restaurantData.whatsapp_number}
                          onChange={(e) => setRestaurantData(prev => ({...prev, whatsapp_number: e.target.value}))}
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="logo_url">
                        Logo URL (Optional)
                      </Label>
                      <Input
                        id="logo_url"
                        value={restaurantData.logo_url || ""}
                        onChange={(e) => setRestaurantData(prev => ({...prev, logo_url: e.target.value}))}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <Save className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Restaurant Profile
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Restaurants;