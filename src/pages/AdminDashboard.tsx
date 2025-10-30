import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import AdminRestaurantManager from '@/components/AdminRestaurantManager';
import AdminOverview from "@/components/admin/AdminOverview";
import AdminPaymentGateways from "@/components/admin/AdminPaymentGateways";
import AdminSubscriptions from "@/components/admin/AdminSubscriptions";
import { AdminManualPayments } from "@/components/AdminManualPayments";
import WhatsAppNotificationManager from "@/components/WhatsAppNotificationManager";
import AdminPackages from "@/pages/admin/AdminPackages";
import {
  Users,
  Shield,
  LogOut,
  Store,
  Settings,
  CreditCard,
  MessageSquare,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/overview') return 'overview';
    if (path === '/admin/restaurants') return 'restaurants';
    if (path === '/admin/packages') return 'packages';
    if (path === '/admin/payment-gateways') return 'payment-gateways';
    if (path === '/admin/subscriptions') return 'subscriptions';
    if (path === '/admin/manual-payments') return 'manual-payments';
    if (path === '/admin/whatsapp') return 'whatsapp';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  
  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'restaurants':
        return <AdminRestaurantManager />;
      case 'packages':
        return <AdminPackages />;
      case 'payment-gateways':
        return <AdminPaymentGateways />;
      case 'subscriptions':
        return <AdminSubscriptions />;
      case 'manual-payments':
        return <AdminManualPayments />;
      case 'whatsapp':
        return <WhatsAppNotificationManager />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            // Navigate to the new URL instead of just setting state
            navigate(`/admin/${tab === 'overview' ? '' : tab}`);
          }}
        />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Menu Management System</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">
            {renderActiveTab()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
