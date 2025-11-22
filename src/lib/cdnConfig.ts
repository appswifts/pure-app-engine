/**
 * Cloudflare CDN Configuration
 * Provides helpers for using Cloudflare's edge network and image optimization
 */

// Check if we're in production and using Cloudflare
export const isCloudflareEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check if deployed on Cloudflare Pages
    const hostname = window.location.hostname;
    return (
        hostname.includes('.pages.dev') ||
        !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
    );
};

/**
 * Transform image URL to use Cloudflare Image Resizing
 * https://developers.cloudflare.com/images/image-resizing/
 */
export const getCloudflareImageUrl = (
    originalUrl: string,
    options: {
        width?: number;
        height?: number;
        fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
        quality?: number; // 1-100
        format?: 'auto' | 'webp' | 'avif' | 'json';
    } = {}
): string => {
    // Only transform if CDN is enabled and URL is absolute
    if (!isCloudflareEnabled() || !originalUrl.startsWith('http')) {
        return originalUrl;
    }

    const {
        width,
        height,
        fit = 'scale-down',
        quality = 85,
        format = 'auto',
    } = options;

    // Build Cloudflare Image Resizing URL
    const params: string[] = [];

    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    params.push(`fit=${fit}`);
    params.push(`quality=${quality}`);
    params.push(`format=${format}`);

    // Cloudflare Image Resizing URL format:
    // https://yourdomain.com/cdn-cgi/image/width=800,quality=85/https://original-image-url.com/image.jpg
    const baseUrl = window.location.origin;
    const imageParams = params.join(',');

    return `${baseUrl}/cdn-cgi/image/${imageParams}/${originalUrl}`;
};

/**
 * Get optimized thumbnail URL
 */
export const getThumbnailUrl = (originalUrl: string): string => {
    return getCloudflareImageUrl(originalUrl, {
        width: 200,
        quality: 80,
        format: 'auto',
    });
};

/**
 * Get optimized image for menu item card
 */
export const getMenuItemImageUrl = (originalUrl: string): string => {
    return getCloudflareImageUrl(originalUrl, {
        width: 400,
        quality: 85,
        format: 'auto',
        fit: 'cover',
    });
};

/**
 * Get optimized logo URL
 */
export const getLogoUrl = (originalUrl: string): string => {
    return getCloudflareImageUrl(originalUrl, {
        width: 300,
        quality: 90,
        format: 'auto',
    });
};

/**
 * Cache control headers for static assets
 * Use these in your API responses or _headers file
 */
export const CACHE_HEADERS = {
    // Images - cache for 1 year
    images: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
    },

    // JavaScript/CSS - cache for 1 year (filename has hash)
    assets: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
    },

    // HTML - cache for 1 hour, revalidate
    html: {
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'CDN-Cache-Control': 'public, max-age=3600',
    },

    // API responses - cache for 5 minutes
    api: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'CDN-Cache-Control': 'public, max-age=300',
    },
};

export default {
    isCloudflareEnabled,
    getCloudflareImageUrl,
    getThumbnailUrl,
    getMenuItemImageUrl,
    getLogoUrl,
    CACHE_HEADERS,
};
