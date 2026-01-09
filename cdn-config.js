// Configuración CDN para RecetasWorld
// Este archivo permite personalizar fácilmente los CDNs utilizados

const CDN_CONFIG = {
    // ========== CONFIGURACIÓN PRINCIPAL ==========
    
    // CDN para imágenes estáticas (SVG predefinidos)
    staticCDN: {
        enabled: false, // Usar archivos locales por defecto
        baseUrl: 'https://cdn.jsdelivr.net/gh/tu-usuario/recetas-world@main/',
        fallback: true
    },
    
    // CDN para imágenes subidas por usuarios
    uploadsCDN: {
        enabled: false,
        baseUrl: 'https://res.cloudinary.com/tu-cloud-name/image/upload/',
        apiKey: '',
        transformations: {
            thumbnail: 'w_300,h_200,c_fill,q_auto,f_auto',
            medium: 'w_600,h_400,c_fill,q_auto,f_auto',
            large: 'w_1200,h_800,c_fill,q_auto,f_auto'
        }
    },
    
    // ========== OPTIMIZACIONES ==========
    
    // Configuración de lazy loading
    lazyLoading: {
        enabled: true,
        threshold: '200px',
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg=='
    },
    
    // Configuración de formatos de imagen
    imageFormats: {
        universal: ['png', 'jpg', 'jpeg', 'gif'],
        modern: ['webp', 'avif'],
        specialized: ['svg', 'bmp', 'tiff', 'tif'],
        mobile: ['heic', 'heif'],
        autoConvert: {
            enabled: true,
            convertToJPG: ['bmp', 'tiff', 'tif', 'heic', 'heif'],
            preferWebP: true,
            quality: 85
        }
    },
    
    // Configuración de responsive images
    responsiveImages: {
        enabled: true,
        breakpoints: {
            mobile: 480,
            tablet: 768,
            desktop: 1200
        }
    },
    
    // Cache del navegador
    caching: {
        enabled: true,
        maxAge: 86400,
        staleWhileRevalidate: 3600
    },
    
    // Preload de imágenes críticas
    preload: {
        enabled: true,
        criticalImages: [
            'img/default-recipe.svg',
            'img/placeholder.svg'
        ]
    },
    
    // Configuración de fallbacks
    fallbacks: {
        defaultImage: 'img/default-recipe.svg',
        errorImage: 'img/error-recipe.svg',
        loadingEmoji: '🍽️',
        retryAttempts: 3,
        retryDelay: 1000
    }
};

// ========== FUNCIONES DE UTILIDAD ==========

// Detectar soporte para WebP
function supportsWebP() {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// Detectar conexión lenta
function isSlowConnection() {
    if (typeof navigator === 'undefined' || !navigator.connection) return false;
    return navigator.connection.effectiveType === 'slow-2g' || 
           navigator.connection.effectiveType === '2g';
}

// Obtener el breakpoint actual
function getCurrentBreakpoint() {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= CDN_CONFIG.responsiveImages.breakpoints.mobile) return 'mobile';
    if (width <= CDN_CONFIG.responsiveImages.breakpoints.tablet) return 'tablet';
    return 'desktop';
}

// Exportar configuración y funciones
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CDN_CONFIG,
        supportsWebP,
        isSlowConnection,
        getCurrentBreakpoint
    };
} else if (typeof window !== 'undefined') {
    window.CDN_CONFIG = CDN_CONFIG;
    window.supportsWebP = supportsWebP;
    window.isSlowConnection = isSlowConnection;
    window.getCurrentBreakpoint = getCurrentBreakpoint;
}