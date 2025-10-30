import { useState, useEffect } from "react";
import { Plus, Store, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { validateAndSanitizeInput, validateEmail, validateWhatsappNumber } from '@/lib/validation';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  subscription_status: string;
  trial_end_date: string | null;
}

interface RestaurantSwitcherProps {
  currentRestaurant: Restaurant | null;
  onRestaurantChange: (restaurant: Restaurant) => void;
  userId: string;
}

export default function RestaurantSwitcher({
  currentRestaurant,
  onRestaurantChange,
  userId,
}: RestaurantSwitcherProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp_number: "",
  });

  useEffect(() => {
    loadRestaurants();
  }, [userId]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setRestaurants(data || []);
      
      // If there's no current restaurant but we have restaurants, select the first one
      if (!currentRestaurant && data && data.length > 0) {
        onRestaurantChange(data[0]);
      }
    } catch (error: any) {
      console.error("Error loading restaurants:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate and sanitize inputs
    const sanitizedName = validateAndSanitizeInput(formData.name, 100);
    const sanitizedEmail = formData.email.trim().toLowerCase();
    const sanitizedPhone = validateAndSanitizeInput(formData.phone, 20);
    const sanitizedWhatsapp = formData.whatsapp_number 
      ? validateAndSanitizeInput(formData.whatsapp_number, 20) 
      : sanitizedPhone;
    
    if (!sanitizedName || sanitizedName.length < 2) {
      toast({
        title: "Error",
        description: "Restaurant name must be at least 2 characters",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!sanitizedPhone) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    if (!validateWhatsappNumber(sanitizedWhatsapp)) {
      toast({
        title: "Error",
        description: "Please enter a valid WhatsApp number with country code (e.g., +250788123456)",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Generate a unique slug (limit to 50 chars)
      const baseSlug = sanitizedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 50);
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists and make it unique - use maybeSingle() to avoid 406 error
      while (true) {
        const { data: existingRestaurant, error: checkError } = await supabase
          .from("restaurants")
          .select("id")
          .eq("slug", slug)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle no results
        
        if (checkError) {
          console.error('Slug check error:', checkError);
          throw new Error('Failed to check slug availability');
        }
        
        if (!existingRestaurant) break;
        
        slug = `${baseSlug}-${counter}`;
        counter++;
        
        // Safety limit to prevent infinite loops
        if (counter > 100) {
          throw new Error('Unable to generate unique slug');
        }
      }

      // Create the restaurant with sanitized data
      const { data: newRestaurant, error } = await supabase
        .from("restaurants")
        .insert({
          user_id: userId,
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          whatsapp_number: sanitizedWhatsapp,
          slug: slug,
          subscription_status: "trial",
          trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Restaurant "${sanitizedName}" created successfully!`,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        whatsapp_number: "",
      });
      
      setDialogOpen(false);
      
      // Reload restaurants and switch to the new one
      await loadRestaurants();
      if (newRestaurant) {
        onRestaurantChange(newRestaurant);
      }
    } catch (error: any) {
      console.error("Error creating restaurant:", error);
      
      let errorMessage = "Failed to create restaurant";
      
      // Provide more specific error messages
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        errorMessage = "A restaurant with this information already exists";
      } else if (error.message?.includes('unique constraint')) {
        errorMessage = "This restaurant name or email is already in use";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (restaurant: Restaurant) => {
    const status = restaurant.subscription_status;
    
    if (status === "active") {
      return <Badge className="bg-green-500">Active</Badge>;
    } else if (status === "trial") {
      const trialEnd = restaurant.trial_end_date ? new Date(restaurant.trial_end_date) : null;
      const daysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      
      if (daysLeft > 0) {
        return <Badge className="bg-blue-500">Trial ({daysLeft} days)</Badge>;
      } else {
        return <Badge className="bg-orange-500">Trial Expired</Badge>;
      }
    } else if (status === "grace_period") {
      return <Badge className="bg-yellow-500">Grace Period</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Store className="h-5 w-5 animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading restaurants...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="truncate max-w-[150px]">
                {currentRestaurant?.name || "Select Restaurant"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          <DropdownMenuLabel>Your Restaurants</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {restaurants.map((restaurant) => (
            <DropdownMenuItem
              key={restaurant.id}
              onClick={() => onRestaurantChange(restaurant)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {currentRestaurant?.id === restaurant.id && (
                  <Check className="h-4 w-4" />
                )}
                <span className="truncate">{restaurant.name}</span>
              </div>
              {getStatusBadge(restaurant)}
            </DropdownMenuItem>
          ))}
          {restaurants.length === 0 && (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No restaurants yet</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setDialogOpen(true);
                }}
                className="text-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Restaurant
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateRestaurant}>
                <DialogHeader>
                  <DialogTitle>Add New Restaurant</DialogTitle>
                  <DialogDescription>
                    Create a new restaurant profile. Each restaurant gets a 14-day free trial.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Restaurant Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="My Restaurant"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="restaurant@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+250788000000"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp_number: e.target.value })
                      }
                      placeholder="+250788000000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use the same as phone number
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Restaurant"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
