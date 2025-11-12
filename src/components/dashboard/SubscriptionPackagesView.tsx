import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, Crown, Star, Zap, CheckCircle, XCircle } from 'lucide-react';
import SubscriptionDialog from './SubscriptionDialog';

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

interface UserSubscription {
  id: string;
  package_name: string;
  status: string;
  expires_at: string | null;
}

const SubscriptionPackagesView: React.FC = () => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load active subscription packages
      const { data: packagesData, error: packagesError } = await (supabase as any)
        .from('subscription_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (packagesError) throw packagesError;
      setPackages((packagesData || []) as SubscriptionPackage[]);

      // Load user's current subscription (only truly active ones)
      const { data: subscriptionData, error: subscriptionError } = await (supabase as any)
        .from('user_subscriptions')
        .select('id, package_name, status, expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active')  // Only load active subscriptions, not pending
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError;
      }

      setUserSubscription(subscriptionData as UserSubscription | null);

      // Debug logging for subscription issues
      if (subscriptionData) {
        console.log('🔍 User subscription found:', {
          package: subscriptionData.package_name,
          status: subscriptionData.status,
          expires: subscriptionData.expires_at,
          user_id: user.id
        });
      } else {
        console.log('📋 No active subscription found for user:', user.id);
      }

    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      // Don't show error toast for subscription data - packages should still be visible
      // Only log the error and continue showing packages
    } finally {
      setLoading(false);
    }
  };

  const getPackageIcon = (packageName: string) => {
    const name = packageName.toLowerCase();
    if (name.includes('basic') || name.includes('starter')) return <Package className="h-5 w-5" />;
    if (name.includes('pro') || name.includes('professional')) return <Star className="h-5 w-5" />;
    if (name.includes('premium') || name.includes('enterprise')) return <Crown className="h-5 w-5" />;
    return <Zap className="h-5 w-5" />;
  };

  const getPackageColor = (packageName: string) => {
    const name = packageName.toLowerCase();
    if (name.includes('basic') || name.includes('starter')) return 'from-blue-50 to-blue-100 border-blue-200';
    if (name.includes('pro') || name.includes('professional')) return 'from-purple-50 to-purple-100 border-purple-200';
    if (name.includes('premium') || name.includes('enterprise')) return 'from-yellow-50 to-yellow-100 border-yellow-200';
    return 'from-green-50 to-green-100 border-green-200';
  };

  const isCurrentPackage = (packageName: string) => {
    return userSubscription?.package_name === packageName && userSubscription?.status === 'active';
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const getFeatureBadges = (pkg: SubscriptionPackage) => {
    const features = [];
    
    if (pkg.feature_qr_codes) features.push({ name: 'QR Codes', color: 'bg-green-100 text-green-800' });
    if (pkg.feature_public_menu_access) features.push({ name: 'Public Menu', color: 'bg-teal-100 text-teal-800' });
    if (pkg.feature_whatsapp_orders) features.push({ name: 'WhatsApp', color: 'bg-green-100 text-green-800' });
    if (pkg.feature_analytics) features.push({ name: 'Analytics', color: 'bg-blue-100 text-blue-800' });
    if (pkg.feature_multiple_restaurants) features.push({ name: 'Multi Restaurant', color: 'bg-purple-100 text-purple-800' });
    if (pkg.feature_custom_branding) features.push({ name: 'Branding', color: 'bg-orange-100 text-orange-800' });
    if (pkg.feature_priority_support) features.push({ name: 'Priority Support', color: 'bg-yellow-100 text-yellow-800' });
    if (pkg.feature_api_access) features.push({ name: 'API Access', color: 'bg-red-100 text-red-800' });

    return features;
  };

  const handleSubscribeClick = (pkg: SubscriptionPackage, cycle: 'monthly' | 'yearly' = 'monthly') => {
    setSelectedPackage(pkg);
    setBillingCycle(cycle);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Subscription Plans
          </CardTitle>
          <CardDescription>Loading available plans...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (packages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Subscription Plans
          </CardTitle>
          <CardDescription>
            Subscription packages will appear here when available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subscription packages are currently available.</p>
            <p className="text-sm mt-1">Contact support for more information.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Subscription Plans
        </CardTitle>
        <CardDescription>
          Explore all available plans and features for your restaurant
          {userSubscription ? (
            <span className="block mt-1 text-sm font-medium text-green-600">
              ✅ Current Plan: {userSubscription.package_name} ({userSubscription.status})
            </span>
          ) : (
            <span className="block mt-1 text-sm font-medium text-blue-600">
              📋 Browse available plans - Contact support to get started
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const isActive = isCurrentPackage(pkg.name);
            const features = getFeatureBadges(pkg);
            
            return (
              <Card key={pkg.id} className={`rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${
                isActive ? 'border-green-500 bg-green-50' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {getPackageIcon(pkg.name)}
                        {pkg.name}
                        {isActive && (
                          <Badge className="bg-green-500 text-white ml-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      {pkg.description && (
                        <CardDescription className="mt-1">{pkg.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div>
                    <div className="text-3xl font-bold">{formatPrice(pkg.price_monthly, pkg.currency)}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                    {pkg.price_yearly > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatPrice(pkg.price_yearly, pkg.currency)}/year
                      </div>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Restaurants:</strong> {pkg.max_restaurants || 'Unlimited'}
                    </div>
                    <div>
                      <strong>Menu Items:</strong> {pkg.max_menu_items || 'Unlimited'}
                    </div>
                  </div>

                  {/* Features */}
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

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {isActive ? (
                      <>
                        <Button disabled className="flex-1" variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Current Plan
                        </Button>
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Contact Support",
                              description: "Contact support to modify your current subscription.",
                            });
                          }}
                        >
                          Modify Plan
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          className="flex-1" 
                          onClick={() => handleSubscribeClick(pkg, 'monthly')}
                        >
                          Subscribe Now
                        </Button>
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Plan Details",
                              description: `Learn more about the ${pkg.name} plan features and pricing.`,
                            });
                          }}
                        >
                          Learn More
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Getting Started Message */}
        {!userSubscription && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Package className="h-5 w-5" />
              <span className="font-medium">Ready to Get Started?</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Choose any plan above and contact support to activate your subscription. All plans include our core features to help grow your restaurant business.
            </p>
          </div>
        )}
      </CardContent>

      {/* Subscription Dialog */}
      <SubscriptionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        package={selectedPackage}
        billingCycle={billingCycle}
      />
    </Card>
  );
};

export default SubscriptionPackagesView;
