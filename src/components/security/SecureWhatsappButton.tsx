import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useSecurity } from './SecurityProvider';
import { validateAndSanitizeInput, validateWhatsappNumber } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';

interface SecureWhatsappButtonProps {
  restaurantId: string;
  itemName: string;
  itemPrice: number;
  currency: string;
  className?: string;
}

export const SecureWhatsappButton = ({ 
  restaurantId, 
  itemName, 
  itemPrice, 
  currency,
  className = ""
}: SecureWhatsappButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isRateLimited, reportSecurityEvent } = useSecurity();
  const { toast } = useToast();

  const handleWhatsappOrder = async () => {
    // Rate limiting check
    const rateLimitKey = `whatsapp_order_${restaurantId}`;
    if (isRateLimited(rateLimitKey, 5)) { // Max 5 orders per minute
      toast({
        title: "Too many requests",
        description: "Please wait a moment before placing another order.",
        variant: "destructive"
      });
      reportSecurityEvent('rate_limit_exceeded', { 
        action: 'whatsapp_order',
        restaurantId,
        itemName
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sanitize inputs
      const sanitizedItemName = validateAndSanitizeInput(itemName, 100);
      const sanitizedRestaurantId = validateAndSanitizeInput(restaurantId, 50);

      // Validate price
      if (itemPrice <= 0 || itemPrice > 1000000) {
        throw new Error('Invalid item price');
      }

      // Call secure edge function to get WhatsApp details
      const response = await fetch('/api/whatsapp/get-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: sanitizedRestaurantId,
          itemName: sanitizedItemName,
          itemPrice,
          currency
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get WhatsApp contact information');
      }

      const { whatsappNumber, restaurantName } = await response.json();

      // Validate WhatsApp number format
      if (!validateWhatsappNumber(whatsappNumber)) {
        throw new Error('Invalid WhatsApp number format');
      }

      // Create secure message
      const message = encodeURIComponent(
        `Hello ${validateAndSanitizeInput(restaurantName, 50)}! I'd like to order:\n\n` +
        `${sanitizedItemName}\n` +
        `Price: ${itemPrice} ${currency}\n\n` +
        `Please confirm availability and delivery details.`
      );

      // Open WhatsApp in new tab (more secure than direct navigation)
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      // Log successful order attempt
      reportSecurityEvent('whatsapp_order_initiated', {
        restaurantId: sanitizedRestaurantId,
        itemName: sanitizedItemName,
        itemPrice,
        currency
      });

    } catch (error) {
      console.error('WhatsApp order error:', error);
      
      toast({
        title: "Order failed",
        description: "Unable to process your order. Please try again.",
        variant: "destructive"
      });

      reportSecurityEvent('whatsapp_order_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        restaurantId,
        itemName
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleWhatsappOrder}
      disabled={isLoading}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
      size="sm"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {isLoading ? 'Processing...' : 'WhatsApp Order'}
    </Button>
  );
};