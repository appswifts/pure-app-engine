import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AdvancedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

// WebP detection utility
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
})();

// Image optimization utility
const optimizeImageUrl = (src: string, width?: number, quality = 80) => {
  if (!src) return src;
  
  // If it's a Supabase storage URL, add optimization parameters
  if (src.includes('supabase')) {
    const url = new URL(src);
    if (width) url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', quality.toString());
    if (supportsWebP) url.searchParams.set('format', 'webp');
    return url.toString();
  }
  
  return src;
};

export const AdvancedImage = ({
  src,
  alt,
  className,
  fallback = "/placeholder.svg",
  placeholder,
  width,
  height,
  loading = "lazy",
  quality = 80,
  onLoad,
  onError,
  priority = false,
}: AdvancedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Progressive image loading
  const loadImage = useCallback(async (imageSrc: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = imageSrc;
    });
  }, []);

  useEffect(() => {
    if (!isInView || !src) return;

    const optimizedSrc = optimizeImageUrl(src, width, quality);
    
    // Progressive loading: load low quality first, then high quality
    const loadProgressive = async () => {
      try {
        // Load low quality version first (if available)
        const lowQualitySrc = optimizeImageUrl(src, Math.floor((width || 200) / 2), 30);
        if (lowQualitySrc !== optimizedSrc) {
          await loadImage(lowQualitySrc);
          setCurrentSrc(lowQualitySrc);
        }
        
        // Then load high quality version
        await loadImage(optimizedSrc);
        setCurrentSrc(optimizedSrc);
        setIsLoaded(true);
        onLoad?.();
      } catch (error) {
        setHasError(true);
        setCurrentSrc(fallback);
        onError?.();
      }
    };

    loadProgressive();
  }, [isInView, src, width, quality, fallback, loadImage, onLoad, onError]);

  useEffect(() => {
    if (loading === 'eager' || priority) {
      setIsInView(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loading, priority]);

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden bg-gray-100", className)}
      style={{ width, height }}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ backgroundColor: placeholder || '#f3f4f6' }}
        >
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}
      
      {/* Blur placeholder for progressive loading */}
      {currentSrc && !isLoaded && (
        <img
          src={currentSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
          style={{ opacity: 0.6 }}
        />
      )}
      
      {/* Main image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
          loading={loading}
          width={width}
          height={height}
          decoding="async"
        />
      )}
    </div>
  );
};

// Preload utility for critical images
export const preloadImage = (src: string, width?: number, quality = 80) => {
  const optimizedSrc = optimizeImageUrl(src, width, quality);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimizedSrc;
  document.head.appendChild(link);
};
