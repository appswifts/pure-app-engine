/**
 * Location Detection Service
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Detects user's country and recommends payment gateway
 */

export interface LocationData {
  country: string;
  countryCode: string;
  city?: string;
  currency: 'USD' | 'RWF';
  paymentGateway: 'stripe' | 'manual';
  latitude?: number;
  longitude?: number;
}

export class LocationService {
  private static CACHE_KEY = 'user_location_data';
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get user's location using browser geolocation + reverse geocoding
   */
  static async detectLocation(): Promise<LocationData> {
    // Check cache first
    const cached = this.getCachedLocation();
    if (cached) {
      return cached;
    }

    try {
      // Try browser geolocation first
      const position = await this.getCurrentPosition();
      const locationData = await this.reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );

      // Cache the result
      this.cacheLocation(locationData);
      return locationData;
    } catch (error) {
      // Silently fallback to IP-based location
      // Geolocation denial is expected behavior, not an error
      console.log('Using IP-based location detection (geolocation unavailable)');
      
      // Fallback to IP-based location
      return await this.getLocationFromIP();
    }
  }

  /**
   * Get user's position using browser geolocation API
   */
  private static getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          timeout: 10000,
          maximumAge: 600000, // Cache for 10 minutes
          enableHighAccuracy: false
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get country using OpenStreetMap Nominatim
   */
  private static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<LocationData> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RestaurantMenuApp/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const countryCode = data.address?.country_code?.toUpperCase() || 'US';
    const country = data.address?.country || 'Unknown';
    const city = data.address?.city || data.address?.town || data.address?.village;

    return this.mapCountryToPaymentGateway(countryCode, country, city, latitude, longitude);
  }

  /**
   * Fallback: Get location from IP address using ip-api.com (free, no key required)
   */
  private static async getLocationFromIP(): Promise<LocationData> {
    try {
      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();

      if (data.status === 'success') {
        return this.mapCountryToPaymentGateway(
          data.countryCode,
          data.country,
          data.city,
          data.lat,
          data.lon
        );
      }
    } catch (error) {
      console.error('IP-based location failed:', error);
    }

    // Final fallback: Default to international (USD/Stripe)
    return {
      country: 'International',
      countryCode: 'INTL',
      currency: 'USD',
      paymentGateway: 'stripe'
    };
  }

  /**
   * Map country code to payment gateway and currency
   */
  private static mapCountryToPaymentGateway(
    countryCode: string,
    country: string,
    city?: string,
    latitude?: number,
    longitude?: number
  ): LocationData {
    // Rwanda: Use RWF and Manual Payment (Mobile Money)
    if (countryCode === 'RW') {
      return {
        country: 'Rwanda',
        countryCode: 'RW',
        city,
        currency: 'RWF',
        paymentGateway: 'manual',
        latitude,
        longitude
      };
    }

    // East African countries: Can also use RWF or their local currency
    // But for simplicity, we'll offer USD via Stripe
    const eastAfricanCountries = ['KE', 'UG', 'TZ', 'BI'];
    if (eastAfricanCountries.includes(countryCode)) {
      return {
        country,
        countryCode,
        city,
        currency: 'USD',
        paymentGateway: 'stripe',
        latitude,
        longitude
      };
    }

    // All other countries: USD via Stripe
    return {
      country,
      countryCode,
      city,
      currency: 'USD',
      paymentGateway: 'stripe',
      latitude,
      longitude
    };
  }

  /**
   * Get pricing for a plan based on location
   */
  static async getPricingForLocation(planId: string): Promise<{
    currency: string;
    price: number;
    paymentGateway: string;
  }> {
    const location = await this.detectLocation();

    // This should be fetched from the database via API
    // For now, returning based on detected location
    const pricingMap: Record<string, { rwf: number; usd: number }> = {
      starter: { rwf: 15000, usd: 15 },
      professional: { rwf: 35000, usd: 35 },
      enterprise: { rwf: 75000, usd: 75 }
    };

    const plan = pricingMap[planId] || pricingMap.starter;

    if (location.currency === 'RWF') {
      return {
        currency: 'RWF',
        price: plan.rwf,
        paymentGateway: 'manual'
      };
    }

    return {
      currency: 'USD',
      price: plan.usd,
      paymentGateway: 'stripe'
    };
  }

  /**
   * Get recommended payment gateway based on location
   */
  static async getRecommendedGateway(): Promise<{
    gateway: 'stripe' | 'manual';
    currency: 'USD' | 'RWF';
    reason: string;
  }> {
    const location = await this.detectLocation();

    if (location.countryCode === 'RW') {
      return {
        gateway: 'manual',
        currency: 'RWF',
        reason: `Recommended for Rwanda: Pay in RWF via Mobile Money (MTN, Airtel)`
      };
    }

    return {
      gateway: 'stripe',
      currency: 'USD',
      reason: `Recommended for ${location.country}: Pay in USD via Credit/Debit Card`
    };
  }

  /**
   * Cache location data in localStorage
   */
  private static cacheLocation(data: LocationData): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  }

  /**
   * Get cached location data if still valid
   */
  private static getCachedLocation(): LocationData | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < this.CACHE_DURATION) {
        return data;
      }

      // Cache expired
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear cached location (useful for testing)
   */
  static clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Format location for display
   */
  static formatLocation(location: LocationData): string {
    const parts = [];
    if (location.city) parts.push(location.city);
    parts.push(location.country);
    return parts.join(', ');
  }
}

export default LocationService;
