import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Crown,
  Zap
} from 'lucide-react';

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
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export const AdminSubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'RWF',
    billing_interval: 'monthly',
    trial_days: '14',
    max_menu_items: '-1',
    max_tables: '-1',
    features: '',
    is_active: true,
    display_order: '0',
  });
  const { toast } = useToast();

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
      setPlans(data || []);
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
      const features = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

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
          features: features,
          is_active: formData.is_active,
          display_order: parseInt(formData.display_order),
        });

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
      const features = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

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
          features: features,
          is_active: formData.is_active,
          display_order: parseInt(formData.display_order),
        })
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
    if (!confirm('Are you sure you want to delete this plan?')) return;

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

  const toggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Plan ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update plan status',
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
      features: plan.features.join('\n'),
      is_active: plan.is_active,
      display_order: plan.display_order.toString(),
    });
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
      features: '',
      is_active: true,
      display_order: '0',
    });
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
          <Label>Billing Interval</Label>
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
            placeholder="-1 for unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Tables</Label>
          <Input
            type="number"
            value={formData.max_tables}
            onChange={(e) => setFormData({ ...formData, max_tables: e.target.value })}
            placeholder="-1 for unlimited"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Features (one per line)</Label>
        <Textarea
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="Unlimited orders&#10;Priority support&#10;Custom branding"
          rows={5}
        />
      </div>

      <div className="flex items-center gap-2">
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
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground">Create and manage subscription plans</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
              </DialogTitle>
            </DialogHeader>
            <PlanForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
            {plan.name.toLowerCase().includes('premium') && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
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
                {plan.trial_days > 0 && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {plan.trial_days} days free trial
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Features:</div>
                <ul className="space-y-1">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-sm text-muted-foreground">
                      +{plan.features.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>

              {/* Limits */}
              <div className="pt-4 border-t space-y-1 text-sm">
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
                  onClick={() => {
                    startEdit(plan);
                    setShowCreateDialog(true);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(plan.id, plan.is_active)}
                >
                  {plan.is_active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
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

        {plans.length === 0 && (
          <Card className="col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No subscription plans yet</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptionPlans;
