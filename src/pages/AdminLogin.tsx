import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Mail, Lock, ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const returnUrl = searchParams.get('returnUrl');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for admin credentials
      if (formData.username === "admin" && formData.password === "admin123") {
        // Check if current user has admin access
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("You need to be logged in to access admin panel. Please log in to your account first.");
        }

        // Check if this user has admin role
        const { data: userRole, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "super_admin"])
          .limit(1)
          .single();

        if (roleError || !userRole) {
          throw new Error("Access denied. You don't have admin privileges.");
        }

        toast({
          title: "Welcome Admin!",
          description: "Successfully verified admin access."
        });
        
        // Redirect to return URL or admin dashboard
        const redirectTo = returnUrl && returnUrl !== '/admin/login' ? returnUrl : '/admin';
        navigate(redirectTo);
      } else {
        throw new Error("Invalid admin credentials");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify admin access",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <Card className="shadow-elegant border-orange-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-orange-600" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Access the administrative dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="admin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In to Admin Panel"
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Demo credentials: username: <code>admin</code>, password: <code>admin123</code>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;