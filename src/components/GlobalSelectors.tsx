import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, DollarSign, ChevronDown, Check, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  fetchCountries,
  fetchCurrencies,
  detectUserCountry,
  getCountry,
  getCurrency,
  formatCurrencyAmount,
  Country,
  Currency,
} from "@/lib/global";
import { cn } from "@/lib/utils";

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (countryCode: string) => void;
  variant?: 'dropdown' | 'select';
  showLabel?: boolean;
  showFlag?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  disabled?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onValueChange,
  variant = 'select',
  showLabel = true,
  showFlag = true,
  className,
  size = 'md',
  placeholder,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        const countriesData = await fetchCountries();
        setCountries(countriesData);

        // Auto-detect or set selected country
        if (value) {
          const country = countriesData.find(c => c.code === value);
          setSelectedCountry(country || null);
        } else if (!value && onValueChange) {
          const detectedCountry = await detectUserCountry();
          const country = countriesData.find(c => c.code === detectedCountry);
          if (country) {
            setSelectedCountry(country);
            onValueChange(country.code);
          }
        }
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, [value, onValueChange]);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    setSelectedCountry(country || null);
    onValueChange?.(countryCode);
  };

  const sizeClasses = {
    sm: "text-sm h-8",
    md: "text-sm h-10",
    lg: "text-base h-12"
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <Skeleton className="h-5 w-16" />
        )}
        <Skeleton className={cn("min-w-[140px]", sizeClasses[size])} />
      </div>
    );
  }

  const getCountryFlag = (countryCode: string) => {
    // Convert country code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (variant === 'dropdown') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {t('common.country')}
          </label>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-between min-w-[160px]", sizeClasses[size])}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                {showFlag && selectedCountry && (
                  <span className="text-base">{getCountryFlag(selectedCountry.code)}</span>
                )}
                <span className="truncate">
                  {selectedCountry?.name || placeholder || t('common.country')}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] overflow-y-auto min-w-[240px]">
            {countries.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onClick={() => handleCountryChange(country.code)}
                className="flex items-center gap-3"
              >
                {showFlag && (
                  <span className="text-lg">{getCountryFlag(country.code)}</span>
                )}
                <div className="flex-1">
                  <div className="font-medium">{country.name}</div>
                  {country.local_name && country.local_name !== country.name && (
                    <div className="text-xs text-muted-foreground">
                      {country.local_name}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {country.phone_code}
                </div>
                {selectedCountry?.code === country.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('common.country')}
        </label>
      )}
      <Select value={value} onValueChange={handleCountryChange} disabled={disabled}>
        <SelectTrigger className={cn(sizeClasses[size], "min-w-[160px]")}>
          <SelectValue placeholder={placeholder || t('common.country')}>
            {selectedCountry && (
              <div className="flex items-center gap-2">
                {showFlag && (
                  <span className="text-base">{getCountryFlag(selectedCountry.code)}</span>
                )}
                <span className="truncate">{selectedCountry.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2 w-full">
                {showFlag && (
                  <span className="text-base">{getCountryFlag(country.code)}</span>
                )}
                <span className="flex-1 truncate">{country.name}</span>
                <span className="text-xs text-muted-foreground">
                  {country.phone_code}
                </span>
                {selectedCountry?.code === country.code && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface CurrencySelectorProps {
  value?: string;
  onValueChange?: (currencyCode: string) => void;
  variant?: 'dropdown' | 'select';
  showLabel?: boolean;
  showSymbol?: boolean;
  showAmount?: boolean;
  sampleAmount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  disabled?: boolean;
  restrictToCountry?: string; // Only show currencies for specific country
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onValueChange,
  variant = 'select',
  showLabel = true,
  showSymbol = true,
  showAmount = false,
  sampleAmount = 10,
  className,
  size = 'md',
  placeholder,
  disabled = false,
  restrictToCountry,
}) => {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setLoading(true);
        let currenciesData = await fetchCurrencies();

        // Filter by country if specified
        if (restrictToCountry) {
          const country = await getCountry(restrictToCountry);
          if (country) {
            // Show default currency + common alternatives
            const allowedCurrencies = [country.default_currency, 'USD', 'EUR'];
            currenciesData = currenciesData.filter(c =>
              allowedCurrencies.includes(c.code)
            );
          }
        }

        setCurrencies(currenciesData);

        if (value) {
          const currency = currenciesData.find(c => c.code === value);
          setSelectedCurrency(currency || null);
        }
      } catch (error) {
        console.error('Error loading currencies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrencies();
  }, [value, restrictToCountry]);

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    setSelectedCurrency(currency || null);
    onValueChange?.(currencyCode);
  };

  const sizeClasses = {
    sm: "text-sm h-8",
    md: "text-sm h-10",
    lg: "text-base h-12"
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <Skeleton className="h-5 w-16" />
        )}
        <Skeleton className={cn("min-w-[120px]", sizeClasses[size])} />
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            {t('common.currency')}
          </label>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-between min-w-[140px]", sizeClasses[size])}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                {showSymbol && selectedCurrency && (
                  <span className="font-medium">{selectedCurrency.symbol}</span>
                )}
                <span className="truncate">
                  {selectedCurrency?.code || placeholder || t('common.currency')}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] overflow-y-auto min-w-[240px]">
            {currencies.map((currency) => (
              <DropdownMenuItem
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                className="flex items-center gap-3"
              >
                {showSymbol && (
                  <span className="font-medium text-base">{currency.symbol}</span>
                )}
                <div className="flex-1">
                  <div className="font-medium">{currency.code}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {currency.name}
                  </div>
                </div>
                {showAmount && (
                  <div className="text-xs text-muted-foreground">
                    ≈ {currency.symbol}{(sampleAmount * currency.exchange_rate_to_usd).toLocaleString()}
                  </div>
                )}
                {selectedCurrency?.code === currency.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('common.currency')}
        </label>
      )}
      <Select value={value} onValueChange={handleCurrencyChange} disabled={disabled}>
        <SelectTrigger className={cn(sizeClasses[size], "min-w-[140px]")}>
          <SelectValue placeholder={placeholder || t('common.currency')}>
            {selectedCurrency && (
              <div className="flex items-center gap-2">
                {showSymbol && (
                  <span className="font-medium">{selectedCurrency.symbol}</span>
                )}
                <span className="truncate">{selectedCurrency.code}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2 w-full">
                {showSymbol && (
                  <span className="font-medium">{currency.symbol}</span>
                )}
                <div className="flex-1">
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-xs text-muted-foreground ml-2 truncate">
                    {currency.name}
                  </span>
                </div>
                {showAmount && (
                  <span className="text-xs text-muted-foreground">
                    ≈ {currency.symbol}{(sampleAmount * currency.exchange_rate_to_usd).toLocaleString()}
                  </span>
                )}
                {selectedCurrency?.code === currency.code && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Combined Country + Currency selector
interface CountryCurrencySelectorProps {
  countryValue?: string;
  currencyValue?: string;
  onCountryChange?: (countryCode: string) => void;
  onCurrencyChange?: (currencyCode: string) => void;
  autoUpdateCurrency?: boolean; // Auto-set currency when country changes
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'horizontal' | 'vertical';
}

export const CountryCurrencySelector: React.FC<CountryCurrencySelectorProps> = ({
  countryValue,
  currencyValue,
  onCountryChange,
  onCurrencyChange,
  autoUpdateCurrency = true,
  className,
  size = 'md',
  variant = 'horizontal',
}) => {
  const handleCountryChange = async (countryCode: string) => {
    onCountryChange?.(countryCode);

    if (autoUpdateCurrency) {
      const country = await getCountry(countryCode);
      if (country && country.default_currency) {
        onCurrencyChange?.(country.default_currency);
      }
    }
  };

  const containerClass = variant === 'horizontal'
    ? "flex items-end gap-4"
    : "flex flex-col gap-3";

  return (
    <div className={cn(containerClass, className)}>
      <CountrySelector
        value={countryValue}
        onValueChange={handleCountryChange}
        size={size}
        showLabel={true}
        showFlag={true}
      />
      <CurrencySelector
        value={currencyValue}
        onValueChange={onCurrencyChange}
        size={size}
        showLabel={true}
        showSymbol={true}
        restrictToCountry={countryValue}
      />
    </div>
  );
};

// Preset components for common use cases
export const OnboardingCountrySelector: React.FC<{
  value?: string;
  onValueChange?: (value: string) => void;
}> = ({ value, onValueChange }) => (
  <CountrySelector
    value={value}
    onValueChange={onValueChange}
    variant="dropdown"
    showLabel={true}
    showFlag={true}
    size="lg"
    className="w-full max-w-md"
  />
);

export const SettingsCurrencySelector: React.FC<{
  value?: string;
  onValueChange?: (value: string) => void;
  countryCode?: string;
}> = ({ value, onValueChange, countryCode }) => (
  <CurrencySelector
    value={value}
    onValueChange={onValueChange}
    variant="select"
    showLabel={true}
    showSymbol={true}
    showAmount={true}
    sampleAmount={10}
    restrictToCountry={countryCode}
    size="md"
  />
);

export default {
  CountrySelector,
  CurrencySelector,
  CountryCurrencySelector,
  OnboardingCountrySelector,
  SettingsCurrencySelector,
};
