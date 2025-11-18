import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Define the structure of a payment gateway
interface PaymentGateway {
  id: string;
  name: string;
  enabled: boolean;
}

// Define the options for creating a manual payment
interface ManualPaymentOptions {
  paymentMethod: 'bank_transfer' | 'mtn_mobile_money' | 'airtel_money' | 'cash';
  customerEmail: string;
  customerName: string;
  restaurantId: string;
}

// Define the structure of a payment intent
interface PaymentIntent {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  metadata: {
    paymentInstructions: any;
  };
}

// Mock available gateways
const availableGateways: PaymentGateway[] = [
  { id: 'manual', name: 'Manual Payment', enabled: true },
  { id: 'stripe', name: 'Stripe', enabled: false }, // Disabled for now
];

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPayment = async (
    gatewayId: string,
    amount: number,
    currency: string,
    options: ManualPaymentOptions
  ): Promise<PaymentIntent | null> => {
    setLoading(true);
    setError(null);

    if (gatewayId !== 'manual') {
      const err = new Error('Only manual payments are supported at this time.');
      setError(err);
      setLoading(false);
      throw err;
    }

    try {
      const paymentId = `manual_${Date.now()}_${uuidv4().substring(0, 8)}`;

      const paymentInstructions = {
        bank_transfer: {
          bankName: import.meta.env.VITE_BANK_NAME,
          accountNumber: import.meta.env.VITE_BANK_ACCOUNT,
          accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME,
          reference: paymentId,
        },
        mtn_mobile_money: {
          number: import.meta.env.VITE_MTN_NUMBER,
          instructions: 'Dial *182# or use MoMo app to send money.',
          reference: paymentId,
        },
        airtel_money: {
          number: import.meta.env.VITE_AIRTEL_NUMBER,
          instructions: 'Dial *182# or use Airtel Money app to send money.',
          reference: paymentId,
        },
        cash: {
          instructions: 'Pay cash at our office and upload a photo of the receipt.',
        },
      };

      const { data, error: insertError } = await supabase
        .from('manual_payments')
        .insert({
          payment_id: paymentId,
          amount,
          currency,
          status: 'pending',
          payment_method: options.paymentMethod,
          customer_email: options.customerEmail,
          customer_name: options.customerName,
          restaurant_id: options.restaurantId,
          metadata: {
            paymentInstructions: paymentInstructions[options.paymentMethod],
          },
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setLoading(false);
      return {
        paymentId: data.payment_id,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        metadata: {
          paymentInstructions: data.metadata.paymentInstructions,
        },
      };
    } catch (err: any) {
      setError(err);
      setLoading(false);
      return null;
    }
  };

  return { createPayment, availableGateways, loading, error };
};
