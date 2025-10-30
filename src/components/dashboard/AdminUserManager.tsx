import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Shield, Crown } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  subscription_status: string;
  created_at: string;
}

const AdminUserManager = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "admin"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);

      // Load restaurants to get user names
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (restaurantsError) throw restaurantsError;
      setRestaurants((restaurantsData || []).map(r => ({ ...r, subscription_status: 'inactive' })));

      // Load auth users (this might be limited in some setups)
      // We'll try to get basic user info from auth.users if possible
      try {
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          // Handle 403 Forbidden error specifically
          if (usersError.status === 403) {
            toast({
              title: "Limited Access",
              description: "Full user management requires admin privileges. Displaying restaurant-based user info only.",
              variant: "default",
            });
          } else {
          }
        } else if (usersData) {
          setAuthUsers(usersData.users.map(user => ({
            id: user.id,
            email: user.email || '',
            created_at: user.created_at
          })));
        }
      } catch (error) {
        // If admin.listUsers fails, we'll rely on restaurant data for user info
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.role) {
      toast({
        title: "Error",
        description: "Email and role are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, we need to find the user by email - try restaurants first
      let user = restaurants.find(r => r.email === formData.email.trim());
      let userId = user?.user_id;
      
      if (!user) {
        // Try auth users as fallback
        const authUser = authUsers.find(u => u.email === formData.email.trim());
        if (authUser) {
          userId = authUser.id;
        }
      }
      
      if (!userId) {
        toast({
          title: "Error",
          description: "User not found. User must be registered first.",
          variant: "destructive",
        });
        return;
      }

      // Add role to user
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: formData.role
        });

      if (error) {
        if (error.code === '23505') { // unique violation
          toast({
            title: "Error",
            description: "User already has this role",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: `${formData.role} role added successfully`,
      });

      setDialogOpen(false);
      setFormData({ email: "", role: "admin" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add admin role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to remove this admin role?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin role removed successfully",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove admin role",
        variant: "destructive",
      });
    }
  };

  const getUserInfo = (userId: string) => {
    // Try to find in restaurants first (has name)
    const restaurant = restaurants.find(r => r.user_id === userId);
    if (restaurant) {
      return {
        name: restaurant.name,
        email: restaurant.email,
        type: 'Restaurant Owner'
      };
    }
    
    // Fallback to auth users
    const authUser = authUsers.find(u => u.id === userId);
    if (authUser) {
      return {
        name: authUser.email,
        email: authUser.email,
        type: 'System User'
      };
    }
    
    return {
      name: `User ${userId.slice(0, 8)}...`,
      email: 'Unknown',
      type: 'Unknown'
    };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Users</h2>
          <p className="text-muted-foreground">Manage system administrators</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin Role</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  User must already be registered in the system
                </p>
              </div>
              <div>
                <Label htmlFor="role">Admin Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="gradient">
                  Add Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {userRoles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No admin users</h3>
            <p className="text-muted-foreground mb-4">
              Add the first admin user to manage the system
            </p>
            <Button variant="gradient" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Admin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {userRoles.map((userRole) => (
            <Card key={userRole.id} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getRoleIcon(userRole.role)}
                    </div>
                    <div>
                      {(() => {
                        const userInfo = getUserInfo(userRole.user_id);
                        return (
                          <>
                            <h3 className="font-semibold">{userInfo.name}</h3>
                            <p className="text-sm text-muted-foreground">{userInfo.email}</p>
                            <p className="text-xs text-muted-foreground">{userInfo.type}</p>
                            <p className="text-xs text-muted-foreground">
                              Added: {new Date(userRole.created_at).toLocaleDateString()}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleColor(userRole.role)}>
                      {userRole.role.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(userRole.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Role Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Admin Role:</p>
            <p className="text-muted-foreground">Can access the admin dashboard and manage restaurants and subscriptions</p>
          </div>
          <div>
            <p className="font-medium">Super Admin Role:</p>
            <p className="text-muted-foreground">Has all admin permissions plus system-level access</p>
          </div>
          <div>
            <p className="font-medium">Note:</p>
            <p className="text-muted-foreground">Users must register in the system before you can assign admin roles to them</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManager;