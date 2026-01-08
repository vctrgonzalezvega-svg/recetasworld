// Configuración CDN para RecetasWorld
// Este archivo permite personalizar fácilmente los CDNs utilizados

const CDN_CONFIG = {
    // ========== CONFIGURACIÓN PRINCIPAL ==========
    
    // CDN para imágenes estáticas (SVG predefinidos)
    // Opciones recomendadas:
    // - jsDelivr (gratis): https://cdn.jsdelivr.net/gh/usuario/repo@branch/
    // - GitHub Pages: https://usuario.github.io/repo/
    // - Netlify: https://app.netlify.com/
    staticCDN: {
        enabled: true,
        baseUrl: 'https://cdn.jsdelivr.net/gh/tu-usuario/recetas-world@main/',
        fallback: true
    },
    
    // CDN para imágenes subidas por usuarios
    // Opciones recomendadas:
    // - Cloudinary (gratis hasta 25GB): https://cloudinary.com/
    // - ImageKit (gratis hasta 20GB): https://imagekit.io/
    // - Imgur API (gratis): https://api.imgur.com/
    uploadsCDN: {
        enabled: false, // Cambiar a true cuando configures un servicio
        baseUrl: 'https://res.cloudinary.com/tu-cloud-name/image/upload/',
        apiKey: '', // Agregar tu API key aquí
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
        threshold: '200px', // Cargar cuando esté a 200px del viewport
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg=='
    },
    
    // Configuración de formatos de imagen
    imageFormats: {
        // Formatos universalmente soportados
        universal: ['png', 'jpg', 'jpeg', 'gif'],
        
        // Formatos modernos con mejor compresión
        modern: ['webp', 'avif'],
        
        // Formatos especializados
        specialized: ['svg', 'bmp', 'tiff', 'tif'],
        
        // Formatos móviles (principalmente iOS)
        mobile: ['heic', 'heif'],
        
        // Configuración de conversión automática
        autoConvert: {
            enabled: true,
            // Convertir estos formatos a JPG para mejor compatibilidad
            convertToJPG: ['bmp', 'tiff', 'tif', 'heic', 'heif'],
            // Usar WebP cuando sea soportado
            preferWebP: true,
            // Calidad de conversión
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
    
    // ========== CONFIGURACIÓN AVANZADA ==========
    
    // Cache del navegador
    caching: {
        enabled: true,
        maxAge: 86400, // 24 horas en segundos
        staleWhileRevalidate: 3600 // 1 hora
    },
    
    // Preload de imágenes críticas
    preload: {
        enabled: true,
        criticalImages: [
            'img/default-recipe.svg',
            'img/placeholder.svg',
            'img/logo.svg'
        ]
    },
    
    // Configuración de fallbacks
    fallbacks: {
        defaultImage: 'img/default-recipe.svg',
        errorImage: 'img/error-recipe.svg',
        loadingEmoji: '🍽️',
        retryAttempts: 3,
        retryDelay: 1000 // ms
    }
};

// ========== FUNCIONES DE UTILIDAD ==========

// Detectar soporte para WebP
function supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// Detectar conexión lenta
function isSlowConnection() {
    return navigator.connection && 
           (navigator.connection.effectiveType === 'slow-2g' || 
            navigator.connection.effectiveType === '2g');
}

// Obtener el breakpoint actual
function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width <= CDN_CONFIG.responsiveImages.breakpoints.mobile) return 'mobile';
    if (width <= CDN_CONFIG.responsiveImages.breakpoints.tablet) return 'tablet';
    return 'desktop';
}

// ========== INSTRUCCIONES DE CONFIGURACIÓN ==========

/*
CÓMO CONFIGURAR TU CDN:

1. PARA IMÁGENES ESTÁTICAS (SVG predefinidos):
   - Sube tu proyecto a GitHub
   - Cambia 'tu-usuario/recetas-world' por tu repositorio real
   - O usa GitHub Pages, Netlify, Vercel, etc.

2. PARA IMÁGENES SUBIDAS POR USUARIOS:
   
   OPCIÓN A - Cloudinary (Recomendado):
   - Regístrate en https://cloudinary.com/
   - Obtén tu cloud_name de tu dashboard
   - Cambia uploadsCDN.baseUrl por: https://res.cloudinary.com/TU_CLOUD_NAME/image/upload/
   - Cambia enabled: true
   
   OPCIÓN B - ImageKit:
   - Regístrate en https://imagekit.io/
   - Obtén tu URL endpoint
   - Cambia uploadsCDN.baseUrl por tu endpoint
   - Cambia enabled: true
   
   OPCIÓN C - Imgur:
   - Regístrate en https://api.imgur.com/
   - Obtén tu Client ID
   - Implementa la subida via API
   - Cambia enabled: true

3. PARA DESARROLLO LOCAL:
   - Deja staticCDN.enabled: false para usar archivos locales
   - Cambia a true solo en producción

4. OPTIMIZACIONES ADICIONALES:
   - Habilita webpSupport si tu servidor lo soporta
   - Ajusta los breakpoints según tu diseño
   - Personaliza las transformaciones de Cloudinary

EJEMPLO DE CONFIGURACIÓN COMPLETA:

const CDN_CONFIG = {
    staticCDN: {
        enabled: true,
        baseUrl: 'https://cdn.jsdelivr.net/gh/miusuario/recetas-world@main/',
        fallback: true
    },
    uploadsCDN: {
        enabled: true,
        baseUrl: 'https://res.cloudinary.com/micloud/image/upload/',
        transformations: {
            thumbnail: 'w_300,h_200,c_fill,q_auto,f_auto',
            medium: 'w_600,h_400,c_fill,q_auto,f_auto'
        }
    }
};
*/

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDN_CONFIG;
} else {
    window.CDN_CONFIG = CDN_CONFIG;
}