import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  trial_days: number;
  features: string[];
  is_active: boolean;
  max_menu_items: number;
  max_tables: number;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  last_payment_date: string | null;
  amount: number;
  currency: string;
  billing_interval: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  plan?: SubscriptionPlan;
  restaurant?: {
    name: string;
    email: string;
  };
}

export interface PaymentRecord {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  payment_proof_url: string | null;
  status: string;
  verified_by: string | null;
  verified_at: string | null;
  admin_notes: string | null;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

class SubscriptionService {
  // Get all subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    
    // Transform the data to match our interface
    return (data || []).map(plan => ({
      ...plan,
      features: Array.isArray(plan.features) ? 
        plan.features.filter((f): f is string => typeof f === 'string') : 
        typeof plan.features === 'string' ? [plan.features] : []
    })) as SubscriptionPlan[];
  }

  // Get restaurant's current subscription
  async getRestaurantSubscription(restaurantId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*),
        restaurant:restaurants(name, email)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    
    // Transform the data to match our interface
    const transformed: any = { ...data };
    if (transformed && transformed.plan) {
      transformed.plan = {
        ...transformed.plan,
        features: Array.isArray(transformed.plan.features) ? 
          transformed.plan.features.filter((f): f is string => typeof f === 'string') : 
          typeof transformed.plan.features === 'string' ? [transformed.plan.features] : []
      };
    }
    
    return transformed as Subscription;
  }

  // Admin: Get all subscriptions
  async getAllSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*),
        restaurant:restaurants(name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match our interface
    return (data || []).map(subscription => {
      const transformed: any = { ...subscription };
      if (transformed.plan) {
        transformed.plan = {
          ...transformed.plan,
          features: Array.isArray(transformed.plan.features) ? 
            transformed.plan.features.filter((f): f is string => typeof f === 'string') : 
            typeof transformed.plan.features === 'string' ? [transformed.plan.features] : []
        };
      }
      return transformed;
    }) as Subscription[];
  }

  // Admin: Create subscription for restaurant
  async createSubscription(
    restaurantId: string,
    planId: string,
    startAsTrial: boolean = true
  ): Promise<Subscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) throw planError || new Error('Plan not found');

    const now = new Date();
    const trialEnd = new Date(now.getTime() + (plan.trial_days * 24 * 60 * 60 * 1000));
    const periodEnd = startAsTrial ? trialEnd : new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const subscriptionData = {
      restaurant_id: restaurantId,
      plan_id: planId,
      status: startAsTrial ? 'trial' : 'active',
      trial_start: startAsTrial ? now.toISOString() : null,
      trial_end: startAsTrial ? trialEnd.toISOString() : null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_billing_date: periodEnd.toISOString(),
      amount: plan.price,
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        plan:subscription_plans(*),
        restaurant:restaurants(name, email)
      `)
      .single();

    if (error) throw error;

    // Transform the data to match our interface
    const transformed: any = { ...data };
    if (transformed && transformed.plan) {
      transformed.plan = {
        ...transformed.plan,
        features: Array.isArray(transformed.plan.features) ? 
          transformed.plan.features.filter((f): f is string => typeof f === 'string') : 
          typeof transformed.plan.features === 'string' ? [transformed.plan.features] : []
      };
    }

    // Update restaurant subscription status
    await this.updateRestaurantSubscriptionStatus(restaurantId, transformed.id, startAsTrial ? 'trial' : 'active');

    return transformed as Subscription;
  }

  // Admin: Start free trial for restaurant
  async startFreeTrial(restaurantId: string, planId: string, trialDays: number = 14): Promise<Subscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) throw planError || new Error('Plan not found');

    const now = new Date();
    const trialEnd = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));

    const subscriptionData = {
      restaurant_id: restaurantId,
      plan_id: planId,
      status: 'trial',
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      next_billing_date: trialEnd.toISOString(),
      amount: plan.price,
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      created_by: user.id,
      notes: `Free trial started by admin for ${trialDays} days`,
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        plan:subscription_plans(*),
        restaurant:restaurants(name, email)
      `)
      .single();

    if (error) throw error;

    // Transform the data to match our interface
    const transformed: any = { ...data };
    if (transformed && transformed.plan) {
      transformed.plan = {
        ...transformed.plan,
        features: Array.isArray(transformed.plan.features) ? 
          transformed.plan.features.filter((f): f is string => typeof f === 'string') : 
          typeof transformed.plan.features === 'string' ? [transformed.plan.features] : []
      };
    }

    // Update restaurant subscription status
    await this.updateRestaurantSubscriptionStatus(restaurantId, transformed.id, 'trial', trialEnd);

    return transformed as Subscription;
  }

  // Admin: Activate subscription (mark as paid)
  async activateSubscription(subscriptionId: string, paymentReference?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const nextBilling = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    // Update subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        last_payment_date: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: nextBilling.toISOString(),
        next_billing_date: nextBilling.toISOString(),
        notes: `Activated by admin on ${now.toLocaleDateString()}`,
      })
      .eq('id', subscriptionId)
      .select('restaurant_id')
      .single();

    if (subError) throw subError;

    // Create payment record
    if (paymentReference) {
      await supabase
        .from('payment_records')
        .insert({
          subscription_id: subscriptionId,
          amount: 0, // Will be updated with actual amount
          currency: 'RWF',
          payment_method: 'manual',
          reference_number: paymentReference,
          status: 'verified',
          verified_by: user.id,
          verified_at: now.toISOString(),
          admin_notes: 'Payment verified by admin',
        });
    }

    // Update restaurant status
    await this.updateRestaurantSubscriptionStatus(subscription.restaurant_id, subscriptionId, 'active', null, nextBilling);
  }

  // Admin: Cancel subscription
  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        cancellation_reason: reason,
        notes: `Cancelled by admin: ${reason}`,
      })
      .eq('id', subscriptionId)
      .select('restaurant_id')
      .single();

    if (error) throw error;

    // Update restaurant status
    await this.updateRestaurantSubscriptionStatus(subscription.restaurant_id, subscriptionId, 'inactive');
  }

  // Update restaurant subscription status
  private async updateRestaurantSubscriptionStatus(
    restaurantId: string,
    subscriptionId: string,
    status: string,
    trialEndDate?: Date | null,
    subscriptionEndDate?: Date | null
  ): Promise<void> {
    const updateData: any = {
      current_subscription_id: subscriptionId,
      subscription_status: status,
    };

    if (trialEndDate) {
      updateData.trial_end_date = trialEndDate.toISOString();
    }

    if (subscriptionEndDate) {
      updateData.subscription_end_date = subscriptionEndDate.toISOString();
    }

    if (status === 'active') {
      updateData.subscription_start_date = new Date().toISOString();
      updateData.last_payment_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId);

    if (error) throw error;
  }

  // Get payment records for subscription
  async getPaymentRecords(subscriptionId: string): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Admin: Get all pending payment records
  async getPendingPayments(): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from('payment_records')
      .select(`
        *,
        subscription:subscriptions(
          restaurant:restaurants(name, email),
          plan:subscription_plans(name)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Admin: Verify payment
  async verifyPayment(paymentId: string, adminNotes?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('payment_records')
      .update({
        status: 'verified',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', paymentId);

    if (error) throw error;
  }

  // Admin: Reject payment
  async rejectPayment(paymentId: string, adminNotes: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('payment_records')
      .update({
        status: 'rejected',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', paymentId);

    if (error) throw error;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;