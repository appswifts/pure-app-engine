import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Globe, 
  CreditCard, 
  Download,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Save,
  Mail,
  Smartphone,
  Shield,
  Key,
  LogOut,
  AlertTriangle,
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

const UserSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // User preferences
  const [preferences, setPreferences] = useState({
    displayName: "",
    email: "",
    phone: "",
    language: "en",
    timezone: "Africa/Kigali",
    emailNotifications: true,
    orderNotifications: true,
    marketingEmails: false,
    smsNotifications: false,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/auth");
        return;
      }

      setUser(authUser);
      setPreferences(prev => ({
        ...prev,
        displayName: authUser.user_metadata?.full_name || "",
        email: authUser.email || "",
        phone: authUser.user_metadata?.phone || "",
      }));

      // Load subscription status
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("subscription_status, subscription_end_date, trial_end_date")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (restaurants) {
        setSubscription(restaurants);
      }
    } catch (error: any) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: preferences.displayName,
          phone: preferences.phone,
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    toast({
      title: "Preferences saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(preferences.email, {
        redirectTo: `${window.location.origin}/password-reset`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return <Badge variant="secondary">No Subscription</Badge>;
    
    const status = subscription.subscription_status;
    const now = new Date();
    const endDate = subscription.subscription_end_date ? new Date(subscription.subscription_end_date) : null;
    const trialEndDate = subscription.trial_end_date ? new Date(subscription.trial_end_date) : null;

    if (status === 'active' && endDate && endDate > now) {
      return <Badge className="bg-green-500">Active</Badge>;
    } else if (status === 'trial' && trialEndDate && trialEndDate > now) {
      return <Badge className="bg-blue-500">Trial</Badge>;
    } else {
      return <Badge variant="destructive">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {preferences.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-medium">{preferences.displayName || user?.email}</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={preferences.displayName}
                        onChange={(e) => setPreferences(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={preferences.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={preferences.phone}
                        onChange={(e) => setPreferences(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+250 xxx xxx xxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={preferences.language}
                        onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="rw">Kinyarwanda</SelectItem>
                          <SelectItem value="sw">Swahili</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={preferences.timezone}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Kigali">Africa/Kigali (CAT)</SelectItem>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Preferences
                </CardTitle>
                <CardDescription>
                  Customize how the dashboard looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Color Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center gap-3 p-6 border-2 rounded-lg transition-all hover:border-primary/50 ${
                        theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <Sun className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-medium">Light</div>
                        <div className="text-xs text-muted-foreground">Clean and bright</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center gap-3 p-6 border-2 rounded-lg transition-all hover:border-primary/50 ${
                        theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <Moon className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-medium">Dark</div>
                        <div className="text-xs text-muted-foreground">Easy on the eyes</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center gap-3 p-6 border-2 rounded-lg transition-all hover:border-primary/50 ${
                        theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <Monitor className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-medium">System</div>
                        <div className="text-xs text-muted-foreground">Match OS settings</div>
                      </div>
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is how your dashboard will look with the current theme
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-primary rounded"></div>
                    <div className="h-8 bg-secondary rounded"></div>
                    <div className="h-8 bg-accent rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="emailNotif">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your account activity
                      </p>
                    </div>
                    <Switch
                      id="emailNotif"
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="orderNotif">Order Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when customers place new orders
                      </p>
                    </div>
                    <Switch
                      id="orderNotif"
                      checked={preferences.orderNotifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, orderNotifications: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="smsNotif">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive text messages for important updates
                      </p>
                    </div>
                    <Switch
                      id="smsNotif"
                      checked={preferences.smsNotifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, smsNotifications: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="marketing">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive tips, updates, and promotional offers
                      </p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="font-medium">Password</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last changed: Never
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleChangePassword}>
                      Change Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Two-Factor Authentication</span>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Enable 2FA
                    </Button>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">Active Sessions</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          You are currently signed in on 1 device
                        </p>
                        <Button variant="link" className="px-0 text-amber-900 dark:text-amber-100 h-auto mt-2">
                          View all sessions →
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Danger Zone</h4>
                    <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                      <div className="space-y-1">
                        <span className="font-medium">Sign Out</span>
                        <p className="text-sm text-muted-foreground">
                          Sign out from this device
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription & Billing
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">Current Plan</span>
                        {getSubscriptionBadge()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.subscription_status === 'active' 
                          ? `Active until ${subscription.subscription_end_date ? new Date(subscription.subscription_end_date).toLocaleDateString() : 'N/A'}`
                          : subscription?.subscription_status === 'trial'
                          ? `Trial ends ${subscription.trial_end_date ? new Date(subscription.trial_end_date).toLocaleDateString() : 'N/A'}`
                          : 'No active subscription'}
                      </p>
                    </div>
                    <Button onClick={() => navigate('/dashboard/subscription')}>
                      Manage Subscription
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto flex-col gap-2 py-6">
                      <Download className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">Download Invoices</div>
                        <div className="text-xs text-muted-foreground">Access your billing history</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto flex-col gap-2 py-6">
                      <CreditCard className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">Payment Methods</div>
                        <div className="text-xs text-muted-foreground">Manage your cards</div>
                      </div>
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Need Help?</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Contact our support team for billing questions or subscription changes
                    </p>
                    <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernDashboardLayout>
  );
};

export default UserSettings;
