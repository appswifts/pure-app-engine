import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { getBlurPlaceholder, getOptimizedImageUrl } from '@/lib/imageOptimizer';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  onErrorCallback?: () => void;
  lazy?: boolean; // Enable lazy loading
  blur?: boolean; // Show blur placeholder while loading
}

/**
 * SafeImage - Enhanced image component with lazy loading and error handling
 * Prevents network errors from appearing in console and shows fallback on error
 * Supports lazy loading with intersection observer for better performance
 */
export const SafeImage = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  onErrorCallback,
  lazy = true, // Lazy loading enabled by default
  blur = true,  // Blur placeholder enabled by default
  className,
  ...props
}: SafeImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(
    lazy ? (blur ? getBlurPlaceholder() : undefined) : src
  );
  const [isLoading, setIsLoading] = useState(lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load the actual image when it enters viewport
            const optimizedSrc = getOptimizedImageUrl(src, {
              width: imgRef.current?.width,
              quality: 85,
            });
            setImageSrc(optimizedSrc || src);
            setIsLoading(false);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src, lazy]);

  // If not lazy loading, load immediately
  useEffect(() => {
    if (!lazy && src) {
      const optimizedSrc = getOptimizedImageUrl(src, { quality: 85 });
      setImageSrc(optimizedSrc || src);
    }
  }, [src, lazy]);

  const handleError = () => {
    // Silently handle the error to prevent console noise
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
      setIsLoading(false);
      onErrorCallback?.();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <img
      {...props}
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      loading={lazy ? 'lazy' : 'eager'}
      className={`${className || ''} ${isLoading ? 'animate-pulse' : ''} transition-opacity duration-300`}
      style={{
        opacity: isLoading ? 0.7 : 1,
        ...props.style,
      }}
    />
  );
};
