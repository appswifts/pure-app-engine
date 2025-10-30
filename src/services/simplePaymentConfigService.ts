import { supabase } from '@/integrations/supabase/client';

export interface PaymentConfigResponse {
  manual: {
    enabled: boolean;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    mtn_number?: string;
    airtel_number?: string;
    instructions?: string;
  };
}

class SimplePaymentConfigService {
  private static instance: SimplePaymentConfigService;
  private cache: PaymentConfigResponse | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): SimplePaymentConfigService {
    if (!SimplePaymentConfigService.instance) {
      SimplePaymentConfigService.instance = new SimplePaymentConfigService();
    }
    return SimplePaymentConfigService.instance;
  }

  /**
   * Get current payment configuration (simplified - manual only)
   */
  async getPaymentConfig(): Promise<PaymentConfigResponse> {
    try {
      // Return cached data if still valid
      if (this.cache && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
        return this.cache;
      }


      // Try to get from database, but fallback to default
      let manualConfig = {
        enabled: true,
        bank_name: 'Bank of Kigali',
        account_number: '400015000001234',
        account_name: 'MenuForest Ltd',
        mtn_number: '+250788123456',
        airtel_number: '+250731123456',
        instructions: 'Please send payment proof via WhatsApp after completing payment.',
      };

      // Just use default manual config for now - database access will be fixed later

      const config: PaymentConfigResponse = {
        manual: manualConfig
      };

      // Cache the result
      this.cache = config;
      this.cacheTimestamp = Date.now();

      return config;
    } catch (error) {
      return this.getDefaultConfig();
    }
  }

  /**
   * Check if manual payments are enabled
   */
  async isManualPaymentEnabled(): Promise<boolean> {
    const config = await this.getPaymentConfig();
    return config.manual.enabled;
  }

  /**
   * Get manual payment information for display
   */
  async getManualPaymentInfo() {
    const config = await this.getPaymentConfig();
    
    if (!config.manual.enabled) {
      return null;
    }

    return {
      bank_name: config.manual.bank_name,
      account_number: config.manual.account_number,
      account_name: config.manual.account_name,
      mtn_number: config.manual.mtn_number,
      airtel_number: config.manual.airtel_number,
      instructions: config.manual.instructions,
    };
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get default configuration when database is unavailable
   */
  private getDefaultConfig(): PaymentConfigResponse {
    return {
      manual: {
        enabled: true,
        bank_name: 'Bank of Kigali',
        account_number: '400015000001234',
        account_name: 'MenuForest Ltd',
        mtn_number: '+250788123456',
        airtel_number: '+250731123456',
        instructions: 'Please send payment proof via WhatsApp after completing payment.',
      }
    };
  }
}

// Export singleton instance
export const simplePaymentConfigService = SimplePaymentConfigService.getInstance();
export default simplePaymentConfigService;