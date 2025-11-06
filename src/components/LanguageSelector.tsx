import React, { useState } from 'react';
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
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslation, SUPPORTED_LANGUAGES, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'select' | 'compact' | 'button';
  showLabel?: boolean;
  showFlag?: boolean;
  showLocalName?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showLabel = true,
  showFlag = true,
  showLocalName = true,
  className,
  size = 'md',
  placement = 'bottom',
}) => {
  const { currentLanguage, setLanguage, availableLanguages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    await setLanguage(languageCode);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "text-sm h-8",
    md: "text-sm h-10",
    lg: "text-base h-12"
  };

  if (variant === 'select') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('common.language')}
          </label>
        )}
        <Select value={currentLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className={cn(sizeClasses[size], "min-w-[120px]")}>
            <SelectValue>
              <div className="flex items-center gap-2">
                {showFlag && currentLang && (
                  <span className="text-base">{currentLang.flag}</span>
                )}
                <span>
                  {showLocalName && currentLang
                    ? currentLang.localName
                    : currentLang?.name}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  {showFlag && (
                    <span className="text-base">{language.flag}</span>
                  )}
                  <span>
                    {showLocalName ? language.localName : language.name}
                  </span>
                  {language.code === currentLanguage && (
                    <Check className="h-4 w-4 text-primary ml-auto" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
            className={cn("gap-1", className)}
          >
            {showFlag && currentLang && (
              <span className="text-base">{currentLang.flag}</span>
            )}
            {currentLang?.code.toUpperCase()}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          {availableLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center gap-2"
            >
              {showFlag && (
                <span className="text-base">{language.flag}</span>
              )}
              <div className="flex-1">
                <div className="font-medium">
                  {showLocalName ? language.localName : language.name}
                </div>
                {showLocalName && language.name !== language.localName && (
                  <div className="text-xs text-muted-foreground">
                    {language.name}
                  </div>
                )}
              </div>
              {language.code === currentLanguage && (
                <Check className="h-4 w-4 text-primary" />
              )}
              {language.rtl && (
                <Badge variant="secondary" className="text-xs">RTL</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'button') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {showLabel && (
          <div className="w-full text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.language')}
          </div>
        )}
        {availableLanguages.map((language) => (
          <Button
            key={language.code}
            variant={language.code === currentLanguage ? "default" : "outline"}
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
            onClick={() => handleLanguageChange(language.code)}
            className="gap-2"
          >
            {showFlag && (
              <span className="text-base">{language.flag}</span>
            )}
            <span>
              {showLocalName ? language.localName : language.name}
            </span>
            {language.rtl && (
              <Badge variant="secondary" className="text-xs ml-1">RTL</Badge>
            )}
          </Button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Globe className="h-4 w-4" />
          {t('common.language')}
        </label>
      )}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-between min-w-[140px]", sizeClasses[size])}
          >
            <div className="flex items-center gap-2">
              {showFlag && currentLang && (
                <span className="text-base">{currentLang.flag}</span>
              )}
              <span className="truncate">
                {showLocalName && currentLang
                  ? currentLang.localName
                  : currentLang?.name}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-[240px] max-h-[300px] overflow-y-auto"
          align={placement === 'left' ? 'start' : placement === 'right' ? 'end' : 'center'}
        >
          {availableLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center gap-3 px-3 py-2"
            >
              {showFlag && (
                <span className="text-lg">{language.flag}</span>
              )}
              <div className="flex-1">
                <div className="font-medium">
                  {showLocalName ? language.localName : language.name}
                </div>
                {showLocalName && language.name !== language.localName && (
                  <div className="text-xs text-muted-foreground">
                    {language.name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {language.rtl && (
                  <Badge variant="secondary" className="text-xs">RTL</Badge>
                )}
                {language.code === currentLanguage && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Specialized components for common use cases
export const HeaderLanguageSelector: React.FC = () => (
  <LanguageSelector
    variant="compact"
    showLabel={false}
    showFlag={true}
    showLocalName={false}
    size="sm"
  />
);

export const FooterLanguageSelector: React.FC = () => (
  <LanguageSelector
    variant="dropdown"
    showLabel={true}
    showFlag={true}
    showLocalName={true}
    size="sm"
  />
);

export const SettingsLanguageSelector: React.FC = () => (
  <LanguageSelector
    variant="select"
    showLabel={true}
    showFlag={true}
    showLocalName={true}
    size="md"
  />
);

export const OnboardingLanguageSelector: React.FC = () => (
  <LanguageSelector
    variant="button"
    showLabel={true}
    showFlag={true}
    showLocalName={true}
    size="md"
    className="max-w-2xl"
  />
);

export default LanguageSelector;
