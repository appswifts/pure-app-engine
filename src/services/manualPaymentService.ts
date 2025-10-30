import { supabase } from '@/integrations/supabase/client';

export interface ManualPaymentRequest {
  user_id: string;
  restaurant_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  description: string;
  payment_method: 'bank_transfer' | 'mobile_money';
  reference_number?: string;
  payment_proof_url?: string;
}

export interface PaymentApproval {
  payment_request_id: string;
  admin_notes?: string;
  verified_by: string;
}

class ManualPaymentService {
  /**
   * Create a manual payment request for subscription
   */
  async createPaymentRequest(data: Omit<ManualPaymentRequest, 'user_id'>): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const grace_period_end = new Date(data.due_date);
      grace_period_end.setDate(grace_period_end.getDate() + 7); // 7 days grace period

      const { data: paymentRequest, error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          restaurant_id: data.restaurant_id,
          subscription_id: data.subscription_id,
          amount: data.amount,
          currency: data.currency,
          billing_period_start: data.billing_period_start,
          billing_period_end: data.billing_period_end,
          due_date: data.due_date,
          grace_period_end: grace_period_end.toISOString(),
          description: data.description,
          payment_method: data.payment_method,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Send admin notification about new payment request
      try {
        await supabase.functions.invoke('admin-notifications', {
          body: {
            type: 'new_restaurant',
            restaurantId: data.restaurant_id,
            data: {
              amount: data.amount,
              currency: data.currency,
              description: data.description,
              paymentRequestId: paymentRequest.id
            }
          }
        });
      } catch (notificationError) {
        console.error('Failed to send admin notification:', notificationError);
        // Don't fail the payment request creation if notification fails
      }

      return paymentRequest;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit payment proof for a payment request
   */
  async submitPaymentProof(
    paymentRequestId: string, 
    referenceNumber: string, 
    proofUrl?: string
  ): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: updatedRequest, error } = await supabase
        .from('payment_requests')
        .update({
          reference_number: referenceNumber,
          payment_proof_url: proofUrl,
          status: 'pending_approval',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentRequestId)
        .eq('user_id', user.id) // Ensure user can only update their own requests
        .select()
        .single();

      if (error) throw error;

      // Send admin notification about payment proof submission
      try {
        await supabase.functions.invoke('admin-notifications', {
          body: {
            type: 'payment_proof',
            restaurantId: updatedRequest.restaurant_id,
            data: {
              amount: updatedRequest.amount,
              currency: updatedRequest.currency,
              reference: referenceNumber,
              paymentRequestId: paymentRequestId,
              proofUrl: proofUrl
            }
          }
        });
      } catch (notificationError) {
        console.error('Failed to send admin notification:', notificationError);
      }

      return updatedRequest;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Admin: Approve a payment request
   */
  async approvePayment(data: PaymentApproval): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update payment request status
      const { data: updatedRequest, error: requestError } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          verified_by: user.email || user.id,
          admin_notes: data.admin_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.payment_request_id)
        .select('*, subscription_id')
        .single();

      if (requestError) throw requestError;

      // Update subscription status to active
      if (updatedRequest.subscription_id) {
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            last_payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedRequest.subscription_id);

        if (subscriptionError) {
        }
      }

      return updatedRequest;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Admin: Reject a payment request
   */
  async rejectPayment(paymentRequestId: string, reason: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: updatedRequest, error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          verified_by: user.email || user.id,
          admin_notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRequestId)
        .select()
        .single();

      if (error) throw error;

      return updatedRequest;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment requests for a restaurant
   */
  async getPaymentRequests(restaurantId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Admin: Get all pending payment requests
   */
  async getAllPendingPayments(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          restaurants(name, email)
        `)
        .in('status', ['pending_approval', 'pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw error;
    }
  }
}

export const manualPaymentService = new ManualPaymentService();
export default manualPaymentService;