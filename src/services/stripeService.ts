import { supabase } from '@/integrations/supabase/client';

export interface StripeConfig {
  id?: string;
  environment: 'test' | 'live';
  publishable_key: string;
  secret_key_encrypted: string;
  webhook_secret?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

class StripeService {
  /**
   * ============================================
   * STRIPE CONFIGURATION CRUD
   * ============================================
   */

  /**
   * CREATE/UPDATE Stripe Configuration
   */
  async saveConfig(config: Omit<StripeConfig, 'id' | 'created_at' | 'updated_at'>): Promise<StripeConfig> {
    try {
      // Check if config exists for this environment
      const { data: existing, error: checkError } = await (supabase as any)
        .from('stripe_config')
        .select('id')
        .eq('environment', config.environment)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let result;
      
      if (existing) {
        // UPDATE existing config
        const { data, error } = await (supabase as any)
          .from('stripe_config')
          .update({
            publishable_key: config.publishable_key,
            secret_key_encrypted: config.secret_key_encrypted,
            webhook_secret: config.webhook_secret,
            is_active: config.is_active,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // CREATE new config
        const { data, error } = await (supabase as any)
          .from('stripe_config')
          .insert({
            environment: config.environment,
            publishable_key: config.publishable_key,
            secret_key_encrypted: config.secret_key_encrypted,
            webhook_secret: config.webhook_secret,
            is_active: config.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // If setting this as active, deactivate other configs
      if (config.is_active) {
        await (supabase as any)
          .from('stripe_config')
          .update({ is_active: false })
          .neq('id', result.id);
      }

      return result;
    } catch (error) {
      console.error('Error saving Stripe config:', error);
      throw error;
    }
  }

  /**
   * READ Active Stripe Configuration
   */
  async getActiveConfig(): Promise<StripeConfig | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('stripe_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No config found
          return null;
        }
        throw error;
      }

      return data as StripeConfig;
    } catch (error) {
      console.error('Error fetching active Stripe config:', error);
      throw error;
    }
  }

  /**
   * READ Config by Environment
   */
  async getConfigByEnvironment(environment: 'test' | 'live'): Promise<StripeConfig | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('stripe_config')
        .select('*')
        .eq('environment', environment)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as StripeConfig;
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      throw error;
    }
  }

  /**
   * READ All Configurations
   */
  async getAllConfigs(): Promise<StripeConfig[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('stripe_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as StripeConfig[];
    } catch (error) {
      console.error('Error fetching Stripe configs:', error);
      throw error;
    }
  }

  /**
   * UPDATE - Set Active Configuration
   */
  async setActiveConfig(configId: string): Promise<void> {
    try {
      // Deactivate all configs
      await (supabase as any)
        .from('stripe_config')
        .update({ is_active: false })
        .neq('id', configId);

      // Activate selected config
      const { error } = await (supabase as any)
        .from('stripe_config')
        .update({ is_active: true })
        .eq('id', configId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting active config:', error);
      throw error;
    }
  }

  /**
   * DELETE Stripe Configuration
   */
  async deleteConfig(configId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('stripe_config')
        .delete()
        .eq('id', configId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting Stripe config:', error);
      throw error;
    }
  }

  /**
   * ============================================
   * STRIPE API OPERATIONS (via Edge Functions)
   * ============================================
   */

  /**
   * CREATE Stripe Customer
   */
  async createCustomer(email: string, name: string, metadata?: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-customer', {
        body: {
          action: 'create',
          email,
          name,
          metadata
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * READ Stripe Customer
   */
  async getCustomer(customerId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-customer', {
        body: {
          action: 'get',
          customerId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching Stripe customer:', error);
      throw error;
    }
  }

  /**
   * UPDATE Stripe Customer
   */
  async updateCustomer(customerId: string, updates: Partial<StripeCustomer>): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-customer', {
        body: {
          action: 'update',
          customerId,
          updates
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * DELETE Stripe Customer
   */
  async deleteCustomer(customerId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-customer', {
        body: {
          action: 'delete',
          customerId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting Stripe customer:', error);
      throw error;
    }
  }

  /**
   * CREATE Stripe Subscription
   */
  async createSubscription(customerId: string, priceId: string, metadata?: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription', {
        body: {
          action: 'create',
          customerId,
          priceId,
          metadata
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * READ Stripe Subscription
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription', {
        body: {
          action: 'get',
          subscriptionId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * UPDATE Stripe Subscription
   */
  async updateSubscription(subscriptionId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription', {
        body: {
          action: 'update',
          subscriptionId,
          updates
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * CANCEL Stripe Subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription', {
        body: {
          action: 'cancel',
          subscriptionId,
          cancelAtPeriodEnd
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * LIST Payments for Customer
   */
  async listPayments(customerId: string, limit = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payments', {
        body: {
          action: 'list',
          customerId,
          limit
        }
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing Stripe payments:', error);
      throw error;
    }
  }

  /**
   * CREATE Checkout Session
   */
  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string): Promise<{ url: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          successUrl,
          cancelUrl
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * ============================================
   * HELPER METHODS
   * ============================================
   */

  /**
   * Simple encryption for secret keys (Base64 encoding)
   * In production, use a proper encryption library
   */
  encryptSecretKey(secretKey: string): string {
    try {
      return btoa(secretKey);
    } catch (error) {
      console.error('Error encrypting secret key:', error);
      throw error;
    }
  }

  /**
   * Simple decryption for secret keys (Base64 decoding)
   * In production, use a proper encryption library
   */
  decryptSecretKey(encryptedKey: string): string {
    try {
      return atob(encryptedKey);
    } catch (error) {
      console.error('Error decrypting secret key:', error);
      throw error;
    }
  }

  /**
   * Validate Stripe Configuration
   */
  validateConfig(config: Partial<StripeConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.publishable_key) {
      errors.push('Publishable key is required');
    } else if (!config.publishable_key.startsWith('pk_')) {
      errors.push('Invalid publishable key format (must start with pk_)');
    }

    if (!config.secret_key_encrypted) {
      errors.push('Secret key is required');
    }

    if (!config.environment || !['test', 'live'].includes(config.environment)) {
      errors.push('Environment must be either "test" or "live"');
    }

    // Ensure test keys match test environment
    if (config.environment === 'test' && config.publishable_key && !config.publishable_key.includes('_test_')) {
      errors.push('Test environment requires test keys (pk_test_...)');
    }

    // Ensure live keys match live environment
    if (config.environment === 'live' && config.publishable_key && !config.publishable_key.includes('_live_')) {
      errors.push('Live environment requires live keys (pk_live_...)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Test Stripe Connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getActiveConfig();
      
      if (!config) {
        return {
          success: false,
          message: 'No active Stripe configuration found'
        };
      }

      // Test connection via edge function
      const { data, error } = await supabase.functions.invoke('stripe-test', {
        body: { action: 'test' }
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Stripe connection successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to Stripe'
      };
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;
