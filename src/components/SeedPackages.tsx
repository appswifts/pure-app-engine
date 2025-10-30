import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Check } from 'lucide-react';

const subscriptionPackages = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small restaurants getting started',
    price: 15000, // 15,000 RWF
    currency: 'RWF',
    billing_interval: 'monthly',
    trial_days: 14,
    features: {
      menu_items: 'Up to 50 menu items',
      customization: 'Basic menu customization',
      qr_code: 'QR code menu',
      analytics: 'Basic analytics',
      support: 'Email support'
    },
    is_active: true,
    max_menu_items: 50,
    max_tables: 5
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing restaurants',
    price: 25000, // 25,000 RWF
    currency: 'RWF',
    billing_interval: 'monthly',
    trial_days: 14,
    features: {
      menu_items: 'Up to 200 menu items',
      customization: 'Advanced menu customization',
      qr_code: 'QR code menu',
      analytics: 'Advanced analytics',
      categories: 'Multiple menu categories',
      branding: 'Custom branding',
      support: 'Priority email support'
    },
    is_active: true,
    max_menu_items: 200,
    max_tables: 15
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large establishments',
    price: 40000, // 40,000 RWF
    currency: 'RWF',
    billing_interval: 'monthly',
    trial_days: 30,
    features: {
      menu_items: 'Unlimited menu items',
      customization: 'Full menu customization',
      qr_code: 'QR code menu',
      analytics: 'Advanced analytics & reports',
      locations: 'Multiple locations',
      branding: 'Custom branding',
      api: 'API access',
      support: 'Dedicated support',
      staff: 'Staff management',
      inventory: 'Inventory tracking'
    },
    is_active: true,
    max_menu_items: 999999,
    max_tables: 100
  }
];

export const SeedPackages: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const { toast } = useToast();

  const seedPackages = async () => {
    try {
      setIsSeeding(true);

      // Check if packages already exist
      const { data: existingPackages, error: checkError } = await supabase
        .from('subscription_plans')
        .select('*');

      if (checkError) {
        throw new Error(`Error checking existing packages: ${checkError.message}`);
      }

      if (existingPackages && existingPackages.length > 0) {
        toast({
          title: "Packages Already Exist",
          description: `Found ${existingPackages.length} existing subscription packages.`,
          variant: "default",
        });
        setIsSeeded(true);
        return;
      }

      // Transform packages for database insertion
      const packagesForDB = subscriptionPackages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        currency: pkg.currency,
        billing_interval: pkg.billing_interval,
        trial_days: pkg.trial_days,
        features: Object.values(pkg.features),
        is_active: pkg.is_active,
        max_menu_items: pkg.max_menu_items,
        max_tables: pkg.max_tables
      }));

      // Insert subscription packages
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert(packagesForDB)
        .select();

      if (error) {
        throw new Error(`Error inserting packages: ${error.message}`);
      }

      toast({
        title: "Success!",
        description: `Successfully created ${data.length} subscription packages.`,
        variant: "default",
      });

      setIsSeeded(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed packages",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Seed Subscription Packages
        </CardTitle>
        <CardDescription>
          Add default subscription packages to the database for testing and development.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {subscriptionPackages.map((pkg, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{pkg.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {pkg.price.toLocaleString()} RWF/month • {Object.keys(pkg.features).length} features
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{pkg.trial_days} days trial</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={seedPackages}
            disabled={isSeeding || isSeeded}
            size="lg"
            className="min-w-[200px]"
          >
            {isSeeding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Seeding Packages...
              </>
            ) : isSeeded ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Packages Seeded
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Seed Packages
              </>
            )}
          </Button>
        </div>

        {isSeeded && (
          <div className="text-center text-sm text-muted-foreground">
            Packages have been added to the database. You can now view them on the pricing page.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeedPackages;
