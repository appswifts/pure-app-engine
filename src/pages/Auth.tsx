import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import BrandLogo from "@/components/BrandLogo";
import { Mail, Lock, MessageCircle, User } from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/styles/phone-input.css';
import { validateAndSanitizeInput, validateEmail, validateWhatsappNumber } from '@/lib/validation';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate("/dashboard/overview");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (formData: FormData) => {
    setLoading(true);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    // Validate and sanitize inputs
    if (!email || !password || !name || !whatsappNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!validateWhatsappNumber(whatsappNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid WhatsApp number with country code",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const sanitizedName = validateAndSanitizeInput(name, 100);

    const redirectUrl = `${window.location.origin}/dashboard`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: sanitizedName,
            whatsapp: whatsappNumber,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.user && !data?.user?.email_confirmed_at) {
        toast({
          title: "Success!",
          description: "Please check your email to confirm your account",
        });
      } else {
        toast({
          title: "Success!",
          description: "Account created successfully",
        });
        navigate("/dashboard/overview");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error?.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error?.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error?.message?.includes("Password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error?.status === 500 || error?.message?.includes("Database error")) {
        errorMessage = "Server error. Please try again in a moment.";
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

  const handleSignIn = async (formData: FormData) => {
    setLoading(true);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast({
        title: "Error", 
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/dashboard/overview");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <BrandLogo size="3xl" />
          </div>
          <p className="text-muted-foreground">
            Create beautiful QR menus for your restaurant
          </p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSignIn(formData);
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm p-0 h-auto"
                      onClick={() => navigate("/password-reset")}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={loading}
                    variant="gradient"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSignUp(formData);
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Restaurant Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        name="name"
                        placeholder="My Restaurant"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Choose a strong password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-whatsapp">WhatsApp Number</Label>
                    <div className="relative">
                      <PhoneInput
                        value={whatsappNumber}
                        onChange={(value) => setWhatsappNumber(value || '')}
                        defaultCountry="RW"
                        placeholder="WhatsApp number"
                        international
                        countryCallingCodeEditable={false}
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={loading}
                    variant="gradient"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      <div className="text-center mt-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-muted-foreground"
        >
          ← Back to Home
        </Button>
        
        <div className="mt-2">
          <Button
            variant="link"
            onClick={() => navigate("/signup-flow")}
            className="text-primary"
          >
            Try our guided signup experience
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Auth;