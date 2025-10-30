import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  CheckCircle,
  Star,
  ArrowRight,
  Crown,
  Zap,
  Shield,
  Clock,
  Users,
  Menu as MenuIcon
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  trial_days: number;
  features: any;
  is_active: boolean;
  created_at: string;
}

const PricingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    loadSubscriptionPlans();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadSubscriptionPlans = async () => {
    try {
      setLoading(true);
      
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive",
        });
        return;
      }

      setPlans(plans || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingInterval === 'monthly' ? plan.price : plan.price * 12;
  };

  const getMonthlySavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.price * 12;
    const yearlyPrice = plan.price * 10; // Assume 2 months free for yearly
    return monthlyTotal - yearlyPrice;
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to select a subscription plan",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Navigate to checkout with plan details
    navigate('/checkout', {
      state: {
        planId: plan.id,
        planName: plan.name,
        price: getPrice(plan),
        billingInterval,
        trialDays: plan.trial_days,
        features: plan.features
      }
    });
  };

  const getPlanIcon = (index: number) => {
    const icons = [Package, Zap, Crown];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-6 w-6" />;
  };

  const getPlanColor = (index: number) => {
    const colors = ['border-blue-200', 'border-green-200', 'border-purple-200'];
    return colors[index % colors.length];
  };

  const getPopularPlan = () => {
    // Mark the middle plan as popular, or the one with most features
    if (plans.length >= 2) {
      return plans[Math.floor(plans.length / 2)];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  const popularPlan = getPopularPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MenuIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">MenuForest</h1>
                <p className="text-sm text-muted-foreground">Digital Menu Solutions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentUser ? (
                <Button variant="outline" onClick={() => navigate('/dashboard/overview')}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your restaurant with our digital menu solutions. Start with a free trial and scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billingInterval === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className="relative"
            >
              <div className={`w-12 h-6 rounded-full transition-colors ${
                billingInterval === 'yearly' ? 'bg-primary' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                  billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </div>
            </Button>
            <span className={`text-sm ${billingInterval === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {billingInterval === 'yearly' && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Save up to 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isPopular = popularPlan?.id === plan.id;
            const price = getPrice(plan);
            const savings = billingInterval === 'yearly' ? getMonthlySavings(plan) : 0;

            return (
              <Card 
                key={plan.id} 
                className={`relative shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isPopular ? 'ring-2 ring-primary scale-105' : getPlanColor(index)
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      isPopular ? 'bg-primary/10' : 'bg-accent'
                    }`}>
                      {getPlanIcon(index)}
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    Perfect for {index === 0 ? 'small restaurants' : index === 1 ? 'growing businesses' : 'large establishments'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold">{formatPrice(price)}</span>
                      <span className="text-muted-foreground">
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingInterval === 'yearly' && savings > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Save {formatPrice(savings)} per year
                      </p>
                    )}
                    {plan.trial_days > 0 && (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {plan.trial_days} days free trial
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">Digital Menu Management</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">QR Code Generation</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">Real-time Updates</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">24/7 Support</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${
                      isPopular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-secondary hover:bg-secondary/90'
                    }`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.trial_days > 0 ? 'Start Free Trial' : 'Get Started'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Plans Available</h3>
            <p className="text-muted-foreground">
              Subscription plans are currently being configured. Please check back later.
            </p>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose MenuForest?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of restaurants that have transformed their business with our digital menu solutions.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast Setup</h3>
              <p className="text-muted-foreground">
                Get your digital menu up and running in minutes, not hours.
              </p>
            </div>

            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Bank-level security with 99.9% uptime guarantee.
              </p>
            </div>

            <div className="text-center">
              <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">
                Our expert team is here to help you succeed, anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
