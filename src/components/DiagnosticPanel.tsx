import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const DiagnosticPanel = () => {
  const [diagnostics, setDiagnostics] = useState({
    auth: { status: 'checking', message: '', data: null },
    session: { status: 'checking', message: '', data: null },
    restaurant: { status: 'checking', message: '', data: null },
    database: { status: 'checking', message: '', data: null },
    rls: { status: 'checking', message: '', data: null }
  });
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = { ...diagnostics };

    // 1. Check Auth User
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        results.auth = { 
          status: 'error', 
          message: `Auth Error: ${error.message}`,
          data: error 
        };
      } else if (!user) {
        results.auth = { 
          status: 'error', 
          message: 'No authenticated user found',
          data: null 
        };
      } else {
        results.auth = { 
          status: 'success', 
          message: `User authenticated: ${user.email}`,
          data: { id: user.id, email: user.email }
        };
      }
    } catch (e: any) {
      results.auth = { 
        status: 'error', 
        message: `Exception: ${e.message}`,
        data: e 
      };
    }

    // 2. Check Session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        results.session = { 
          status: 'error', 
          message: `Session Error: ${error.message}`,
          data: error 
        };
      } else if (!session) {
        results.session = { 
          status: 'error', 
          message: 'No active session',
          data: null 
        };
      } else {
        results.session = { 
          status: 'success', 
          message: 'Session is active',
          data: { 
            expires_at: session.expires_at,
            user_id: session.user?.id 
          }
        };
      }
    } catch (e: any) {
      results.session = { 
        status: 'error', 
        message: `Exception: ${e.message}`,
        data: e 
      };
    }

    // 3. Check Restaurant Fetch
    if (results.auth.status === 'success' && results.auth.data?.id) {
      try {
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', results.auth.data.id);

        if (error) {
          results.restaurant = { 
            status: 'error', 
            message: `Restaurant Fetch Error: ${error.message} (Code: ${error.code})`,
            data: error 
          };
        } else if (!restaurants || restaurants.length === 0) {
          results.restaurant = { 
            status: 'warning', 
            message: 'No restaurant found for user',
            data: null 
          };
        } else {
          results.restaurant = { 
            status: 'success', 
            message: `Found ${restaurants.length} restaurant(s)`,
            data: restaurants[0]
          };
        }
      } catch (e: any) {
        results.restaurant = { 
          status: 'error', 
          message: `Exception: ${e.message}`,
          data: e 
        };
      }
    } else {
      results.restaurant = { 
        status: 'skipped', 
        message: 'Skipped - No authenticated user',
        data: null 
      };
    }

    // 4. Test Database Connection
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('count')
        .limit(1);

      if (error) {
        results.database = { 
          status: 'error', 
          message: `Database Error: ${error.message}`,
          data: error 
        };
      } else {
        results.database = { 
          status: 'success', 
          message: 'Database connection successful',
          data: { connected: true }
        };
      }
    } catch (e: any) {
      results.database = { 
        status: 'error', 
        message: `Exception: ${e.message}`,
        data: e 
      };
    }

    // 5. Test RLS Policies
    if (results.auth.status === 'success') {
      try {
        // Try to create a test category to check RLS
        const testId = `test-${Date.now()}`;
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            name: testId,
            restaurant_id: results.restaurant.data?.id || 'test',
            display_order: 999
          });

        if (insertError) {
          if (insertError.code === '42501') {
            results.rls = { 
              status: 'error', 
              message: 'RLS Policy Error: Insufficient permissions',
              data: insertError 
            };
          } else {
            results.rls = { 
              status: 'warning', 
              message: `RLS Test Failed: ${insertError.message}`,
              data: insertError 
            };
          }
        } else {
          // Clean up test data
          await supabase
            .from('categories')
            .delete()
            .eq('name', testId);
            
          results.rls = { 
            status: 'success', 
            message: 'RLS policies working correctly',
            data: { passed: true }
          };
        }
      } catch (e: any) {
        results.rls = { 
          status: 'error', 
          message: `Exception: ${e.message}`,
          data: e 
        };
      }
    } else {
      results.rls = { 
        status: 'skipped', 
        message: 'Skipped - No authenticated user',
        data: null 
      };
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Diagnostics</span>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Re-run Diagnostics'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(diagnostics).map(([key, value]) => (
          <Alert key={key} className={`${getStatusColor(value.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(value.status)}
              <div className="flex-1">
                <AlertDescription>
                  <div className="font-semibold capitalize mb-1">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-sm">{value.message}</div>
                  {value.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(value.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Common Solutions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Auth Error:</strong> Try logging out and logging back in</li>
            <li>• <strong>Session Error:</strong> Clear browser cache and cookies</li>
            <li>• <strong>Restaurant Error:</strong> Check if restaurant was created properly</li>
            <li>• <strong>Database Error:</strong> Check Supabase connection and API keys</li>
            <li>• <strong>RLS Error:</strong> Verify Row Level Security policies are configured</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
