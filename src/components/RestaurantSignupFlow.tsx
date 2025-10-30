import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ManualPaymentFlow } from '@/components/ManualPaymentFlow';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/styles/phone-input.css';
import { 
  Store, 
  Check, 
  CreditCard,
  Users,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_interval: string;
  description: string;
  features: any; // Changed from string[] to any to handle Json type
  max_menu_items: number;
  max_tables: number;
  trial_days: number;
}

interface RestaurantData {
  name: string;
  email: string;
  whatsapp_number: string;
  address?: string;
  description?: string;
}

export const RestaurantSignupFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'plan' | 'payment' | 'success'>('info');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantData>({
    name: '',
    email: '',
    whatsapp_number: '',
    address: '',
    description: ''
  });
  const [createdRestaurant, setCreatedRestaurant] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive'
      });
    }
  };

  const handleRestaurantSubmit = async () => {
    if (!restaurantData.name || !restaurantData.email || !restaurantData.whatsapp_number) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setStep('plan');
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handlePlanConfirm = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      // Create user account first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: restaurantData.email,
        password: 'temp_password_' + Date.now(), // Temporary password
        options: {
          data: {
            name: restaurantData.name,
            whatsapp: restaurantData.whatsapp_number
          }
        }
      });

      if (authError) throw authError;

      // Create restaurant record
      const slug = restaurantData.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          user_id: authData.user?.id,
          name: restaurantData.name,
          email: restaurantData.email,
          phone: restaurantData.whatsapp_number, // Use WhatsApp number as phone
          whatsapp_number: restaurantData.whatsapp_number,
          slug: slug + '-' + Date.now(), // Ensure uniqueness
          subscription_status: 'pending_payment',
          notes: restaurantData.description
        })
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // Create subscription record
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + selectedPlan.trial_days);

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          restaurant_id: restaurant.id,
          plan_id: selectedPlan.id,
          status: 'trialing',
          billing_interval: selectedPlan.billing_interval,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnd.toISOString(),
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString(),
          next_billing_date: trialEnd.toISOString()
        })
        .select()
        .single();

      if (subError) throw subError;

      setCreatedRestaurant({ ...restaurant, subscription });
      setStep('payment');

      toast({
        title: 'Success',
        description: 'Restaurant created successfully! Please complete payment to activate.',
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create restaurant',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to MenuForest!</h2>
            <p className="text-muted-foreground mb-6">
              Your restaurant has been created successfully. Once your payment is verified by our admin, 
              your account will be activated and you can start managing your menu.
            </p>
            <div className="space-y-2 text-sm text-left bg-muted p-4 rounded-lg">
              <p><strong>Restaurant:</strong> {restaurantData.name}</p>
              <p><strong>Plan:</strong> {selectedPlan?.name}</p>
              <p><strong>Trial Period:</strong> {selectedPlan?.trial_days} days</p>
            </div>
          <Button 
            className="w-full mt-6" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'payment' && createdRestaurant && selectedPlan) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => setStep('plan')}
              className="mb-4"
            >
              ← Back to Plans
            </Button>
            <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
            <p className="text-muted-foreground">
              Restaurant created successfully! Complete payment to activate your account.
            </p>
          </div>
          <ManualPaymentFlow
            subscriptionId={createdRestaurant.subscription.id}
            amount={selectedPlan.price}
            currency={selectedPlan.currency}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Store className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Join MenuForest</h1>
          </div>
          <p className="text-muted-foreground">
            Create your digital menu and start taking orders via WhatsApp
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${step === 'info' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'info' ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span className="hidden sm:inline">Restaurant Info</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center space-x-2 ${step === 'plan' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'plan' ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="hidden sm:inline">Choose Plan</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center space-x-2 ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-primary text-white' : 'bg-muted'}`}>
              3
            </div>
            <span className="hidden sm:inline">Payment</span>
          </div>
        </div>

        {/* Restaurant Information Step */}
        {step === 'info' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Restaurant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    value={restaurantData.name}
                    onChange={(e) => setRestaurantData({...restaurantData, name: e.target.value})}
                    placeholder="Your Restaurant Name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantData.email}
                    onChange={(e) => setRestaurantData({...restaurantData, email: e.target.value})}
                    placeholder="restaurant@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="RW"
                  value={restaurantData.whatsapp_number}
                  onChange={(value) => setRestaurantData({...restaurantData, whatsapp_number: value || ''})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Select country and enter number"
                />
              </div>

              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={restaurantData.address}
                  onChange={(e) => setRestaurantData({...restaurantData, address: e.target.value})}
                  placeholder="Restaurant address"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={restaurantData.description}
                  onChange={(e) => setRestaurantData({...restaurantData, description: e.target.value})}
                  placeholder="Tell us about your restaurant"
                  rows={3}
                />
              </div>

              <Button onClick={handleRestaurantSubmit} className="w-full">
                Continue to Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plan Selection Step */}
        {step === 'plan' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">Select the plan that best fits your restaurant</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'}`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-between">
                      <span>{plan.name}</span>
                      {selectedPlan?.id === plan.id && <Check className="h-5 w-5 text-primary" />}
                    </CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {plan.price.toLocaleString()} {plan.currency}
                      <span className="text-sm text-muted-foreground">/{plan.billing_interval}</span>
                    </div>
                    <Badge variant="secondary">{plan.trial_days} days free trial</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        Up to {plan.max_menu_items} menu items
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4" />
                        Up to {plan.max_tables} tables
                      </div>
                      {Array.isArray(plan.features) ? plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </div>
                      )) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                onClick={handlePlanConfirm} 
                disabled={!selectedPlan || loading}
                className="px-8"
              >
                {loading ? 'Creating Restaurant...' : 'Continue to Payment'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantSignupFlow;