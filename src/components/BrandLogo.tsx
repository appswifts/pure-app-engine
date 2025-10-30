import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

type Restaurant = {
  id: string;
  name: string;
  logo_url?: string;
  [key: string]: any;
};

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "xl" | "3xl" | "responsive";
  alt?: string;
  className?: string;
  restaurant?: Restaurant | null;
  showSettingsLink?: boolean;
};

const sizeMap: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  "3xl": "h-36 w-36",
  responsive: "h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 lg:h-20 lg:w-20",
};

export default function BrandLogo({ 
  size = "md", 
  alt = "Brand logo", 
  className = "",
  restaurant = null,
  showSettingsLink = true
}: BrandLogoProps) {
  const [src, setSrc] = useState<string>(
    restaurant?.logo_url || "/menuforestlogo.png"
  );
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    setImageError(true);
    // Fallback to app logo if restaurant logo fails
    setSrc("/menuforestlogo.png");
  };

  // If restaurant exists but no logo is set and we should show settings link
  const shouldShowSettingsLink = restaurant && !restaurant.logo_url && showSettingsLink;

  if (shouldShowSettingsLink) {
    return (
      <Link 
        to="/dashboard/settings" 
        className={`${sizeMap[size]} ${className} border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors group relative`}
        title="Click to add your restaurant logo"
      >
        <Settings className="h-1/2 w-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
          +
        </div>
      </Link>
    );
  }

  return (
    <img
      src={src}
      alt={restaurant ? `${restaurant.name} logo` : alt}
      className={`${sizeMap[size]} ${className} object-cover rounded-lg`}
      onError={handleError}
    />
  );
}
