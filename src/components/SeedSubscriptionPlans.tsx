import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, CheckCircle } from 'lucide-react';

const SeedSubscriptionPlans = () => {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const { toast } = useToast();

  const defaultPlans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small restaurants getting started',
      price: 15000,
      currency: 'RWF',
      billing_interval: 'monthly',
      trial_days: 14,
      max_tables: 5,
      max_menu_items: 50,
      features: [
        'Up to 50 menu items',
        'Basic menu customization',
        'QR code menu',
        'Basic analytics',
        'Email support'
      ],
      is_active: true,
      display_order: 1
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Best for growing restaurants with more features',
      price: 25000,
      currency: 'RWF',
      billing_interval: 'monthly',
      trial_days: 14,
      max_tables: 20,
      max_menu_items: 200,
      features: [
        'Up to 200 menu items',
        'Advanced menu customization',
        'QR code menu',
        'Advanced analytics',
        'Multiple menu categories',
        'Custom branding',
        'Priority email support'
      ],
      is_active: true,
      display_order: 2
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete solution for established restaurants',
      price: 40000,
      currency: 'RWF',
      billing_interval: 'monthly',
      trial_days: 30,
      max_tables: null, // Unlimited
      max_menu_items: null, // Unlimited
      features: [
        'Unlimited menu items',
        'Full menu customization',
        'QR code menu',
        'Advanced analytics & reports',
        'Multiple locations',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Staff management',
        'Inventory tracking'
      ],
      is_active: true,
      display_order: 3
    }
  ];

  const seedPlans = async () => {
    try {
      setSeeding(true);

      // Check if plans already exist
      const { data: existingPlans, error: checkError } = await supabase
        .from('subscription_plans')
        .select('*');

      if (checkError) throw checkError;

      if (existingPlans && existingPlans.length > 0) {
        toast({
          title: 'Plans Already Exist',
          description: `Found ${existingPlans.length} existing subscription plans`,
        });
        setSeeded(true);
        return;
      }

      // Insert the default plans
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert(defaultPlans)
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Created ${data.length} subscription plans successfully`,
      });

      setSeeded(true);
    } catch (error: any) {
      console.error('Error seeding plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed subscription plans: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Seed Subscription Plans
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Initialize the system with default subscription plans for restaurants.
          </p>
          
          <div className="space-y-2">
            <h4 className="font-medium">Default Plans:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Starter - 15,000 RWF/month (up to 50 menu items)</li>
              <li>• Professional - 25,000 RWF/month (up to 200 menu items)</li>
              <li>• Enterprise - 40,000 RWF/month (unlimited)</li>
            </ul>
          </div>

          {seeded ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">Subscription plans have been seeded!</span>
            </div>
          ) : (
            <Button onClick={seedPlans} disabled={seeding}>
              {seeding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Plans...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Default Plans
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeedSubscriptionPlans;