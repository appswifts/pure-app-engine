import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Crown, Star, Zap } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import ManualPaymentInstructions from "@/components/ManualPaymentInstructions";
import { manualPaymentService } from "@/services/manualPaymentService";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  max_menu_items: number;
  max_tables: number;
  features: string[];
  trial_days: number;
}

interface RestaurantData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
}

const SignupFlow = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantData>({
    name: '',
    email: '',
    phone: '',
    whatsapp: ''
  });
  const [createdRestaurant, setCreatedRestaurant] = useState<any>(null);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setPlans(data?.map(plan => ({
        id: plan.id,
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || 0,
        currency: plan.currency || 'RWF',
        billing_interval: plan.billing_interval || 'monthly',
        max_menu_items: plan.max_menu_items || 0,
        max_tables: plan.max_tables || 0,
        trial_days: plan.trial_days || 0,
        features: Array.isArray(plan.features) ? 
          plan.features.filter(f => typeof f === 'string') as string[] :
          typeof plan.features === 'string' ? [plan.features] : []
      })) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    }
  };

  const handleRestaurantSignup = async (formData: FormData) => {
    setLoading(true);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;

    if (!email || !password || !name || !phone || !whatsapp) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup-flow?step=3`,
          data: { name, phone, whatsapp }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setRestaurantData({ name, email, phone, whatsapp });
        
        // Get the created restaurant
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (restaurantError) throw restaurantError;
        setCreatedRestaurant(restaurant);
        
        await loadPlans();
        setStep(2);
      }
    } catch (error: any) {
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error?.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error?.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      }
      
      toast({
        title: "Sign Up Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelection = async () => {
    if (!selectedPlan || !createdRestaurant) return;

    setLoading(true);
    try {
      // Create subscription with pending status
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: createdRestaurant.user_id,
          restaurant_id: createdRestaurant.id,
          plan_id: selectedPlan.id,
          status: 'pending_payment',
          billing_interval: selectedPlan.billing_interval,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + selectedPlan.trial_days * 24 * 60 * 60 * 1000).toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          next_billing_date: new Date(Date.now() + selectedPlan.trial_days * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Create payment request
      const dueDate = new Date(Date.now() + selectedPlan.trial_days * 24 * 60 * 60 * 1000);
      const paymentRequestData = {
        restaurant_id: createdRestaurant.id,
        subscription_id: subscription.id,
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: dueDate.toISOString(),
        description: `${selectedPlan.name} Plan Subscription - ${selectedPlan.billing_interval}`,
        payment_method: 'bank_transfer' as const
      };

      const request = await manualPaymentService.createPaymentRequest(paymentRequestData);
      setPaymentRequest(request);

      // Update restaurant status
      await supabase
        .from('restaurants')
        .update({
          subscription_status: 'trial',
          trial_end_date: dueDate.toISOString()
        })
        .eq('id', createdRestaurant.id);

      setStep(3);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    navigate('/dashboard/overview');
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('starter')) return Star;
    if (planName.toLowerCase().includes('professional')) return Crown;
    if (planName.toLowerCase().includes('enterprise')) return Zap;
    return Star;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <BrandLogo size="3xl" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Create Your Restaurant Account</h1>
            <p className="text-muted-foreground">Step 1 of 3: Restaurant Information</p>
          </div>

          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
              <CardDescription>Tell us about your restaurant</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleRestaurantSignup(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input id="name" name="name" placeholder="My Restaurant" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="your@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Choose a strong password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+250 788 123 456" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input id="whatsapp" name="whatsapp" type="tel" placeholder="+250 788 123 456" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <BrandLogo size="3xl" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Choose Your Plan</h1>
            <p className="text-muted-foreground">Step 2 of 3: Select a subscription plan</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan.name);
              const isSelected = selectedPlan?.id === plan.id;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardHeader className="text-center">
                    <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="text-3xl font-bold mt-4">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {plan.billing_interval}
                    </div>
                    {plan.trial_days > 0 && (
                      <div className="bg-primary/10 text-primary text-sm px-2 py-1 rounded mt-2">
                        {plan.trial_days} days free trial
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-success mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Up to {plan.max_menu_items === -1 ? 'Unlimited' : plan.max_menu_items} menu items</div>
                      <div>• Up to {plan.max_tables === -1 ? 'Unlimited' : plan.max_tables} tables</div>
                    </div>
                    {isSelected && (
                      <div className="mt-4 text-center text-primary font-medium">
                        ✓ Selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handlePlanSelection} 
              disabled={!selectedPlan || loading}
            >
              {loading ? "Setting up..." : "Continue to Payment"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <BrandLogo size="3xl" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Information</h1>
            <p className="text-muted-foreground">Step 3 of 3: Complete your subscription</p>
          </div>

          <ManualPaymentInstructions
            planName={selectedPlan?.name || 'Selected Plan'}
            amount={selectedPlan?.price || 0}
            currency={selectedPlan?.currency || 'RWF'}
            restaurantId={createdRestaurant?.id || ''}
            onPaymentComplete={handlePaymentComplete}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default SignupFlow;