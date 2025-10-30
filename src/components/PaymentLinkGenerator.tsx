import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, Copy, ExternalLink, QrCode } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  billing_interval: string;
  is_active: boolean;
}

interface PaymentLinkGeneratorProps {
  restaurantId?: string;
}

const PaymentLinkGenerator: React.FC<PaymentLinkGeneratorProps> = ({ restaurantId }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentLink = (planId: string, planName: string) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      plan: planId,
      restaurant: restaurantId || ''
    });
    return `${baseUrl}/payment?${params.toString()}`;
  };

  const copyToClipboard = (text: string, planName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `Payment link for ${planName} copied to clipboard`
    });
  };

  const openPaymentPage = (link: string) => {
    window.open(link, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading payment options...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Payment Links
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate payment links for different subscription plans
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans.map((plan) => {
            const paymentLink = generatePaymentLink(plan.id, plan.name);
            
            return (
              <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{plan.name}</h4>
                      <Badge variant="outline">
                        {plan.price.toLocaleString()} {plan.currency}/{plan.billing_interval}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Payment Link:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background px-2 py-1 rounded border break-all">
                      {paymentLink}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(paymentLink, plan.name)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPaymentPage(paymentLink)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {plans.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active plans available</p>
              <p className="text-sm">Contact admin to set up subscription plans</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentLinkGenerator;