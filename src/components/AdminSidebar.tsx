import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Store,
  Users,
  CreditCard,
  Settings,
  MessageSquare,
  Shield,
  Receipt,
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  {
    title: 'Overview',
    icon: Shield,
    key: 'overview',
    description: 'Admin dashboard overview'
  },
  {
    title: 'Restaurants',
    icon: Store,
    key: 'restaurants',
    description: 'Manage restaurants'
  },
  {
    title: 'Subscription Plans',
    icon: CreditCard,
    key: 'packages',
    description: 'Manage subscription plans'
  },
  {
    title: 'Payment Gateways',
    icon: Settings,
    key: 'payment-gateways',
    description: 'Configure payment methods'
  },
  {
    title: 'Subscriptions',
    icon: Users,
    key: 'subscriptions',
    description: 'Manage subscriptions'
  },
  {
    title: 'Manual Payments',
    icon: Receipt,
    key: 'manual-payments',
    description: 'Review manual payments'
  },
  {
    title: 'WhatsApp',
    icon: MessageSquare,
    key: 'whatsapp',
    description: 'WhatsApp notifications'
  },
];

export const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5" />
            <span>Admin Panel</span>
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.key)}
                    isActive={activeTab === item.key}
                    className={activeTab === item.key ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};