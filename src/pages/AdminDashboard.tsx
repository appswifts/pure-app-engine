import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import AdminOverview from "@/components/admin/AdminOverview";
import AdminSettings from "@/components/admin/AdminSettings";
import SubscriptionPackages from "@/pages/admin/SubscriptionPackages";
import UserSubscriptions from "@/pages/admin/UserSubscriptions";
import { Menu as MenuIcon, X, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Determine active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/overview') return 'overview';
    if (path === '/admin/packages') return 'packages';
    if (path === '/admin/subscriptions') return 'subscriptions';
    if (path === '/admin/settings') return 'settings';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  
  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', materialIcon: 'dashboard' },
    { id: 'packages', label: 'Subscription Packages', materialIcon: 'card_membership' },
    { id: 'subscriptions', label: 'User Subscriptions', materialIcon: 'people' },
    { id: 'settings', label: 'Settings', materialIcon: 'settings' }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'packages':
        return <SubscriptionPackages />;
      case 'subscriptions':
        return <UserSubscriptions />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      {/* Mobile Header */}
      <div className="lg:hidden bg-background-light dark:bg-background-dark border-b border-primary-green/20 dark:border-primary-green/30 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-green">shield</span>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar - Fixed/Sticky */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 bg-background-light dark:bg-background-dark p-4 flex flex-col justify-between border-r border-primary-green/20 dark:border-primary-green/30 transition-transform duration-300 ease-in-out overflow-y-auto`}>
          <div>
            {/* Mobile Close Button */}
            <div className="lg:hidden mb-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Admin Profile Section */}
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary-green/20 dark:bg-primary-green/30 rounded-full size-12 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-gray-900 dark:text-white">shield</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">Admin</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Administrator</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    onClick={() => {
                      navigate(`/admin/${item.id === 'overview' ? '' : item.id}`);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${
                      isActive 
                        ? 'bg-primary-green/20 dark:bg-primary-green/30 text-gray-900 dark:text-white font-medium' 
                        : 'hover:bg-primary-green/10 dark:hover:bg-primary-green/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.materialIcon}</span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="flex flex-col gap-2">
            <a
              onClick={() => {
                navigate("/dashboard");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-green/10 dark:hover:bg-primary-green/20 cursor-pointer text-gray-700 dark:text-gray-300"
            >
              <span className="material-symbols-outlined">restaurant</span>
              <span>Restaurant Dashboard</span>
            </a>
            <a
              onClick={() => {
                handleSignOut();
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-green/10 dark:hover:bg-primary-green/20 cursor-pointer text-gray-700 dark:text-gray-300"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Sign Out</span>
            </a>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - Offset for Sidebar */}
        <main className="flex-1 min-h-screen overflow-auto lg:ml-64 w-full">
          <div className="p-4 lg:p-8">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
