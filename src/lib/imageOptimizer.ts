/**
 * Image optimization utilities for better performance
 * Provides lazy loading, responsive images, and placeholder support
 */

import { getCloudflareImageUrl, isCloudflareEnabled } from './cdnConfig';

// Generate optimized image URL (uses Cloudflare CDN when available)
export const getOptimizedImageUrl = (
    originalUrl: string | null,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'avif' | 'auto';
    } = {}
): string | null => {
    if (!originalUrl) return null;

    const { width, height, quality = 85, format = 'auto' } = options;

    // Use Cloudflare Image Resizing if available
    if (isCloudflareEnabled() && originalUrl.startsWith('http')) {
        return getCloudflareImageUrl(originalUrl, {
            width,
            height,
            quality,
            format,
            fit: 'scale-down',
        });
    }

    // Return original URL for local development
    return originalUrl;
};

// Generate blur data URL placeholder for smooth loading
export const getBlurPlaceholder = (width: number = 10, height: number = 10): string => {
    // Create a tiny 10x10 gray placeholder
    // This creates a data URL that's much smaller than loading an actual image
    const canvas = typeof document !== 'undefined'
        ? document.createElement('canvas')
        : null;

    if (!canvas) {
        // Fallback: return a small SVG placeholder
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='%23f3f4f6' width='${width}' height='${height}'/%3E%3C/svg%3E`;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, width, height);
        return canvas.toDataURL('image/jpeg', 0.1);
    }

    // SVG fallback
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='%23f3f4f6' width='${width}' height='${height}'/%3E%3C/svg%3E`;
};

// Preload critical images (for above-the-fold content)
export const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
    });
};

// Check if image is in viewport (for lazy loading)
export const isInViewport = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

// Get responsive image sizes
export const getResponsiveSizes = (baseWidth: number) => {
    return {
        thumbnail: Math.round(baseWidth * 0.3), // 30% for thumbnails
        small: Math.round(baseWidth * 0.5),     // 50% for small screens
        medium: Math.round(baseWidth * 0.75),   // 75% for medium screens
        large: baseWidth,                       // 100% for large screens
    };
};

export default {
    getOptimizedImageUrl,
    getBlurPlaceholder,
    preloadImage,
    isInViewport,
    getResponsiveSizes,
};
