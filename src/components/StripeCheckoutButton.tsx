import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Loader2 } from 'lucide-react';

interface StripeCheckoutButtonProps {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval?: 'monthly' | 'yearly';
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  children?: React.ReactNode;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  planId,
  planName,
  amount,
  currency,
  billingInterval = 'monthly',
  className,
  variant = 'default',
  children
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId,
          billingInterval
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          {children || `Subscribe to ${planName}`}
        </>
      )}
    </Button>
  );
};

export default StripeCheckoutButton;