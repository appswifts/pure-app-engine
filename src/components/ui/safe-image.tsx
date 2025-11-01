import { useState, ImgHTMLAttributes } from 'react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  onErrorCallback?: () => void;
}

/**
 * SafeImage - A wrapper component for img tags that handles errors gracefully
 * Prevents network errors from appearing in console and shows fallback on error
 */
export const SafeImage = ({ 
  src, 
  alt, 
  fallback = '/placeholder.svg',
  onErrorCallback,
  ...props 
}: SafeImageProps) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    // Silently handle the error to prevent console noise
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
      onErrorCallback?.();
    }
  };

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      onError={handleError}
    />
  );
};
