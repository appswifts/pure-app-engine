import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubscriptionPackage {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_restaurants: number | null;
  max_menu_items: number | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  feature_whatsapp_orders: boolean;
  feature_custom_branding: boolean;
  feature_analytics: boolean;
  feature_api_access: boolean;
  feature_priority_support: boolean;
  feature_multiple_restaurants: boolean;
  feature_qr_codes: boolean;
  feature_public_menu_access: boolean;
}

const SubscriptionPackages: React.FC = () => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    max_restaurants: '',
    max_menu_items: '',
    features: '',
    is_active: true,
    sort_order: '0',
    feature_whatsapp_orders: false,
    feature_custom_branding: false,
    feature_analytics: false,
    feature_api_access: false,
    feature_priority_support: false,
    feature_multiple_restaurants: false,
    feature_qr_codes: true,
    feature_public_menu_access: true
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('subscription_packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        title: "Error",
        description: "Failed to load packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (pkg?: SubscriptionPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        price_monthly: pkg.price_monthly.toString(),
        price_yearly: pkg.price_yearly.toString(),
        max_restaurants: pkg.max_restaurants?.toString() || '',
        max_menu_items: pkg.max_menu_items?.toString() || '',
        features: pkg.features.join('\n'),
        is_active: pkg.is_active,
        sort_order: pkg.sort_order.toString(),
        feature_whatsapp_orders: pkg.feature_whatsapp_orders || false,
        feature_custom_branding: pkg.feature_custom_branding || false,
        feature_analytics: pkg.feature_analytics || false,
        feature_api_access: pkg.feature_api_access || false,
        feature_priority_support: pkg.feature_priority_support || false,
        feature_multiple_restaurants: pkg.feature_multiple_restaurants || false,
        feature_qr_codes: pkg.feature_qr_codes !== undefined ? pkg.feature_qr_codes : true,
        feature_public_menu_access: pkg.feature_public_menu_access !== undefined ? pkg.feature_public_menu_access : true
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        price_monthly: '',
        price_yearly: '',
        max_restaurants: '',
        max_menu_items: '',
        features: '',
        is_active: true,
        sort_order: (packages.length + 1).toString(),
        feature_whatsapp_orders: false,
        feature_custom_branding: false,
        feature_analytics: false,
        feature_api_access: false,
        feature_priority_support: false,
        feature_multiple_restaurants: false,
        feature_qr_codes: true,
        feature_public_menu_access: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const packageData = {
        name: formData.name,
        description: formData.description || null,
        price_monthly: parseFloat(formData.price_monthly) || 0,
        price_yearly: parseFloat(formData.price_yearly) || 0,
        currency: 'RWF',
        max_restaurants: formData.max_restaurants ? parseInt(formData.max_restaurants) : null,
        max_menu_items: formData.max_menu_items ? parseInt(formData.max_menu_items) : null,
        features: featuresArray,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
        feature_whatsapp_orders: formData.feature_whatsapp_orders,
        feature_custom_branding: formData.feature_custom_branding,
        feature_analytics: formData.feature_analytics,
        feature_api_access: formData.feature_api_access,
        feature_priority_support: formData.feature_priority_support,
        feature_multiple_restaurants: formData.feature_multiple_restaurants,
        feature_qr_codes: formData.feature_qr_codes,
        feature_public_menu_access: formData.feature_public_menu_access
      };

      if (editingPackage) {
        // Update
        const { error } = await (supabase as any)
          .from('subscription_packages')
          .update(packageData)
          .eq('id', editingPackage.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Package updated successfully",
        });
      } else {
        // Create
        const { error } = await (supabase as any)
          .from('subscription_packages')
          .insert([packageData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Package created successfully",
        });
      }

      handleCloseDialog();
      loadPackages();
    } catch (error: any) {
      console.error('Error saving package:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" package?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('subscription_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package deleted successfully",
      });

      loadPackages();
    } catch (error: any) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (pkg: SubscriptionPackage) => {
    try {
      const { error } = await (supabase as any)
        .from('subscription_packages')
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Package ${!pkg.is_active ? 'activated' : 'deactivated'}`,
      });

      loadPackages();
    } catch (error: any) {
      console.error('Error toggling package:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    }
  };

  if (loading && packages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Subscription Packages
          </h1>
          <p className="text-muted-foreground mt-1">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Subscription Packages
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription tiers and pricing
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={!pkg.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {pkg.description}
                  </CardDescription>
                </div>
                {!pkg.is_active && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div>
                <div className="text-3xl font-bold">
                  {pkg.price_monthly.toLocaleString()} {pkg.currency}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
                {pkg.price_yearly > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {pkg.price_yearly.toLocaleString()} {pkg.currency}/year
                  </div>
                )}
              </div>

              {/* Limits */}
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Restaurants:</strong>{' '}
                  {pkg.max_restaurants ? pkg.max_restaurants : 'Unlimited'}
                </div>
                <div>
                  <strong>Menu Items:</strong>{' '}
                  {pkg.max_menu_items ? pkg.max_menu_items : 'Unlimited'}
                </div>
              </div>

              {/* Enabled Features */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">Enabled Features:</div>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.feature_qr_codes && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">QR Codes</span>
                  )}
                  {pkg.feature_whatsapp_orders && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">WhatsApp</span>
                  )}
                  {pkg.feature_analytics && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Analytics</span>
                  )}
                  {pkg.feature_multiple_restaurants && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Multi Restaurant</span>
                  )}
                  {pkg.feature_custom_branding && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Branding</span>
                  )}
                  {pkg.feature_priority_support && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Priority Support</span>
                  )}
                  {pkg.feature_api_access && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">API Access</span>
                  )}
                  {pkg.feature_public_menu_access && (
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded">Menu Access</span>
                  )}
                </div>
                {pkg.features.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    +{pkg.features.length} custom features
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(pkg)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={pkg.is_active ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(pkg)}
                  className="flex-1"
                >
                  {pkg.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(pkg.id, pkg.name)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? 'Update the subscription package details'
                : 'Create a new subscription package'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic"
                  required
                />
              </div>

              {/* Sort Order */}
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Perfect for small restaurants"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Monthly Price */}
              <div>
                <Label htmlFor="price_monthly">Monthly Price (RWF) *</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  placeholder="15000"
                  required
                />
              </div>

              {/* Yearly Price */}
              <div>
                <Label htmlFor="price_yearly">Yearly Price (RWF)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                  placeholder="150000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Max Restaurants */}
              <div>
                <Label htmlFor="max_restaurants">Max Restaurants</Label>
                <Input
                  id="max_restaurants"
                  type="number"
                  value={formData.max_restaurants}
                  onChange={(e) => setFormData({ ...formData, max_restaurants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Empty = Unlimited
                </p>
              </div>

              {/* Max Menu Items */}
              <div>
                <Label htmlFor="max_menu_items">Max Menu Items</Label>
                <Input
                  id="max_menu_items"
                  type="number"
                  value={formData.max_menu_items}
                  onChange={(e) => setFormData({ ...formData, max_menu_items: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Empty = Unlimited
                </p>
              </div>
            </div>

            {/* Features */}
            <div>
              <Label htmlFor="features">Additional Features (one per line)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Premium Support&#10;Custom Domain&#10;Advanced Reports"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Enter custom features on a new line
              </p>
            </div>

            {/* Feature Toggles */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Feature Access Controls</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_qr_codes"
                    checked={formData.feature_qr_codes}
                    onChange={(e) => setFormData({ ...formData, feature_qr_codes: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_qr_codes" className="cursor-pointer font-normal">
                    QR Code Menus
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_public_menu_access"
                    checked={formData.feature_public_menu_access}
                    onChange={(e) => setFormData({ ...formData, feature_public_menu_access: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_public_menu_access" className="cursor-pointer font-normal">
                    Public Menu Access
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_whatsapp_orders"
                    checked={formData.feature_whatsapp_orders}
                    onChange={(e) => setFormData({ ...formData, feature_whatsapp_orders: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_whatsapp_orders" className="cursor-pointer font-normal">
                    WhatsApp Orders
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_analytics"
                    checked={formData.feature_analytics}
                    onChange={(e) => setFormData({ ...formData, feature_analytics: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_analytics" className="cursor-pointer font-normal">
                    Analytics Dashboard
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_multiple_restaurants"
                    checked={formData.feature_multiple_restaurants}
                    onChange={(e) => setFormData({ ...formData, feature_multiple_restaurants: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_multiple_restaurants" className="cursor-pointer font-normal">
                    Multiple Restaurants
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_custom_branding"
                    checked={formData.feature_custom_branding}
                    onChange={(e) => setFormData({ ...formData, feature_custom_branding: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_custom_branding" className="cursor-pointer font-normal">
                    Custom Branding
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_priority_support"
                    checked={formData.feature_priority_support}
                    onChange={(e) => setFormData({ ...formData, feature_priority_support: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_priority_support" className="cursor-pointer font-normal">
                    Priority Support
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="feature_api_access"
                    checked={formData.feature_api_access}
                    onChange={(e) => setFormData({ ...formData, feature_api_access: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="feature_api_access" className="cursor-pointer font-normal">
                    API Access
                  </Label>
                </div>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (visible to users)
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPackages;
