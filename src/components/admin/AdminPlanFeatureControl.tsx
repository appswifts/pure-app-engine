import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Shield,
  Zap,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import { AVAILABLE_FEATURES, FEATURE_INFO, getFeaturesByCategory, type FeatureKey } from '@/services/accessControlService';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: string;
  trial_days: number;
  max_menu_items: number;
  max_tables: number;
  features: FeatureKey[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export const AdminPlanFeatureControl: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFeaturesDialog, setShowFeaturesDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'RWF',
    billing_interval: 'monthly',
    trial_days: '14',
    max_menu_items: '-1',
    max_tables: '-1',
    is_active: true,
    display_order: '0',
  });
  const { toast } = useToast();

  const featuresByCategory = getFeaturesByCategory();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      // Type cast features from Json to FeatureKey[]
      const typedPlans = (data || []).map(plan => ({
        ...plan,
        features: (plan.features as any) as FeatureKey[],
      }));
      setPlans(typedPlans);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .insert({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          currency: formData.currency,
          billing_interval: formData.billing_interval,
          trial_days: parseInt(formData.trial_days),
          max_menu_items: parseInt(formData.max_menu_items),
          max_tables: parseInt(formData.max_tables),
          features: selectedFeatures as any,
          is_active: formData.is_active,
          display_order: parseInt(formData.display_order),
        } as any);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subscription plan created successfully',
      });

      setShowCreateDialog(false);
      resetForm();
      loadPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create plan',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          currency: formData.currency,
          billing_interval: formData.billing_interval,
          trial_days: parseInt(formData.trial_days),
          max_menu_items: parseInt(formData.max_menu_items),
          max_tables: parseInt(formData.max_tables),
          features: selectedFeatures as any,
          is_active: formData.is_active,
          display_order: parseInt(formData.display_order),
        } as any)
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Plan updated successfully',
      });

      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update plan',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This may affect active subscriptions.')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Plan deleted successfully',
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete plan',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      trial_days: plan.trial_days.toString(),
      max_menu_items: plan.max_menu_items.toString(),
      max_tables: plan.max_tables.toString(),
      is_active: plan.is_active,
      display_order: plan.display_order.toString(),
    });
    setSelectedFeatures(plan.features || []);
    setShowCreateDialog(true);
  };

  const openFeaturesDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setSelectedFeatures(plan.features || []);
    setShowFeaturesDialog(true);
  };

  const saveFeaturesOnly = async () => {
    if (!editingPlan) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ features: selectedFeatures as any } as any)
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Features updated successfully',
      });

      setShowFeaturesDialog(false);
      setEditingPlan(null);
      loadPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update features',
        variant: 'destructive',
      });
    }
  };

  const toggleFeature = (feature: FeatureKey) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'RWF',
      billing_interval: 'monthly',
      trial_days: '14',
      max_menu_items: '-1',
      max_tables: '-1',
      is_active: true,
      display_order: '0',
    });
    setSelectedFeatures([]);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const PlanForm = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Plan Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Premium"
          />
        </div>
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the plan..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Price *</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="10000"
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Billing</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.billing_interval}
            onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Trial Days</Label>
          <Input
            type="number"
            value={formData.trial_days}
            onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Menu Items</Label>
          <Input
            type="number"
            value={formData.max_menu_items}
            onChange={(e) => setFormData({ ...formData, max_menu_items: e.target.value })}
            placeholder="-1 = unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Tables</Label>
          <Input
            type="number"
            value={formData.max_tables}
            onChange={(e) => setFormData({ ...formData, max_tables: e.target.value })}
            placeholder="-1 = unlimited"
          />
        </div>
      </div>

      {/* Feature Selection */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Features & Permissions</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedFeatures(Object.values(AVAILABLE_FEATURES))}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedFeatures([])}
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-semibold text-sm text-blue-600">{category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {features.map(({ key, info }) => (
                  <label
                    key={key}
                    className="flex items-start gap-2 p-2 rounded hover:bg-background cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(key)}
                      onChange={() => toggleFeature(key)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{info.name}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Selected: <strong>{selectedFeatures.length}</strong> feature{selectedFeatures.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="is_active">Active (visible to users)</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false);
            setEditingPlan(null);
            resetForm();
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={editingPlan ? handleUpdate : handleCreate}
          className="flex-1"
          disabled={!formData.name || !formData.price}
        >
          {editingPlan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Plan & Access Control
          </h2>
          <p className="text-muted-foreground">Manage subscription plans and feature access</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pricing */}
              <div>
                <div className="text-3xl font-bold">
                  {formatCurrency(plan.price, plan.currency)}
                </div>
                <div className="text-sm text-muted-foreground">
                  per {plan.billing_interval}
                </div>
              </div>

              {/* Features Count */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Zap className="h-4 w-4" />
                  {plan.features?.length || 0} Features Enabled
                </div>
              </div>

              {/* Limits */}
              <div className="pt-2 border-t space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Menu Items:</span>
                  <span className="font-medium">
                    {plan.max_menu_items === -1 ? 'Unlimited' : plan.max_menu_items}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tables:</span>
                  <span className="font-medium">
                    {plan.max_tables === -1 ? 'Unlimited' : plan.max_tables}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => startEdit(plan)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openFeaturesDialog(plan)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Features
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(plan.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
            </DialogTitle>
          </DialogHeader>
          <PlanForm />
        </DialogContent>
      </Dialog>

      {/* Features Dialog */}
      <Dialog open={showFeaturesDialog} onOpenChange={setShowFeaturesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Features: {editingPlan?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(featuresByCategory).map(([category, features]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-blue-600">{category}</h4>
                <div className="space-y-2">
                  {features.map(({ key, info }) => (
                    <label
                      key={key}
                      className="flex items-start gap-3 p-3 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(key)}
                        onChange={() => toggleFeature(key)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{info.name}</div>
                        <div className="text-sm text-muted-foreground">{info.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowFeaturesDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={saveFeaturesOnly} className="flex-1">
              Save Features
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlanFeatureControl;
