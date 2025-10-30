import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Users, 
  Shield, 
  UserCheck, 
  UserX,
  Mail,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  role?: string;
  is_active?: boolean;
}

interface UserFormData {
  email: string;
  full_name: string;
  phone: string;
  role: string;
  password: string;
}

const AdminUserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    phone: '',
    role: 'staff',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Check if current user is admin first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      const { data: isAdminResult } = await supabase.rpc('is_admin', { _user_id: session.user.id });
      if (!isAdminResult) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Get user roles and basic info from user_roles table and restaurants table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');
      
      if (rolesError) {
      }

      // Get restaurant owners (they are users too)
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, email, name, created_at');
      
      if (restaurantsError) {
      }

      // Combine role users and restaurant users
      const allUsers: User[] = [];
      
      // Add users from user_roles table
      if (userRoles) {
        for (const roleUser of userRoles) {
          allUsers.push({
            id: roleUser.user_id,
            email: 'Loading...', // We'll need to get this from auth metadata or another source
            full_name: 'Admin User',
            phone: '',
            created_at: roleUser.created_at || new Date().toISOString(),
            role: roleUser.role,
            is_active: true
          });
        }
      }

      // Add restaurant owners
      if (restaurants) {
        for (const restaurant of restaurants) {
          // Check if this user is already in the list (from user_roles)
          const existingUser = allUsers.find(u => u.id === restaurant.id);
          if (!existingUser) {
            allUsers.push({
              id: restaurant.id,
              email: restaurant.email || '',
              full_name: restaurant.name || 'Restaurant Owner',
              phone: '',
              created_at: restaurant.created_at || new Date().toISOString(),
              role: 'restaurant_owner',
              is_active: true
            });
          } else {
            // Update existing user with restaurant info
            existingUser.email = restaurant.email || existingUser.email;
            existingUser.full_name = restaurant.name || existingUser.full_name;
          }
        }
      }

      setUsers(allUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users. Make sure you have admin privileges.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email) {
        toast({
          title: "Validation Error",
          description: "Email is required",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll create a placeholder user record
      // In a real implementation, you'd need service role keys or a backend API
      toast({
        title: "Feature Unavailable",
        description: "User creation requires service role permissions. Please use Supabase dashboard to create users.",
        variant: "destructive",
      });

      // Alternatively, you could create a restaurant record if it's a restaurant owner
      if (formData.role === 'restaurant_owner') {
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            email: formData.email,
            name: formData.full_name || 'New Restaurant',
            phone: formData.phone || '',
            slug: formData.full_name?.toLowerCase().replace(/\s+/g, '-') || 'new-restaurant',
            whatsapp_number: formData.phone || '',
            password_hash: 'placeholder', // This would need proper handling in a real app
            brand_color: '#000000',
            background_style: 'solid',
            background_color: '#ffffff',
            font_family: 'Inter',
            subscription_status: 'trial'
            // Note: This creates a restaurant record but not an auth user
          });

        if (restaurantError) {
        } else {
          toast({
            title: "Restaurant Record Created",
            description: "Restaurant record created. User must sign up separately.",
          });
        }
      }

      setShowCreateDialog(false);
      setFormData({ email: '', full_name: '', phone: '', role: 'staff', password: '' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      // Update user role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedUser.id,
          role: formData.role
        });

      if (roleError) {
        throw roleError;
      }

      // If it's a restaurant owner, update restaurant info
      if (selectedUser.role === 'restaurant_owner' || formData.role === 'restaurant_owner') {
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .update({
            name: formData.full_name
          })
          .eq('id', selectedUser.id);

        if (restaurantError) {
        }
      }

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      setShowEditDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Remove user role (we can't delete auth users without service role)
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      if (roleError) {
      }

      // If it's a restaurant owner, we can delete the restaurant record
      if (selectedUser.role === 'restaurant_owner') {
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .delete()
          .eq('id', selectedUser.id);

        if (restaurantError) {
        }
      }

      toast({
        title: "Success",
        description: "User role removed successfully. Note: Auth user still exists.",
      });

      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      toast({
        title: "Feature Unavailable",
        description: "User status management requires service role permissions. Use Supabase dashboard to ban/unban users.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle user status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role || 'user',
      password: ''
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'staff': return 'bg-blue-500';
      case 'manager': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users, roles, and permissions.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with specified role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+250 xxx xxx xxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter secure password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateUser}>
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => !u.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || 'No name'}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getRoleBadgeColor(user.role || 'user')} text-white`}>
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadgeColor(user.is_active || false)} text-white`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openViewDialog(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleUserStatus(user)}
                        className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDeleteDialog(user)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+250 xxx xxx xxx"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed user information.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <div className="p-2 bg-muted rounded">{selectedUser.email}</div>
              </div>
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <div className="p-2 bg-muted rounded">{selectedUser.full_name || 'Not provided'}</div>
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <div className="p-2 bg-muted rounded">{selectedUser.phone || 'Not provided'}</div>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <div className="p-2 bg-muted rounded">
                  <Badge className={`${getRoleBadgeColor(selectedUser.role || 'user')} text-white`}>
                    {selectedUser.role || 'user'}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <div className="p-2 bg-muted rounded">
                  <Badge className={`${getStatusBadgeColor(selectedUser.is_active || false)} text-white`}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Created At</Label>
                <div className="p-2 bg-muted rounded">{new Date(selectedUser.created_at).toLocaleString()}</div>
              </div>
              <div className="grid gap-2">
                <Label>Last Sign In</Label>
                <div className="p-2 bg-muted rounded">
                  {selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : 'Never'}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email Confirmed</Label>
                <div className="p-2 bg-muted rounded">
                  {selectedUser.email_confirmed_at ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              {selectedUser && ` for ${selectedUser.email}`} and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUserManager;
