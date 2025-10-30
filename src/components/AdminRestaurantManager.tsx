import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  slug: string;
  subscription_status: string;
  created_at: string;
  user_id: string;
  notes: string;
}

const AdminRestaurantManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    notes: '',
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async () => {
    try {
      // Generate unique slug from restaurant name
      const baseSlug = formData.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug uniqueness
      while (true) {
        const { data: existingRestaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (!existingRestaurant) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const { error } = await supabase
        .from('restaurants')
        .insert({
          ...formData,
          slug,
          subscription_status: 'active', // Default to active
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant created successfully",
      });

      setShowCreateDialog(false);
      resetForm();
      loadRestaurants();
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to create restaurant",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRestaurant = async () => {
    if (!editingRestaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp_number: formData.whatsapp_number,
          notes: formData.notes,
        })
        .eq('id', editingRestaurant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant updated successfully",
      });

      setShowEditDialog(false);
      setEditingRestaurant(null);
      resetForm();
      loadRestaurants();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to update restaurant",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!editingRestaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', editingRestaurant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant deleted successfully",
      });

      setShowDeleteDialog(false);
      setEditingRestaurant(null);
      loadRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to delete restaurant",
        variant: "destructive",
      });
    }
  };

  const toggleRestaurantAccess = async (restaurant: Restaurant) => {
    try {
      const newStatus = restaurant.subscription_status === 'active' ? 'inactive' : 'active';
      
      console.log(`Toggling restaurant ${restaurant.id} from ${restaurant.subscription_status} to ${newStatus}`);
      
      const { data, error } = await supabase
        .from('restaurants')
        .update({ subscription_status: newStatus })
        .eq('id', restaurant.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update result:', data);

      // Update local state immediately
      setRestaurants(prev => prev.map(r => 
        r.id === restaurant.id 
          ? { ...r, subscription_status: newStatus }
          : r
      ));

      toast({
        title: "Success",
        description: `Restaurant ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`,
      });

    } catch (error) {
      console.error('Error updating restaurant access:', error);
      toast({
        title: "Error",
        description: `Failed to update restaurant access: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      whatsapp_number: '',
      notes: '',
    });
  };

  const openEditDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      email: restaurant.email,
      phone: restaurant.phone,
      whatsapp_number: restaurant.whatsapp_number,
      notes: restaurant.notes || '',
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowDeleteDialog(true);
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Restaurant Management</h1>
            <p className="text-muted-foreground">Manage restaurants and their menu access</p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Restaurant</DialogTitle>
              <DialogDescription>
                Add a new restaurant to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter restaurant name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="restaurant@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+250 xxx xxx xxx"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="+250 xxx xxx xxx"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this restaurant"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRestaurant}>
                Create Restaurant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restaurants.filter(r => r.subscription_status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restaurants.filter(r => r.subscription_status !== 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurants</CardTitle>
          <CardDescription>
            Manage restaurant access to their menu systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Restaurant Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Menu Access</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading restaurants...
                    </TableCell>
                  </TableRow>
                ) : filteredRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No restaurants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <Globe className="h-3 w-3 mr-1" />
                            /{restaurant.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {restaurant.email}
                          </div>
                          {restaurant.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1" />
                              {restaurant.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={restaurant.subscription_status === 'active' ? 'default' : 'secondary'}
                        >
                          {restaurant.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={restaurant.subscription_status === 'active'}
                            onCheckedChange={() => toggleRestaurantAccess(restaurant)}
                          />
                          <span className="text-sm">
                            {restaurant.subscription_status === 'active' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(restaurant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(restaurant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(restaurant)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
            <DialogDescription>
              Update restaurant information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Restaurant Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRestaurant}>
              Update Restaurant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingRestaurant?.name}"? This action cannot be undone.
              All menu items, categories, and other data associated with this restaurant will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRestaurant}>
              Delete Restaurant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRestaurantManager;