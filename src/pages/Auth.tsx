import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Shield, Store, Utensils } from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/styles/phone-input.css';
import { validateAndSanitizeInput, validateEmail, validateWhatsappNumber } from '@/lib/validation';
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isAdminMode = searchParams.get('mode') === 'admin';
  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !isAdminMode) {
        navigate("/dashboard/overview");
      }
    };
    checkUser();
  }, [navigate, isAdminMode]);

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

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // If admin mode, verify admin access
      if (isAdminMode) {
        if (!authData.user) {
          throw new Error("Authentication failed");
        }

        const { data: isAdmin, error: roleError } = await (supabase as any).rpc('verify_admin_access', {
          p_user_id: authData.user.id
        });

        if (roleError) {
          console.error('Admin verification error:', roleError);
          throw new Error("Failed to verify admin access");
        }

        if (!isAdmin) {
          await supabase.auth.signOut();
          throw new Error("Access denied. You don't have admin privileges.");
        }

        toast({
          title: "Welcome Admin!",
          description: "Successfully verified admin access."
        });
        
        const redirectTo = returnUrl && returnUrl !== '/admin/login' ? returnUrl : '/admin';
        navigate(redirectTo);
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in."
        });
        navigate("/dashboard/overview");
      }
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 text-primary mb-4">
            {isAdminMode ? (
              <Shield className="h-12 w-12" />
            ) : (
              <>
                <Utensils className="h-12 w-12" />
                <span className="text-3xl font-bold">QR Menu</span>
              </>
            )}
          </div>
          <p className="text-muted-foreground">
            {isAdminMode 
              ? "Access the administrative dashboard" 
              : "Create beautiful QR menus for your restaurant"
            }
          </p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              {isAdminMode && <Shield className="h-6 w-6 text-primary" />}
              {isAdminMode ? "Admin Login" : "Welcome"}
            </CardTitle>
            <CardDescription className="text-center">
              {isAdminMode 
                ? "Sign in with your admin credentials" 
                : "Sign in to your account or create a new one"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdminMode ? (
              // Admin Sign In Only
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSignIn(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      name="password"
                      type="password"
                      placeholder="Enter admin password"
                      className="pl-10"
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
                  {loading ? "Signing in..." : "Sign In to Admin Panel"}
                </Button>
              </form>
            ) : (
              // Regular User Auth
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

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <GoogleSignInButton />
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleSignUp(formData);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="name"
                          placeholder="Your full name"
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

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <GoogleSignInButton />
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground"
          >
            ← Back to Home
          </Button>
          
          {!isAdminMode && (
            <div className="text-xs text-muted-foreground">
              Admin? <Button 
                variant="link" 
                onClick={() => navigate("/auth?mode=admin")}
                className="text-xs p-0 h-auto"
              >
                Sign in here
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
