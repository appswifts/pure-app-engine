import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, RefreshCw, Info } from "lucide-react";
import {
  fetchCurrencies,
  convertCurrency,
  formatCurrencyAmount,
  detectUserCountry,
  getCountry,
  Currency,
} from "@/lib/global";
import { useTranslation } from "@/lib/i18n";

interface CurrencyDisplayProps {
  amount: number;
  baseCurrency: string;
  displayCurrency?: string;
  showConversion?: boolean;
  showSymbol?: boolean;
  precision?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  baseCurrency,
  displayCurrency,
  showConversion = false,
  showSymbol = true,
  precision = 2,
  size = 'md',
  className = '',
}) => {
  const { t } = useTranslation();
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetCurrency = displayCurrency || baseCurrency;

  useEffect(() => {
    const performConversion = async () => {
      if (baseCurrency === targetCurrency || !showConversion) {
        setConvertedAmount(amount);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const converted = await convertCurrency(amount, baseCurrency, targetCurrency);
        setConvertedAmount(converted);
      } catch (err) {
        console.error('Currency conversion error:', err);
        setError('Conversion failed');
        setConvertedAmount(amount); // Fallback to original amount
      } finally {
        setLoading(false);
      }
    };

    performConversion();
  }, [amount, baseCurrency, targetCurrency, showConversion]);

  const formatAmount = (value: number, currency: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(value);

    return formatted;
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  if (loading) {
    return <Skeleton className={`h-6 w-16 ${className}`} />;
  }

  if (error || convertedAmount === null) {
    return (
      <span className={`${sizeClasses[size]} text-muted-foreground ${className}`}>
        {formatAmount(amount, baseCurrency)}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${sizeClasses[size]} font-medium`}>
        {formatAmount(convertedAmount, targetCurrency)}
      </span>

      {showConversion && baseCurrency !== targetCurrency && (
        <Badge variant="outline" className="text-xs">
          ≈ {formatAmount(amount, baseCurrency)}
        </Badge>
      )}
    </div>
  );
};

interface CurrencySelectorProps {
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
  availableCurrencies?: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currentCurrency,
  onCurrencyChange,
  availableCurrencies,
  size = 'sm',
  className = '',
}) => {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setLoading(true);
        const allCurrencies = await fetchCurrencies();

        let filteredCurrencies = allCurrencies;
        if (availableCurrencies && availableCurrencies.length > 0) {
          filteredCurrencies = allCurrencies.filter(c =>
            availableCurrencies.includes(c.code)
          );
        }

        setCurrencies(filteredCurrencies);
      } catch (error) {
        console.error('Error loading currencies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrencies();
  }, [availableCurrencies]);

  if (loading) {
    return <Skeleton className="h-8 w-20" />;
  }

  const currentCurrencyData = currencies.find(c => c.code === currentCurrency);

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${sizeClasses[size]} ${className}`}
        >
          <DollarSign className="h-3 w-3" />
          {currentCurrencyData?.symbol} {currentCurrency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => onCurrencyChange(currency.code)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{currency.symbol}</span>
              <span>{currency.code}</span>
            </div>
            {currency.code === currentCurrency && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface PriceComparisonProps {
  amount: number;
  baseCurrency: string;
  comparisonCurrencies: string[];
  className?: string;
}

export const PriceComparison: React.FC<PriceComparisonProps> = ({
  amount,
  baseCurrency,
  comparisonCurrencies,
  className = '',
}) => {
  const { t } = useTranslation();
  const [conversions, setConversions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performConversions = async () => {
      try {
        setLoading(true);
        const conversionPromises = comparisonCurrencies.map(async (currency) => {
          if (currency === baseCurrency) {
            return { currency, amount };
          }
          const converted = await convertCurrency(amount, baseCurrency, currency);
          return { currency, amount: converted };
        });

        const results = await Promise.all(conversionPromises);
        const conversionMap = results.reduce((acc, { currency, amount }) => {
          acc[currency] = amount;
          return acc;
        }, {} as Record<string, number>);

        setConversions(conversionMap);
      } catch (error) {
        console.error('Error performing currency conversions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (comparisonCurrencies.length > 0) {
      performConversions();
    }
  }, [amount, baseCurrency, comparisonCurrencies]);

  if (loading) {
    return (
      <div className={`space-y-1 ${className}`}>
        {comparisonCurrencies.map((_, index) => (
          <Skeleton key={index} className="h-4 w-24" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-1 text-sm text-muted-foreground ${className}`}>
      {Object.entries(conversions).map(([currency, amount]) => (
        <div key={currency} className="flex items-center justify-between">
          <span>{currency}:</span>
          <CurrencyDisplay
            amount={amount}
            baseCurrency={currency}
            size="sm"
            showConversion={false}
          />
        </div>
      ))}
    </div>
  );
};

interface AutoCurrencyDetectorProps {
  onCurrencyDetected: (currency: string) => void;
  fallbackCurrency?: string;
}

export const AutoCurrencyDetector: React.FC<AutoCurrencyDetectorProps> = ({
  onCurrencyDetected,
  fallbackCurrency = 'USD',
}) => {
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const userCountry = await detectUserCountry();
        const country = await getCountry(userCountry);

        if (country && country.default_currency) {
          onCurrencyDetected(country.default_currency);
        } else {
          onCurrencyDetected(fallbackCurrency);
        }
      } catch (error) {
        console.error('Error detecting currency:', error);
        onCurrencyDetected(fallbackCurrency);
      }
    };

    detectCurrency();
  }, [onCurrencyDetected, fallbackCurrency]);

  return null; // This is a utility component with no visual output
};

interface CurrencyConverterProps {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  onConversionComplete?: (convertedAmount: number) => void;
  showRate?: boolean;
  className?: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  amount,
  fromCurrency,
  toCurrency,
  onConversionComplete,
  showRate = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performConversion = async () => {
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      setExchangeRate(1);
      onConversionComplete?.(amount);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const converted = await convertCurrency(amount, fromCurrency, toCurrency);
      const rate = converted / amount;

      setConvertedAmount(converted);
      setExchangeRate(rate);
      onConversionComplete?.(converted);
    } catch (err) {
      console.error('Currency conversion error:', err);
      setError('Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performConversion();
  }, [amount, fromCurrency, toCurrency]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-6 w-20" />
        <RefreshCw className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error || convertedAmount === null) {
    return (
      <div className={`flex items-center gap-2 text-destructive ${className}`}>
        <span className="text-sm">{error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={performConversion}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <CurrencyDisplay
          amount={amount}
          baseCurrency={fromCurrency}
          size="sm"
          showConversion={false}
        />
        <span className="text-muted-foreground">→</span>
        <CurrencyDisplay
          amount={convertedAmount}
          baseCurrency={toCurrency}
          size="sm"
          showConversion={false}
          className="font-semibold"
        />
      </div>

      {showRate && exchangeRate && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>
            1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
          </span>
        </div>
      )}
    </div>
  );
};

// Utility hook for managing currency in components
export const useCurrency = (initialCurrency?: string) => {
  const [currency, setCurrency] = useState<string>(initialCurrency || 'USD');
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);

  useEffect(() => {
    if (!initialCurrency) {
      const detectCurrency = async () => {
        try {
          const userCountry = await detectUserCountry();
          const country = await getCountry(userCountry);

          if (country?.default_currency) {
            const detected = country.default_currency;
            setDetectedCurrency(detected);
            setCurrency(detected);
          }
        } catch (error) {
          console.error('Error detecting currency:', error);
        }
      };

      detectCurrency();
    }
  }, [initialCurrency]);

  const convertAmount = async (amount: number, fromCurrency: string, toCurrency?: string) => {
    const target = toCurrency || currency;
    if (fromCurrency === target) return amount;
    return await convertCurrency(amount, fromCurrency, target);
  };

  const formatAmount = (amount: number, currencyCode?: string) => {
    const target = currencyCode || currency;
    return formatCurrencyAmount(amount, target);
  };

  return {
    currency,
    setCurrency,
    detectedCurrency,
    convertAmount,
    formatAmount,
  };
};

export default {
  CurrencyDisplay,
  CurrencySelector,
  PriceComparison,
  AutoCurrencyDetector,
  CurrencyConverter,
  useCurrency,
};
