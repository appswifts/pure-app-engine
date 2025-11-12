import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, AlertTriangle } from 'lucide-react';

const SubscriptionDebugTool: React.FC = () => {
  const [email, setEmail] = useState('appswifts@gmail.com');
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const debugSubscription = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      // Get user ID from restaurants table
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('user_id, email, name')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (!restaurant) {
        setDebugData({ error: 'No restaurant found with this email' });
        return;
      }

      // Get all subscriptions for this user
      const { data: subscriptions, error } = await (supabase as any)
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', restaurant.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDebugData({
        restaurant,
        subscriptions: subscriptions || [],
        user_id: restaurant.user_id
      });

    } catch (error: any) {
      console.error('Debug error:', error);
      toast({
        title: "Debug Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
      const { error } = await (supabase as any)
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });

      // Refresh data
      debugSubscription();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Subscription Debug Tool
        </CardTitle>
        <CardDescription>
          Debug subscription issues for specific users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={debugSubscription} disabled={loading}>
              {loading ? 'Debugging...' : 'Debug'}
            </Button>
          </div>
        </div>

        {debugData && (
          <div className="space-y-4">
            {debugData.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{debugData.error}</p>
              </div>
            ) : (
              <>
                {/* Restaurant Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Restaurant Info</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div><strong>Email:</strong> {debugData.restaurant.email}</div>
                    <div><strong>Name:</strong> {debugData.restaurant.name}</div>
                    <div><strong>User ID:</strong> {debugData.user_id}</div>
                  </div>
                </div>

                {/* Subscriptions */}
                <div className="space-y-2">
                  <h3 className="font-medium">Subscriptions ({debugData.subscriptions.length})</h3>
                  
                  {debugData.subscriptions.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">No subscriptions found</p>
                    </div>
                  ) : (
                    debugData.subscriptions.map((sub: any) => (
                      <div 
                        key={sub.id} 
                        className={`p-4 border rounded-lg ${
                          sub.status === 'active' 
                            ? 'bg-green-50 border-green-200' 
                            : sub.status === 'pending'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 text-sm">
                            <div><strong>Package:</strong> {sub.package_name}</div>
                            <div><strong>Status:</strong> 
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                sub.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : sub.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                            <div><strong>Created:</strong> {new Date(sub.created_at).toLocaleDateString()}</div>
                            {sub.expires_at && (
                              <div><strong>Expires:</strong> {new Date(sub.expires_at).toLocaleDateString()}</div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSubscription(sub.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Analysis */}
                {debugData.subscriptions.length > 0 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="font-medium text-orange-900 mb-2">Analysis</h3>
                    <div className="text-sm text-orange-800 space-y-1">
                      {debugData.subscriptions.some((s: any) => s.status === 'pending') && (
                        <div>⚠️ <strong>Found pending subscriptions</strong> - These might show as "active" in the dashboard due to a bug</div>
                      )}
                      {debugData.subscriptions.some((s: any) => s.status === 'active') && (
                        <div>✅ <strong>Found active subscriptions</strong> - These should show correctly</div>
                      )}
                      {debugData.subscriptions.length > 1 && (
                        <div>📋 <strong>Multiple subscriptions found</strong> - Only the most recent active one should show</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionDebugTool;
