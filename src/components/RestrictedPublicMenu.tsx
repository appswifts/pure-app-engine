import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Package,
  Clock,
  Phone,
  MapPin,
  Mail,
  ExternalLink
} from 'lucide-react';

interface RestrictedPublicMenuProps {
  restaurant: {
    id: string;
    name: string;
    logo_url?: string;
    phone?: string;
    address?: string;
    email?: string;
    description?: string;
  };
  subscriptionStatus?: string;
}

const RestrictedPublicMenu: React.FC<RestrictedPublicMenuProps> = ({ 
  restaurant, 
  subscriptionStatus = 'inactive' 
}) => {
  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case 'past_due':
        return {
          title: 'Service Temporarily Unavailable',
          message: 'This restaurant\'s digital menu is temporarily unavailable due to payment processing. Please contact the restaurant directly for menu information.',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'canceled':
        return {
          title: 'Digital Menu Service Suspended',
          message: 'This restaurant\'s digital menu service has been suspended. Please contact the restaurant directly for current menu and pricing information.',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          title: 'Menu Coming Soon',
          message: 'This restaurant is setting up their digital menu. Please check back soon or contact them directly for menu information.',
          icon: Package,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          title: 'Digital Menu Unavailable',
          message: 'This restaurant\'s digital menu is currently unavailable. Please contact the restaurant directly for menu and pricing information.',
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusInfo = getStatusMessage();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Restaurant Header */}
          <Card className="shadow-lg mb-8">
            <CardContent className="p-8 text-center">
              {/* Logo */}
              <div className="mb-6">
                {restaurant.logo_url ? (
                  <img
                    src={restaurant.logo_url}
                    alt={`${restaurant.name} logo`}
                    className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                    <Package className="h-12 w-12 text-primary" />
                  </div>
                )}
              </div>

              {/* Restaurant Name */}
              <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
              
              {/* Description */}
              {restaurant.description && (
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  {restaurant.description}
                </p>
              )}

              {/* Status Badge */}
              <Badge variant="outline" className="mb-4">
                <StatusIcon className="h-3 w-3 mr-1" />
                Menu Status: {subscriptionStatus === 'past_due' ? 'Temporarily Unavailable' : 'Unavailable'}
              </Badge>
            </CardContent>
          </Card>

          {/* Status Announcement */}
          <Card className={`shadow-lg mb-8 ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full bg-white shadow-sm`}>
                  <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className={`text-lg font-semibold mb-2 ${statusInfo.color}`}>
                    {statusInfo.title}
                  </h2>
                  <p className={`text-sm ${statusInfo.color.replace('600', '700')}`}>
                    {statusInfo.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </h3>
              
              <div className="space-y-4">
                {restaurant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a 
                        href={`tel:${restaurant.phone}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>
                )}

                {restaurant.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a 
                        href={`mailto:${restaurant.email}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {restaurant.email}
                      </a>
                    </div>
                  </div>
                )}

                {restaurant.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{restaurant.address}</p>
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    For current menu, pricing, and ordering information:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {restaurant.phone && (
                      <Button asChild className="flex-1">
                        <a href={`tel:${restaurant.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call Restaurant
                        </a>
                      </Button>
                    )}
                    {restaurant.email && (
                      <Button variant="outline" asChild className="flex-1">
                        <a href={`mailto:${restaurant.email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Powered by MenuForest Digital Menu Solutions</p>
            <Button variant="link" asChild className="text-xs">
              <a href="https://menuforest.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Learn More
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestrictedPublicMenu;
