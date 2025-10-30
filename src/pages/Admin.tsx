import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminRestaurantManager from "@/components/AdminRestaurantManager";
import AdminUserManager from "@/components/AdminUserManager";
import AdminPaymentConfig from "@/components/AdminPaymentConfig";
import ManualPaymentAdmin from "@/components/ManualPaymentAdmin";
import WhatsAppNotificationManager from "@/components/WhatsAppNotificationManager";
import { 
  Shield, 
  Users, 
  Store,
  CreditCard,
  Settings,
  MessageSquare
} from "lucide-react";

const Admin = () => {
  const [activeTab, setActiveTab] = useState('restaurants');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'restaurants':
        return <AdminRestaurantManager />;
      case 'users':
        return <AdminUserManager />;
      case 'payments':
        return <ManualPaymentAdmin />;
      case 'payment-config':
        return <AdminPaymentConfig />;
      case 'whatsapp':
        return <WhatsAppNotificationManager />;
      default:
        return <AdminRestaurantManager />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Restaurant Management System</p>
              </div>
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

export default Admin;