import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, Mail, Phone, MessageSquare, Lock } from "lucide-react";

const RestaurantSignup = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp_number: "",
    password: "",
    confirmPassword: "",
    selectedPackage: ""
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load packages",
        variant: "destructive"
      });
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.selectedPackage) {
      toast({
        title: "Error",
        description: "Please select a subscription package",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create the auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Check if restaurant record already exists
        const { data: existingRestaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("id", authData.user.id)
          .single();

        if (!existingRestaurant) {
          // Insert restaurant data with the auth user ID
          const { error: restaurantError } = await supabase
            .from("restaurants")
            .insert({
              user_id: authData.user.id,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              whatsapp_number: formData.whatsapp_number,
              subscription_status: "inactive",
              slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            });

          if (restaurantError) throw restaurantError;
        }

        // Create subscription for admin review
        const selectedPkg = packages.find(p => p.id === formData.selectedPackage);
        
        // Create subscription with pending payment status
        const { data: subscription, error: orderError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: authData.user.id,
            restaurant_id: authData.user.id,
            plan_id: formData.selectedPackage,
            status: "pending_payment",
            billing_interval: "monthly",
            amount: selectedPkg?.price || 0,
            currency: selectedPkg?.currency || "RWF",
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days trial
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (orderError) {
          console.error('Subscription order error:', orderError);
          throw orderError;
        }

        // Create initial payment request for admin review
        if (subscription) {
          await supabase.from('payment_requests').insert({
            user_id: authData.user.id,
            restaurant_id: authData.user.id,
            subscription_id: subscription.id,
            amount: selectedPkg?.price || 0,
            currency: selectedPkg?.currency || "RWF",
            billing_period_start: new Date().toISOString(),
            billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: `Initial subscription payment for ${selectedPkg?.name}`,
            payment_method: 'bank_transfer',
             status: 'pending'
          });
        }

        toast({
          title: "Success!",
          description: "Restaurant account created successfully. Please complete payment to activate your subscription."
        });

        navigate("/auth");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            Restaurant Registration
          </CardTitle>
          <CardDescription className="text-lg">
            Join our QR code ordering system. Start accepting orders via WhatsApp today!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Restaurant Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Amazing Restaurant"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="owner@restaurant.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp Number *
                </Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password *
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            {/* Package Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Choose Your Subscription Package *</Label>
              {packagesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading packages...</div>
              ) : (
                <div className="grid gap-3">
                  {packages.map((pkg) => {
                    const isSelected = formData.selectedPackage === pkg.id;
                    const features = Array.isArray(pkg.features) ? pkg.features : [];
                    
                    return (
                      <Card 
                        key={pkg.id} 
                        className={`cursor-pointer transition-all duration-300 ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, selectedPackage: pkg.id }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                                }`}>
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{pkg.name}</h4>
                                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                                </div>
                              </div>
                              <div className="mt-2 ml-7">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-primary">
                                    {pkg.price?.toLocaleString()} {pkg.currency}
                                  </span>
                                  <span className="text-sm text-muted-foreground">/month</span>
                                </div>
                                {features.length > 0 && (
                                  <div className="mt-2">
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {features.slice(0, 3).map((feature: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2">
                                          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                          {feature}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                After registration, you'll receive payment instructions to activate your selected package.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Restaurant Account"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantSignup;