import { supabase } from "@/integrations/supabase/client";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  exchange_rate_to_usd: number;
  is_active: boolean;
}

export interface Country {
  code: string;
  name: string;
  local_name?: string | null;
  phone_code: string | null;
  default_currency: string | null;
  default_language: string | null;
  default_timezone: string | null;
  common_languages: any;
  is_supported: boolean | null;
  date_format: string | null;
  time_format: string | null;
  number_format: any;
  created_at: string | null;
}

export interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  is_active: boolean | null;
  supported_countries: any;
  supported_currencies: any;
  config: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface RegionalPricing {
  id: string;
  plan_id: string | null;
  country_code: string | null;
  currency: string | null;
  price: number;
  discount_percentage?: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// Cache for global data
let currencyCache: Currency[] | null = null;
let countryCache: Country[] | null = null;
let paymentGatewayCache: PaymentGateway[] | null = null;

// Fetch currencies from database
export const fetchCurrencies = async (): Promise<Currency[]> => {
  if (currencyCache) {
    return currencyCache;
  }

  try {
    const { data, error } = await supabase
      .from("global_currencies")
      .select("*")
      .eq("is_active", true)
      .order("code");

    if (error) {
      console.error("Error fetching currencies:", error);
      return [];
    }

    currencyCache = data || [];
    return currencyCache;
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return [];
  }
};

// Fetch countries from database
export const fetchCountries = async (): Promise<Country[]> => {
  if (countryCache) {
    return countryCache;
  }

  try {
    const { data, error } = await supabase
      .from("global_countries")
      .select("*")
      .eq("is_supported", true)
      .order("name");

    if (error) {
      console.error("Error fetching countries:", error);
      return [];
    }

    countryCache = data || [];
    return countryCache;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
};

// Fetch payment gateways from database
// Payment gateways removed - subscription system no longer used
export const fetchPaymentGateways = async (): Promise<PaymentGateway[]> => {
  return [];
};

// Get regional pricing for a plan and country
export const getRegionalPricing = async (
  planId: string,
  countryCode: string,
): Promise<RegionalPricing | null> => {
  try {
    const { data, error } = await supabase
      .from("regional_pricing")
      .select("*")
      .eq("plan_id", planId)
      .eq("country_code", countryCode)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching regional pricing:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching regional pricing:", error);
    return null;
  }
};

// Detect user's country based on various factors
export const detectUserCountry = async (): Promise<string> => {
  // Try different methods to detect country

  // Method 1: Check if we have it stored in localStorage
  const storedCountry = localStorage.getItem("user_country");
  if (storedCountry) {
    return storedCountry;
  }

  // Method 2: Try to get from browser timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countries = await fetchCountries();
    const countryByTimezone = countries.find(
      (country) => country.default_timezone === timezone,
    );
    if (countryByTimezone) {
      localStorage.setItem("user_country", countryByTimezone.code);
      return countryByTimezone.code;
    }
  } catch (error) {
    console.warn("Could not detect country from timezone:", error);
  }

  // Method 3: Try to get from browser language
  try {
    const browserLanguage = navigator.language;
    const languageCode = browserLanguage.split("-")[0];
    const countryFromLanguage = browserLanguage.split("-")[1]?.toUpperCase();

    if (countryFromLanguage) {
      const countries = await fetchCountries();
      const country = countries.find((c) => c.code === countryFromLanguage);
      if (country) {
        localStorage.setItem("user_country", country.code);
        return country.code;
      }
    }

    // Fallback: map common languages to countries
    const languageCountryMap: Record<string, string> = {
      en: "US",
      es: "ES",
      fr: "FR",
      de: "DE",
      it: "IT",
      pt: "BR",
      ru: "RU",
      ja: "JP",
      ko: "KR",
      zh: "CN",
      ar: "SA",
      hi: "IN",
      sw: "KE",
      rw: "RW",
    };

    const mappedCountry = languageCountryMap[languageCode];
    if (mappedCountry) {
      localStorage.setItem("user_country", mappedCountry);
      return mappedCountry;
    }
  } catch (error) {
    console.warn("Could not detect country from language:", error);
  }

  // Default fallback
  const defaultCountry = "US";
  localStorage.setItem("user_country", defaultCountry);
  return defaultCountry;
};

// Get currency by code
export const getCurrency = async (
  currencyCode: string,
): Promise<Currency | null> => {
  const currencies = await fetchCurrencies();
  return currencies.find((c) => c.code === currencyCode) || null;
};

// Get country by code
export const getCountry = async (
  countryCode: string,
): Promise<Country | null> => {
  const countries = await fetchCountries();
  return countries.find((c) => c.code === countryCode) || null;
};

// Get available payment gateways for a country
export const getAvailablePaymentGateways = async (
  countryCode: string,
): Promise<PaymentGateway[]> => {
  const gateways = await fetchPaymentGateways();
  return gateways.filter((gateway) => {
    if (!gateway.supported_countries) return false;
    const countries = Array.isArray(gateway.supported_countries)
      ? gateway.supported_countries
      : JSON.parse(gateway.supported_countries as string);
    return countries.includes(countryCode);
  });
};

// Currency conversion utility
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const currencies = await fetchCurrencies();
    const fromCurrencyData = currencies.find((c) => c.code === fromCurrency);
    const toCurrencyData = currencies.find((c) => c.code === toCurrency);

    if (!fromCurrencyData || !toCurrencyData) {
      console.warn(`Currency not found: ${fromCurrency} or ${toCurrency}`);
      return amount;
    }

    // Convert through USD
    const usdAmount = amount / fromCurrencyData.exchange_rate_to_usd;
    const convertedAmount = usdAmount * toCurrencyData.exchange_rate_to_usd;

    return convertedAmount;
  } catch (error) {
    console.error("Error converting currency:", error);
    return amount;
  }
};

// Format currency with proper symbols and decimal places
export const formatCurrencyAmount = async (
  amount: number,
  currencyCode: string,
  locale?: string,
): Promise<string> => {
  try {
    const currency = await getCurrency(currencyCode);
    if (!currency) {
      return `${currencyCode} ${amount.toLocaleString()}`;
    }

    const formatter = new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currency.decimal_places || 2,
      maximumFractionDigits: currency.decimal_places || 2,
    });

    return formatter.format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
};

// Synchronous version for UI components
export const formatCurrencyAmountSync = (
  amount: number,
  currencyCode: string,
  locale?: string,
  decimalPlaces: number = 2,
): string => {
  try {
    const formatter = new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    return formatter.format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
};

// Get localized number format for a country
export const formatNumberForCountry = async (
  number: number,
  countryCode: string,
): Promise<string> => {
  try {
    const country = await getCountry(countryCode);
    if (!country || !country.number_format) {
      return number.toLocaleString();
    }

    const numberFormat =
      typeof country.number_format === "string"
        ? JSON.parse(country.number_format)
        : country.number_format;
    const { decimal, thousands } = numberFormat;

    // Simple implementation - could be enhanced with proper locale formatting
    const parts = number.toString().split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    const decimalPart = parts[1];

    return decimalPart ? `${integerPart}${decimal}${decimalPart}` : integerPart;
  } catch (error) {
    console.warn("Error formatting number for country:", error);
    return number.toLocaleString();
  }
};

// Get date format for a country
export const getDateFormatForCountry = async (
  countryCode: string,
): Promise<string> => {
  try {
    const country = await getCountry(countryCode);
    return country?.date_format || "MM/DD/YYYY";
  } catch (error) {
    console.warn("Error getting date format:", error);
    return "MM/DD/YYYY";
  }
};

// Get time format for a country
export const getTimeFormatForCountry = async (
  countryCode: string,
): Promise<string> => {
  try {
    const country = await getCountry(countryCode);
    return country?.time_format || "12h";
  } catch (error) {
    console.warn("Error getting time format:", error);
    return "12h";
  }
};

// Format date according to country preferences
export const formatDateForCountry = async (
  date: Date | string,
  countryCode: string,
): Promise<string> => {
  try {
    const country = await getCountry(countryCode);
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (!country) {
      return dateObj.toLocaleDateString();
    }

    // Map country date format to Intl options
    const formatOptions: Intl.DateTimeFormatOptions = {};

    if (country.date_format.includes("YYYY")) {
      formatOptions.year = "numeric";
    }
    if (country.date_format.includes("MM")) {
      formatOptions.month = "2-digit";
    }
    if (country.date_format.includes("DD")) {
      formatOptions.day = "2-digit";
    }

    // Use country's default language for locale
    const locale = `${country.default_language}-${countryCode}`;

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.warn("Error formatting date for country:", error);
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
};

// Format time according to country preferences
export const formatTimeForCountry = async (
  date: Date | string,
  countryCode: string,
): Promise<string> => {
  try {
    const country = await getCountry(countryCode);
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (!country) {
      return dateObj.toLocaleTimeString();
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: country.time_format === "12h",
    };

    // Use country's default language for locale
    const locale = `${country.default_language}-${countryCode}`;

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.warn("Error formatting time for country:", error);
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleTimeString();
  }
};

// Initialize global settings based on user's detected location
export const initializeGlobalSettings = async (): Promise<{
  country: Country;
  currency: Currency;
  paymentGateways: PaymentGateway[];
}> => {
  try {
    const detectedCountry = await detectUserCountry();
    const country = await getCountry(detectedCountry);

    if (!country) {
      throw new Error(`Country ${detectedCountry} not found`);
    }

    const currency = await getCurrency(country.default_currency);
    if (!currency) {
      throw new Error(`Currency ${country.default_currency} not found`);
    }

    const paymentGateways = await getAvailablePaymentGateways(country.code);

    return {
      country,
      currency,
      paymentGateways,
    };
  } catch (error) {
    console.error("Error initializing global settings:", error);

    // Fallback to defaults
    const defaultCountry = await getCountry("US");
    const defaultCurrency = await getCurrency("USD");
    const defaultGateways = await getAvailablePaymentGateways("US");

    return {
      country: defaultCountry!,
      currency: defaultCurrency!,
      paymentGateways: defaultGateways,
    };
  }
};

// Clear caches (useful for admin operations or when data is updated)
export const clearGlobalCache = () => {
  currencyCache = null;
  countryCache = null;
  paymentGatewayCache = null;
};

// Update exchange rates (admin function)
export const updateExchangeRates = async (
  rates: Record<string, number>,
): Promise<void> => {
  try {
    const updatePromises = Object.entries(rates).map(([currencyCode, rate]) =>
      supabase
        .from("global_currencies")
        .update({
          exchange_rate_to_usd: rate,
          updated_at: new Date().toISOString(),
        })
        .eq("code", currencyCode),
    );

    await Promise.all(updatePromises);

    // Clear cache to force refresh
    currencyCache = null;

    console.log("Exchange rates updated successfully");
  } catch (error) {
    console.error("Error updating exchange rates:", error);
    throw error;
  }
};

// Validate phone number format for a country
export const validatePhoneNumber = async (
  phoneNumber: string,
  countryCode: string,
): Promise<boolean> => {
  try {
    const country = await getCountry(countryCode);
    if (!country) {
      return false;
    }

    // Remove all non-digit characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");

    // Check if it starts with the country's phone code
    const expectedPrefix = country.phone_code.replace("+", "");

    if (cleanNumber.startsWith("+")) {
      return cleanNumber.startsWith("+" + expectedPrefix);
    } else if (cleanNumber.startsWith(expectedPrefix)) {
      return true;
    } else if (cleanNumber.startsWith("0")) {
      // Handle local format (starting with 0)
      return cleanNumber.length >= 9; // Minimum length check
    }

    return false;
  } catch (error) {
    console.warn("Error validating phone number:", error);
    return false;
  }
};

// Format phone number for a country
export const formatPhoneNumber = async (
  phoneNumber: string,
  countryCode: string,
  international: boolean = true,
): Promise<string> => {
  try {
    const country = await getCountry(countryCode);
    if (!country) {
      return phoneNumber;
    }

    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, "");

    if (international) {
      // Ensure it starts with country code
      const expectedPrefix = country.phone_code.replace("+", "");
      if (!digitsOnly.startsWith(expectedPrefix)) {
        return `${country.phone_code}${digitsOnly}`;
      }
      return `+${digitsOnly}`;
    } else {
      // Return local format
      const expectedPrefix = country.phone_code.replace("+", "");
      if (digitsOnly.startsWith(expectedPrefix)) {
        return digitsOnly.substring(expectedPrefix.length);
      }
      return digitsOnly;
    }
  } catch (error) {
    console.warn("Error formatting phone number:", error);
    return phoneNumber;
  }
};
