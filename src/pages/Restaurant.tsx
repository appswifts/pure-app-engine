import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { RestaurantSidebar } from "@/components/RestaurantSidebar";
import { Store, Plus, Edit, MapPin, Phone, Clock } from "lucide-react";

const Restaurant = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <RestaurantSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Restaurant Management</h1>
              <p className="text-sm text-muted-foreground">Setup and manage your restaurant information</p>
            </div>
          </header>

          <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="grid gap-6">
              {/* Restaurant Setup */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Restaurant Information
                      </CardTitle>
                      <CardDescription>Basic information about your restaurant</CardDescription>
                    </div>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-name">Restaurant Name</Label>
                      <Input id="restaurant-name" placeholder="Enter restaurant name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cuisine-type">Cuisine Type</Label>
                      <Input id="cuisine-type" placeholder="e.g., Italian, Chinese, Mexican" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe your restaurant" rows={3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input id="phone" placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </Label>
                      <Input id="address" placeholder="Restaurant address" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operating Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Operating Hours
                  </CardTitle>
                  <CardDescription>Set your restaurant's operating hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-24 font-medium">{day}</div>
                        <Input className="w-32" placeholder="9:00 AM" />
                        <span className="text-muted-foreground">to</span>
                        <Input className="w-32" placeholder="10:00 PM" />
                        <Button variant="outline" size="sm">Closed</Button>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4">Save Hours</Button>
                </CardContent>
              </Card>

              {/* Table Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Table Configuration</CardTitle>
                      <CardDescription>Manage your restaurant tables</CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Table
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Table Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure your restaurant tables and generate QR codes for each table.
                    </p>
                    <Button>Coming Soon</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Restaurant;