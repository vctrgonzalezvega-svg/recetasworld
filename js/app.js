// Aplicación de Recetas del Mundo - Versión con AJAX y JSON
class RecipesApp {
    constructor() {
        this.currentCategory = null;
        this.recipes = [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        // Normalizar IDs de favoritos al cargar
        this.favorites = this.favorites.map(id => parseInt(id)).filter(id => !isNaN(id));
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.ratings = JSON.parse(localStorage.getItem('ratings')) || {};
        this.weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan')) || {};
        this.adminEditId = null;
        this.ratingStats = JSON.parse(localStorage.getItem('ratingStats')) || {}; // { [id]: { count, total } }
        this.uploads = JSON.parse(localStorage.getItem('uploads')) || []; // image submissions
        this.userPoints = JSON.parse(localStorage.getItem('userPoints')) || {}; // { username: points }
        this.completedChallenges = JSON.parse(localStorage.getItem('completedChallenges')) || {}; // { username: [{recipeId, completedAt}] }
        this.blockedRecipes = JSON.parse(localStorage.getItem('blockedRecipes')) || {}; // { username: { [recipeId]: timestamp } }
        this.lastSearchQuery = '';
        this.openRecipeId = null;
        
        // ========== CONFIGURACIÓN CDN ==========
        this.cdnConfig = {
            // CDN principal para imágenes estáticas
            staticCDN: 'https://cdn.jsdelivr.net/gh/tu-usuario/tu-repo@main/',
            // CDN para imágenes subidas por usuarios (usando un servicio gratuito)
            uploadsCDN: 'https://i.imgur.com/',
            // Fallback local
            localFallback: true,
            // Cache de URLs optimizadas
            optimizedUrls: new Map()
        };
        
        // Sistema de recomendaciones basado en cookies
        this.userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {
            favoriteCategories: {},
            favoriteCountries: {},
            searchHistory: [],
            viewHistory: []
        };
        this.recommendationWeights = {
            favoriteCategories: 0.4,
            favoriteCountries: 0.3,
            searchHistory: 0.2,
            viewHistory: 0.1
        };
        
        // Sistema de bots para calificaciones automáticas
        this.botUsers = this.initializeBotUsers();
        this.botRatingsGenerated = JSON.parse(localStorage.getItem('botRatingsGenerated')) || {};
        
        // Global error capture
        window.addEventListener('error', (e) => {
            console.error('Error:', e.message);
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
        
        // Cargar usuario actual
        this.loadUserFromStorage();
        
        // Cargar recetas y inicializar
        this.loadRecipesFromJSON();
        this.adminProductEditId = null;
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        
        // Inicializar actualización automática de puntos
        this.initializePointsAutoUpdate();
        
        // ========== INICIALIZAR CDN ==========
        this.initializeCDN();
        
        // Comandos de consola para controlar bots (solo en desarrollo)
        if (typeof window !== 'undefined') {
            window.regenerateBotRatings = () => this.regenerateAllBotRatings();
            window.showBotStats = () => this.showBotStats();
            window.generateBotsForRecipe = (id) => this.generateBotRatingsForRecipe(id);
            window.debugEventListeners = () => this.debugEventListeners();
            window.testReviewsButton = (recipeId) => {
                console.log('Testing reviews button for recipe:', recipeId);
                this.showRecipeReviews(recipeId);
            };
            window.repairAllButtons = () => {
                console.log('🔧 Force repairing all recipe buttons...');
                this.verifyAllRecipeButtons();
                return 'Repair completed - check console for details';
            };
            window.ensureAllIds = () => {
                console.log('🔧 Ensuring all recipes have valid IDs...');
                this.ensureAllRecipesHaveValidIds();
                return 'ID verification completed - check console for details';
            };
            
            // ========== NUEVOS COMANDOS DE REPARACIÓN ==========
            window.repairUserData = () => {
                console.log('🔧 Reparando datos de usuarios...');
                return this.repairUserData();
            };
            window.debugUser = (username) => {
                if (!username) {
                    console.log('Uso: debugUser("nombreUsuario")');
                    return;
                }
                return this.debugUserData(username);
            };
            window.fixGabriel = () => {
                console.log('🔧 Reparación específica para Gabriel...');
                return this.repairGabrielData();
            };
            window.repairGabriel = () => {
                console.log('🔧 Reparación completa de Gabriel...');
                return this.repairGabrielData();
            };
            window.showPersonalizationInfo = () => {
                console.log('🎯 Información del sistema de personalización:');
                console.log('📊 Preferencias del usuario:', this.userPreferences);
                console.log('🔍 Últimas búsquedas:', this.userPreferences.searchHistory.slice(0, 5));
                console.log('❤️ Categorías favoritas:', this.userPreferences.favoriteCategories);
                console.log('🌍 Países favoritos:', this.userPreferences.favoriteCountries);
                
                const allRecipes = this.getAllRecipesPersonalized();
                console.log('🏆 Top 10 recetas personalizadas:', allRecipes.slice(0, 10).map(r => r.nombre));
                
                return {
                    preferences: this.userPreferences,
                    topRecipes: allRecipes.slice(0, 10)
                };
            };
            window.refreshHome = () => {
                console.log('🔄 Refrescando página principal...');
                this.showHome();
                return 'Página principal actualizada';
            };
            window.updatePoints = () => {
                console.log('💰 Actualizando puntos en interfaz...');
                this.updatePointsDisplay();
                return 'Puntos actualizados';
            };
            
            // ========== COMANDOS CDN ==========
            window.testCDN = () => {
                console.log('🌐 Probando sistema CDN...');
                console.log('Configuración actual:', this.cdnConfig);
                
                // Probar algunas URLs
                const testImages = [
                    'img/tacos-al-pastor.svg',
                    'img/uploads/recipe-123.jpg',
                    'img/default-recipe.svg'
                ];
                
                testImages.forEach(img => {
                    const optimized = this.getOptimizedImageUrl(img);
                    console.log(`${img} → ${optimized}`);
                });
                
                return 'Test CDN completado - revisa la consola';
            };
            
            window.optimizeImages = () => {
                console.log('🚀 Optimizando imágenes existentes...');
                const count = this.optimizeExistingImages();
                return `${count} imágenes optimizadas`;
            };
            
            window.clearCDNCache = () => {
                console.log('🗑️ Limpiando cache CDN...');
                this.cdnConfig.optimizedUrls.clear();
                return 'Cache CDN limpiado';
            };
            
            window.cdnStats = () => {
                console.log('📊 Estadísticas CDN:');
                console.log(`URLs en cache: ${this.cdnConfig.optimizedUrls.size}`);
                console.log(`Modo desarrollo: ${this.cdnConfig.isDevelopment}`);
                console.log('Cache actual:', Array.from(this.cdnConfig.optimizedUrls.entries()));
                return {
                    cacheSize: this.cdnConfig.optimizedUrls.size,
                    isDevelopment: this.cdnConfig.isDevelopment
                };
            };
            window.debugSpecificRecipes = (recipeNames) => {
                console.log('🔍 Debugging specific recipes:', recipeNames);
                const names = Array.isArray(recipeNames) ? recipeNames : [recipeNames];
                
                names.forEach(name => {
                    console.log(`\n--- Debugging: ${name} ---`);
                    
                    // Buscar la receta en el array
                    const recipe = this.recipes.find(r => 
                        r.nombre.toLowerCase().includes(name.toLowerCase())
                    );
                    
                    if (!recipe) {
                        console.error(`❌ Recipe "${name}" not found in recipes array`);
                        return;
                    }
                    
                    console.log(`✅ Recipe found:`, {
                        id: recipe.id,
                        nombre: recipe.nombre,
                        idType: typeof recipe.id,
                        idValid: !isNaN(parseInt(recipe.id))
                    });
                    
                    // Buscar la tarjeta en el DOM
                    const cards = document.querySelectorAll('.recipe-card');
                    let foundCard = null;
                    
                    cards.forEach(card => {
                        const cardName = card.querySelector('.recipe-name');
                        if (cardName && cardName.textContent.toLowerCase().includes(name.toLowerCase())) {
                            foundCard = card;
                        }
                    });
                    
                    if (!foundCard) {
                        console.error(`❌ Card for "${name}" not found in DOM`);
                        return;
                    }
                    
                    const cardId = foundCard.getAttribute('data-recipe-id');
                    const reviewsBtn = foundCard.querySelector('.reviews-btn');
                    const favoriteBtn = foundCard.querySelector('.favorite-btn');
                    
                    console.log(`Card analysis:`, {
                        cardId: cardId,
                        cardIdType: typeof cardId,
                        cardIdValid: !isNaN(parseInt(cardId)),
                        hasReviewsBtn: !!reviewsBtn,
                        hasFavoriteBtn: !!favoriteBtn
                    });
                    
                    if (reviewsBtn) {
                        const btnId = reviewsBtn.getAttribute('data-recipe-id');
                        console.log(`Reviews button:`, {
                            btnId: btnId,
                            btnIdType: typeof btnId,
                            btnIdValid: !isNaN(parseInt(btnId)),
                            idsMatch: cardId === btnId
                        });
                        
                        // Probar el click manualmente
                        console.log(`Testing click on reviews button...`);
                        try {
                            reviewsBtn.click();
                            console.log(`✅ Click successful`);
                        } catch (e) {
                            console.error(`❌ Click failed:`, e);
                        }
                    } else {
                        console.error(`❌ Reviews button not found for "${name}"`);
                    }
                });
                
                return 'Debug completed - check console for details';
            };
            window.fixSpecificRecipes = (recipeNames) => {
                console.log('🔧 Fixing specific recipes:', recipeNames);
                const names = Array.isArray(recipeNames) ? recipeNames : [recipeNames];
                
                names.forEach(name => {
                    const cards = document.querySelectorAll('.recipe-card');
                    
                    cards.forEach(card => {
                        const cardName = card.querySelector('.recipe-name');
                        if (cardName && cardName.textContent.toLowerCase().includes(name.toLowerCase())) {
                            console.log(`🔧 Fixing card for: ${name}`);
                            
                            // Asegurar que tenga ID válido
                            let cardId = card.getAttribute('data-recipe-id');
                            if (!cardId || isNaN(parseInt(cardId))) {
                                cardId = Date.now() + Math.random();
                                card.setAttribute('data-recipe-id', cardId);
                                console.log(`🔧 Assigned new card ID: ${cardId}`);
                            }
                            
                            // Verificar/crear botón de reseñas
                            let reviewsBtn = card.querySelector('.reviews-btn');
                            if (!reviewsBtn) {
                                const actionsDiv = card.querySelector('.recipe-actions');
                                if (actionsDiv) {
                                    reviewsBtn = document.createElement('button');
                                    reviewsBtn.className = 'reviews-btn';
                                    reviewsBtn.setAttribute('data-recipe-id', cardId);
                                    reviewsBtn.setAttribute('title', 'Ver reseñas');
                                    reviewsBtn.innerHTML = '<i class="fas fa-comments"></i>';
                                    actionsDiv.insertBefore(reviewsBtn, actionsDiv.firstChild);
                                    console.log(`🔧 Created reviews button for ${name}`);
                                }
                            } else {
                                // Verificar que tenga el ID correcto
                                const btnId = reviewsBtn.getAttribute('data-recipe-id');
                                if (btnId !== cardId) {
                                    reviewsBtn.setAttribute('data-recipe-id', cardId);
                                    console.log(`🔧 Fixed reviews button ID for ${name}`);
                                }
                            }
                        }
                    });
                });
                
                return 'Fix completed - try the buttons now';
            };
            window.debugMenu = () => {
                console.log('🔍 Debugging menu categories...');
                const megaLinks = document.querySelectorAll('.mega-link[data-category]');
                
                megaLinks.forEach(link => {
                    const category = link.getAttribute('data-category');
                    const text = link.textContent.trim();
                    console.log(`Category: ${category} -> Text: "${text}"`);
                });
                
                return 'Menu debug completed - check console for details';
            };
        }
    }

    saveProducts() { localStorage.setItem('products', JSON.stringify(this.products)); }

    // ========== VALIDACIÓN DE IMÁGENES MEJORADA ==========
    
    validateImageFile(file, maxSizeMB = 10) {
        // Verificar que sea un archivo de imagen
        if (!file.type.startsWith('image/')) {
            return {
                valid: false,
                error: 'Por favor selecciona un archivo de imagen válido'
            };
        }
        
        // Lista expandida de formatos soportados
        const supportedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'image/bmp', 'image/tiff', 'image/svg+xml', 'image/avif', 
            'image/heic', 'image/heif'
        ];
        
        // Verificar tamaño
        if (file.size > maxSizeMB * 1024 * 1024) {
            return {
                valid: false,
                error: `La imagen es demasiado grande (máximo ${maxSizeMB}MB)`
            };
        }
        
        // Verificar formato
        let warning = null;
        if (!supportedTypes.includes(file.type)) {
            warning = `Formato ${file.type.split('/')[1].toUpperCase()} detectado. Se procesará para mejor compatibilidad.`;
            console.warn(`⚠️ Formato ${file.type} puede tener compatibilidad limitada`);
        }
        
        return {
            valid: true,
            warning: warning,
            format: file.type.split('/')[1],
            size: (file.size / 1024 / 1024).toFixed(2)
        };
    }

    // ========== SISTEMA CDN PARA IMÁGENES ==========
    
    initializeCDN() {
        console.log('🌐 Inicializando sistema CDN...');
        
        // Detectar si estamos en desarrollo o producción
        this.cdnConfig.isDevelopment = window.location.hostname === 'localhost' || 
                                      window.location.hostname === '127.0.0.1';
        
        // Detectar soporte de formatos de imagen
        this.cdnConfig.formatSupport = this.checkImageFormatSupport();
        
        // Configurar CDNs según el entorno
        if (this.cdnConfig.isDevelopment) {
            console.log('🔧 Modo desarrollo: usando archivos locales con fallback CDN');
        } else {
            console.log('🚀 Modo producción: usando CDN con fallback local');
        }
        
        console.log('📷 Soporte de formatos detectado:', this.cdnConfig.formatSupport);
        
        // Precargar imágenes críticas
        this.preloadCriticalImages();
        
        // Configurar observer para lazy loading mejorado
        this.setupAdvancedLazyLoading();
    }
    
    // Obtener URL optimizada para una imagen
    getOptimizedImageUrl(imagePath, options = {}) {
        if (!imagePath) return this.getDefaultImageUrl();
        
        // Si ya está en cache, devolverla
        const cacheKey = `${imagePath}_${JSON.stringify(options)}`;
        if (this.cdnConfig.optimizedUrls.has(cacheKey)) {
            return this.cdnConfig.optimizedUrls.get(cacheKey);
        }
        
        let optimizedUrl;
        
        // Determinar el tipo de imagen
        if (imagePath.startsWith('img/uploads/')) {
            // Imagen subida por usuario - usar CDN de uploads
            optimizedUrl = this.getUploadImageUrl(imagePath, options);
        } else if (imagePath.startsWith('img/')) {
            // Imagen estática - usar CDN estático
            optimizedUrl = this.getStaticImageUrl(imagePath, options);
        } else if (imagePath.startsWith('http')) {
            // URL externa - usar tal como está
            optimizedUrl = imagePath;
        } else {
            // Ruta relativa - convertir a estática
            optimizedUrl = this.getStaticImageUrl(`img/${imagePath}`, options);
        }
        
        // Guardar en cache
        this.cdnConfig.optimizedUrls.set(cacheKey, optimizedUrl);
        
        return optimizedUrl;
    }
    
    // URL para imágenes estáticas (SVG predefinidos)
    getStaticImageUrl(imagePath, options = {}) {
        const { width, height, quality = 85 } = options;
        
        if (this.cdnConfig.isDevelopment) {
            // En desarrollo, usar archivos locales
            return imagePath;
        }
        
        // En producción, usar jsDelivr CDN para archivos estáticos
        let cdnUrl = `https://cdn.jsdelivr.net/gh/tu-usuario/recetas-world@main/${imagePath}`;
        
        // Agregar parámetros de optimización si se especifican
        const params = new URLSearchParams();
        if (width) params.append('w', width);
        if (height) params.append('h', height);
        if (quality !== 85) params.append('q', quality);
        
        if (params.toString()) {
            cdnUrl += `?${params.toString()}`;
        }
        
        return cdnUrl;
    }
    
    // URL para imágenes subidas por usuarios
    getUploadImageUrl(imagePath, options = {}) {
        const { width, height, quality = 85 } = options;
        
        // Extraer el nombre del archivo
        const filename = imagePath.replace('img/uploads/', '');
        
        if (this.cdnConfig.isDevelopment) {
            // En desarrollo, usar archivos locales
            return imagePath;
        }
        
        // En producción, intentar usar un servicio de imágenes optimizado
        // Por ahora, usar la URL local pero con parámetros de optimización
        let optimizedUrl = imagePath;
        
        // Si tienes configurado un CDN para uploads (como Cloudinary, ImageKit, etc.)
        // puedes implementar la lógica aquí
        
        return optimizedUrl;
    }
    
    // URL por defecto cuando no hay imagen
    getDefaultImageUrl() {
        return this.getStaticImageUrl('img/default-recipe.svg');
    }
    
    // Precargar imágenes críticas
    preloadCriticalImages() {
        const criticalImages = [
            'img/default-recipe.svg',
            'img/placeholder.svg'
        ];
        
        criticalImages.forEach(imagePath => {
            const img = new Image();
            img.src = this.getOptimizedImageUrl(imagePath);
            img.onload = () => console.log(`✅ Precargada: ${imagePath}`);
            img.onerror = () => console.warn(`⚠️ Error precargando: ${imagePath}`);
        });
    }
    
    // Crear elemento img con lazy loading y fallback mejorado
    createOptimizedImage(imagePath, alt = '', options = {}) {
        const {
            width,
            height,
            className = 'recipe-image',
            loading = 'lazy',
            fallbackEmoji = '🍽️'
        } = options;
        
        const optimizedUrl = this.getOptimizedImageUrl(imagePath, { width, height });
        const fallbackUrl = this.getDefaultImageUrl();
        
        // Detectar formato de imagen para compatibilidad
        const imageFormat = this.detectImageFormat(imagePath);
        const needsFallback = this.needsFormatFallback(imageFormat);
        
        return `
            <img 
                src="${optimizedUrl}" 
                alt="${alt}" 
                class="${className}"
                loading="${loading}"
                ${width ? `width="${width}"` : ''}
                ${height ? `height="${height}"` : ''}
                onerror="this.onerror=null; ${needsFallback ? `this.src='${this.convertToCompatibleFormat(optimizedUrl)}'; if(this.src.includes('converted') && this.complete && this.naturalWidth === 0) {` : ''} this.src='${fallbackUrl}'; if(!this.src || this.src==='${fallbackUrl}') { this.style.display='none'; this.nextElementSibling.style.display='flex'; } ${needsFallback ? '}' : ''}"
                data-original-format="${imageFormat}"
                data-needs-fallback="${needsFallback}"
            >
            <div class="recipe-emoji-fallback" style="display:none; font-size: 4rem; color: var(--primary); justify-content: center; align-items: center; min-height: 200px;">
                ${fallbackEmoji}
            </div>
        `;
    }
    
    // Detectar formato de imagen
    detectImageFormat(imagePath) {
        if (!imagePath) return 'unknown';
        
        const extension = imagePath.split('.').pop()?.toLowerCase();
        return extension || 'unknown';
    }
    
    // Verificar si un formato necesita fallback para compatibilidad
    needsFormatFallback(format) {
        const modernFormats = ['avif', 'heic', 'heif', 'webp'];
        const oldFormats = ['bmp', 'tiff', 'tif'];
        
        return modernFormats.includes(format) || oldFormats.includes(format);
    }
    
    // Convertir a formato compatible (simulado - en producción usarías un servicio real)
    convertToCompatibleFormat(imageUrl) {
        // En un entorno real, esto llamaría a un servicio de conversión
        // Por ahora, simulamos cambiando la extensión a JPG
        return imageUrl.replace(/\.(avif|heic|heif|webp|bmp|tiff|tif)$/i, '.jpg');
    }
    
    // Verificar soporte del navegador para formatos de imagen
    checkImageFormatSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        const support = {
            webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
            avif: false, // Se detectará dinámicamente
            heic: false  // Generalmente no soportado en navegadores web
        };
        
        // Detectar soporte AVIF
        const avifImg = new Image();
        avifImg.onload = () => { support.avif = true; };
        avifImg.onerror = () => { support.avif = false; };
        avifImg.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        
        return support;
    }
    
    // Optimizar todas las imágenes existentes en el DOM
    optimizeExistingImages() {
        const images = document.querySelectorAll('img[src^="img/"]');
        let optimizedCount = 0;
        
        images.forEach(img => {
            const originalSrc = img.src;
            const optimizedSrc = this.getOptimizedImageUrl(originalSrc);
            
            if (originalSrc !== optimizedSrc) {
                img.src = optimizedSrc;
                optimizedCount++;
            }
        });
        
        console.log(`🚀 Optimizadas ${optimizedCount} imágenes existentes`);
        return optimizedCount;
    }
    
    // Configurar lazy loading avanzado con Intersection Observer
    setupAdvancedLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            console.log('⚠️ IntersectionObserver no soportado, usando lazy loading básico');
            return;
        }
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Cargar imagen de alta calidad
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    
                    // Verificar compatibilidad de formato
                    if (img.dataset.needsFallback === 'true') {
                        this.handleFormatCompatibility(img);
                    }
                    
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Observar todas las imágenes con lazy loading
        document.addEventListener('DOMContentLoaded', () => {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(img => imageObserver.observe(img));
        });
        
        this.imageObserver = imageObserver;
    }
    
    // Manejar compatibilidad de formatos de imagen
    handleFormatCompatibility(img) {
        const format = img.dataset.originalFormat;
        
        if (!format) return;
        
        // Verificar si el navegador soporta el formato
        const isSupported = this.isFormatSupported(format);
        
        if (!isSupported) {
            console.log(`🔄 Convirtiendo formato ${format.toUpperCase()} para mejor compatibilidad`);
            
            // Intentar cargar versión convertida
            const convertedSrc = this.convertToCompatibleFormat(img.src);
            
            const testImg = new Image();
            testImg.onload = () => {
                img.src = convertedSrc;
                console.log(`✅ Formato convertido exitosamente: ${format} → JPG`);
            };
            testImg.onerror = () => {
                console.log(`⚠️ No se pudo convertir ${format}, usando fallback`);
            };
            testImg.src = convertedSrc;
        }
    }
    
    // Verificar si un formato es soportado por el navegador
    isFormatSupported(format) {
        switch (format.toLowerCase()) {
            case 'webp':
                return this.cdnConfig.formatSupport?.webp || false;
            case 'avif':
                return this.cdnConfig.formatSupport?.avif || false;
            case 'heic':
            case 'heif':
                return false; // Generalmente no soportado en navegadores web
            case 'bmp':
            case 'tiff':
            case 'tif':
                return true; // Soportado pero no optimizado
            default:
                return true; // PNG, JPG, GIF son universalmente soportados
        }
    }

    // ========== VENTANA DE BIENVENIDA PARA USUARIOS ==========
    
    showUserWelcomeModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.zIndex = '10000';
        modal.innerHTML = `
            <div class="modal-content modal-medium">
                <button class="modal-close" onclick="this.closest('.modal').remove();">&times;</button>
                <div class="welcome-modal-body">
                    <div class="welcome-header">
                        <div class="welcome-icon">
                            <i class="fas fa-camera"></i>
                        </div>
                        <h2>¡Bienvenido a RecetasWorld!</h2>
                        <p class="welcome-subtitle">Comparte tus creaciones culinarias y gana puntos</p>
                    </div>
                    
                    <div class="welcome-content">
                        <div class="welcome-feature">
                            <div class="feature-icon">
                                <i class="fas fa-heart"></i>
                            </div>
                            <div class="feature-info">
                                <h4>Explora Recetas del Mundo</h4>
                                <p>Descubre <strong>deliciosas recetas</strong> de diferentes países y culturas culinarias.</p>
                            </div>
                        </div>
                        
                        <div class="welcome-feature">
                            <div class="feature-icon">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div class="feature-info">
                                <h4>Gana Puntos por tus Fotos</h4>
                                <p>Cada imagen aprobada te otorga <strong>puntos</strong> que puedes canjear por productos exclusivos.</p>
                            </div>
                        </div>
                        
                        <div class="welcome-feature">
                            <div class="feature-icon">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="feature-info">
                                <h4>Sistema de Intentos</h4>
                                <p>Tienes <strong>3 intentos por receta</strong>: 1er intento = 10 pts, 2do = 6 pts, 3er = 3 pts.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="welcome-actions">
                        <button class="btn-primary" onclick="this.closest('.modal').remove();">
                            <i class="fas fa-check"></i>
                            Entendido
                        </button>
                        <button class="btn-secondary" onclick="this.closest('.modal').remove();">
                            <i class="fas fa-times"></i>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Mostrar modal con animación
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // ========== SISTEMA DE RECOMENDACIONES BASADO EN COOKIES ==========
    
    // Guardar preferencias del usuario
    saveUserPreferences() {
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    }

    // Actualizar preferencias cuando se agrega a favoritos
    updateFavoritePreferences(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        // Incrementar peso de categorías
        recipe.categorias.forEach(category => {
            this.userPreferences.favoriteCategories[category] = 
                (this.userPreferences.favoriteCategories[category] || 0) + 1;
        });

        // Incrementar peso del país
        if (recipe.pais) {
            this.userPreferences.favoriteCountries[recipe.pais] = 
                (this.userPreferences.favoriteCountries[recipe.pais] || 0) + 1;
        }

        this.saveUserPreferences();
        console.log('🍳 Preferencias actualizadas por favorito:', recipe.nombre);
    }

    // Actualizar historial de búsqueda
    updateSearchHistory(query) {
        if (!query || query.trim().length < 2) return;
        
        const normalizedQuery = query.toLowerCase().trim();
        
        // Agregar al historial (máximo 50 búsquedas)
        this.userPreferences.searchHistory.unshift(normalizedQuery);
        this.userPreferences.searchHistory = this.userPreferences.searchHistory.slice(0, 50);
        
        this.saveUserPreferences();
        console.log('🔍 Historial de búsqueda actualizado:', normalizedQuery);
        
        // Verificar logros relacionados con búsquedas
        if (this.currentUser) {
            this.checkAndAwardAchievements(this.currentUser.username);
        }
    }

    // Actualizar historial de visualización
    updateViewHistory(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        // Agregar al historial de visualización (máximo 100 recetas)
        this.userPreferences.viewHistory.unshift(recipeId);
        this.userPreferences.viewHistory = this.userPreferences.viewHistory.slice(0, 100);

        // También actualizar preferencias de categorías y países con menor peso
        recipe.categorias.forEach(category => {
            this.userPreferences.favoriteCategories[category] = 
                (this.userPreferences.favoriteCategories[category] || 0) + 0.3;
        });

        if (recipe.pais) {
            this.userPreferences.favoriteCountries[recipe.pais] = 
                (this.userPreferences.favoriteCountries[recipe.pais] || 0) + 0.3;
        }

        this.saveUserPreferences();
        console.log('👀 Historial de visualización actualizado:', recipe.nombre);
    }

    // Calcular puntuación de recomendación para una receta
    calculateRecommendationScore(recipe) {
        let score = 0;

        // Puntuación base por calificación
        score += (recipe.calificacion || 0) * 0.2;

        // Puntuación por categorías favoritas
        const categoryScore = recipe.categorias.reduce((sum, category) => {
            return sum + (this.userPreferences.favoriteCategories[category] || 0);
        }, 0);
        score += categoryScore * this.recommendationWeights.favoriteCategories;

        // Puntuación por país favorito
        const countryScore = this.userPreferences.favoriteCountries[recipe.pais] || 0;
        score += countryScore * this.recommendationWeights.favoriteCountries;

        // Puntuación por historial de búsqueda
        const searchScore = this.userPreferences.searchHistory.reduce((sum, query) => {
            const recipeText = `${recipe.nombre} ${recipe.pais} ${recipe.categorias.join(' ')}`.toLowerCase();
            return sum + (recipeText.includes(query) ? 1 : 0);
        }, 0);
        score += searchScore * this.recommendationWeights.searchHistory;

        // Penalizar recetas ya vistas recientemente
        const recentlyViewed = this.userPreferences.viewHistory.slice(0, 20);
        if (recentlyViewed.includes(recipe.id)) {
            score *= 0.5; // Reducir puntuación a la mitad
        }

        // Penalizar recetas ya en favoritos
        if (this.favorites.includes(recipe.id)) {
            score *= 0.3; // Reducir aún más
        }

        return score;
    }

    // Obtener recetas recomendadas
    getRecommendedRecipes(count = 8) {
        // Si no hay suficientes datos de preferencias, mostrar las mejor calificadas
        const totalPreferences = 
            Object.keys(this.userPreferences.favoriteCategories).length +
            Object.keys(this.userPreferences.favoriteCountries).length +
            this.userPreferences.searchHistory.length +
            this.userPreferences.viewHistory.length;

        if (totalPreferences < 5) {
            console.log('🤖 Datos insuficientes para recomendaciones, mostrando mejor calificadas');
            return [...this.recipes]
                .sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0))
                .slice(0, count);
        }

        // Calcular puntuaciones y ordenar
        const scoredRecipes = this.recipes.map(recipe => ({
            recipe,
            score: this.calculateRecommendationScore(recipe)
        }));

        // Ordenar por puntuación y tomar las mejores
        const recommended = scoredRecipes
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(item => item.recipe);

        console.log('🎯 Recetas recomendadas generadas:', recommended.length);
        console.log('📊 Preferencias del usuario:', {
            categorias: Object.keys(this.userPreferences.favoriteCategories).length,
            paises: Object.keys(this.userPreferences.favoriteCountries).length,
            busquedas: this.userPreferences.searchHistory.length,
            vistas: this.userPreferences.viewHistory.length
        });

        return recommended;
    }

    // Mostrar recetas recomendadas
    showRecommendations() {
        this.currentCategory = null;
        this.lastSearchQuery = '';
        
        const recommendedRecipes = this.getRecommendedRecipes(8);
        
        // Determinar el título basado en las preferencias
        let title = 'Recetas Recomendadas para Ti';
        const topCategories = Object.entries(this.userPreferences.favoriteCategories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 2)
            .map(([category]) => category);
        
        if (topCategories.length > 0) {
            const categoryNames = {
                'desayunos': 'Desayunos',
                'comidas': 'Comidas', 
                'cenas': 'Cenas',
                'postres': 'Postres',
                'bebidas': 'Bebidas',
                'botanas': 'Botanas',
                'entradas': 'Entradas',
                'rapidas': 'Rápidas',
                'baratas': 'Económicas'
            };
            
            if (topCategories.length === 1) {
                title = `Recetas de ${categoryNames[topCategories[0]] || topCategories[0]} para Ti`;
            } else {
                title = `Recetas de ${categoryNames[topCategories[0]] || topCategories[0]} y ${categoryNames[topCategories[1]] || topCategories[1]}`;
            }
        }

        document.getElementById('sectionTitle').textContent = title;
        this.displayRecipes(recommendedRecipes);
        
        // Mostrar información de debug en consola
        this.showRecommendationDebugInfo();
    }

    // Información de debug para recomendaciones
    showRecommendationDebugInfo() {
        const topCategories = Object.entries(this.userPreferences.favoriteCategories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        const topCountries = Object.entries(this.userPreferences.favoriteCountries)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        console.log('🎯 SISTEMA DE RECOMENDACIONES - DEBUG INFO');
        console.log('📈 Top Categorías:', topCategories);
        console.log('🌍 Top Países:', topCountries);
        console.log('🔍 Últimas búsquedas:', this.userPreferences.searchHistory.slice(0, 5));
        console.log('👀 Últimas vistas:', this.userPreferences.viewHistory.slice(0, 5));
        console.log('❤️ Favoritos actuales:', this.favorites.length);
    }

    // ========== SISTEMA DE BOTS PARA CALIFICACIONES AUTOMÁTICAS ==========
    
    initializeBotUsers() {
        // Lista de nombres de bots realistas con comentarios típicos
        return [
            { 
                name: 'María González', 
                country: 'México', 
                preference: ['comidas', 'desayunos'],
                avatar: '👩🏻‍🍳',
                comments: [
                    'Deliciosa receta, la hice para mi familia y les encantó!',
                    'Muy fácil de preparar, perfecta para el desayuno',
                    'Los ingredientes son fáciles de conseguir, excelente!',
                    'Le agregué un toque personal y quedó increíble',
                    'Definitivamente la voy a hacer otra vez'
                ]
            },
            { 
                name: 'Carlos Rodríguez', 
                country: 'España', 
                preference: ['cenas', 'postres'],
                avatar: '👨🏻‍🍳',
                comments: [
                    'Espectacular! Mis invitados no paraban de preguntar por la receta',
                    'El sabor es auténtico, me recordó a mi abuela',
                    'Perfecta para una cena romántica',
                    'Los tiempos de cocción están perfectos',
                    'Una receta que no puede faltar en tu repertorio'
                ]
            },
            { 
                name: 'Ana Martínez', 
                country: 'Argentina', 
                preference: ['bebidas', 'botanas'],
                avatar: '👩🏽‍🍳',
                comments: [
                    'Refrescante y deliciosa, ideal para el verano',
                    'Perfecta para acompañar con amigos',
                    'Muy original, nunca había probado algo así',
                    'Fácil de hacer y con un sabor increíble',
                    'La textura quedó perfecta, muy recomendada'
                ]
            },
            { 
                name: 'Luis Fernández', 
                country: 'Colombia', 
                preference: ['comidas', 'rapidas'],
                avatar: '👨🏽‍🍳',
                comments: [
                    'Rápida y sabrosa, perfecta para el almuerzo',
                    'Ideal cuando tienes poco tiempo pero quieres algo rico',
                    'Los sabores se combinan muy bien',
                    'Nutritiva y deliciosa, qué más se puede pedir',
                    'Mis hijos la devoran, es un éxito total'
                ]
            },
            { 
                name: 'Sofia López', 
                country: 'Chile', 
                preference: ['desayunos', 'postres'],
                avatar: '👩🏻‍🦰',
                comments: [
                    'Dulce perfecto, no empalaga para nada',
                    'Ideal para empezar el día con energía',
                    'La presentación queda hermosa',
                    'Sabor casero que te llena el corazón',
                    'Perfecta para compartir en familia'
                ]
            },
            { 
                name: 'Diego Herrera', 
                country: 'Perú', 
                preference: ['comidas', 'entradas'],
                avatar: '👨🏽‍🦱',
                comments: [
                    'Sabores intensos que despiertan el paladar',
                    'Una entrada que roba protagonismo al plato principal',
                    'Técnica impecable, resultado profesional',
                    'Combina tradición con un toque moderno',
                    'Cada bocado es una explosión de sabor'
                ]
            },
            { 
                name: 'Isabella Torres', 
                country: 'Venezuela', 
                preference: ['bebidas', 'postres'],
                avatar: '👩🏽‍🦱',
                comments: [
                    'Cremosa y deliciosa, un postre de ensueño',
                    'Refrescante y con el dulzor justo',
                    'Perfecta para cerrar una comida especial',
                    'Fácil de hacer pero con resultado gourmet',
                    'Mis invitados siempre piden la receta'
                ]
            },
            { 
                name: 'Alejandro Silva', 
                country: 'Ecuador', 
                preference: ['cenas', 'comidas'],
                avatar: '👨🏻‍🦲',
                comments: [
                    'Contundente y sabrosa, perfecta para la cena',
                    'Los condimentos están en su punto exacto',
                    'Una receta que satisface hasta al más exigente',
                    'Tradicional pero con un toque especial',
                    'Ideal para reuniones familiares'
                ]
            },
            { 
                name: 'Valentina Morales', 
                country: 'Uruguay', 
                preference: ['desayunos', 'baratas'],
                avatar: '👩🏻‍🦳',
                comments: [
                    'Económica pero no por eso menos deliciosa',
                    'Perfecta para estudiantes como yo',
                    'Ingredientes básicos, resultado extraordinario',
                    'Rinde mucho y está buenísima',
                    'La mejor relación calidad-precio'
                ]
            },
            { 
                name: 'Sebastián Castro', 
                country: 'Costa Rica', 
                preference: ['rapidas', 'botanas'],
                avatar: '👨🏽‍🦰',
                comments: [
                    'Lista en minutos y súper sabrosa',
                    'Perfecta para picar mientras ves una película',
                    'Crujiente y adictiva, no puedes parar de comer',
                    'Ideal para fiestas y reuniones casuales',
                    'Simple pero efectiva, me encanta'
                ]
            },
            { 
                name: 'Camila Vargas', 
                country: 'Panamá', 
                preference: ['postres', 'bebidas'],
                avatar: '👩🏽‍🦰',
                comments: [
                    'Dulce tentación que no puedes resistir',
                    'Perfecta para acompañar el café de la tarde',
                    'Textura suave y sabor intenso',
                    'Un postre que enamora desde el primer bocado',
                    'Fácil de hacer pero parece de pastelería'
                ]
            },
            { 
                name: 'Mateo Jiménez', 
                country: 'Guatemala', 
                preference: ['comidas', 'entradas'],
                avatar: '👨🏻‍🦱',
                comments: [
                    'Auténtica y llena de sabor tradicional',
                    'Me transporta a la cocina de mi madre',
                    'Ingredientes frescos hacen la diferencia',
                    'Una receta que honra nuestras tradiciones',
                    'Perfecta para domingos en familia'
                ]
            },
            { 
                name: 'Lucía Mendoza', 
                country: 'Honduras', 
                preference: ['desayunos', 'baratas'],
                avatar: '👩🏽‍🦳',
                comments: [
                    'Nutritiva y económica, perfecta para empezar el día',
                    'Con pocos ingredientes logras mucho sabor',
                    'Ideal para familias numerosas',
                    'Saludable y deliciosa, qué más pedir',
                    'Mis nietos la aman, es su desayuno favorito'
                ]
            },
            { 
                name: 'Gabriel Ruiz', 
                country: 'Nicaragua', 
                preference: ['cenas', 'rapidas'],
                avatar: '👨🏽‍🦳',
                comments: [
                    'Perfecta para después de un día largo de trabajo',
                    'Rápida pero no sacrifica el sabor',
                    'Ingredientes que siempre tengo en casa',
                    'Una cena que satisface y reconforta',
                    'Práctica y deliciosa, mi combinación favorita'
                ]
            },
            { 
                name: 'Emilia Guerrero', 
                country: 'El Salvador', 
                preference: ['bebidas', 'postres'],
                avatar: '👩🏻‍🦱',
                comments: [
                    'Refrescante y con un toque tropical delicioso',
                    'Perfecta para celebraciones especiales',
                    'El equilibrio de sabores es perfecto',
                    'Una bebida que alegra cualquier momento',
                    'Fácil de preparar y siempre queda bien'
                ]
            },
            { 
                name: 'Nicolás Peña', 
                country: 'República Dominicana', 
                preference: ['comidas', 'botanas'],
                avatar: '👨🏾‍🦲',
                comments: [
                    'Sabor caribeño auténtico en cada bocado',
                    'Perfecta para compartir en la playa',
                    'Los condimentos le dan un toque especial',
                    'Una receta que nunca pasa de moda',
                    'Ideal para reuniones con música y baile'
                ]
            },
            { 
                name: 'Antonella Ramos', 
                country: 'Puerto Rico', 
                preference: ['desayunos', 'entradas'],
                avatar: '👩🏾‍🦱',
                comments: [
                    'Desayuno tropical que te llena de energía',
                    'Colores vibrantes y sabores intensos',
                    'Una entrada que despierta todos los sentidos',
                    'Perfecta para brunches de fin de semana',
                    'Fresca y nutritiva, ideal para el clima tropical'
                ]
            },
            { 
                name: 'Joaquín Medina', 
                country: 'Cuba', 
                preference: ['cenas', 'comidas'],
                avatar: '👨🏾‍🦱',
                comments: [
                    'Sabor cubano tradicional que no defrauda',
                    'Una receta que pasa de generación en generación',
                    'Perfecta para cenas con música de fondo',
                    'Los sabores te transportan al Caribe',
                    'Contundente y sabrosa, como debe ser'
                ]
            },
            { 
                name: 'Renata Ortiz', 
                country: 'Bolivia', 
                preference: ['postres', 'baratas'],
                avatar: '👩🏽‍🦲',
                comments: [
                    'Dulce tradicional con ingredientes accesibles',
                    'Perfecta para endulzar tardes de lluvia',
                    'Receta familiar que siempre funciona',
                    'Económica pero con sabor de lujo',
                    'Ideal para compartir con vecinos y amigos'
                ]
            },
            { 
                name: 'Tomás Aguilar', 
                country: 'Paraguay', 
                preference: ['rapidas', 'bebidas'],
                avatar: '👨🏻‍🦰',
                comments: [
                    'Refrescante y rápida, perfecta para el calor',
                    'Lista en minutos y con sabor increíble',
                    'Ideal para después del trabajo o ejercicio',
                    'Ingredientes simples, resultado espectacular',
                    'Una bebida que siempre levanta el ánimo'
                ]
            }
        ];
    }

    generateBotRatingsForRecipe(recipeId) {
        // Verificar si ya se generaron calificaciones para esta receta
        if (this.botRatingsGenerated[recipeId]) {
            return;
        }

        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        // Determinar cuántos bots van a calificar (entre 3 y 12)
        const numRatings = Math.floor(Math.random() * 10) + 3;
        
        // Seleccionar bots que tengan preferencia por las categorías de la receta
        let eligibleBots = this.botUsers.filter(bot => 
            bot.preference.some(pref => recipe.categorias.includes(pref))
        );
        
        // Si no hay bots elegibles, usar todos
        if (eligibleBots.length === 0) {
            eligibleBots = this.botUsers;
        }

        // Mezclar y seleccionar bots aleatorios
        const selectedBots = this.shuffleArray([...eligibleBots]).slice(0, numRatings);
        
        let totalRating = 0;
        let ratingCount = 0;

        selectedBots.forEach(bot => {
            // Generar calificación basada en preferencias
            let rating;
            const hasPreference = bot.preference.some(pref => recipe.categorias.includes(pref));
            
            if (hasPreference) {
                // Si le gusta la categoría, calificación más alta (3-5 estrellas)
                rating = Math.floor(Math.random() * 3) + 3;
            } else {
                // Calificación más variada (2-5 estrellas)
                rating = Math.floor(Math.random() * 4) + 2;
            }

            // Pequeña variación aleatoria para hacer más realista
            if (Math.random() < 0.1) {
                rating = Math.max(1, Math.min(5, rating + (Math.random() < 0.5 ? -1 : 1)));
            }

            totalRating += rating;
            ratingCount++;
        });

        // Actualizar estadísticas de calificación
        const currentStats = this.ratingStats[recipeId] || { count: 0, total: 0 };
        this.ratingStats[recipeId] = {
            count: currentStats.count + ratingCount,
            total: currentStats.total + totalRating
        };

        // Marcar como generado
        this.botRatingsGenerated[recipeId] = true;
        
        // Guardar en localStorage
        localStorage.setItem('ratingStats', JSON.stringify(this.ratingStats));
        localStorage.setItem('botRatingsGenerated', JSON.stringify(this.botRatingsGenerated));

        console.log(`🤖 Bots generaron ${ratingCount} calificaciones para "${recipe.nombre}" (promedio: ${(totalRating/ratingCount).toFixed(1)})`);
    }

    generateBotRatingsForAllRecipes() {
        if (!this.recipes || this.recipes.length === 0) return;
        
        console.log('🤖 Iniciando generación de calificaciones por bots...');
        
        this.recipes.forEach(recipe => {
            // Generar con un pequeño delay para simular actividad natural
            setTimeout(() => {
                this.generateBotRatingsForRecipe(recipe.id);
            }, Math.random() * 1000);
        });

        // Aplicar las nuevas calificaciones a las recetas
        setTimeout(() => {
            this.applyRatingStatsToRecipes();
            // Refrescar la vista actual si hay recetas mostradas
            if (document.getElementById('recipesGrid').children.length > 0) {
                this.refreshCurrentView();
            }
        }, 1500);
    }

    // Función auxiliar para mezclar arrays
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Generar calificaciones para una nueva receta agregada por admin
    generateBotRatingsForNewRecipe(recipeId) {
        console.log('🤖 Generando calificaciones para nueva receta...');
        
        // Esperar un poco para simular que los bots "descubren" la nueva receta
        setTimeout(() => {
            this.generateBotRatingsForRecipe(recipeId);
            this.applyRatingStatsToRecipes();
            this.refreshCurrentView();
        }, 2000 + Math.random() * 3000); // Entre 2-5 segundos
    }

    // Función para regenerar todas las calificaciones (útil para testing)
    regenerateAllBotRatings() {
        if (!confirm('¿Regenerar todas las calificaciones de bots? Esto eliminará las calificaciones existentes.')) {
            return;
        }
        
        console.log('🤖 Regenerando todas las calificaciones de bots...');
        
        // Limpiar calificaciones existentes
        this.botRatingsGenerated = {};
        localStorage.removeItem('botRatingsGenerated');
        
        // Regenerar para todas las recetas
        this.generateBotRatingsForAllRecipes();
        
        this.showNotification('🤖 Calificaciones de bots regeneradas', 'info');
    }

    // Mostrar estadísticas de bots
    showBotStats() {
        const totalRecipes = this.recipes.length;
        const recipesWithBotRatings = Object.keys(this.botRatingsGenerated).length;
        const totalBotRatings = Object.values(this.ratingStats).reduce((sum, stat) => sum + (stat.count || 0), 0);
        
        console.log(`📊 Estadísticas de Bots:
        - Total de recetas: ${totalRecipes}
        - Recetas con calificaciones de bots: ${recipesWithBotRatings}
        - Total de calificaciones generadas: ${totalBotRatings}
        - Bots activos: ${this.botUsers.length}`);
        
        this.showNotification(`🤖 ${totalBotRatings} calificaciones generadas por ${this.botUsers.length} bots`, 'info');
    }

    // ========== SISTEMA DE RESEÑAS DE BOTS ==========
    
    generateBotReviewsForRecipe(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return [];

        const stats = this.ratingStats[recipeId];
        if (!stats || stats.count === 0) return [];

        // Generar entre 2 y 6 reseñas de bots (menos que calificaciones)
        const numReviews = Math.min(stats.count, Math.floor(Math.random() * 5) + 2);
        
        // Seleccionar bots que tengan preferencia por las categorías de la receta
        let eligibleBots = this.botUsers.filter(bot => 
            bot.preference.some(pref => recipe.categorias.includes(pref))
        );
        
        if (eligibleBots.length === 0) {
            eligibleBots = this.botUsers;
        }

        const selectedBots = this.shuffleArray([...eligibleBots]).slice(0, numReviews);
        
        const botReviews = selectedBots.map(bot => {
            // Seleccionar un comentario aleatorio del bot
            const comment = bot.comments[Math.floor(Math.random() * bot.comments.length)];
            
            // Generar calificación similar a la lógica existente
            const hasPreference = bot.preference.some(pref => recipe.categorias.includes(pref));
            let rating;
            if (hasPreference) {
                rating = Math.floor(Math.random() * 3) + 3; // 3-5 estrellas
            } else {
                rating = Math.floor(Math.random() * 4) + 2; // 2-5 estrellas
            }

            // Generar fecha aleatoria en los últimos 30 días
            const daysAgo = Math.floor(Math.random() * 30);
            const reviewDate = new Date();
            reviewDate.setDate(reviewDate.getDate() - daysAgo);

            return {
                id: `review_${recipeId}_${bot.name.replace(/\s+/g, '_')}`,
                userName: bot.name,
                userCountry: bot.country,
                userAvatar: bot.avatar,
                rating: rating,
                comment: comment,
                date: reviewDate,
                helpful: Math.floor(Math.random() * 15) + 1, // Entre 1 y 15 personas encontraron útil
                isUserReview: false
            };
        });

        // Agregar reseñas de usuarios reales
        const userReviews = JSON.parse(localStorage.getItem('userReviews')) || {};
        const recipeUserReviews = userReviews[recipeId] || [];

        // Combinar reseñas de bots y usuarios, ordenar por fecha (más recientes primero)
        const allReviews = [...botReviews, ...recipeUserReviews];
        return allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    showRecipeReviews(recipeId) {
        console.log('showRecipeReviews called with recipeId:', recipeId, 'type:', typeof recipeId);
        
        this.closeAllModals();
        this.hideHeaderAndSearch();
        
        // Buscar la receta de manera más flexible
        let recipe = this.recipes.find(r => r.id === recipeId);
        
        // Si no se encuentra, intentar con conversión de tipos
        if (!recipe) {
            recipe = this.recipes.find(r => String(r.id) === String(recipeId) || parseInt(r.id) === parseInt(recipeId));
        }
        
        console.log('Found recipe:', recipe ? recipe.nombre : 'NOT FOUND');
        
        if (!recipe) {
            console.error('Recipe not found for ID:', recipeId);
            console.log('Available recipes:', this.recipes.map(r => ({id: r.id, name: r.nombre})).slice(0, 10));
            this.showNotification('Error: Receta no encontrada', 'error');
            this.showHeaderAndSearch();
            return;
        }

        const reviews = this.generateBotReviewsForRecipe(recipeId);
        const stats = this.ratingStats[recipeId] || { count: 0, total: 0 };
        const avgRating = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : 0;
        const userRating = this.ratings[recipeId] || 0;

        // Obtener reseñas útiles del usuario
        const userHelpfulReviews = JSON.parse(localStorage.getItem('userHelpfulReviews')) || {};

        const html = `
            <div class="reviews-container">
                <div class="reviews-header">
                    <div class="recipe-info-mini">
                        <img src="${recipe.imagen}" alt="${recipe.nombre}" class="recipe-mini-image">
                        <div>
                            <h3>${recipe.nombre}</h3>
                            <p class="recipe-country-mini"><i class="fas fa-map-marker-alt"></i> ${recipe.pais}</p>
                        </div>
                    </div>
                    <div class="rating-summary">
                        <div class="avg-rating">
                            <span class="rating-number-large">${avgRating}</span>
                            <div class="stars-large">
                                ${[1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= Math.round(avgRating) ? 'active' : ''}"></i>`).join('')}
                            </div>
                            <p>${stats.count} calificaciones</p>
                        </div>
                    </div>
                </div>

                <div class="reviews-list">
                    <h4><i class="fas fa-comments"></i> Reseñas de la comunidad</h4>
                    ${reviews.length === 0 ? 
                        '<div class="no-reviews">Esta receta aún no tiene reseñas escritas.</div>' :
                        reviews.map(review => `
                            <div class="review-item ${review.isUserReview ? 'user-review' : ''}">
                                <div class="review-header">
                                    <div class="user-info">
                                        <span class="user-avatar">${review.userAvatar}</span>
                                        <div class="user-details">
                                            <span class="user-name">${review.userName}${review.isUserReview ? ' (Tú)' : ''}</span>
                                            <span class="user-location">${review.userCountry}</span>
                                        </div>
                                    </div>
                                    <div class="review-rating">
                                        <div class="stars-small">
                                            ${[1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= review.rating ? 'active' : ''}"></i>`).join('')}
                                        </div>
                                        <span class="review-date">${this.formatDate(review.date)}</span>
                                    </div>
                                </div>
                                <div class="review-content">
                                    <p>${review.comment}</p>
                                </div>
                                <div class="review-footer">
                                    <button class="helpful-btn ${userHelpfulReviews[review.id] ? 'helpful-active' : ''}" data-review-id="${review.id}">
                                        <i class="fas fa-thumbs-up"></i>
                                        Útil (${review.helpful + (userHelpfulReviews[review.id] ? 1 : 0)})
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>

                ${this.currentUser ? `
                <div class="add-review-section">
                    <h4><i class="fas fa-edit"></i> Escribe tu reseña</h4>
                    <div class="add-review-form">
                        <div class="rating-input">
                            <span>Tu calificación:</span>
                            <div class="stars-input" data-recipe-id="${recipeId}">
                                ${[1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= userRating ? 'active' : ''}" data-star="${i}"></i>`).join('')}
                            </div>
                            ${userRating > 0 ? `
                                <button class="clear-rating-btn" data-recipe-id="${recipeId}">
                                    <i class="fas fa-times"></i> Quitar calificación
                                </button>
                            ` : ''}
                        </div>
                        <textarea placeholder="Comparte tu experiencia con esta receta..." class="review-textarea" id="reviewText"></textarea>
                        <button class="btn-primary submit-review-btn" data-recipe-id="${recipeId}">
                            <i class="fas fa-paper-plane"></i>
                            Publicar reseña
                        </button>
                    </div>
                </div>
                ` : `
                <div class="login-required-section">
                    <div class="login-prompt">
                        <i class="fas fa-user-lock"></i>
                        <h4>Inicia sesión para escribir una reseña</h4>
                        <p>Comparte tu experiencia con la comunidad</p>
                        <button class="btn-primary login-prompt-btn" onclick="app.showLoginRequiredModal('Inicia sesión para escribir reseñas y calificar recetas')">
                            <i class="fas fa-sign-in-alt"></i>
                            Iniciar sesión
                        </button>
                    </div>
                </div>
                `}
            </div>
        `;

        const modalBodyEl = document.getElementById('modalBody');
        if (modalBodyEl) modalBodyEl.innerHTML = html;
        
        const recipeModalEl = document.getElementById('recipeModal');
        if (recipeModalEl) recipeModalEl.classList.add('active');

        this.setupReviewsEventListeners(recipeId);
    }

    updateReviewsContent(recipeId) {
        // Actualizar solo el contenido de reseñas sin recargar todo el modal
        const recipe = this.recipes.find(r => r.id === recipeId || String(r.id) === String(recipeId));
        if (!recipe) return;

        const reviews = this.generateBotReviewsForRecipe(recipeId);
        const stats = this.ratingStats[recipeId] || { count: 0, total: 0 };
        const avgRating = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : 0;
        const userRating = this.ratings[recipeId] || 0;
        const userHelpfulReviews = JSON.parse(localStorage.getItem('userHelpfulReviews')) || {};

        // Actualizar el resumen de calificación
        const ratingNumberLarge = document.querySelector('.rating-number-large');
        if (ratingNumberLarge) ratingNumberLarge.textContent = avgRating;

        const starsLarge = document.querySelector('.stars-large');
        if (starsLarge) {
            starsLarge.innerHTML = [1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= Math.round(avgRating) ? 'active' : ''}"></i>`).join('');
        }

        const ratingCount = document.querySelector('.rating-summary p');
        if (ratingCount) ratingCount.textContent = `${stats.count} calificaciones`;

        // Actualizar la lista de reseñas
        const reviewsList = document.querySelector('.reviews-list');
        if (reviewsList) {
            const reviewsHtml = reviews.length === 0 ? 
                '<h4><i class="fas fa-comments"></i> Reseñas de la comunidad</h4><div class="no-reviews">Esta receta aún no tiene reseñas escritas.</div>' :
                `<h4><i class="fas fa-comments"></i> Reseñas de la comunidad</h4>` +
                reviews.map(review => `
                    <div class="review-item ${review.isUserReview ? 'user-review' : ''}">
                        <div class="review-header">
                            <div class="user-info">
                                <span class="user-avatar">${review.userAvatar}</span>
                                <div class="user-details">
                                    <span class="user-name">${review.userName}${review.isUserReview ? ' (Tú)' : ''}</span>
                                    <span class="user-location">${review.userCountry}</span>
                                </div>
                            </div>
                            <div class="review-rating">
                                <div class="stars-small">
                                    ${[1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= review.rating ? 'active' : ''}"></i>`).join('')}
                                </div>
                                <span class="review-date">${this.formatDate(review.date)}</span>
                            </div>
                        </div>
                        <div class="review-content">
                            <p>${review.comment}</p>
                        </div>
                        <div class="review-footer">
                            <button class="helpful-btn ${userHelpfulReviews[review.id] ? 'helpful-active' : ''}" data-review-id="${review.id}">
                                <i class="fas fa-thumbs-up"></i>
                                Útil (${review.helpful + (userHelpfulReviews[review.id] ? 1 : 0)})
                            </button>
                        </div>
                    </div>
                `).join('');
            
            reviewsList.innerHTML = reviewsHtml;
        }

        // Limpiar el textarea de reseña
        const reviewTextarea = document.getElementById('reviewText');
        if (reviewTextarea) reviewTextarea.value = '';

        // Actualizar las estrellas de calificación del usuario
        const starsInput = document.querySelector('.stars-input');
        if (starsInput) {
            starsInput.innerHTML = [1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= userRating ? 'active' : ''}" data-star="${i}"></i>`).join('');
        }

        // Actualizar botón de quitar calificación
        this.updateClearRatingButton(recipeId, userRating);

        // Reconfigurar event listeners solo para el contenido actualizado
        this.setupReviewsEventListeners(recipeId);
    }

    formatDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hace 1 día';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    setupReviewsEventListeners(recipeId) {
        // Event listeners para las estrellas de calificación
        document.querySelectorAll('.stars-input .fa-star').forEach(star => {
            star.addEventListener('click', () => {
                const starValue = parseInt(star.getAttribute('data-star'));
                this.rateRecipe(recipeId, starValue);
                
                // Actualizar visualmente las estrellas
                const starsContainer = star.parentElement;
                starsContainer.querySelectorAll('.fa-star').forEach((s, index) => {
                    s.classList.toggle('active', index < starValue);
                });

                // Mostrar/ocultar botón de quitar calificación
                this.updateClearRatingButton(recipeId, starValue);
            });

            // Efecto hover para las estrellas
            star.addEventListener('mouseenter', () => {
                const starValue = parseInt(star.getAttribute('data-star'));
                const starsContainer = star.parentElement;
                starsContainer.querySelectorAll('.fa-star').forEach((s, index) => {
                    s.classList.toggle('hover', index < starValue);
                });
            });

            star.addEventListener('mouseleave', () => {
                const starsContainer = star.parentElement;
                starsContainer.querySelectorAll('.fa-star').forEach(s => {
                    s.classList.remove('hover');
                });
            });
        });

        // Event listener para quitar calificación
        const clearRatingBtn = document.querySelector('.clear-rating-btn');
        if (clearRatingBtn) {
            clearRatingBtn.addEventListener('click', () => {
                this.clearRecipeRating(recipeId);
            });
        }

        // Event listeners para botones "útil"
        document.querySelectorAll('.helpful-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const reviewId = btn.getAttribute('data-review-id');
                this.toggleHelpfulReview(reviewId, btn);
            });
        });

        // Event listener para enviar reseña
        const submitBtn = document.querySelector('.submit-review-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitUserReview(recipeId);
            });
        }
    }

    clearRecipeRating(recipeId) {
        // Eliminar calificación personal
        delete this.ratings[recipeId];
        localStorage.setItem('ratings', JSON.stringify(this.ratings));

        // Actualizar estadísticas agregadas
        const stat = this.ratingStats[recipeId];
        if (stat && stat.count > 0) {
            // Esto es una simplificación - en un sistema real necesitarías rastrear calificaciones individuales
            stat.count = Math.max(0, stat.count - 1);
            if (stat.count === 0) {
                stat.total = 0;
            }
            this.ratingStats[recipeId] = stat;
            localStorage.setItem('ratingStats', JSON.stringify(this.ratingStats));
        }

        // Actualizar la receta en memoria
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (recipe && stat) {
            recipe.calificacion = stat.count > 0 ? (stat.total / stat.count) : 0;
            recipe.resenas = stat.count;
        }

        this.showNotification('Calificación eliminada');
        
        // Actualizar solo el contenido en lugar de recargar todo el modal
        setTimeout(() => {
            this.updateReviewsContent(recipeId);
        }, 500);
    }

    updateClearRatingButton(recipeId, rating) {
        const existingBtn = document.querySelector('.clear-rating-btn');
        const ratingInput = document.querySelector('.rating-input');
        
        if (rating > 0 && !existingBtn) {
            // Agregar botón de quitar calificación
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-rating-btn';
            clearBtn.setAttribute('data-recipe-id', recipeId);
            clearBtn.innerHTML = '<i class="fas fa-times"></i> Quitar calificación';
            clearBtn.addEventListener('click', () => this.clearRecipeRating(recipeId));
            ratingInput.appendChild(clearBtn);
        }
    }

    toggleHelpfulReview(reviewId, buttonElement) {
        if (!this.currentUser) {
            this.showLoginRequiredModal('Inicia sesión para marcar reseñas como útiles');
            return;
        }

        const userHelpfulReviews = JSON.parse(localStorage.getItem('userHelpfulReviews')) || {};
        const isCurrentlyHelpful = userHelpfulReviews[reviewId];

        if (isCurrentlyHelpful) {
            // Quitar como útil
            delete userHelpfulReviews[reviewId];
            buttonElement.classList.remove('helpful-active');
            this.showNotification('Marcado como no útil');
        } else {
            // Marcar como útil
            userHelpfulReviews[reviewId] = true;
            buttonElement.classList.add('helpful-active');
            this.showNotification('¡Gracias por tu feedback!');
        }

        localStorage.setItem('userHelpfulReviews', JSON.stringify(userHelpfulReviews));

        // Actualizar el contador en el botón
        const currentText = buttonElement.textContent;
        const currentCount = parseInt(currentText.match(/\((\d+)\)/)[1]);
        const newCount = isCurrentlyHelpful ? currentCount - 1 : currentCount + 1;
        buttonElement.innerHTML = `<i class="fas fa-thumbs-up"></i> Útil (${newCount})`;
    }

    submitUserReview(recipeId) {
        if (!this.currentUser) {
            this.showLoginRequiredModal('Inicia sesión para escribir una reseña');
            return;
        }

        const reviewText = document.getElementById('reviewText').value.trim();
        const userRating = this.ratings[recipeId] || 0;

        if (!reviewText) {
            this.showNotification('Escribe un comentario para tu reseña', 'error');
            return;
        }

        if (userRating === 0) {
            this.showNotification('Califica la receta antes de escribir una reseña', 'error');
            return;
        }

        // Guardar la reseña del usuario
        const userReviews = JSON.parse(localStorage.getItem('userReviews')) || {};
        if (!userReviews[recipeId]) {
            userReviews[recipeId] = [];
        }

        const newReview = {
            id: `user_review_${recipeId}_${this.currentUser.username}_${Date.now()}`,
            userName: this.currentUser.username,
            userCountry: 'Usuario',
            userAvatar: '👤',
            rating: userRating,
            comment: reviewText,
            date: new Date(),
            helpful: 0,
            isUserReview: true
        };

        userReviews[recipeId].push(newReview);
        localStorage.setItem('userReviews', JSON.stringify(userReviews));

        this.showNotification('¡Reseña publicada exitosamente!', 'success');
        
        // En lugar de recargar todo el modal, solo actualizar el contenido de reseñas
        setTimeout(() => {
            this.updateReviewsContent(recipeId);
        }, 800);
    }

    // Cargar recetas desde JSON usando AJAX
    loadRecipesFromJSON() {
        console.log('Inicio: loadRecipesFromJSON');
        // Leer posibles recetas locales (solo como último recurso)
        const localRaw = localStorage.getItem('localRecipes');
        console.log('localRaw presente:', localRaw ? 'sí' : 'no');
        // Intentar cargar desde la API cuando exista, sino desde el JSON local
        console.log('Intentando fetch API /api/recipes');
        // Detectar si se está abriendo por file:// — esto bloqueará fetch por motivos de CORS/file access
        if (location && location.protocol === 'file:') {
            this.debugLog('Aviso: la página se abrió via file:// — fetch() no funcionará. Usa un servidor local (Apache/XAMPP o `node server.js`).');
            // intentar cargar directamente desde data/recipes.json
            return fetch('data/recipes.json')
                .then(r => r.json())
                .then(data => {
                    const arr = Array.isArray(data.recetas) ? data.recetas : [];
                    this.debugLog('data/recipes.json length (file protocol): ' + arr.length);
                    this.recipes = arr;
                    this.applyRatingStatsToRecipes();
                    this.applyRecipeOverrides();
                    this.initializeApp();
                })
                .catch(err => {
                    this.debugLog('Fallo fetch data/recipes.json en file protocol: ' + (err && err.message ? err.message : String(err)));
                    
                    // Fallback: usar recipesDatabase si está disponible
                    if (typeof recipesDatabase !== 'undefined' && Array.isArray(recipesDatabase)) {
                        this.debugLog('Usando recipesDatabase como fallback en file protocol: ' + recipesDatabase.length + ' recetas');
                        this.recipes = recipesDatabase;
                        this.applyRatingStatsToRecipes();
                        this.applyRecipeOverrides();
                        this.initializeApp();
                    } else {
                        this.recipes = [];
                        this.initializeApp();
                    }
                });
        }

        this.apiFetch('/api/recipes')
            .then(response => {
                this.debugLog('API respuesta recibida (status ' + (response && response.status) + ')');
                if (!response.ok) throw new Error('API no disponible');
                return response.json();
            })
            .then(data => {
                const apiRecipes = Array.isArray(data.recetas) ? data.recetas : [];
                this.debugLog('API recetas: ' + apiRecipes.length);
                if (apiRecipes.length > 0) {
                    this.recipes = apiRecipes;
                    this.applyRatingStatsToRecipes();
                    this.applyRecipeOverrides();
                    this.initializeApp();
                    try { localStorage.removeItem('localRecipes'); } catch(e) {}
                } else {
                    this.debugLog('API devolvió 0 recetas; probando localRaw y luego data/recipes.json');
                    // Si la API trae 0, intentar usar local primero y luego JSON
                    try {
                        if (localRaw) {
                            const parsedLocal = JSON.parse(localRaw);
                            if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
                                this.debugLog('Cargando recetas desde localRaw: ' + parsedLocal.length);
                                this.recipes = parsedLocal;
                                this.applyRatingStatsToRecipes();
                                this.applyRecipeOverrides();
                                this.initializeApp();
                                return;
                            }
                        }
                    } catch(e) { this.debugLog('Error parseando localRaw: ' + (e && e.message ? e.message : String(e))); }

                    this.debugLog('Cargando data/recipes.json como fallback');
                    return fetch('data/recipes.json')
                        .then(r => r.json())
                        .then(fallback => {
                            const arr = Array.isArray(fallback.recetas) ? fallback.recetas : [];
                            this.debugLog('data/recipes.json length: ' + arr.length);
                            this.recipes = arr;
                            this.applyRatingStatsToRecipes();
                            this.applyRecipeOverrides();
                            this.initializeApp();
                        })
                        .catch(err => {
                            this.debugLog('Error cargando data/recipes.json: ' + (err && err.message ? err.message : String(err)));
                            
                            // Fallback: usar recipesDatabase si está disponible
                            if (typeof recipesDatabase !== 'undefined' && Array.isArray(recipesDatabase)) {
                                this.debugLog('Usando recipesDatabase como fallback: ' + recipesDatabase.length + ' recetas');
                                this.recipes = recipesDatabase;
                                this.applyRatingStatsToRecipes();
                                this.applyRecipeOverrides();
                                this.initializeApp();
                            } else {
                                this.recipes = [];
                                this.initializeApp();
                            }
                        });
                }
            })
            .catch((err) => {
                this.debugLog('API fetch falló: ' + (err && err.message ? err.message : String(err)));
                // Si la API falla: intentar local y luego JSON
                try {
                    if (localRaw) {
                        const parsedLocal = JSON.parse(localRaw);
                        if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
                            this.debugLog('Cargando recetas desde localRaw en catch: ' + parsedLocal.length);
                            this.recipes = parsedLocal;
                            this.applyRatingStatsToRecipes();
                            this.applyRecipeOverrides();
                            this.initializeApp();
                            return;
                        }
                    }
                } catch(e) { this.debugLog('Error parseando localRaw en catch: ' + (e && e.message ? e.message : String(e))); }
                this.debugLog('Intentando cargar data/recipes.json en catch');
                fetch('data/recipes.json')
                    .then(response => response.json())
                    .then(data => {
                        const arr = Array.isArray(data.recetas) ? data.recetas : [];
                        this.debugLog('data/recipes.json length (catch): ' + arr.length);
                        this.recipes = arr;
                        this.applyRatingStatsToRecipes();
                        this.applyRecipeOverrides();
                        this.initializeApp();
                    })
                    .catch(error => {
                        console.error('Error cargando recetas:', error);
                        this.debugLog('Error cargando recetas final: ' + (error && error.message ? error.message : String(error)));
                        
                        // Último fallback: usar recipesDatabase si está disponible
                        if (typeof recipesDatabase !== 'undefined' && Array.isArray(recipesDatabase)) {
                            this.debugLog('Usando recipesDatabase como último fallback: ' + recipesDatabase.length + ' recetas');
                            this.recipes = recipesDatabase;
                            this.applyRatingStatsToRecipes();
                            this.applyRecipeOverrides();
                            this.initializeApp();
                        } else {
                            this.debugLog('recipesDatabase no disponible');
                            this.recipes = [];
                            this.initializeApp();
                            this.showNotification('Error al cargar las recetas ❌');
                        }
                    });
            });
    }

    applyRatingStatsToRecipes() {
        if (!this.recipes || !Array.isArray(this.recipes)) return;
        
        this.recipes.forEach((recipe, index) => {
            // Asegurar que cada receta tenga un ID válido
            if (!recipe.id || isNaN(parseInt(recipe.id))) {
                recipe.id = Date.now() + index + Math.random();
                console.warn(`⚠️ Assigned ID ${recipe.id} to recipe: ${recipe.nombre}`);
            }
            
            // Aplicar estadísticas de calificación
            const s = this.ratingStats[recipe.id];
            if (s && s.count > 0) {
                recipe.calificacion = (s.total / s.count);
                recipe.resenas = s.count;
            } else {
                // Eliminar calificaciones/pre-resenas preexistentes: dejar sin reseñas
                recipe.calificacion = 0;
                recipe.resenas = 0;
            }
        });
        
        console.log(`✅ Applied rating stats to ${this.recipes.length} recipes, all have valid IDs`);
    }

    getRecipeOverrides() {
        try {
            const raw = localStorage.getItem('recipeOverrides');
            const obj = raw ? JSON.parse(raw) : {};
            return (obj && typeof obj === 'object') ? obj : {};
        } catch (e) { return {}; }
    }

    saveRecipeOverride(id, override) {
        try {
            const all = this.getRecipeOverrides();
            all[id] = override;
            localStorage.setItem('recipeOverrides', JSON.stringify(all));
        } catch (e) { 
            console.warn('Could not save recipe override:', e);
        }
    }

    applyRecipeOverrides() {
        try {
            const overrides = this.getRecipeOverrides();
            Object.keys(overrides).forEach(id => {
                const recipe = this.recipes.find(r => String(r.id) === String(id));
                if (recipe) {
                    Object.assign(recipe, overrides[id]);
                }
            });
        } catch (e) {
            console.warn('Could not apply recipe overrides:', e);
        }
    }

    ensureAllRecipesHaveValidIds() {
        if (!this.recipes || !Array.isArray(this.recipes)) return;
        
        let repaired = 0;
        this.recipes.forEach((recipe, index) => {
            if (!recipe.id || isNaN(parseInt(recipe.id))) {
                recipe.id = Date.now() + index + Math.random();
                console.log(`🔧 Assigned ID ${recipe.id} to recipe: ${recipe.nombre}`);
                repaired++;
            }
        });
        
        if (repaired > 0) {
            console.log(`🔧 Repaired ${repaired} recipes with missing IDs`);
            
            // Guardar las recetas reparadas
            try {
                localStorage.setItem('localRecipes', JSON.stringify(this.recipes));
            } catch (e) {
                console.warn('Could not save repaired recipes to localStorage');
            }
        }
        
        return repaired;
    }

    // Función de utilidad para debug
    debugLog(message) {
        if (console && console.log) {
            console.log(`[RecipesApp] ${message}`);
        }
    }

    // Función para manejar errores de API
    async apiFetch(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            return response;
        } catch (error) {
            console.warn(`API request failed for ${url}:`, error.message);
            throw error;
        }
    }

    // Inicializar la aplicación
    initializeApp() {
        this.debugLog('Initializing application...');
        
        // Asegurar que todas las recetas tengan IDs válidos
        this.ensureAllRecipesHaveValidIds();
        
        // Generar calificaciones de bots si es necesario
        if (this.recipes.length > 0 && Object.keys(this.botRatingsGenerated).length === 0) {
            this.debugLog('Generating initial bot ratings...');
            setTimeout(() => {
                this.generateBotRatingsForAllRecipes();
            }, 1000);
        }
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Mostrar vista inicial
        this.showHome();
        
        // Actualizar UI del header
        this.updateHeaderUI();
        
        this.debugLog('Application initialized successfully');
    }

    // Función centralizada para actualizar puntos en toda la interfaz
    updatePointsDisplay() {
        if (!this.currentUser) return;
        
        const username = this.currentUser.username;
        const currentPoints = this.userPoints[username] || 0;
        
        // Actualizar badge de puntos en el header
        const pointsBadge = document.getElementById('pointsBadge');
        if (pointsBadge) {
            pointsBadge.textContent = `Puntos: ${currentPoints}`;
        }
        
        // Actualizar puntos en el panel de usuario si está abierto
        const userProfileModal = document.getElementById('recipeModal');
        if (userProfileModal && userProfileModal.classList.contains('active')) {
            // Actualizar en la pestaña de estadísticas
            const pointsStatElement = document.querySelector('.stat-card .stat-number');
            if (pointsStatElement && pointsStatElement.parentElement.querySelector('.stat-label')?.textContent === 'Puntos Ganados') {
                pointsStatElement.textContent = currentPoints;
            }
            
            // Actualizar en la pestaña de cuenta
            const accountPointsElement = document.querySelector('.account-field .field-value.highlight');
            if (accountPointsElement && accountPointsElement.textContent.includes('puntos')) {
                accountPointsElement.textContent = `${currentPoints} puntos`;
            }
        }
        
        // Actualizar en cualquier modal de subida de usuario si está abierto
        const uploadModal = document.getElementById('userUploadsModal');
        if (uploadModal && uploadModal.classList.contains('active')) {
            const uploadPointsElement = uploadModal.querySelector('.points-display');
            if (uploadPointsElement) {
                uploadPointsElement.textContent = `Puntos: ${currentPoints}`;
            }
        }
        
        console.log(`💰 Puntos actualizados en interfaz: ${currentPoints} para ${username}`);
    }

    // Función para otorgar puntos y actualizar interfaz automáticamente
    awardPoints(username, points, reason = '') {
        if (!username || !points) return;
        
        const oldPoints = this.userPoints[username] || 0;
        this.userPoints[username] = oldPoints + points;
        this.saveUserPoints();
        
        // Actualizar interfaz inmediatamente
        this.updatePointsDisplay();
        
        console.log(`💰 ${points} puntos otorgados a ${username}${reason ? ` por ${reason}` : ''} (Total: ${this.userPoints[username]})`);
        
        return this.userPoints[username];
    }

    // Inicializar actualización automática de puntos
    initializePointsAutoUpdate() {
        // Actualizar puntos cada 5 segundos para mantener sincronización
        setInterval(() => {
            if (this.currentUser) {
                this.updatePointsDisplay();
            }
        }, 5000);
        
        // También actualizar cuando la ventana recupera el foco
        window.addEventListener('focus', () => {
            if (this.currentUser) {
                setTimeout(() => {
                    this.updatePointsDisplay();
                }, 100);
            }
        });
        
        console.log('🔄 Sistema de actualización automática de puntos inicializado');
    }

    // Función de logout
    logout() {
        localStorage.removeItem('user');
        this.currentUser = null;
        this.updateHeaderUI();
        this.showNotification('Sesión cerrada correctamente');
        
        // Cerrar modales si están abiertos
        this.closeAllModals();
        
        // Volver a la vista principal
        this.showHome();
    }

    // Cargar usuario desde localStorage al iniciar
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.debugLog(`User loaded: ${this.currentUser.username} (${this.currentUser.role})`);
            }
        } catch (e) {
            console.warn('Could not load user from storage:', e);
            localStorage.removeItem('user');
        }
    }

    saveRecipeOverride(id, override) {
        try {
            const all = this.getRecipeOverrides();
            all[id] = { ...(all[id] || {}), ...override };
            localStorage.setItem('recipeOverrides', JSON.stringify(all));
        } catch (e) { 
            console.warn('Could not save recipe override:', e);
        }
    }

    applyRecipeOverrides() {
        const overrides = this.getRecipeOverrides();
        if (!overrides || !this.recipes) return;
        this.recipes = this.recipes.map(r => {
            const ov = overrides[r.id];
            if (!ov) return r;
            const merged = { ...r, ...ov };
            return merged;
        });
    }

    // Utility functions
    debugLog(msg) {
        // Debug deshabilitado - solo console.log
        console.log(msg);
    }

    initializeApp() {
        console.log(`Inicializando app con ${this.recipes ? this.recipes.length : 0} recetas`);
        
        // Verificar y reparar todas las recetas al inicio
        this.ensureAllRecipesHaveValidIds();
        
        this.setupEventListeners();
        this.restoreSession();
        this.showHome();
        this.startLiveUpdates();
        this.renderMegaMenu();
        
        // Generar calificaciones de bots para recetas que no las tengan
        setTimeout(() => {
            this.generateBotRatingsForAllRecipes();
        }, 1000); // Esperar 1 segundo después de cargar la app
    }

    ensureAllRecipesHaveValidIds() {
        if (!this.recipes || !Array.isArray(this.recipes)) return;
        
        let repaired = 0;
        this.recipes.forEach((recipe, index) => {
            if (!recipe.id || isNaN(parseInt(recipe.id))) {
                recipe.id = Date.now() + index + Math.random();
                console.warn(`🔧 Assigned ID ${recipe.id} to recipe: ${recipe.nombre}`);
                repaired++;
            }
        });
        
        if (repaired > 0) {
            console.log(`🔧 Repaired ${repaired} recipes with missing IDs`);
            // Guardar las recetas reparadas
            try {
                localStorage.setItem('localRecipes', JSON.stringify(this.recipes));
            } catch (e) {
                console.warn('Could not save repaired recipes to localStorage');
            }
        }
        
        console.log(`✅ All ${this.recipes.length} recipes have valid IDs`);
    }

    renderMegaMenu() {
        const container = document.getElementById('megaProducts');
        if (!container) return;
        container.innerHTML = '';
        const list = (this.products || []).slice(0,6);
        if (!list || list.length === 0) {
            container.innerHTML = '<div style="color:var(--gray);">No hay productos</div>';
            return;
        }
        container.innerHTML = list.map(p => `
            <a href="#" class="mega-product" data-product-id="${p.id}">
                <img src="${p.imageBase64 || p.imagen || 'img/default-product.png'}" alt="${p.name}" />
                <div class="meta"><div class="name">${p.name}</div><div class="price">${p.points} pts — Stock: ${p.stock}</div></div>
            </a>
        `).join('');

        container.querySelectorAll('.mega-product').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const id = a.getAttribute('data-product-id');
                this.purchaseProduct(parseInt(id,10));
                // cerrar tanto el menu principal como el mega
                this.closeMenu();
                const mega = document.getElementById('megaMenu');
                if (mega) { mega.classList.remove('active'); mega.setAttribute('aria-hidden','true'); }
            });
        });
    }

    async apiFetch(path, options) {
        try {
            const res = await fetch(path, options);
            if (res && res.ok) return res;
        } catch (e) { /* ignore */ }
        try {
            const res2 = await fetch('http://localhost:8081' + path, options);
            return res2;
        } catch (e2) { throw e2; }
    }

    restoreSession() {
        const raw = localStorage.getItem('user');
        if (raw) {
            try {
                const user = JSON.parse(raw);
                this.currentUser = user;
                this.updateHeaderUI();
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
    }

    updateHeaderUI() {
        const loginBtn = document.getElementById('loginBtn');
        const adminBtn = document.getElementById('adminPanelBtn');
        const achievementsBtn = document.getElementById('achievementsBtn');
        const userArea = document.getElementById('userArea');
        const pointsBadge = document.getElementById('pointsBadge');
        const uploadsRemainingBadge = document.getElementById('uploadsRemainingBadge');
        if (!userArea) return;
        userArea.innerHTML = '';
        if (this.currentUser) {
            if (loginBtn) loginBtn.style.display = 'none';
            
            // Mostrar botón de logros para usuarios logueados
            if (achievementsBtn) achievementsBtn.style.display = 'inline-flex';
            
            // Nombre del usuario
            const nameSpan = document.createElement('span');
            nameSpan.textContent = this.currentUser.username;
            nameSpan.style.fontWeight = '600';
            nameSpan.style.color = 'white';
            nameSpan.style.marginRight = '12px';
            userArea.appendChild(nameSpan);
            
            // Botón de configuración de usuario para TODOS los usuarios (incluyendo admins)
            const userConfigBtn = document.createElement('button');
            userConfigBtn.className = 'icon-btn';
            userConfigBtn.title = 'Configuración de usuario';
            userConfigBtn.style.marginRight = '8px';
            userConfigBtn.innerHTML = '<i class="fas fa-cog"></i>';
            userConfigBtn.addEventListener('click', () => this.showUserProfilePanel());
            userArea.appendChild(userConfigBtn);
            
            // Botón de logout
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'icon-btn';
            logoutBtn.title = 'Cerrar sesión';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            logoutBtn.addEventListener('click', () => this.logout());
            userArea.appendChild(logoutBtn);
            
            // mostrar puntos
            if (pointsBadge) {
                const pts = this.userPoints[this.currentUser.username] || 0;
                pointsBadge.style.display = 'inline-flex';
                pointsBadge.textContent = `Puntos: ${pts}`;
            }
            if (this.currentUser.role === 'admin') {
                if (adminBtn) adminBtn.style.display = 'inline-flex';
                // NO mostrar contador de subidas para admin
                if (uploadsRemainingBadge) uploadsRemainingBadge.style.display = 'none';
            } else {
                if (adminBtn) adminBtn.style.display = 'none';
                // Mostrar contador de subidas SOLO para usuarios normales
                if (uploadsRemainingBadge) {
                    const remaining = this.getUserDailyUploadsRemaining(this.currentUser.username);
                    uploadsRemainingBadge.style.display = 'inline-flex';
                    uploadsRemainingBadge.textContent = `Subidas: ${remaining}`;
                }
            }
            
            // Verificar y otorgar logros cuando se actualiza la UI
            this.checkAndAwardAchievements(this.currentUser.username);
            
            // Asegurar que los puntos estén actualizados
            this.updatePointsDisplay();
            
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (adminBtn) adminBtn.style.display = 'none';
            if (achievementsBtn) achievementsBtn.style.display = 'none';
            if (pointsBadge) pointsBadge.style.display = 'none';
            if (uploadsRemainingBadge) uploadsRemainingBadge.style.display = 'none';
        }
    }

    logout() {
        localStorage.removeItem('user');
        this.currentUser = null;
        this.updateHeaderUI();
        this.showNotification('Sesión cerrada');
    }

    // Actualizar ratings en tiempo real (SIN rotación automática)
    startLiveUpdates() {
        // Solo actualizar calificaciones cada 30 segundos (mantener esto)
        setInterval(() => {
            if (document.querySelectorAll('.recipe-card').length > 0) {
                this.updateRatings();
            }
        }, 30000);

        // ELIMINADO: Rotación automática de recetas
        // ELIMINADO: Cambios automáticos por tiempo
        
        console.log('✅ Sistema de actualizaciones iniciado (solo ratings, sin rotación automática)');
    }

    // Actualizar calificaciones dinámicamente
    updateRatings() {
        // No inventamos reseñas: sincronizar valores desde ratingStats
        this.recipes.forEach(recipe => {
            const s = this.ratingStats[recipe.id];
            if (s && s.count > 0) {
                recipe.calificacion = (s.total / s.count);
                recipe.resenas = s.count;
            }
        });
        // Re-render visible lists
        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            // re-display current view: if category active, keep; else show home
            if (this.currentCategory) this.filterByCategory(this.currentCategory);
            else this.showHome();
        }
    }

    setupEventListeners() {
        const hamburger = document.getElementById('hamburger');
        const menu = document.getElementById('menu');
        hamburger.addEventListener('click', () => this.toggleMenu());

        document.querySelectorAll('.menu-link[data-category], .mega-link[data-category]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.currentTarget.getAttribute('data-category');
                this.filterByCategory(category);
                this.closeMenu();
            });
        });

        // close menu when clicking outside (and allow clicks inside)
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('menu');
            const hamburger = document.getElementById('hamburger');
            if (!menu) return;
            // ignore clicks inside menu or on hamburger
            if (e.target.closest('#menu') || e.target.closest('#hamburger')) return;
            menu.classList.remove('active');
            if (hamburger) {
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded','false');
            }
        });

        document.querySelector('.logo').addEventListener('click', () => {
            this.showHome();
            this.closeMenu();
        });

        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.search(searchInput.value);
            });
            searchInput.addEventListener('input', () => this.updateSearchSuggestions(searchInput.value));
            searchInput.addEventListener('focus', () => this.updateSearchSuggestions(searchInput.value));
        }
        if (searchBtn) searchBtn.addEventListener('click', () => this.search((searchInput && searchInput.value) || ''));

        // Botón "Sorpréndeme"
        const surpriseBtn = document.getElementById('surpriseBtn');
        if (surpriseBtn) {
            surpriseBtn.addEventListener('click', () => {
                this.surpriseMe();
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar-container')) this.hideSearchSuggestions();
        });

        // DELEGACIÓN DE EVENTOS GLOBAL UNIFICADA
        document.addEventListener('click', (e) => {
            // Prevenir múltiples handlers
            if (e.defaultPrevented) return;

            // Manejar botones de reseñas con máxima prioridad
            const reviewsBtn = e.target.closest('.reviews-btn');
            if (reviewsBtn) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const recipeId = parseInt(reviewsBtn.getAttribute('data-recipe-id'));
                console.log('🔍 Reviews button clicked - Recipe ID:', recipeId, 'Button element:', reviewsBtn);
                if (recipeId && !isNaN(recipeId)) {
                    this.showRecipeReviews(recipeId);
                } else {
                    console.error('❌ Invalid recipe ID for reviews button:', recipeId);
                }
                return false;
            }

            // Manejar botones de favoritos
            const favoriteBtn = e.target.closest('.favorite-btn');
            if (favoriteBtn) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const recipeId = favoriteBtn.getAttribute('data-recipe-id');
                console.log('❤️ Favorite button clicked - Recipe ID:', recipeId);
                if (recipeId && !isNaN(parseInt(recipeId))) {
                    this.toggleFavorite(recipeId);
                    favoriteBtn.classList.toggle('active');
                } else {
                    console.error('❌ Invalid recipe ID for favorite button:', recipeId);
                }
                return false;
            }

            // Manejar clicks en tarjetas de recetas (solo si no es en botones)
            const recipeCard = e.target.closest('.recipe-card');
            if (recipeCard && !e.target.closest('.recipe-actions')) {
                const recipeId = parseInt(recipeCard.getAttribute('data-recipe-id'));
                console.log('📄 Recipe card clicked - Recipe ID:', recipeId);
                if (recipeId && !isNaN(recipeId)) {
                    const recipe = this.recipes.find(r => r.id === recipeId);
                    if (recipe) {
                        this.openRecipeDetail(recipe);
                    } else {
                        console.error('❌ Recipe not found for ID:', recipeId);
                    }
                }
                return false;
            }
        }, true); // Usar capture phase para máxima prioridad

        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
            const rm = document.getElementById('recipeModal'); 
            if (rm) rm.classList.remove('active');
            this.openRecipeId = null;
            this.showHeaderAndSearch(); // Restaurar header y barra de búsqueda
        });
        const closePlannerBtn = document.getElementById('closePlannerModal');
        if (closePlannerBtn) closePlannerBtn.addEventListener('click', () => {
            const pm = document.getElementById('plannerModal'); if (pm) pm.classList.remove('active');
            this.showHeaderAndSearch(); // Restaurar header y barra de búsqueda
        });
        const closeFavoritesBtn = document.getElementById('closeFavoritesModal');
        if (closeFavoritesBtn) closeFavoritesBtn.addEventListener('click', () => {
            const fm = document.getElementById('favoritesModal'); if (fm) fm.classList.remove('active');
            this.showHeaderAndSearch(); // Restaurar header y barra de búsqueda
        });

        const favoritesTrigger = document.getElementById('favorites-link') || document.getElementById('favoritesBtn');
        if (favoritesTrigger) favoritesTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFavorites();
            this.closeMenu();
        });

        const recommendationsTrigger = document.getElementById('recommendations-link');
        if (recommendationsTrigger) recommendationsTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRecommendations();
            this.closeMenu();
        });

        // Admin search inputs (rendered in admin panel)
        const adminRecipeSearch = document.getElementById('adminRecipeSearch');
        if (adminRecipeSearch) {
            adminRecipeSearch.addEventListener('input', () => this.loadAdminLists());
            const clearBtn = document.getElementById('clearAdminRecipeSearch');
            if (clearBtn) clearBtn.addEventListener('click', () => { adminRecipeSearch.value = ''; this.loadAdminLists(); });
        }
        const adminProductSearch = document.getElementById('adminProductSearch');
        if (adminProductSearch) {
            adminProductSearch.addEventListener('input', () => this.loadAdminLists());
            const clearP = document.getElementById('clearAdminProductSearch');
            if (clearP) clearP.addEventListener('click', () => { adminProductSearch.value = ''; this.loadAdminLists(); });
        }
        const adminUserSearch = document.getElementById('adminUserSearch');
        if (adminUserSearch) adminUserSearch.addEventListener('input', () => this.loadAdminLists());

        const plannerTrigger = document.getElementById('planner-link') || document.getElementById('plannerBtn');
        if (plannerTrigger) plannerTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.showWeeklyPlanner();
            this.closeMenu();
        });
    }

    // Configurar todos los event listeners
    setupEventListeners() {
        // Event delegation para botones de recetas
        document.addEventListener('click', (e) => {
            // Botones de reseñas
            if (e.target.closest('.reviews-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.reviews-btn');
                const recipeId = btn.getAttribute('data-recipe-id');
                if (recipeId) {
                    console.log('Reviews button clicked for recipe:', recipeId);
                    this.showRecipeReviews(recipeId);
                }
                return;
            }
            
            // Botones de favoritos
            if (e.target.closest('.favorite-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.favorite-btn');
                const recipeId = btn.getAttribute('data-recipe-id');
                if (recipeId && !isNaN(parseInt(recipeId))) {
                    this.toggleFavorite(recipeId);
                    btn.classList.toggle('active');
                } else {
                    console.error('❌ Invalid recipe ID for favorite button:', recipeId);
                }
                return;
            }
            
            // Botones de subir imagen
            if (e.target.closest('.btn-upload-image')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.btn-upload-image');
                const recipeId = parseInt(btn.getAttribute('data-recipe-id'));
                if (recipeId && !isNaN(recipeId)) {
                    this.openImageUploadForRecipe(recipeId);
                } else {
                    console.error('❌ Invalid recipe ID for upload button:', recipeId);
                }
                return;
            }
            
            // Click en tarjetas de recetas (pero no en botones)
            if (e.target.closest('.recipe-card') && !e.target.closest('button')) {
                const card = e.target.closest('.recipe-card');
                const recipeId = card.getAttribute('data-recipe-id');
                if (recipeId) {
                    const recipe = this.recipes.find(r => String(r.id) === String(recipeId));
                    if (recipe) {
                        this.openRecipeDetail(recipe);
                    }
                }
                return;
            }
        });

        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');
        const surpriseBtn = document.getElementById('surpriseBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.updateSearchSuggestions(e.target.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search(e.target.value);
                    this.hideSearchSuggestions();
                }
            });
            
            searchInput.addEventListener('blur', () => {
                setTimeout(() => this.hideSearchSuggestions(), 200);
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput ? searchInput.value : '';
                this.search(query);
                this.hideSearchSuggestions();
            });
        }

        if (surpriseBtn) {
            surpriseBtn.addEventListener('click', () => this.surpriseMe());
        }

        // Menú hamburguesa
        const hamburger = document.getElementById('hamburger');
        const megaMenu = document.getElementById('megaMenu');

        if (hamburger) {
            hamburger.addEventListener('click', () => {
                this.toggleMenu();
            });
        }

        // Enlaces del mega menú
        document.querySelectorAll('.mega-link[data-category]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.getAttribute('data-category');
                this.filterByCategory(category);
                this.closeMenu();
            });
        });

        // Logo - volver al inicio
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', () => {
                this.showHome();
                this.closeMenu();
            });
        }

        // Enlaces de navegación
        const favoritesLink = document.getElementById('favorites-link');
        if (favoritesLink) {
            favoritesLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showFavorites();
                this.closeMenu();
            });
        }

        // Cerrar modales
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    this.showHeaderAndSearch();
                }
            });
        });

        // Búsqueda en admin
        const adminRecipeSearch = document.getElementById('adminRecipeSearch');
        const adminUserSearch = document.getElementById('adminUserSearch');
        const adminProductSearch = document.getElementById('adminProductSearch');

        if (adminRecipeSearch) adminRecipeSearch.addEventListener('input', () => this.loadAdminLists());
        if (adminUserSearch) adminUserSearch.addEventListener('input', () => this.loadAdminLists());
        if (adminProductSearch) adminProductSearch.addEventListener('input', () => this.loadAdminLists());

        const plannerTrigger = document.getElementById('planner-link') || document.getElementById('plannerBtn');
        if (plannerTrigger) {
            plannerTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.showWeeklyPlanner();
                this.closeMenu();
            });
        }

        // Cerrar modales al hacer click fuera
        window.addEventListener('click', (e) => {
            const recipeModalEl = document.getElementById('recipeModal');
            if (recipeModalEl && e.target.id === 'recipeModal') {
                recipeModalEl.classList.remove('active');
                this.showHeaderAndSearch();
            }
            const plannerModalEl = document.getElementById('plannerModal');
            if (plannerModalEl && e.target.id === 'plannerModal') {
                plannerModalEl.classList.remove('active');
                this.showHeaderAndSearch();
            }
            const favoritesModalEl = document.getElementById('favoritesModal');
            if (favoritesModalEl && e.target.id === 'favoritesModal') {
                favoritesModalEl.classList.remove('active');
                this.showHeaderAndSearch();
            }
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMenu();
                ['recipeModal','plannerModal','favoritesModal','loginModal','adminPanel'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.remove('active');
                });
                this.showHeaderAndSearch();
            }
        });

        // Login / Admin handlers
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginModal());
        
        const adminPanelBtn = document.getElementById('adminPanelBtn');
        if (adminPanelBtn) adminPanelBtn.addEventListener('click', () => this.showAdminPanel());
        
        const userConfigBtn = document.getElementById('userConfigBtn');
        if (userConfigBtn) userConfigBtn.addEventListener('click', () => this.showUserProfilePanel());
        
        // Nuevas funcionalidades avanzadas
        const achievementsBtn = document.getElementById('achievementsBtn');
        if (achievementsBtn) achievementsBtn.addEventListener('click', () => this.showAchievementsModal());
        
        const advancedFiltersBtn = document.getElementById('advancedFiltersBtn');
        if (advancedFiltersBtn) advancedFiltersBtn.addEventListener('click', () => this.showAdvancedFilters());
        
        // Toggle admin key input when role changes
        const roleRadios = document.querySelectorAll('input[name="loginRole"]');
        const adminKeyWrapper = document.getElementById('adminKeyWrapper');
        if (roleRadios && adminKeyWrapper) {
            roleRadios.forEach(r => r.addEventListener('change', (e) => {
                if (e.target.value === 'admin') adminKeyWrapper.style.display = 'block';
                else adminKeyWrapper.style.display = 'none';
            }));
        }
        
        const closeLoginModal = document.getElementById('closeLoginModal');
        const loginModalEl = document.getElementById('loginModal');
        if (closeLoginModal && loginModalEl) closeLoginModal.addEventListener('click', () => {
            loginModalEl.classList.remove('active');
            this.showHeaderAndSearch();
        });
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); this.login(); });
        
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) registerBtn.addEventListener('click', () => this.register());

        const closeAdminPanel = document.getElementById('closeAdminPanel');
        if (closeAdminPanel) {
            closeAdminPanel.addEventListener('click', () => this.closeAdminPanel());
        }
        
        const submitAddRecipe = document.getElementById('submitAddRecipe');
        if (submitAddRecipe) submitAddRecipe.addEventListener('click', () => this.adminAddRecipe());
        
        const refreshRecipesBtn = document.getElementById('refreshRecipesBtn');
        if (refreshRecipesBtn) refreshRecipesBtn.addEventListener('click', () => this.loadAdminLists());
        
        const productsLink = document.getElementById('products-link');
        if (productsLink) productsLink.addEventListener('click', (e) => { e.preventDefault(); this.showProducts(); this.closeMenu(); });

        const recommendationsLink = document.getElementById('recommendations-link');
        if (recommendationsLink) recommendationsLink.addEventListener('click', (e) => { e.preventDefault(); this.showRecommendations(); this.closeMenu(); });

        const submitAddProduct = document.getElementById('submitAddProduct');
        if (submitAddProduct) submitAddProduct.addEventListener('click', () => this.adminAddProduct());
        
        const refreshProductsBtn = document.getElementById('refreshProductsBtn');
        if (refreshProductsBtn) refreshProductsBtn.addEventListener('click', () => this.loadAdminLists());
        
        const viewUploadsBtn = document.getElementById('viewUploadsBtn');
        if (viewUploadsBtn) viewUploadsBtn.addEventListener('click', () => this.openAdminUploadsView());
        
        // Tab buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab');
            this.switchAdminTab(tab);
        }));
    }

    /* ========== Productos (usuario) ========== */
    showProducts() {
        this.currentCategory = null;
        document.getElementById('sectionTitle').textContent = 'Productos';
        this.displayProducts(this.products);
    }

    displayProducts(products) {
        const grid = document.getElementById('recipesGrid');
        if (!grid) return;
        if (!products || products.length === 0) {
            grid.innerHTML = '<div class="no-recipes" style="grid-column:1 / -1;"><p>No hay productos disponibles</p></div>';
            return;
        }
        grid.innerHTML = products.map(p => this.createProductCard(p)).join('');

        // add handlers for purchase buttons
        document.querySelectorAll('.product-card').forEach((card, idx) => {
            const btn = card.querySelector('.buy-btn');
            if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); const id = parseInt(btn.getAttribute('data-product-id')); this.purchaseProduct(id); });
        });
    }

    createProductCard(p) {
        const img = p.imageBase64 || p.imagen || '';
        return `
            <div class="recipe-card product-card" data-product-id="${p.id}">
                <div class="recipe-image-container">
                    <img src="${img}" alt="${p.name}" class="recipe-image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="recipe-emoji-fallback" style="display:none; font-size: 4rem; color: var(--primary);">🛍️</div>
                </div>
                <div class="recipe-info">
                    <div class="recipe-name">${p.name}</div>
                    <div class="recipe-country" style="color:var(--gray);">Costo: ${p.points} pts — Stock: ${p.stock}</div>
                    <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
                        <button class="btn-primary buy-btn" data-product-id="${p.id}">${p.stock>0? 'Canjear' : 'Agotado'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    purchaseProduct(productId) {
        const user = this.currentUser;
        if (!user) return this.showNotification('Inicia sesión para canjear productos', 'error');
        const product = this.products.find(p => p.id === productId);
        if (!product) return this.showNotification('Producto no encontrado', 'error');
        if (product.stock <= 0) return this.showNotification('Producto agotado', 'error');
        const username = user.username;
        const balance = this.userPoints[username] || 0;
        if (balance < product.points) return this.showNotification('No tienes suficientes puntos', 'error');
        // deduct points using centralized function
        const pointsToDeduct = -product.points; // Negative to deduct
        this.awardPoints(username, pointsToDeduct, `canje de ${product.name}`);
        
        product.stock = Math.max(0, product.stock - 1);
        this.saveProducts();
        this.showNotification(`Has canjeado ${product.name} por ${product.points} pts`);
        this.showProducts();
    }

    toggleMenu() {
        const hamburger = document.getElementById('hamburger');
        const megaMenu = document.getElementById('megaMenu');
        
        if (hamburger) hamburger.classList.toggle('active');
        
        if (megaMenu) {
            const nowOpen = megaMenu.classList.toggle('active');
            megaMenu.setAttribute('aria-hidden', nowOpen ? 'false' : 'true');
            if (hamburger) hamburger.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
            
            // manage focus for accessibility
            if (nowOpen) {
                const first = megaMenu.querySelector('.mega-link, a, button');
                if (first) first.focus();
            } else {
                if (hamburger) hamburger.focus();
            }
        }
    }

    closeMenu() {
        const hamburger = document.getElementById('hamburger');
        if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
        const menu = document.getElementById('menu');
        if (menu) {
            menu.classList.remove('active');
            menu.setAttribute('aria-hidden', 'true');
        }
        // También cerrar el mega menu
        const megaMenu = document.getElementById('megaMenu');
        if (megaMenu) {
            megaMenu.classList.remove('active');
            megaMenu.setAttribute('aria-hidden', 'true');
        }
    }

    closeAllModals() {
        // Cerrar todos los modales
        const modalIds = ['recipeModal', 'plannerModal', 'favoritesModal', 'loginModal', 'adminPanel'];
        modalIds.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                modal.classList.remove('active');
            }
        });
        // Restaurar header y barra de búsqueda
        this.showHeaderAndSearch();
    }

    hideHeaderAndSearch() {
        const header = document.querySelector('.header');
        const searchBar = document.querySelector('.search-bar-container');
        const filtersBtn = document.getElementById('advancedFiltersBtn');
        
        if (header) {
            header.style.transform = 'translateY(-100%)';
            header.style.transition = 'transform 0.3s ease';
        }
        if (searchBar) {
            searchBar.style.transform = 'translateY(-100%)';
            searchBar.style.transition = 'transform 0.3s ease';
            searchBar.style.opacity = '0';
        }
        
        // Mantener visible solo el botón de filtros avanzados
        if (filtersBtn) {
            filtersBtn.style.position = 'fixed';
            filtersBtn.style.top = '2rem';
            filtersBtn.style.right = '2rem';
            filtersBtn.style.transform = 'translateY(0)';
            filtersBtn.style.opacity = '1';
            filtersBtn.style.zIndex = '1005'; // Muy por encima de todo
            filtersBtn.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
            filtersBtn.style.transition = 'all 0.3s ease';
        }
    }

    showHeaderAndSearch() {
        const header = document.querySelector('.header');
        const searchBar = document.querySelector('.search-bar-container');
        const filtersBtn = document.getElementById('advancedFiltersBtn');
        
        if (header) {
            header.style.transform = 'translateY(0)';
        }
        if (searchBar) {
            searchBar.style.transform = 'translateY(0)';
            searchBar.style.opacity = '1';
        }
        
        // Restaurar el botón de filtros a su posición original
        if (filtersBtn) {
            filtersBtn.style.position = '';
            filtersBtn.style.top = '';
            filtersBtn.style.right = '';
            filtersBtn.style.transform = '';
            filtersBtn.style.opacity = '';
            filtersBtn.style.zIndex = '';
            filtersBtn.style.boxShadow = '';
            filtersBtn.style.transition = '';
        }
    }

    showHome() {
        this.currentCategory = null;
        this.lastSearchQuery = '';
        
        // Mostrar TODAS las recetas ordenadas por preferencias del usuario
        const allRecipesPersonalized = this.getAllRecipesPersonalized();
        
        document.getElementById('sectionTitle').textContent = 'Todas las Recetas - Personalizadas para Ti';
        this.displayRecipes(allRecipesPersonalized);
        
        console.log(`🏠 Mostrando ${allRecipesPersonalized.length} recetas personalizadas`);
    }

    // Nueva función para obtener todas las recetas ordenadas por preferencias
    getAllRecipesPersonalized() {
        // Si no hay suficientes datos de preferencias, mostrar por calificación
        const totalPreferences = 
            Object.keys(this.userPreferences.favoriteCategories).length +
            Object.keys(this.userPreferences.favoriteCountries).length +
            this.userPreferences.searchHistory.length +
            this.userPreferences.viewHistory.length;

        if (totalPreferences < 3) {
            console.log('🤖 Pocas preferencias, ordenando por calificación');
            return [...this.recipes].sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
        }

        // Calcular puntuaciones para todas las recetas
        const scoredRecipes = this.recipes.map(recipe => ({
            recipe,
            score: this.calculateRecommendationScore(recipe)
        }));

        // Ordenar por puntuación (las más relevantes primero)
        const sortedRecipes = scoredRecipes
            .sort((a, b) => b.score - a.score)
            .map(item => item.recipe);

        console.log('🎯 Recetas ordenadas por preferencias del usuario');
        console.log('📊 Top 5 recomendadas:', sortedRecipes.slice(0, 5).map(r => r.nombre));
        
        return sortedRecipes;
    }

    getRandomRecipes(count) {
        const shuffled = [...this.recipes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    getRecentlyAddedRecipes(count) {
        // Simular recetas "recientes" basándose en el ID (IDs más altos = más recientes)
        const sorted = [...this.recipes].sort((a, b) => b.id - a.id);
        return sorted.slice(0, count);
    }

    getMixedRecipes(count) {
        // Mezcla de recetas bien calificadas y aleatorias
        const topRated = [...this.recipes]
            .sort((a, b) => b.calificacion - a.calificacion)
            .slice(0, Math.floor(count / 2));
        
        const remaining = this.recipes.filter(r => !topRated.includes(r));
        const randomFromRemaining = remaining
            .sort(() => Math.random() - 0.5)
            .slice(0, count - topRated.length);
        
        return [...topRated, ...randomFromRemaining].sort(() => Math.random() - 0.5);
    }

    surpriseMe() {
        // Limpiar búsqueda y categoría actual
        this.currentCategory = null;
        this.lastSearchQuery = '';
        
        // Limpiar input de búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        // Generar vista sorpresa
        const surpriseTypes = [
            {
                type: 'random',
                title: 'Recetas Aleatorias',
                getRecipes: () => this.getRandomRecipes(8)
            },
            {
                type: 'category_mix',
                title: 'Mix de Categorías',
                getRecipes: () => this.getCategoryMixRecipes(8)
            },
            {
                type: 'hidden_gems',
                title: 'Joyas Ocultas',
                getRecipes: () => this.getHiddenGemRecipes(8)
            },
            {
                type: 'world_tour',
                title: 'Tour Mundial',
                getRecipes: () => this.getWorldTourRecipes(8)
            },
            {
                type: 'quick_delicious',
                title: 'Recetas Rápidas',
                getRecipes: () => this.getQuickDeliciousRecipes(8)
            }
        ];
        
        const randomSurprise = surpriseTypes[Math.floor(Math.random() * surpriseTypes.length)];
        const recipesToShow = randomSurprise.getRecipes();
        
        document.getElementById('sectionTitle').textContent = randomSurprise.title;
        this.displayRecipes(recipesToShow);
        
        this.showSubtleNotification('🎉 ¡Sorpresa preparada!');
    }

    // Función de debug para verificar event listeners
    debugEventListeners() {
        console.log('🔧 Debugging event listeners...');
        const allReviewsBtns = document.querySelectorAll('.reviews-btn');
        const allFavoriteBtns = document.querySelectorAll('.favorite-btn');
        const allRecipeCards = document.querySelectorAll('.recipe-card');
        
        console.log(`Found ${allReviewsBtns.length} reviews buttons`);
        console.log(`Found ${allFavoriteBtns.length} favorite buttons`);
        console.log(`Found ${allRecipeCards.length} recipe cards`);
        
        // Verificar que todos tengan data-recipe-id válido
        allReviewsBtns.forEach((btn, i) => {
            const id = btn.getAttribute('data-recipe-id');
            console.log(`Reviews btn ${i}: ID = ${id}, valid = ${!isNaN(parseInt(id))}`);
        });
        
        return {
            reviewsButtons: allReviewsBtns.length,
            favoriteButtons: allFavoriteBtns.length,
            recipeCards: allRecipeCards.length
        };
    }

    getCategoryMixRecipes(count) {
        const categories = ['desayunos', 'comidas', 'cenas', 'postres', 'bebidas', 'botanas'];
        const recipesPerCategory = Math.floor(count / categories.length);
        let mixedRecipes = [];
        
        categories.forEach(category => {
            const categoryRecipes = this.recipes.filter(r => r.categorias.includes(category));
            const randomFromCategory = categoryRecipes
                .sort(() => Math.random() - 0.5)
                .slice(0, recipesPerCategory);
            mixedRecipes = [...mixedRecipes, ...randomFromCategory];
        });
        
        // Completar con recetas aleatorias si no llegamos al count
        while (mixedRecipes.length < count && mixedRecipes.length < this.recipes.length) {
            const remaining = this.recipes.filter(r => !mixedRecipes.includes(r));
            if (remaining.length > 0) {
                const randomRecipe = remaining[Math.floor(Math.random() * remaining.length)];
                mixedRecipes.push(randomRecipe);
            } else {
                break;
            }
        }
        
        return mixedRecipes.sort(() => Math.random() - 0.5).slice(0, count);
    }

    getHiddenGemRecipes(count) {
        // Recetas con pocas reseñas pero buena calificación
        const hiddenGems = this.recipes.filter(r => {
            const reviews = r.resenas || 0;
            const rating = r.calificacion || 0;
            return reviews < 5 && rating >= 3.5; // Pocas reseñas pero buena calificación
        });
        
        if (hiddenGems.length >= count) {
            return hiddenGems.sort(() => Math.random() - 0.5).slice(0, count);
        } else {
            // Si no hay suficientes, completar con recetas aleatorias
            const remaining = this.recipes.filter(r => !hiddenGems.includes(r));
            const additional = remaining.sort(() => Math.random() - 0.5).slice(0, count - hiddenGems.length);
            return [...hiddenGems, ...additional].sort(() => Math.random() - 0.5);
        }
    }

    getWorldTourRecipes(count) {
        // Agrupar por países y tomar una receta de cada país diferente
        const countriesMap = {};
        this.recipes.forEach(recipe => {
            const country = recipe.pais;
            if (!countriesMap[country]) {
                countriesMap[country] = [];
            }
            countriesMap[country].push(recipe);
        });
        
        const countries = Object.keys(countriesMap);
        let worldTourRecipes = [];
        
        // Tomar una receta aleatoria de cada país
        countries.forEach(country => {
            const countryRecipes = countriesMap[country];
            const randomRecipe = countryRecipes[Math.floor(Math.random() * countryRecipes.length)];
            worldTourRecipes.push(randomRecipe);
        });
        
        // Mezclar y tomar solo las que necesitamos
        return worldTourRecipes.sort(() => Math.random() - 0.5).slice(0, count);
    }

    getQuickDeliciousRecipes(count) {
        // Recetas rápidas (≤30 min) con buena calificación
        const quickRecipes = this.recipes.filter(r => {
            const time = parseInt(r.tiempo) || 60;
            const rating = r.calificacion || 0;
            return time <= 30 && rating >= 3.0;
        });
        
        if (quickRecipes.length >= count) {
            return quickRecipes.sort(() => Math.random() - 0.5).slice(0, count);
        } else {
            // Completar con recetas rápidas sin importar calificación
            const allQuick = this.recipes.filter(r => {
                const time = parseInt(r.tiempo) || 60;
                return time <= 30;
            });
            return allQuick.sort(() => Math.random() - 0.5).slice(0, count);
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        let filtered = this.recipes.filter(recipe => 
            recipe.categorias.includes(category)
        );
        
        const categoryNames = {
            'desayunos': 'Desayunos',
            'comidas': 'Comidas',
            'cenas': 'Cenas',
            'postres': 'Postres',
            'bebidas': 'Bebidas',
            'botanas': 'Botanas',
            'entradas': 'Entradas',
            'rapidas': 'Recetas Rápidas',
            'baratas': 'Recetas Económicas'
        };
        
        document.getElementById('sectionTitle').textContent = categoryNames[category] || category;
        this.displayRecipes(filtered);
    }

    normalizeText(s) {
        return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    levenshtein(a, b) {
        const m = a.length;
        const n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[m][n];
    }

    similarityScore(target, query) {
        const t = this.normalizeText(target);
        const q = this.normalizeText(query);
        if (!t || !q) return 0;
        if (t.includes(q)) return Math.max(0.6, 1 - Math.min(1, t.indexOf(q) / Math.max(1, t.length)));
        const tokens = t.split(/\s+/).filter(Boolean);
        let best = 0;
        for (const tok of tokens) {
            const dist = this.levenshtein(tok, q);
            const sim = 1 - dist / Math.max(tok.length, q.length);
            const boost = tok.startsWith(q) ? 0.15 : 0;
            best = Math.max(best, Math.min(1, sim + boost));
        }
        const distFull = this.levenshtein(t, q);
        const simFull = 1 - distFull / Math.max(t.length, q.length);
        return Math.max(best, simFull);
    }

    recipeSearchScore(recipe, query) {
        const nameScore = this.similarityScore(recipe.nombre || '', query);
        const countryScore = this.similarityScore(recipe.pais || '', query);
        const cats = Array.isArray(recipe.categorias) ? recipe.categorias.join(' ') : '';
        const catScore = this.similarityScore(cats, query);
        return Math.max(nameScore, countryScore, catScore);
    }

    updateSearchSuggestions(query) {
        const box = document.getElementById('searchSuggestions');
        if (!box) return;
        const q = this.normalizeText(query);
        if (!q) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }
        const scored = this.recipes.map(r => ({ r, s: this.recipeSearchScore(r, q) }))
            .filter(x => x.s >= 0.45)
            .sort((a, b) => b.s - a.s)
            .slice(0, 8);
        if (scored.length === 0) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }
        box.innerHTML = scored.map(x => `
            <div class="item" data-id="${x.r.id}">
                <i class="fas fa-utensils"></i>
                <span>${x.r.nombre}</span>
                <span class="hint">${x.r.pais}</span>
            </div>
        `).join('');
        box.style.display = 'block';
        box.querySelectorAll('.item').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.getAttribute('data-id'), 10);
                const r = this.recipes.find(x => x.id === id);
                if (r) {
                    const input = document.getElementById('searchInput');
                    input.value = r.nombre;
                    this.hideSearchSuggestions();
                    this.search(r.nombre);
                }
            });
        });
    }

    hideSearchSuggestions() {
        const box = document.getElementById('searchSuggestions');
        if (!box) return;
        box.style.display = 'none';
        box.innerHTML = '';
    }

    search(query) {
        if (!query.trim()) {
            this.showHome();
            return;
        }
        this.lastSearchQuery = query;
        
        // Actualizar historial de búsqueda
        this.updateSearchHistory(query);
        
        const scored = this.recipes.map(r => ({ r, s: this.recipeSearchScore(r, query) }))
            .filter(x => x.s >= 0.45)
            .sort((a, b) => b.s - a.s)
            .map(x => x.r);

        document.getElementById('sectionTitle').textContent = `Resultados para: "${query}" (${scored.length})`;
        this.displayRecipes(scored);
    }

    refreshCurrentView(updatedId) {
        const modalActive = document.getElementById('recipeModal') && document.getElementById('recipeModal').classList.contains('active');
        if (modalActive && updatedId) {
            const r = this.recipes.find(x => String(x.id) === String(updatedId));
            if (r) this.openRecipeDetail(r);
            return;
        }
        if (this.currentCategory) {
            this.filterByCategory(this.currentCategory);
            return;
        }
        if (this.lastSearchQuery) {
            this.search(this.lastSearchQuery);
            return;
        }
        this.showHome();
    }

    refreshCurrentViewEventListeners() {
        // Refrescar los event listeners del grid principal
        const grid = document.getElementById('recipesGrid');
        if (!grid) return;

        // Obtener las recetas actualmente mostradas
        let currentRecipes = [];
        if (this.currentCategory) {
            currentRecipes = this.recipes.filter(recipe => 
                recipe.categorias.includes(this.currentCategory)
            );
        } else if (this.lastSearchQuery) {
            const scored = this.recipes.map(r => ({ r, s: this.recipeSearchScore(r, this.lastSearchQuery) }))
                .filter(x => x.s >= 0.45)
                .sort((a, b) => b.s - a.s)
                .map(x => x.r);
            currentRecipes = scored;
        } else {
            // Vista home - mejores calificadas
            currentRecipes = [...this.recipes]
                .sort((a, b) => b.calificacion - a.calificacion)
                .slice(0, 8);
        }

        // Ya no necesitamos reconfigurar event listeners porque usamos delegación global
        console.log('Current view refreshed with', currentRecipes.length, 'recipes');
    }

    async reloadRecipesFromAPI() {
        try {
            const res = await this.apiFetch('/api/recipes');
            if (!res.ok) return;
            const data = await res.json();
            const recetas = Array.isArray(data.recetas) ? data.recetas : [];
            if (recetas.length > 0) {
                this.recipes = recetas;
                this.applyRatingStatsToRecipes();
                try { localStorage.removeItem('localRecipes'); } catch(e) {}
            }
        } catch (e) { /* ignore */ }
    }

    displayRecipes(recipes) {
        const grid = document.getElementById('recipesGrid');
        
        if (recipes.length === 0) {
            grid.innerHTML = `
                <div class="no-recipes" style="grid-column: 1 / -1;">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron recetas</p>
                </div>
            `;
            return;
        }

        // Asegurar que todas las recetas tengan IDs válidos
        const validRecipes = recipes.map(recipe => {
            if (!recipe.id || isNaN(parseInt(recipe.id))) {
                console.warn('⚠️ Recipe without valid ID found:', recipe.nombre, 'Assigning new ID');
                recipe.id = Date.now() + Math.random(); // Asignar ID único
            }
            return recipe;
        });

        grid.innerHTML = validRecipes.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // Verificación exhaustiva después de crear las tarjetas
        setTimeout(() => {
            this.verifyAllRecipeButtons();
        }, 100);
        
        console.log('✅ Recipes displayed:', validRecipes.length);
    }

    verifyAllRecipeButtons() {
        const allRecipeCards = document.querySelectorAll('.recipe-card');
        const allReviewsBtns = document.querySelectorAll('.reviews-btn');
        const allFavoriteBtns = document.querySelectorAll('.favorite-btn');
        
        console.log(`🔍 Verification: ${allRecipeCards.length} cards, ${allReviewsBtns.length} reviews buttons, ${allFavoriteBtns.length} favorite buttons`);
        
        let issuesFound = 0;
        
        allRecipeCards.forEach((card, index) => {
            const cardId = card.getAttribute('data-recipe-id');
            const reviewsBtn = card.querySelector('.reviews-btn');
            const favoriteBtn = card.querySelector('.favorite-btn');
            
            // Verificar que la tarjeta tenga ID
            if (!cardId || isNaN(parseInt(cardId))) {
                console.error(`❌ Card ${index} has invalid ID:`, cardId);
                issuesFound++;
            }
            
            // Verificar que tenga botón de reseñas
            if (!reviewsBtn) {
                console.error(`❌ Card ${index} missing reviews button`);
                issuesFound++;
            } else {
                const btnId = reviewsBtn.getAttribute('data-recipe-id');
                if (btnId !== cardId) {
                    console.error(`❌ Card ${index} reviews button ID mismatch: card=${cardId}, button=${btnId}`);
                    issuesFound++;
                }
            }
            
            // Verificar que tenga botón de favoritos
            if (!favoriteBtn) {
                console.error(`❌ Card ${index} missing favorite button`);
                issuesFound++;
            } else {
                const btnId = favoriteBtn.getAttribute('data-recipe-id');
                if (btnId !== cardId) {
                    console.error(`❌ Card ${index} favorite button ID mismatch: card=${cardId}, button=${btnId}`);
                    issuesFound++;
                }
            }
        });
        
        if (issuesFound === 0) {
            console.log('✅ All recipe buttons verified successfully!');
        } else {
            console.error(`❌ Found ${issuesFound} issues with recipe buttons`);
            // Intentar reparar automáticamente
            this.repairRecipeButtons();
        }
    }

    repairRecipeButtons() {
        console.log('🔧 Attempting to repair recipe buttons...');
        
        const allRecipeCards = document.querySelectorAll('.recipe-card');
        let repaired = 0;
        
        allRecipeCards.forEach((card, index) => {
            const cardId = card.getAttribute('data-recipe-id');
            
            if (!cardId || isNaN(parseInt(cardId))) {
                // Asignar ID único a la tarjeta
                const newId = Date.now() + index;
                card.setAttribute('data-recipe-id', newId);
                console.log(`🔧 Assigned new ID ${newId} to card ${index}`);
                repaired++;
            }
            
            // Verificar y reparar botón de reseñas
            let reviewsBtn = card.querySelector('.reviews-btn');
            if (!reviewsBtn) {
                // Crear botón de reseñas si no existe
                const actionsDiv = card.querySelector('.recipe-actions');
                if (actionsDiv) {
                    reviewsBtn = document.createElement('button');
                    reviewsBtn.className = 'reviews-btn';
                    reviewsBtn.setAttribute('data-recipe-id', cardId);
                    reviewsBtn.setAttribute('title', 'Ver reseñas');
                    reviewsBtn.innerHTML = '<i class="fas fa-comments"></i>';
                    actionsDiv.insertBefore(reviewsBtn, actionsDiv.firstChild);
                    console.log(`🔧 Created missing reviews button for card ${index}`);
                    repaired++;
                }
            } else {
                // Verificar que tenga el ID correcto
                const btnId = reviewsBtn.getAttribute('data-recipe-id');
                if (btnId !== cardId) {
                    reviewsBtn.setAttribute('data-recipe-id', cardId);
                    console.log(`🔧 Fixed reviews button ID for card ${index}`);
                    repaired++;
                }
            }
            
            // Verificar y reparar botón de favoritos
            let favoriteBtn = card.querySelector('.favorite-btn');
            if (!favoriteBtn) {
                // Crear botón de favoritos si no existe
                const actionsDiv = card.querySelector('.recipe-actions');
                if (actionsDiv) {
                    favoriteBtn = document.createElement('button');
                    favoriteBtn.className = 'favorite-btn';
                    favoriteBtn.setAttribute('data-recipe-id', cardId);
                    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                    actionsDiv.appendChild(favoriteBtn);
                    console.log(`🔧 Created missing favorite button for card ${index}`);
                    repaired++;
                }
            } else {
                // Verificar que tenga el ID correcto
                const btnId = favoriteBtn.getAttribute('data-recipe-id');
                if (btnId !== cardId) {
                    favoriteBtn.setAttribute('data-recipe-id', cardId);
                    console.log(`🔧 Fixed favorite button ID for card ${index}`);
                    repaired++;
                }
            }
        });
        
        console.log(`🔧 Repair completed: ${repaired} issues fixed`);
    }

    createRecipeCard(recipe) {
        const rating = this.ratings[recipe.id] || 0;
        // Normalizar comparación de favoritos
        const isFavorite = this.favorites.map(id => parseInt(id)).includes(parseInt(recipe.id));
        const hasReviews = recipe.resenas && recipe.resenas > 0;
        const stars = Math.round(recipe.calificacion || 0);
        const starsHtml = hasReviews ? [1,2,3,4,5].map(i => `<i class="fas fa-star ${i <= stars ? 'active' : ''}"></i>`).join('') : `<span style="color:var(--gray);font-weight:600;">Sin calificaciones</span>`;
        const ratingNumberHtml = hasReviews ? `<span class="rating-number">${recipe.calificacion.toFixed(1)}</span>` : '';
        const reviewsHtml = hasReviews ? `${recipe.resenas} reseñas` : 'Sin reseñas';

        // compute per-recipe attempt info for the current user (solo para detalle, no para tarjetas)
        let attemptInfoHtml = '';
        // Removido para no saturar las tarjetas - solo se mostrará en el detalle

        // ========== USAR CDN PARA IMÁGENES ==========
        const optimizedImageHtml = this.createOptimizedImage(
            recipe.imagen, 
            recipe.nombre, 
            {
                width: 300,
                height: 200,
                className: 'recipe-image',
                loading: 'lazy',
                fallbackEmoji: '🍽️'
            }
        );

        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <div class="recipe-image-container">
                    ${optimizedImageHtml}
                    <div class="recipe-overlay">
                        <span class="recipe-badge">
                            <i class="fas fa-clock"></i> ${recipe.tiempo} min
                        </span>
                    </div>
                </div>
                <div class="recipe-info">
                    <div class="recipe-name">${recipe.nombre}</div>
                    ${this.currentUser && this.hasActiveCompletion(this.currentUser.username, recipe.id) ? `<div style="margin-top:6px;"><span class="category-badge" style="background:var(--success);color:white;">Reto cumplido</span></div>` : ''}
                    <div class="recipe-country">
                        <i class="fas fa-map-marker-alt"></i> ${recipe.pais}
                    </div>
                    <div class="recipe-rating">
                        <div class="stars">
                            ${starsHtml}
                        </div>
                        ${ratingNumberHtml}
                    </div>
                    <div class="recipe-categories">
                        ${recipe.categorias.slice(0, 3).map(cat => 
                            `<span class="category-badge">${this.getCategoryIcon(cat)} ${this.getCategoryName(cat)}</span>`
                        ).join('')}
                    </div>
                    ${attemptInfoHtml}
                    
                    <div class="recipe-footer">
                        <span class="reviews">
                            <i class="fas fa-users"></i> ${reviewsHtml}
                        </span>
                        <div class="recipe-actions">
                            <button class="reviews-btn" data-recipe-id="${recipe.id}" title="Ver reseñas">
                                <i class="fas fa-comments"></i>
                            </button>
                            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-recipe-id="${recipe.id}">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            'desayunos': '🌅',
            'comidas': '🍽️',
            'cenas': '🌙',
            'postres': '🍰',
            'bebidas': '🥤',
            'botanas': '🍿',
            'entradas': '🥗',
            'rapidas': '⚡',
            'baratas': '💰'
        };
        return icons[category] || '🍴';
    }

    // Crear sección de subida de imagen para cada receta
    createImageUploadSection(recipe) {
        if (!this.currentUser || this.currentUser.role === 'admin') {
            return '';
        }
        
        const username = this.currentUser.username;
        const attempts = this.getUserAttemptsForRecipe(username, recipe.id);
        const canUpload = attempts < 3;
        const remaining = this.getUserDailyUploadsRemaining(username);
        const nextPoints = [10, 6, 3][attempts] || 0;
        
        // Obtener imágenes subidas para esta receta
        const userImages = this.uploads.filter(u => 
            u.username === username && 
            u.recipeId === recipe.id && 
            u.status === 'approved'
        );
        
        return `
            <div class="recipe-image-upload-section">
                <div class="upload-section-header">
                    <i class="fas fa-camera"></i>
                    <span>Subir imagen de tu preparación</span>
                </div>
                
                ${userImages.length > 0 ? `
                    <div class="user-images-gallery">
                        ${userImages.map(img => `
                            <div class="user-image-item">
                                <img src="${img.imageBase64}" alt="Preparación de ${recipe.nombre}" class="user-dish-image">
                                <div class="image-date">${new Date(img.timestamp).toLocaleDateString()}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="upload-info">
                    ${canUpload && remaining > 0 ? `
                        <div class="upload-available">
                            <span class="points-info">Si tu imagen es aceptada: <strong>${nextPoints} pts</strong> (Intento ${attempts + 1}/3)</span>
                            <button class="btn-upload-image" data-recipe-id="${recipe.id}">
                                <i class="fas fa-camera"></i> Subir Foto
                            </button>
                        </div>
                    ` : `
                        <div class="upload-unavailable">
                            ${attempts >= 3 
                                ? '<span class="no-attempts">Ya has usado tus 3 intentos para esta receta</span>'
                                : '<span class="no-uploads">Sin subidas disponibles hoy (máximo 5 por día)</span>'
                            }
                        </div>
                    `}
                </div>
                
                ${userImages.length === 0 ? `
                    <div class="no-images-message">
                        <i class="fas fa-image"></i>
                        <span>No has subido imágenes para esta receta</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getCategoryName(category) {
        const names = {
            'desayunos': 'Desayunos',
            'comidas': 'Comidas',
            'cenas': 'Cenas',
            'postres': 'Postres',
            'bebidas': 'Bebidas',
            'botanas': 'Botanas',
            'entradas': 'Entradas',
            'rapidas': 'Rápidas',
            'baratas': 'Económicas'
        };
        return names[category] || category;
    }

    openRecipeDetail(recipe) {
        this.closeAllModals(); // Cerrar otros modales primero
        this.hideHeaderAndSearch(); // Ocultar header y barra de búsqueda
        
        // Actualizar historial de visualización
        this.updateViewHistory(recipe.id);
        
        const rating = this.ratings[recipe.id] || 0;
        const isFavorite = this.favorites.includes(recipe.id);
        this.openRecipeId = recipe.id;

        const html = `
            <div class="recipe-detail">
                <div class="recipe-detail-header">
                    <div class="detail-image-container">
                        ${this.createOptimizedImage(recipe.imagen, recipe.nombre, {
                            width: 600,
                            height: 400,
                            className: 'detail-image',
                            loading: 'eager',
                            fallbackEmoji: '🍽️'
                        })}
                    </div>
                    <div class="recipe-detail-info">
                        <h2>${recipe.nombre}</h2>
                        <div class="detail-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${recipe.pais}</span>
                            <span><i class="fas fa-clock"></i> ${recipe.tiempo} min</span>
                            <span><i class="fas fa-users"></i> ${recipe.resenas} reseñas</span>
                        </div>
                        <div class="recipe-categories-detail">
                            ${recipe.categorias.map(cat => 
                                `<span class="category-badge-detail">${this.getCategoryIcon(cat)} ${this.getCategoryName(cat)}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>

                <div class="recipe-stats">
                    <div class="stat">
                        <div class="stat-icon"><i class="fas fa-star"></i></div>
                        <div class="stat-value">${recipe.calificacion.toFixed(1)}</div>
                        <div class="stat-label">Calificación</div>
                    </div>
                    <div class="stat">
                        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-value">${this.getDifficulty(recipe.tiempo).split(' ')[0]}</div>
                        <div class="stat-label">Dificultad</div>
                    </div>
                    <div class="stat">
                        <div class="stat-icon"><i class="fas fa-utensils"></i></div>
                        <div class="stat-value">${recipe.categorias.length}</div>
                        <div class="stat-label">Categorías</div>
                    </div>
                </div>

                ${recipe.ingredientes && recipe.ingredientes.length > 0 ? `
                <div class="ingredients-section">
                    <h3><i class="fas fa-list"></i> Ingredientes</h3>
                    <ul class="ingredients-list">
                        ${recipe.ingredientes.map(ing => `
                            <li class="ingredient-item">
                                <span class="ingredient-icon">${ing.icono}</span>
                                <span class="ingredient-name">${ing.nombre}</span>
                                <span class="ingredient-amount">${ing.cantidad}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : `
                <div class="ingredients-section">
                    <h3><i class="fas fa-list"></i> Ingredientes</h3>
                    <div class="empty-message">
                        <p><i class="fas fa-info-circle"></i> Los ingredientes para esta receta estarán disponibles próximamente.</p>
                    </div>
                </div>
                `}

                ${recipe.instrucciones && recipe.instrucciones.length > 0 ? `
                <div class="instructions-section">
                    <h3><i class="fas fa-clipboard-list"></i> Instrucciones</h3>
                    <ol class="instructions-list">
                        ${recipe.instrucciones.map(inst => `
                            <li class="instruction-step">${inst}</li>
                        `).join('')}
                    </ol>
                </div>
                ` : `
                <div class="instructions-section">
                    <h3><i class="fas fa-clipboard-list"></i> Instrucciones</h3>
                    <div class="empty-message">
                        <p><i class="fas fa-info-circle"></i> Las instrucciones para esta receta estarán disponibles próximamente.</p>
                    </div>
                </div>
                `}

                <div class="rating-section">
                    <h4><i class="fas fa-star"></i> Califica esta receta</h4>
                    <div class="star-rating" data-recipe-id="${recipe.id}">
                        ${[1,2,3,4,5].map(star => 
                            `<i class="fas fa-star ${star <= rating ? 'active' : ''}" data-star="${star}"></i>`
                        ).join('')}
                    </div>
                    <div class="rating-value">${recipe.resenas && recipe.resenas > 0 ? `Promedio: ${recipe.calificacion.toFixed(1)} — ${recipe.resenas} reseñas` : 'Sin reseñas aún'}</div>
                    <div class="action-buttons">
                        <button class="btn-primary ${isFavorite ? 'btn-danger' : 'btn-success'}" id="favorite-btn">
                            <i class="fas fa-heart"></i> ${isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
                        </button>
                        <button class="btn-primary btn-info" id="planner-btn">
                            <i class="fas fa-calendar-plus"></i> Agregar al Planificador
                        </button>
                    </div>
                </div>

                <div class="upload-section" style="margin-top:16px;padding-top:12px;border-top:1px dashed var(--border);">
                    <h4><i class="fas fa-image"></i> Subir imagen de tu preparación</h4>
                    <div id="uploadPointsInfo" style="margin-top:8px;font-weight:700;color:var(--secondary);"></div>
                    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                        <input type="file" id="r_imagenfile_modal" accept="image/*">
                        <button id="uploadImageBtn" class="btn-primary">Subir imagen</button>
                    </div>
                    
                    <div id="userUploadsList" style="margin-top:12px;"></div>
                </div>
            </div>
        `;

        const modalBodyEl = document.getElementById('modalBody'); if (modalBodyEl) modalBodyEl.innerHTML = html;
        const recipeModalEl = document.getElementById('recipeModal'); if (recipeModalEl) recipeModalEl.classList.add('active');

        // Render user's own uploads for this recipe (if logged in)
        this.renderUserUploadsInModal(recipe.id);

        // Mostrar puntos posibles según intento siguiente
        const ptsInfoEl = document.getElementById('uploadPointsInfo');
        if (ptsInfoEl) {
            const username = this.currentUser ? this.currentUser.username : null;
            const prevAttempts = username ? this.getUserMaxAttemptForRecipe(username, recipe.id) : 0;
            const nextAttempt = prevAttempts + 1;
            const pointsMap = {1:10,2:6,3:3};
            let infoText = '';
            if (!username) infoText = 'Inicia sesión para ver y subir imágenes';
            else if (this.hasActiveCompletion(username, recipe.id)) infoText = 'Ya completaste este reto recientemente — no obtendrás puntos hasta pasado el periodo.';
            else if (this.isBlockedForRecipe(username, recipe.id)) {
                const until = (this.blockedRecipes[username] || {})[recipe.id] || 0;
                infoText = 'No puedes obtener puntos por esta receta hasta: ' + new Date(until).toLocaleDateString();
            } else if (nextAttempt > 3) infoText = 'No quedan intentos que otorguen puntos para esta receta.';
            else infoText = `Si tu imagen es aceptada: ${pointsMap[nextAttempt] || 0} pts (Intento ${nextAttempt})`;
            ptsInfoEl.textContent = infoText;
        }

        // Event listeners
        document.querySelectorAll('.star-rating .fa-star').forEach(star => {
            star.addEventListener('click', () => {
                const starValue = parseInt(star.getAttribute('data-star'));
                this.rateRecipe(recipe.id, starValue);
                this.openRecipeDetail(recipe);
            });
        });

        const favBtn = document.getElementById('favorite-btn');
        if (favBtn) favBtn.addEventListener('click', () => {
            this.toggleFavorite(recipe.id);
            this.openRecipeDetail(recipe);
        });

        const plannerBtn = document.getElementById('planner-btn');
        if (plannerBtn) plannerBtn.addEventListener('click', () => {
            this.addToPlanner(recipe.id);
        });

        // Upload image button handler
        const uploadBtn = document.getElementById('uploadImageBtn');
        if (uploadBtn) uploadBtn.addEventListener('click', () => this.handleImageUpload(recipe.id));
    }

    // Sistema de subidas diarias para usuarios
    getUserDailyUploadsRemaining(username) {
        if (!username) return 0;
        
        const maxDaily = 5;
        const today = this.getTodayDateString();
        const userUploads = this.getUserUploadsData(username);
        
        // Verificar si necesitamos regenerar subidas (nuevo día)
        if (userUploads.lastResetDate !== today) {
            this.resetDailyUploads(username);
            return maxDaily;
        }
        
        return Math.max(0, maxDaily - userUploads.todayCount);
    }

    getUserUploadsData(username) {
        const uploadsData = JSON.parse(localStorage.getItem('userUploadsData')) || {};
        const today = this.getTodayDateString();
        
        if (!uploadsData[username]) {
            uploadsData[username] = {
                todayCount: 0,
                lastResetDate: today,
                totalUploads: []
            };
        }
        
        return uploadsData[username];
    }

    saveUserUploadsData(username, data) {
        const uploadsData = JSON.parse(localStorage.getItem('userUploadsData')) || {};
        uploadsData[username] = data;
        localStorage.setItem('userUploadsData', JSON.stringify(uploadsData));
    }

    getTodayDateString() {
        const today = new Date();
        return today.getFullYear() + '-' + 
               String(today.getMonth() + 1).padStart(2, '0') + '-' + 
               String(today.getDate()).padStart(2, '0');
    }

    resetDailyUploads(username) {
        const userData = this.getUserUploadsData(username);
        const today = this.getTodayDateString();
        
        // Regenerar una subida por día transcurrido
        const lastReset = new Date(userData.lastResetDate);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastReset) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
            userData.todayCount = Math.max(0, userData.todayCount - daysDiff);
            userData.lastResetDate = today;
            this.saveUserUploadsData(username, userData);
            
            console.log(`🔄 Regenerated ${daysDiff} uploads for user ${username}`);
        }
    }

    canUserUpload(username) {
        // Admin puede subir infinitas
        if (this.currentUser && this.currentUser.role === 'admin') {
            return { canUpload: true, reason: 'admin' };
        }
        
        // Usuario normal - verificar límite diario
        const remaining = this.getUserDailyUploadsRemaining(username);
        if (remaining > 0) {
            return { canUpload: true, remaining: remaining };
        } else {
            return { 
                canUpload: false, 
                reason: 'Se te acabaron tus cargas, regresa el siguiente día' 
            };
        }
    }

    recordUserUpload(username, uploadData) {
        // No registrar para admin
        if (this.currentUser && this.currentUser.role === 'admin') {
            return;
        }
        
        const userData = this.getUserUploadsData(username);
        userData.todayCount += 1;
        userData.totalUploads.push({
            id: uploadData.id,
            date: new Date().toISOString(),
            recipeTitle: uploadData.recipeTitle || 'Sin título'
        });
        
        this.saveUserUploadsData(username, userData);
        this.updateHeaderUI(); // Actualizar contador en header
    }

    deleteUserUpload(username, uploadId) {
        // Solo usuarios pueden borrar sus propias subidas
        if (!this.currentUser || this.currentUser.role === 'admin') {
            return false;
        }
        
        const userData = this.getUserUploadsData(username);
        const uploadIndex = userData.totalUploads.findIndex(u => u.id === uploadId);
        
        if (uploadIndex !== -1) {
            // Eliminar de la lista de subidas del usuario
            userData.totalUploads.splice(uploadIndex, 1);
            userData.todayCount = Math.max(0, userData.todayCount - 1);
            this.saveUserUploadsData(username, userData);
            
            // También eliminar de la lista global de uploads si existe
            const globalUploadIndex = this.uploads.findIndex(u => u.id === uploadId);
            if (globalUploadIndex !== -1) {
                this.uploads.splice(globalUploadIndex, 1);
                this.saveUploads();
            }
            
            this.updateHeaderUI(); // Actualizar contador en header
            return true;
        }
        
        return false;
    }

    // Obtener todas las subidas de un usuario para mostrar en su panel
    getUserUploadsList(username) {
        if (!username) return [];
        
        const userData = this.getUserUploadsData(username);
        return userData.totalUploads.map(upload => {
            // Buscar información adicional en la lista global de uploads
            const globalUpload = this.uploads.find(u => u.id === upload.id);
            return {
                ...upload,
                imageBase64: globalUpload?.imageBase64 || '',
                status: globalUpload?.status || 'uploaded',
                description: globalUpload?.description || ''
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Mostrar panel de gestión de subidas del usuario
    // Mostrar panel de perfil de usuario con pestañas
    showUserProfilePanel() {
        if (!this.currentUser) {
            this.showNotification('Debes iniciar sesión primero', 'error');
            return;
        }

        // Actualizar puntos antes de mostrar el panel
        this.updatePointsDisplay();

        const username = this.currentUser.username;
        const userUploads = this.uploads.filter(u => u.username === username);
        const userPoints = this.userPoints[username] || 0;
        const userCompletedChallenges = this.completedChallenges[username] || [];
        
        // Calcular estadísticas
        const totalApprovedUploads = userUploads.filter(u => u.status === 'approved' || u.approved === true).length;
        const totalPointsEarned = userPoints;
        
        // Categorías principales (basado en favoritos)
        const favoriteCategories = Object.entries(this.userPreferences.favoriteCategories || {})
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category, count]) => ({ category, count }));

        // Productos canjeados (simulado)
        const redeemedProducts = 0; // Por ahora 0, se puede implementar después

        // Título específico según el rol
        const panelTitle = this.currentUser.role === 'admin' ? 
            'Panel de Administrador - Perfil Personal' : 
            'Panel de Usuario';

        const html = `
            <div class="user-profile-panel">
                <div class="profile-header">
                    <div class="profile-icon">
                        <i class="fas fa-${this.currentUser.role === 'admin' ? 'crown' : 'user-circle'}"></i>
                    </div>
                    <h3><i class="fas fa-cog"></i> ${panelTitle}</h3>
                    <p class="profile-subtitle">Gestiona tu perfil y revisa tu actividad${this.currentUser.role === 'admin' ? ' personal' : ''}</p>
                </div>
                
                <!-- Pestañas del panel -->
                <div class="profile-tabs">
                    <button class="profile-tab-btn active" data-tab="uploads">
                        <i class="fas fa-images"></i> Mis Fotos
                    </button>
                    <button class="profile-tab-btn" data-tab="achievements">
                        <i class="fas fa-trophy"></i> Logros
                    </button>
                    <button class="profile-tab-btn" data-tab="stats">
                        <i class="fas fa-chart-bar"></i> Estadísticas
                    </button>
                    <button class="profile-tab-btn" data-tab="account">
                        <i class="fas fa-user"></i> Mi Cuenta
                    </button>
                </div>

                <!-- Contenido de las pestañas -->
                <div class="profile-tab-content">
                    <!-- Tab: Mis Fotos -->
                    <div class="profile-tab-panel active" id="profile-tab-uploads">
                        <div class="uploads-section">
                            <h4><i class="fas fa-camera"></i> Recetas con Fotos Subidas</h4>
                            <div class="uploads-grid">
                                ${userUploads.length > 0 ? userUploads.map(upload => `
                                    <div class="upload-card ${(upload.status === 'approved' || upload.approved) ? 'approved' : 'pending'}">
                                        <img src="${upload.imageBase64}" alt="Foto de ${upload.recipeName}" class="upload-image">
                                        <div class="upload-info">
                                            <h5>${upload.recipeName}</h5>
                                            <div class="upload-status">
                                                ${(upload.status === 'approved' || upload.approved) ? 
                                                    '<span class="status-approved"><i class="fas fa-check-circle"></i> Aprobada</span>' : 
                                                    upload.status === 'rejected' ? 
                                                    '<span class="status-rejected"><i class="fas fa-times-circle"></i> Rechazada</span>' :
                                                    '<span class="status-pending"><i class="fas fa-clock"></i> Pendiente</span>'
                                                }
                                                }
                                            </div>
                                            <div class="upload-date">${new Date(upload.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                `).join('') : '<div class="empty-message"><i class="fas fa-camera"></i><p>Aún no has subido fotos de recetas</p></div>'}
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Logros -->
                    <div class="profile-tab-panel" id="profile-tab-achievements">
                        <div class="achievements-section">
                            <h4><i class="fas fa-trophy"></i> Logros Completados</h4>
                            <div class="achievements-grid">
                                ${userCompletedChallenges.length > 0 ? userCompletedChallenges.map(challenge => `
                                    <div class="achievement-card completed">
                                        <div class="achievement-icon">
                                            <i class="fas fa-medal"></i>
                                        </div>
                                        <div class="achievement-info">
                                            <h5>Receta Completada</h5>
                                            <p>Preparaste: ${this.getRecipeById(challenge.recipeId)?.nombre || 'Receta desconocida'}</p>
                                            <div class="achievement-date">${new Date(challenge.completedAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                `).join('') : ''}
                                
                                <!-- Logros por puntos -->
                                ${totalPointsEarned >= 10 ? `
                                    <div class="achievement-card completed">
                                        <div class="achievement-icon">
                                            <i class="fas fa-star"></i>
                                        </div>
                                        <div class="achievement-info">
                                            <h5>Primer Cocinero</h5>
                                            <p>Ganaste tus primeros 10 puntos</p>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${totalPointsEarned >= 50 ? `
                                    <div class="achievement-card completed">
                                        <div class="achievement-icon">
                                            <i class="fas fa-crown"></i>
                                        </div>
                                        <div class="achievement-info">
                                            <h5>Chef Experimentado</h5>
                                            <p>Acumulaste 50 puntos</p>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${totalApprovedUploads >= 5 ? `
                                    <div class="achievement-card completed">
                                        <div class="achievement-icon">
                                            <i class="fas fa-camera"></i>
                                        </div>
                                        <div class="achievement-info">
                                            <h5>Fotógrafo Culinario</h5>
                                            <p>5 fotos aprobadas</p>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${userCompletedChallenges.length === 0 && totalPointsEarned < 10 && totalApprovedUploads < 5 ? 
                                    '<div class="empty-message"><i class="fas fa-trophy"></i><p>Completa recetas y sube fotos para desbloquear logros</p></div>' : ''
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Estadísticas -->
                    <div class="profile-tab-panel" id="profile-tab-stats">
                        <div class="stats-section">
                            <h4><i class="fas fa-chart-bar"></i> Mis Estadísticas</h4>
                            
                            <div class="stats-cards">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-coins"></i>
                                    </div>
                                    <div class="stat-info">
                                        <div class="stat-number">${totalPointsEarned}</div>
                                        <div class="stat-label">Puntos Ganados</div>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-images"></i>
                                    </div>
                                    <div class="stat-info">
                                        <div class="stat-number">${totalApprovedUploads}</div>
                                        <div class="stat-label">Fotos Aprobadas</div>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-gift"></i>
                                    </div>
                                    <div class="stat-info">
                                        <div class="stat-number">${redeemedProducts}</div>
                                        <div class="stat-label">Productos Canjeados</div>
                                    </div>
                                </div>
                            </div>

                            <div class="categories-section">
                                <h5><i class="fas fa-utensils"></i> Categorías Principales</h5>
                                <div class="categories-list">
                                    ${favoriteCategories.length > 0 ? favoriteCategories.map(cat => `
                                        <div class="category-item">
                                            <span class="category-name">${this.getCategoryDisplayName(cat.category)}</span>
                                            <span class="category-count">${cat.count.toFixed(1)} recetas</span>
                                        </div>
                                    `).join('') : '<div class="empty-message">Explora más recetas para ver tus categorías favoritas</div>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Mi Cuenta -->
                    <div class="profile-tab-panel" id="profile-tab-account">
                        <div class="account-section">
                            <h4><i class="fas fa-user"></i> Información de la Cuenta</h4>
                            
                            <div class="account-info">
                                <div class="account-field">
                                    <label><i class="fas fa-user"></i> Nombre de Usuario</label>
                                    <div class="field-value">${username}</div>
                                </div>
                                
                                <div class="account-field">
                                    <label><i class="fas fa-coins"></i> Puntos Actuales</label>
                                    <div class="field-value highlight">${userPoints} puntos</div>
                                </div>
                                
                                <div class="account-field">
                                    <label><i class="fas fa-check-circle"></i> Fotos Aprobadas</label>
                                    <div class="field-value">${totalApprovedUploads} aprobaciones</div>
                                </div>
                                
                                <div class="account-field">
                                    <label><i class="fas fa-calendar"></i> Miembro desde</label>
                                    <div class="field-value">${new Date().toLocaleDateString()}</div>
                                </div>
                                
                                <div class="account-field">
                                    <label><i class="fas fa-heart"></i> Recetas Favoritas</label>
                                    <div class="field-value">${this.favorites.length} favoritos</div>
                                </div>
                                
                                <div class="account-field">
                                    <label><i class="fas fa-trophy"></i> Logros Desbloqueados</label>
                                    <div class="field-value">${userCompletedChallenges.length + (totalPointsEarned >= 10 ? 1 : 0) + (totalPointsEarned >= 50 ? 1 : 0) + (totalApprovedUploads >= 5 ? 1 : 0)} logros</div>
                                </div>
                            </div>
                            
                            <div class="account-actions">
                                <button class="btn-secondary" onclick="app.exportUserData()">
                                    <i class="fas fa-download"></i> Exportar Datos
                                </button>
                                <button class="btn-warning" onclick="app.resetUserProgress()">
                                    <i class="fas fa-refresh"></i> Reiniciar Progreso
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Mostrar en el modal existente
        const modalBodyEl = document.getElementById('modalBody');
        if (modalBodyEl) modalBodyEl.innerHTML = html;
        
        const recipeModalEl = document.getElementById('recipeModal');
        if (recipeModalEl) recipeModalEl.classList.add('active');
        
        // Configurar event listeners para las pestañas
        setTimeout(() => {
            this.setupProfileTabListeners();
        }, 100);
    }

    // Confirmar eliminación de subida del usuario
    confirmDeleteUserUpload(uploadId) {
        const upload = this.getUserUploadsList(this.currentUser.username).find(u => u.id === uploadId);
        if (!upload) {
            this.showNotification('Subida no encontrada', 'error');
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar "${upload.recipeTitle}"?\n\nEsto recuperará 1 subida disponible para hoy.`)) {
            const success = this.deleteUserUpload(this.currentUser.username, uploadId);
            if (success) {
                this.showNotification('Receta eliminada correctamente. +1 subida disponible', 'success');
                this.showUserUploadsPanel(); // Refrescar la vista
            } else {
                this.showNotification('Error al eliminar la receta', 'error');
            }
        }
    }

    // Uploads helpers
    saveUploads() { localStorage.setItem('uploads', JSON.stringify(this.uploads)); }
    saveUserPoints() { localStorage.setItem('userPoints', JSON.stringify(this.userPoints)); }
    saveCompletedChallenges() { localStorage.setItem('completedChallenges', JSON.stringify(this.completedChallenges)); }
    saveBlockedRecipes() { localStorage.setItem('blockedRecipes', JSON.stringify(this.blockedRecipes)); }

    userDailyUploadCount(username) {
        const dayAgo = Date.now() - 24*60*60*1000;
        return this.uploads.filter(u => u.username === username && u.createdAt >= dayAgo).length;
    }

    getUserMaxAttemptForRecipe(username, recipeId) {
        const userUploads = this.uploads.filter(u => u.username === username && u.recipeId === recipeId);
        if (userUploads.length === 0) return 0;
        return Math.max(...userUploads.map(u => u.attemptNumber || 1));
    }

    hasActiveCompletion(username, recipeId) {
        const list = (this.completedChallenges[username] || []);
        const now = Date.now();
        const fourMonths = 120*24*60*60*1000; // ~120 days
        return list.some(entry => entry.recipeId === recipeId && (now - (entry.completedAt || 0)) < fourMonths);
    }

    isBlockedForRecipe(username, recipeId) {
        const userBlocks = this.blockedRecipes[username] || {};
        const until = userBlocks[recipeId] || 0;
        return until > Date.now();
    }

    async handleImageUpload(recipeId) {
        const user = this.currentUser;
        if (!user) return this.showNotification('Debes iniciar sesión para subir imágenes', 'error');
        const username = user.username;
        // check daily limit (max 5 per day global)
        if (this.userDailyUploadCount(username) >= 5) return this.showNotification('Has alcanzado el límite de 5 imágenes por día', 'error');
        // check attempts for this recipe
        const prevAttempts = this.getUserMaxAttemptForRecipe(username, recipeId);
        // check blocked status (due to 3 denials or recent completion)
        const blockedForUser = (this.blockedRecipes[username] && this.blockedRecipes[username][recipeId]) || 0;
        const now = Date.now();
        if (blockedForUser && blockedForUser > now) return this.showNotification('Ya no puedes obtener puntos por esta receta hasta: ' + new Date(blockedForUser).toLocaleDateString(), 'error');
        if (prevAttempts >= 3) return this.showNotification('Has agotado los 3 intentos para esta receta', 'error');

        const fileInput = document.getElementById('r_imagenfile_modal');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) return this.showNotification('Selecciona una imagen antes de subir', 'error');
        const file = fileInput.files[0];
        const imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });

        const newUpload = {
            id: 'u_' + Date.now() + '_' + Math.floor(Math.random()*1000),
            recipeId: recipeId,
            username: username,
            imageBase64: imageBase64,
            status: 'pending',
            attemptNumber: prevAttempts + 1,
            createdAt: Date.now()
        };
        this.uploads.push(newUpload);
        this.saveUploads();
        this.showNotification('Imagen subida y pendiente de revisión');
        this.renderUserUploadsInModal(recipeId);
    }

    renderUserUploadsInModal(recipeId) {
        const user = this.currentUser;
        const container = document.getElementById('userUploadsList');
        if (!container) return;
        container.innerHTML = '';
        if (!user) { container.innerHTML = '<div class="empty-message">Inicia sesión para subir imágenes</div>'; return; }
        const username = user.username;
        const myUploads = this.uploads.filter(u => u.username === username && u.recipeId === recipeId).sort((a,b)=>b.createdAt-a.createdAt);
        if (myUploads.length === 0) { container.innerHTML = '<div class="empty-message">No has subido imágenes para esta receta</div>'; return; }
        container.innerHTML = myUploads.map(u => `
            <div style="display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--border);">
                <img src="${u.imageBase64}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;"/>
                <div style="flex:1;"><strong>Intento ${u.attemptNumber}</strong><div style="font-size:0.9rem;color:var(--gray);">Estado: ${u.status}</div></div>
            </div>
        `).join('');
    }

    // Admin: view uploads
    openAdminUploadsView() {
        if (!this.currentUser || this.currentUser.role !== 'admin') return this.showNotification('Acceso denegado', 'error');
        // build modal content showing pending uploads
        const pending = this.uploads.filter(u => u.status === 'pending').sort((a,b)=>b.createdAt-a.createdAt);
        let html = `<div style="max-width:900px;">`;
        html += '<h3>Imágenes pendientes</h3>';
        if (pending.length === 0) html += '<div class="empty-message">No hay imágenes pendientes</div>';
        pending.forEach(u => {
            const recipe = this.recipes.find(r => r.id === u.recipeId) || {nombre: 'Receta desconocida'};
            html += `
                <div style="display:flex;gap:12px;align-items:flex-start;padding:12px;border-bottom:1px solid var(--border);">
                    <img src="${u.imageBase64}" style="width:140px;height:100px;object-fit:cover;border-radius:8px;"/>
                    <div style="flex:1;"><strong>${recipe.nombre}</strong><div style="color:var(--gray);">Usuario: ${u.username} — Intento ${u.attemptNumber}</div></div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <button class="btn-success" data-upload-id="${u.id}">Aceptar</button>
                        <button class="btn-danger" data-upload-id="${u.id}">Denegar</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        const modal = document.getElementById('recipeModal');
        const original = (document.getElementById('modalBody') ? document.getElementById('modalBody').innerHTML : '');
        const modalBodyEl_short = document.getElementById('modalBody'); if (modalBodyEl_short) modalBodyEl_short.innerHTML = html;
        modal.classList.add('active');

        // wire buttons
        document.querySelectorAll('[data-upload-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-upload-id');
                if (btn.classList.contains('btn-success')) this.adminAcceptUpload(id).then(()=>this.openAdminUploadsView());
                else if (btn.classList.contains('btn-danger')) this.adminDenyUpload(id).then(()=>this.openAdminUploadsView());
            });
        });
    }

    // Admin: view uploads for a specific user
    openAdminUploadsForUser(username) {
        if (!this.currentUser || this.currentUser.role !== 'admin') return this.showNotification('Acceso denegado', 'error');
        const userUploads = this.uploads.filter(u => u.username === username).sort((a,b)=>b.createdAt-a.createdAt);
        let html = `<div style="max-width:900px;">`;
        html += `<h3>Imágenes de ${username}</h3>`;
        if (userUploads.length === 0) html += '<div class="empty-message">No hay imágenes para este usuario</div>';
        userUploads.forEach(u => {
            const recipe = this.recipes.find(r => String(r.id) === String(u.recipeId)) || {nombre: 'Receta desconocida'};
            html += `
                <div style="display:flex;gap:12px;align-items:flex-start;padding:12px;border-bottom:1px solid var(--border);">
                    <img src="${u.imageBase64}" style="width:140px;height:100px;object-fit:cover;border-radius:8px;"/>
                    <div style="flex:1;"><strong>${recipe.nombre}</strong><div style="color:var(--gray);">Estado: ${u.status} — Intento ${u.attemptNumber}</div></div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${u.status === 'pending' ? `<button class="btn-success" data-upload-id="${u.id}">Aceptar</button><button class="btn-danger" data-upload-id="${u.id}">Denegar</button>` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        const modal = document.getElementById('recipeModal');
        const modalBodyUp = document.getElementById('modalBody');
        if (modalBodyUp) modalBodyUp.innerHTML = html;
        if (modal) modal.classList.add('active');

        // wire buttons
        document.querySelectorAll('[data-upload-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-upload-id');
                if (btn.classList.contains('btn-success')) this.adminAcceptUpload(id).then(()=>this.openAdminUploadsForUser(username));
                else if (btn.classList.contains('btn-danger')) this.adminDenyUpload(id).then(()=>this.openAdminUploadsForUser(username));
            });
        });
    }

    async adminAcceptUpload(uploadId) {
        const up = this.uploads.find(u => u.id === uploadId);
        if (!up) return this.showNotification('Subida no encontrada', 'error');
        
        // Cambiar estado a approved (no accepted)
        up.status = 'approved';
        up.approved = true; // Para compatibilidad con el panel de usuario
        
        this.saveUploads();
        
        // award points only if user hasn't completed recently
        const attempt = up.attemptNumber || 1;
        const pointsMap = {1:10, 2:6, 3:3};
        let pts = 0;
        if (!this.hasActiveCompletion(up.username, up.recipeId)) {
            pts = pointsMap[attempt] || 0;
            
            // Otorgar puntos usando la función centralizada
            this.awardPoints(up.username, pts, `foto aprobada (intento ${attempt})`);
            
            // mark completed with timestamp
            if (!this.completedChallenges[up.username]) this.completedChallenges[up.username] = [];
            this.completedChallenges[up.username].push({ recipeId: up.recipeId, completedAt: Date.now() });
            this.saveCompletedChallenges();
            this.showNotification(`Aceptada. ${up.username} recibe ${pts} puntos.`);
        } else {
            this.showNotification(`Aceptada. ${up.username} ya completó este reto recientemente — no se otorgan puntos.`);
        }
        this.updateHeaderUI();
    }

    async adminDenyUpload(uploadId) {
        const up = this.uploads.find(u => u.id === uploadId);
        if (!up) return this.showNotification('Subida no encontrada', 'error');
        
        // Cambiar estado a rejected
        up.status = 'rejected';
        up.approved = false;
        
        this.saveUploads();
        this.showNotification(`Imagen de ${up.username} rechazada`);
        this.updateHeaderUI();
    }

    // Abrir panel de gestión de usuario específico
    openAdminUserManagement(username) {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.showNotification('Acceso denegado', 'error');
            return;
        }

        const userData = this.getUserUploadsData(username);
        const remaining = this.getUserDailyUploadsRemaining(username);
        const totalUploads = this.uploads.filter(u => u.username === username).length;
        const pendingUploads = this.uploads.filter(u => u.username === username && u.status === 'pending').length;

        const html = `
            <div class="user-management-panel">
                <h3><i class="fas fa-user-cog"></i> Gestión de Usuario: ${username}</h3>
                
                <div class="user-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-images"></i></div>
                        <div class="stat-info">
                            <div class="stat-number">${totalUploads}</div>
                            <div class="stat-label">Total subidas</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <div class="stat-number">${pendingUploads}</div>
                            <div class="stat-label">Pendientes</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-upload"></i></div>
                        <div class="stat-info">
                            <div class="stat-number">${remaining}</div>
                            <div class="stat-label">Disponibles hoy</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-star"></i></div>
                        <div class="stat-info">
                            <div class="stat-number">${this.userPoints[username] || 0}</div>
                            <div class="stat-label">Puntos totales</div>
                        </div>
                    </div>
                </div>

                <div class="management-actions">
                    <h4>Acciones de administración</h4>
                    <div class="action-buttons">
                        <button class="btn-info" onclick="app.openAdminUploadsForUser('${username}')">
                            <i class="fas fa-images"></i> Ver todas las imágenes
                        </button>
                        <button class="btn-warning" onclick="app.resetUserDailyUploads('${username}')">
                            <i class="fas fa-refresh"></i> Resetear subidas diarias
                        </button>
                        <button class="btn-success" onclick="app.grantBonusPoints('${username}')">
                            <i class="fas fa-gift"></i> Otorgar puntos bonus
                        </button>
                        <button class="btn-danger" onclick="app.blockUserTemporarily('${username}')">
                            <i class="fas fa-ban"></i> Bloquear temporalmente
                        </button>
                    </div>
                </div>

                <div class="user-activity">
                    <h4>Actividad reciente</h4>
                    <div class="activity-list">
                        ${this.getUserRecentActivity(username)}
                    </div>
                </div>
            </div>
        `;

        const modal = document.getElementById('recipeModal');
        const modalBody = document.getElementById('modalBody');
        if (modalBody) modalBody.innerHTML = html;
        if (modal) modal.classList.add('active');
    }

    // Obtener actividad reciente del usuario
    getUserRecentActivity(username) {
        const userUploads = this.uploads
            .filter(u => u.username === username)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 10);

        if (userUploads.length === 0) {
            return '<div class="no-activity">No hay actividad reciente</div>';
        }

        return userUploads.map(upload => {
            const recipe = this.recipes.find(r => r.id === upload.recipeId);
            const recipeName = recipe ? recipe.nombre : 'Receta desconocida';
            const date = new Date(upload.createdAt).toLocaleDateString('es-ES');
            const statusIcon = upload.status === 'accepted' ? '✅' : 
                             upload.status === 'denied' ? '❌' : '⏳';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${statusIcon}</div>
                    <div class="activity-info">
                        <div class="activity-title">Subió imagen de "${recipeName}"</div>
                        <div class="activity-date">${date} - Estado: ${upload.status}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Resetear subidas diarias de un usuario
    resetUserDailyUploads(username) {
        if (!confirm(`¿Resetear las subidas diarias de ${username}? Esto le dará 5 subidas disponibles.`)) {
            return;
        }

        const userData = this.getUserUploadsData(username);
        userData.todayCount = 0;
        userData.lastResetDate = this.getTodayDateString();
        this.saveUserUploadsData(username, userData);

        this.showNotification(`Subidas diarias reseteadas para ${username}`, 'success');
        this.openAdminUserManagement(username); // Refrescar la vista
    }

    // Otorgar puntos bonus a un usuario
    grantBonusPoints(username) {
        const points = prompt(`¿Cuántos puntos bonus otorgar a ${username}?`, '50');
        if (!points || isNaN(parseInt(points))) return;

        const bonusPoints = parseInt(points);
        
        // Otorgar puntos usando la función centralizada
        this.awardPoints(username, bonusPoints, 'bonus del administrador');

        this.showNotification(`${bonusPoints} puntos bonus otorgados a ${username}`, 'success');
        this.openAdminUserManagement(username); // Refrescar la vista
    }

    // Bloquear usuario temporalmente
    blockUserTemporarily(username) {
        const days = prompt(`¿Por cuántos días bloquear a ${username}?`, '7');
        if (!days || isNaN(parseInt(days))) return;

        const blockDays = parseInt(days);
        const blockUntil = Date.now() + (blockDays * 24 * 60 * 60 * 1000);

        // Bloquear para todas las recetas
        if (!this.blockedRecipes[username]) {
            this.blockedRecipes[username] = {};
        }

        this.recipes.forEach(recipe => {
            this.blockedRecipes[username][recipe.id] = blockUntil;
        });

        this.saveBlockedRecipes();
        this.showNotification(`${username} bloqueado por ${blockDays} días`, 'warning');
        this.openAdminUserManagement(username); // Refrescar la vista
    }

    getDifficulty(time) {
        if (time <= 15) return "Muy fácil";
        if (time <= 30) return "Fácil";
        if (time <= 60) return "Moderada";
        return "Difícil";
    }

    rateRecipe(recipeId, rating) {
        // Guardar la calificación personal y actualizar estadísticas agregadas
        const prev = this.ratings[recipeId] || null;
        this.ratings[recipeId] = rating;
        localStorage.setItem('ratings', JSON.stringify(this.ratings));

        // Actualizar ratingStats: mantener total y count
        const stat = this.ratingStats[recipeId] || { count: 0, total: 0 };
        if (prev !== null) {
            // reemplazar el valor anterior por el nuevo
            stat.total = stat.total - prev + rating;
        } else {
            stat.count = (stat.count || 0) + 1;
            stat.total = (stat.total || 0) + rating;
        }
        this.ratingStats[recipeId] = stat;
        localStorage.setItem('ratingStats', JSON.stringify(this.ratingStats));

        // Aplicar a la receta en memoria
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (recipe) {
            recipe.calificacion = stat.total / stat.count;
            recipe.resenas = stat.count;
        }

        this.showNotification(`Receta calificada con ${rating}/5 ⭐`);
        
        // Verificar logros relacionados con calificaciones
        if (this.currentUser) {
            this.checkAndAwardAchievements(this.currentUser.username);
        }
    }

    toggleFavorite(recipeId) {
        // Normalizar el ID a número para consistencia
        const normalizedId = parseInt(recipeId);
        if (isNaN(normalizedId)) {
            console.error('❌ Invalid recipe ID for favorite:', recipeId);
            return;
        }
        
        // Asegurar que todos los IDs en favoritos sean números
        this.favorites = this.favorites.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        const index = this.favorites.indexOf(normalizedId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showNotification('Eliminado de favoritos ❌');
        } else {
            this.favorites.push(normalizedId);
            this.showNotification('Agregado a favoritos ❤️');
            // Actualizar preferencias cuando se agrega a favoritos
            this.updateFavoritePreferences(normalizedId);
            
            // Verificar logros relacionados con favoritos
            if (this.currentUser) {
                this.checkAndAwardAchievements(this.currentUser.username);
            }
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        console.log('🔧 Favorites updated:', this.favorites);
    }

    showFavorites() {
        this.closeAllModals(); // Cerrar otros modales primero
        this.hideHeaderAndSearch(); // Ocultar header y barra de búsqueda
        
        // Normalizar IDs de favoritos para consistencia
        this.favorites = this.favorites.map(id => parseInt(id)).filter(id => !isNaN(id));
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        const favoriteRecipes = this.recipes.filter(r => this.favorites.includes(parseInt(r.id)));
        
        console.log('🔍 Showing favorites:', {
            favoritesArray: this.favorites,
            foundRecipes: favoriteRecipes.length,
            recipeIds: favoriteRecipes.map(r => r.id)
        });
        
        const content = `
            <div class="favorites-container">
                <h3><i class="fas fa-heart"></i> Mis Favoritos (${favoriteRecipes.length})</h3>
                <div class="favorites-grid" id="favoritesGrid">
                    ${favoriteRecipes.length === 0 
                        ? '<div class="empty-message">No tienes favoritos aún. ¡Agrega algunos!</div>' 
                        : favoriteRecipes.map(r => this.createRecipeCard(r)).join('')}
                </div>
            </div>
        `;

        const favoritesContentEl = document.getElementById('favoritesContent');
        if (favoritesContentEl) favoritesContentEl.innerHTML = content;
        const favoritesModalEl = document.getElementById('favoritesModal');
        if (favoritesModalEl) favoritesModalEl.classList.add('active');

        // Ya no necesitamos event listeners específicos porque usamos delegación global
        console.log('Favorites displayed:', favoriteRecipes.length);
    }

    showWeeklyPlanner() {
        this.closeAllModals(); // Cerrar otros modales primero
        this.hideHeaderAndSearch(); // Ocultar header y barra de búsqueda
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        let html = '<div class="planner-container"><h3><i class="fas fa-calendar-alt"></i> Planificador Semanal</h3><div class="week-grid">';
        
        days.forEach((day, index) => {
            const dayKey = `day${index}`;
            const recipes = this.weeklyPlan[dayKey] || [];
            
            html += `
                <div class="day-card">
                    <div class="day-header">${day}</div>
                    <ul class="day-recipes" data-day="${dayKey}">
                        ${recipes.map((recipeId, recipeIndex) => {
                            const recipe = this.recipes.find(r => r.id === recipeId);
                            return recipe ? `
                                <li class="day-recipe-item">
                                    <span class="day-recipe-name">${recipe.nombre}</span>
                                    <button class="remove-recipe-btn" data-index="${recipeIndex}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </li>
                            ` : '';
                        }).join('')}
                    </ul>
                    <button class="btn-add-recipe" data-day="${dayKey}">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
            `;
        });
        
        html += '</div></div>';
        const plannerContentEl = document.getElementById('plannerContent');
        if (plannerContentEl) plannerContentEl.innerHTML = html;
        const plannerModalEl = document.getElementById('plannerModal');
        if (plannerModalEl) plannerModalEl.classList.add('active');

        document.querySelectorAll('.remove-recipe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget || btn;
                const dayEl = button.closest('.day-card') ? button.closest('.day-card').querySelector('.day-recipes') : null;
                const day = dayEl ? dayEl.getAttribute('data-day') : null;
                const indexAttr = button.getAttribute('data-index');
                const index = indexAttr ? parseInt(indexAttr) : null;
                if (day && index !== null) {
                    this.removeFromPlanner(day, index);
                    this.showWeeklyPlanner();
                }
            });
        });

        document.querySelectorAll('.btn-add-recipe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget || btn;
                const day = button.getAttribute('data-day');
                if (day) this.selectRecipeForPlanner(day);
            });
        });
    }

    addToPlanner(recipeId) {
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const recipe = this.recipes.find(r => r.id === recipeId);
        
        let html = '<div class="planner-selector"><h4>Selecciona un día para: <strong>' + recipe.nombre + '</strong></h4>';
        html += '<div class="days-selector">';
        
        days.forEach((day, index) => {
            const dayKey = `day${index}`;
            html += `
                <button class="day-btn" data-day="${dayKey}">
                    <i class="fas fa-plus"></i><br>${day}
                </button>
            `;
        });
        
        html += '</div></div>';
        
        const modal = document.getElementById('recipeModal');
        const originalContent = (document.getElementById('modalBody') ? document.getElementById('modalBody').innerHTML : '');
        const modalBodyEl_day = document.getElementById('modalBody'); if (modalBodyEl_day) modalBodyEl_day.innerHTML = html;

        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const day = btn.getAttribute('data-day');
                if (!this.weeklyPlan[day]) this.weeklyPlan[day] = [];
                this.weeklyPlan[day].push(recipeId);
                localStorage.setItem('weeklyPlan', JSON.stringify(this.weeklyPlan));
                this.showNotification(`Agregado al ${day} ✓`);
                const modalBodyEl_restore = document.getElementById('modalBody'); if (modalBodyEl_restore) modalBodyEl_restore.innerHTML = originalContent;
                if (modal) modal.classList.remove('active');
            });
        });
    }

    selectRecipeForPlanner(day) {
        const recipeSelect = prompt('Escribe el nombre de la receta:');
        if (!recipeSelect) return;

        const recipe = this.recipes.find(r => 
            r.nombre.toLowerCase().includes(recipeSelect.toLowerCase())
        );

        if (recipe) {
            if (!this.weeklyPlan[day]) this.weeklyPlan[day] = [];
            this.weeklyPlan[day].push(recipe.id);
            localStorage.setItem('weeklyPlan', JSON.stringify(this.weeklyPlan));
            this.showNotification(`${recipe.nombre} agregado ✓`);
            this.showWeeklyPlanner();
        } else {
            this.showNotification('Receta no encontrada ❌');
        }
    }

    removeFromPlanner(day, index) {
        if (this.weeklyPlan[day]) {
            this.weeklyPlan[day].splice(index, 1);
            localStorage.setItem('weeklyPlan', JSON.stringify(this.weeklyPlan));
            this.showNotification('Receta removida ✓');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'info' ? 'info-circle' : 'check-circle';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    showLoginRequiredModal(message) {
        // Crear modal temporal para mostrar mensaje de login requerido
        const modal = document.createElement('div');
        modal.className = 'modal login-required-modal';
        modal.style.zIndex = '16000'; // Más alto que otros modales
        
        modal.innerHTML = `
            <div class="modal-content modal-small">
                <button class="modal-close" onclick="this.closest('.modal').remove(); app.showHeaderAndSearch();">&times;</button>
                <div class="login-required-content">
                    <div class="login-required-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3>Acceso Restringido</h3>
                    <p>${message}</p>
                    <div class="login-required-actions">
                        <button class="btn-primary" onclick="this.closest('.modal').remove(); app.showLoginModal();">
                            <i class="fas fa-sign-in-alt"></i>
                            Iniciar Sesión
                        </button>
                        <button class="btn-secondary" onclick="this.closest('.modal').remove(); app.showHeaderAndSearch();">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.hideHeaderAndSearch();
        
        // Mostrar modal con animación
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.showHeaderAndSearch();
            }
        });
    }

    showSubtleNotification(message) {
        // Notificación más sutil para rotaciones automáticas
        const notification = document.createElement('div');
        notification.className = 'notification notification-subtle';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(255, 122, 80, 0.95);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 25px rgba(255, 122, 80, 0.3);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 400);
        }, 3000);
    }

    /* ----------------- Authentication & Admin ----------------- */
    showLoginModal() {
        this.hideHeaderAndSearch(); // Ocultar header y barra de búsqueda
        const modal = document.getElementById('loginModal');
        if (modal) modal.classList.add('active');
    }

    async login() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        try {
            const res = await this.apiFetch('/api/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!data.ok) {
                // intentar fallback local
                const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
                const found = localUsers.find(u => u.username === username && u.password === password);
                if (found) {
                    localStorage.setItem('user', JSON.stringify(found));
                    this.currentUser = found;
                    this.updateHeaderUI();
                    const modal = document.getElementById('loginModal'); if (modal) modal.classList.remove('active');
                    this.showHeaderAndSearch(); // Restaurar header y barra de búsqueda
                    this.showNotification(`Bienvenido ${found.username} (local)`);
                    
                    // Otorgar logro de primer login
                    this.awardFirstLoginAchievement(found.username);
                    
                    if (found.role === 'admin') {
                        this.showAdminPanel();
                    } else {
                        // Mostrar ventana informativa para usuarios normales
                        this.showUserWelcomeModal();
                    }
                    return;
                }
                this.showNotification('Credenciales inválidas', 'error');
                return;
            }
            // guardar sesión y actualizar UI con el usuario actual
            localStorage.setItem('user', JSON.stringify(data.user));
            this.currentUser = data.user;
            this.updateHeaderUI();
            const modal = document.getElementById('loginModal');
            if (modal) modal.classList.remove('active');
            this.showHeaderAndSearch(); // Restaurar header y barra de búsqueda
            this.showNotification(`Bienvenido ${data.user.username}`);
            
            // Otorgar logro de primer login
            this.awardFirstLoginAchievement(data.user.username);
            
            if (data.user.role === 'admin') {
                this.showAdminPanel();
            } else {
                // Mostrar ventana informativa para usuarios normales
                this.showUserWelcomeModal();
            }
        } catch (err) {
            console.error(err);
            // intentar login local si falla la API
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            const found = localUsers.find(u => u.username === username && u.password === password);
            if (found) {
                localStorage.setItem('user', JSON.stringify(found));
                this.currentUser = found;
                this.updateHeaderUI();
                const modal = document.getElementById('loginModal'); if (modal) modal.classList.remove('active');
                this.showHeaderAndSearch(); // Restaurar header y barra de búsqueda
                this.showNotification(`Bienvenido ${found.username} (local)`);
                
                // Otorgar logro de primer login
                this.awardFirstLoginAchievement(found.username);
                
                if (found.role === 'admin') {
                    this.showAdminPanel();
                } else {
                    // Mostrar ventana informativa para usuarios normales
                    this.showUserWelcomeModal();
                }
                return;
            }
            this.showNotification('Error de login', 'error');
        }
    }

    async register() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const roleInput = document.querySelector('input[name="loginRole"]:checked');
        const role = roleInput ? roleInput.value : 'user';
        if (!username || !password) return this.showNotification('Completa usuario y contraseña', 'error');
        const payload = { username, password, role };
        if (role === 'admin') {
            const adminKey = document.getElementById('loginAdminKey').value || '';
            payload.adminKey = adminKey.trim();
        }
        try {
            const res = await this.apiFetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!data.ok) return this.showNotification(data.error || 'Error registro', 'error');
            this.showNotification('Registro exitoso. Ya puedes entrar.');
        } catch (err) {
            console.error(err);
            // fallback local: guardar usuario en localUsers
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            if (localUsers.find(u => u.username === username)) return this.showNotification('Usuario ya registrado (local)', 'error');
            const newUser = { username, password, role };
            localUsers.push(newUser);
            localStorage.setItem('localUsers', JSON.stringify(localUsers));
            this.showNotification('Usuario registrado (local). Ya puedes iniciar sesión.');
        }
    }

    showUploadRecipeModal() {
        // Funcionalidad eliminada - Panel de subida de fotos deshabilitado
        this.showNotification('Función de subida de fotos no disponible', 'info');
    }

    // Nueva función para actualizar el contenido del panel de imágenes (ELIMINADA)
    updateUserImagePanelContent() {
        // Funcionalidad eliminada
        console.log('Panel de imágenes deshabilitado');
    }

    // Configurar event listeners para subida de imágenes
    setupImageUploadEventListeners() {
        console.log('🔧 Setting up image upload event listeners');
        
        // Búsqueda de recetas
        const recipeSearchInput = document.getElementById('recipeSearchInput');
        if (recipeSearchInput) {
            recipeSearchInput.addEventListener('input', (e) => {
                this.searchRecipesForUpload(e.target.value);
            });
        }
        
        // Subida de imagen
        const dishImageInput = document.getElementById('dishImageInput');
        if (dishImageInput) {
            dishImageInput.addEventListener('change', (e) => {
                this.handleDishImageSelection(e);
            });
        }
        
        // Botón de enviar
        const submitBtn = document.getElementById('submitDishImage');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitDishImage();
            });
        }
        
        // Botón de cancelar
        const cancelBtn = document.getElementById('cancelUpload');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelImageUpload();
            });
        }
        
        // Cambiar receta
        const changeRecipeBtn = document.getElementById('changeRecipeBtn');
        if (changeRecipeBtn) {
            changeRecipeBtn.addEventListener('click', () => {
                this.showRecipeSelector();
            });
        }
        
        // Tabs del panel
        document.querySelectorAll('.user-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.switchUserTab(tab);
            });
        });
        
        console.log('✅ Image upload event listeners configured');
    }

    // ========== FUNCIONES PARA SUBIDA DE IMÁGENES DE PLATILLOS ==========
    
    // Buscar recetas para subir imagen
    searchRecipesForUpload(query) {
        const resultsContainer = document.getElementById('recipeSearchResults');
        if (!resultsContainer) return;
        
        if (!query || query.trim().length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }
        
        // Filtrar recetas que coincidan con la búsqueda
        const matchingRecipes = this.recipes.filter(recipe => 
            recipe.nombre.toLowerCase().includes(query.toLowerCase()) ||
            recipe.pais.toLowerCase().includes(query.toLowerCase()) ||
            recipe.categorias.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 8); // Máximo 8 resultados
        
        if (matchingRecipes.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No se encontraron recetas</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        
        const html = matchingRecipes.map(recipe => {
            const attempts = this.getUserAttemptsForRecipe(this.currentUser.username, recipe.id);
            const canUpload = attempts < 3;
            const nextPoints = [10, 6, 3][attempts] || 0;
            
            return `
                <div class="recipe-search-result ${!canUpload ? 'disabled' : ''}" data-recipe-id="${recipe.id}">
                    <img src="${recipe.imagen}" alt="${recipe.nombre}" class="result-image">
                    <div class="result-info">
                        <h4>${recipe.nombre}</h4>
                        <p><i class="fas fa-map-marker-alt"></i> ${recipe.pais}</p>
                        <div class="result-attempts">
                            ${canUpload 
                                ? `<span class="attempts-available">Intento ${attempts + 1}/3 - ${nextPoints} pts</span>`
                                : `<span class="attempts-exhausted">Sin intentos disponibles</span>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
        
        // Agregar event listeners a los resultados
        resultsContainer.querySelectorAll('.recipe-search-result:not(.disabled)').forEach(result => {
            result.addEventListener('click', () => {
                const recipeId = parseInt(result.getAttribute('data-recipe-id'));
                this.selectRecipeForUpload(recipeId);
            });
        });
    }
    
    // Seleccionar receta para subir imagen
    selectRecipeForUpload(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        // Verificar que el usuario pueda subir para esta receta
        const attempts = this.getUserAttemptsForRecipe(this.currentUser.username, recipeId);
        if (attempts >= 3) {
            this.showNotification('Ya has agotado los 3 intentos para esta receta', 'error');
            return;
        }
        
        // Mostrar receta seleccionada
        const selectedDisplay = document.getElementById('selectedRecipeDisplay');
        const imageSection = document.getElementById('imageUploadSection');
        const searchContainer = document.querySelector('.recipe-search-container');
        
        if (selectedDisplay && imageSection) {
            // Actualizar información de la receta seleccionada
            document.getElementById('selectedRecipeImage').src = recipe.imagen;
            document.getElementById('selectedRecipeName').textContent = recipe.nombre;
            document.getElementById('selectedRecipeCountry').textContent = `📍 ${recipe.pais}`;
            
            const nextPoints = [10, 6, 3][attempts] || 0;
            document.getElementById('selectedRecipeAttempts').innerHTML = `
                <span class="attempt-info">Intento ${attempts + 1}/3 - ${nextPoints} puntos</span>
            `;
            
            // Mostrar secciones apropiadas
            selectedDisplay.style.display = 'block';
            imageSection.style.display = 'block';
            if (searchContainer) searchContainer.style.display = 'none';
            
            // Guardar receta seleccionada
            this.selectedRecipeForUpload = recipe;
            
            // Limpiar búsqueda
            const searchInput = document.getElementById('recipeSearchInput');
            const searchResults = document.getElementById('recipeSearchResults');
            if (searchInput) searchInput.value = '';
            if (searchResults) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
            }
        }
    }
    
    // Mostrar selector de recetas
    showRecipeSelector() {
        const selectedDisplay = document.getElementById('selectedRecipeDisplay');
        const imageSection = document.getElementById('imageUploadSection');
        const searchContainer = document.querySelector('.recipe-search-container');
        
        if (selectedDisplay) selectedDisplay.style.display = 'none';
        if (imageSection) imageSection.style.display = 'none';
        if (searchContainer) searchContainer.style.display = 'block';
        
        this.selectedRecipeForUpload = null;
        this.clearImageUpload();
    }
    
    // Manejar selección de imagen
    handleDishImageSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validar archivo
        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }
        
        // Lista expandida de formatos soportados
        const supportedFormats = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'image/bmp', 'image/tiff', 'image/svg+xml', 'image/avif', 
            'image/heic', 'image/heif'
        ];
        
        if (!supportedFormats.includes(file.type)) {
            console.warn(`⚠️ Formato ${file.type} puede tener compatibilidad limitada`);
            // Permitir el archivo pero mostrar advertencia
            this.showNotification(`Formato ${file.type.split('/')[1].toUpperCase()} detectado. Se convertirá automáticamente para mejor compatibilidad.`, 'warning');
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.showNotification('La imagen debe ser menor a 5MB', 'error');
            return;
        }
        
        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imageUploadPreview');
            if (preview) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                    <p>Imagen seleccionada: ${file.name}</p>
                `;
            }
            
            // Habilitar botón de envío
            const submitBtn = document.getElementById('submitDishImage');
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
        
        this.selectedImageFile = file;
    }
    
    // Enviar imagen del platillo
    async submitDishImage() {
        if (!this.selectedRecipeForUpload || !this.selectedImageFile) {
            this.showNotification('Selecciona una receta y una imagen', 'error');
            return;
        }
        
        const username = this.currentUser.username;
        const remaining = this.getUserDailyUploadsRemaining(username);
        
        if (remaining <= 0) {
            this.showNotification('Has agotado tus 5 subidas diarias', 'error');
            return;
        }
        
        // Convertir imagen a base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageBase64 = e.target.result;
            
            // Crear objeto de subida
            const upload = {
                id: Date.now(),
                username: username,
                recipeId: this.selectedRecipeForUpload.id,
                recipeName: this.selectedRecipeForUpload.nombre,
                imageBase64: imageBase64,
                timestamp: Date.now(),
                status: 'pending',
                approved: false // Para compatibilidad
            };
            
            // Guardar en uploads
            this.uploads.push(upload);
            this.saveUploads();
            
            // Actualizar datos del usuario (pasar el objeto upload completo)
            this.recordUserUpload(username, {
                id: upload.id,
                recipeTitle: upload.recipeName
            });
            
            // Actualizar UI
            this.updateHeaderUI();
            
            this.showNotification('¡Imagen enviada! Será revisada por los administradores', 'success');
            
            // Limpiar formulario
            this.clearImageUpload();
            this.showRecipeSelector();
            
            // Actualizar estadísticas
            this.updateImageUploadStats();
        };
        
        reader.readAsDataURL(this.selectedImageFile);
    }
    
    // Cancelar subida de imagen
    cancelImageUpload() {
        this.clearImageUpload();
        this.showRecipeSelector();
    }
    
    // Limpiar subida de imagen
    clearImageUpload() {
        const imageInput = document.getElementById('dishImageInput');
        const preview = document.getElementById('imageUploadPreview');
        const submitBtn = document.getElementById('submitDishImage');
        
        if (imageInput) imageInput.value = '';
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-camera"></i>
                <p>Haz clic para subir la foto de tu platillo</p>
                <small>PNG, JPG hasta 5MB</small>
            `;
        }
        if (submitBtn) submitBtn.disabled = true;
        
        this.selectedImageFile = null;
    }
    
    // Obtener intentos del usuario para una receta específica
    getUserAttemptsForRecipe(username, recipeId) {
        const userUploads = this.uploads.filter(upload => 
            upload.username === username && 
            upload.recipeId === recipeId
        );
        return userUploads.length;
    }
    
    // Actualizar estadísticas de subida de imágenes
    updateImageUploadStats() {
        const username = this.currentUser.username;
        const remaining = this.getUserDailyUploadsRemaining(username);
        const totalPoints = this.userPoints[username] || 0;
        const totalUploads = this.uploads.filter(u => u.username === username).length;
        const approvedUploads = this.uploads.filter(u => u.username === username && (u.status === 'approved' || u.approved === true)).length;
        
        // Actualizar badge en header
        const uploadsRemainingBadge = document.getElementById('uploadsRemainingBadge');
        if (uploadsRemainingBadge) {
            uploadsRemainingBadge.textContent = `Subidas: ${remaining}`;
        }
        
        // Actualizar puntos en header
        const pointsBadge = document.getElementById('pointsBadge');
        if (pointsBadge) {
            pointsBadge.textContent = `Puntos: ${totalPoints}`;
        }
        
        console.log('📊 Updated image upload stats:', {
            username,
            remaining,
            totalPoints,
            totalUploads,
            approvedUploads
        });
    }
    
    // Cambiar tab del panel de usuario
    switchUserTab(tabName) {
        // Ocultar todos los contenidos
        document.querySelectorAll('.user-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Desactivar todos los botones
        document.querySelectorAll('.user-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar contenido seleccionado
        const targetContent = document.getElementById(`user-tab-${tabName}`);
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetContent) targetContent.style.display = 'block';
        if (targetBtn) targetBtn.classList.add('active');
        
        // Cargar contenido específico del tab
        if (tabName === 'my-uploads') {
            this.loadUserUploads();
        } else if (tabName === 'stats') {
            this.loadUserStats();
        }
    }
    
    // Cargar fotos subidas por el usuario
    loadUserUploads() {
        const container = document.getElementById('userUploadsContent');
        if (!container) return;
        
        const username = this.currentUser.username;
        const userUploads = this.uploads.filter(u => u.username === username);
        
        if (userUploads.length === 0) {
            container.innerHTML = `
                <div class="empty-uploads">
                    <i class="fas fa-camera"></i>
                    <h3>Aún no has subido fotos</h3>
                    <p>¡Comparte fotos de tus platillos terminados y gana puntos!</p>
                </div>
            `;
            return;
        }
        
        const html = userUploads.map(upload => {
            const recipe = this.recipes.find(r => r.id === upload.recipeId);
            const statusIcon = {
                'pending': '<i class="fas fa-clock" style="color: #f39c12;"></i>',
                'approved': '<i class="fas fa-check-circle" style="color: #27ae60;"></i>',
                'rejected': '<i class="fas fa-times-circle" style="color: #e74c3c;"></i>'
            };
            
            return `
                <div class="upload-item">
                    <img src="${upload.imageBase64}" alt="${upload.recipeName}" class="upload-image">
                    <div class="upload-info">
                        <h4>${upload.recipeName}</h4>
                        <p><i class="fas fa-calendar"></i> ${new Date(upload.timestamp).toLocaleDateString()}</p>
                        <div class="upload-status">
                            ${statusIcon[upload.status]} ${upload.status === 'pending' ? 'Pendiente' : upload.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="uploads-grid">
                ${html}
            </div>
        `;
    }
    
    // Cargar estadísticas del usuario
    loadUserStats() {
        const container = document.getElementById('userStatsContent');
        if (!container) return;
        
        const username = this.currentUser.username;
        const totalPoints = this.userPoints[username] || 0;
        const totalUploads = this.uploads.filter(u => u.username === username).length;
        const approvedUploads = this.uploads.filter(u => u.username === username && (u.status === 'approved' || u.approved === true)).length;
        const pendingUploads = this.uploads.filter(u => u.username === username && u.status === 'pending').length;
        const remaining = this.getUserDailyUploadsRemaining(username);
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-coins"></i></div>
                    <div class="stat-info">
                        <div class="stat-number">${totalPoints}</div>
                        <div class="stat-label">Puntos Totales</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-camera"></i></div>
                    <div class="stat-info">
                        <div class="stat-number">${totalUploads}</div>
                        <div class="stat-label">Fotos Subidas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info">
                        <div class="stat-number">${approvedUploads}</div>
                        <div class="stat-label">Fotos Aprobadas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-info">
                        <div class="stat-number">${pendingUploads}</div>
                        <div class="stat-label">Pendientes</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-upload"></i></div>
                    <div class="stat-info">
                        <div class="stat-number">${remaining}</div>
                        <div class="stat-label">Subidas Restantes Hoy</div>
                    </div>
                </div>
            </div>
        `;
    }

    debugFormState() {
        console.log('🔍 === DEBUGGING FORM STATE ===');
        
        const elements = {
            modal: document.getElementById('uploadRecipeModal'),
            form: document.getElementById('userRecipeForm'),
            title: document.getElementById('userRecipeTitle'),
            category: document.getElementById('userRecipeCategory'),
            ingredients: document.getElementById('userRecipeIngredients'),
            instructions: document.getElementById('userRecipeInstructions'),
            submitBtn: document.getElementById('submitRecipe'),
            skipBtn: document.getElementById('skipUpload')
        };
        
        Object.entries(elements).forEach(([name, element]) => {
            if (element) {
                console.log(`✅ ${name}:`, {
                    found: true,
                    visible: element.offsetParent !== null,
                    value: element.value || 'N/A',
                    disabled: element.disabled || false
                });
            } else {
                console.error(`❌ ${name}: NOT FOUND`);
            }
        });
        
        // Verificar si el tab correcto está activo
        const activeTab = document.querySelector('.user-tab-content:not([style*="display: none"])');
        console.log('🔍 Active tab:', activeTab ? activeTab.id : 'NONE');
        
        // Verificar event listeners
        const form = document.getElementById('userRecipeForm');
        if (form) {
            console.log('🔍 Form event listeners attached:', !!this.handleFormSubmit);
        }
    }

    updateUserPanelContent() {
        console.log('🔍 updateUserPanelContent called');
        
        // Inicializar uploads si no existe
        if (!this.uploads) {
            console.log('🔍 Initializing uploads array');
            this.uploads = [];
        }
        
        console.log('🔍 Current uploads:', this.uploads.length);
        
        // Actualizar estadísticas del usuario
        this.updateUserStats();
        
        // Cargar recetas del usuario
        this.loadUserRecipes();
        
        // Mostrar tab por defecto
        this.switchUserTab('upload');
    }

    switchUserTab(tabName) {
        // Actualizar botones de tabs
        document.querySelectorAll('.user-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        
        // Mostrar/ocultar contenido de tabs
        document.querySelectorAll('.user-tab-content').forEach(content => {
            content.style.display = content.id === `user-tab-${tabName}` ? 'block' : 'none';
        });
        
        // Cargar contenido específico del tab
        if (tabName === 'my-recipes') {
            this.loadUserRecipes();
        } else if (tabName === 'stats') {
            this.updateUserStats();
        }
    }

    loadUserRecipes() {
        const userRecipes = this.uploads.filter(upload => 
            upload.username === this.currentUser.username
        );
        
        const listContainer = document.getElementById('userRecipesList');
        if (!listContainer) return;
        
        if (userRecipes.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h4>Aún no has subido ninguna receta</h4>
                    <p>¡Comparte tus creaciones culinarias con la comunidad!</p>
                    <button class="btn-primary" onclick="app.switchUserTab('upload')">
                        <i class="fas fa-plus"></i> Subir mi primera receta
                    </button>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = userRecipes.map(recipe => `
            <div class="user-recipe-item" data-recipe-id="${recipe.id}">
                <img src="${recipe.images && recipe.images[0] ? recipe.images[0] : 'img/default-recipe.svg'}" 
                     alt="${recipe.title}" class="user-recipe-image">
                <div class="user-recipe-info">
                    <div class="user-recipe-name">${recipe.title}</div>
                    <div class="user-recipe-meta">
                        ${recipe.category ? `📂 ${recipe.category}` : ''} 
                        ${recipe.country ? `🌍 ${recipe.country}` : ''}
                        ${recipe.time ? `⏱️ ${recipe.time} min` : ''}
                    </div>
                    <span class="user-recipe-status status-${recipe.status || 'pending'}">
                        ${this.getStatusText(recipe.status || 'pending')}
                    </span>
                </div>
                <div class="user-recipe-actions">
                    <button class="btn-edit-user-recipe" data-recipe-id="${recipe.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete-user-recipe" data-recipe-id="${recipe.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners para los botones
        document.querySelectorAll('.btn-edit-user-recipe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recipeId = e.target.closest('button').getAttribute('data-recipe-id');
                this.editUserRecipe(recipeId);
            });
        });
        
        document.querySelectorAll('.btn-delete-user-recipe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recipeId = e.target.closest('button').getAttribute('data-recipe-id');
                this.deleteUserRecipe(recipeId);
            });
        });
        
        // Actualizar contador
        const countElement = document.getElementById('userRecipesCount');
        if (countElement) {
            countElement.textContent = `${userRecipes.length} receta${userRecipes.length !== 1 ? 's' : ''}`;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '⏳ Pendiente',
            'approved': '✅ Aprobada',
            'rejected': '❌ Rechazada'
        };
        return statusMap[status] || '⏳ Pendiente';
    }

    editUserRecipe(recipeId) {
        const recipe = this.uploads.find(upload => 
            upload.id === recipeId && upload.username === this.currentUser.username
        );
        
        if (!recipe) {
            this.showNotification('Receta no encontrada', 'error');
            return;
        }
        
        // Cambiar al tab de subida
        this.switchUserTab('upload');
        
        // Llenar el formulario con los datos existentes
        document.getElementById('userRecipeTitle').value = recipe.title || '';
        document.getElementById('userRecipeCountry').value = recipe.country || '';
        document.getElementById('userRecipeTime').value = recipe.time || '';
        document.getElementById('userRecipeCategory').value = recipe.category || '';
        document.getElementById('userRecipeDescription').value = recipe.description || '';
        document.getElementById('userRecipeIngredients').value = recipe.ingredients || '';
        document.getElementById('userRecipeInstructions').value = recipe.instructions || '';
        
        // Mostrar imágenes existentes
        if (recipe.images && recipe.images.length > 0) {
            const uploadedImagesContainer = document.getElementById('uploadedImages');
            if (uploadedImagesContainer) {
                uploadedImagesContainer.innerHTML = recipe.images.map((img, index) => `
                    <div class="uploaded-image">
                        <img src="${img}" alt="Imagen ${index + 1}">
                        <button class="remove-image" data-index="${index}">×</button>
                    </div>
                `).join('');
            }
        }
        
        // Marcar como edición
        this.editingRecipeId = recipeId;
        
        // Cambiar texto del botón
        const submitBtn = document.getElementById('submitRecipe');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar receta';
        }
        
        this.showNotification('Receta cargada para edición', 'info');
    }

    deleteUserRecipe(recipeId) {
        const recipe = this.uploads.find(upload => 
            upload.id === recipeId && upload.username === this.currentUser.username
        );
        
        if (!recipe) {
            this.showNotification('Receta no encontrada', 'error');
            return;
        }
        
        if (!confirm(`¿Estás seguro de que quieres eliminar "${recipe.title}"?`)) {
            return;
        }
        
        // Eliminar de la lista de uploads
        this.uploads = this.uploads.filter(upload => upload.id !== recipeId);
        localStorage.setItem('uploads', JSON.stringify(this.uploads));
        
        // Recargar la lista
        this.loadUserRecipes();
        this.updateUserStats();
        
        this.showNotification('Receta eliminada exitosamente', 'success');
    }

    updateUserStats() {
        if (!this.currentUser) return;
        
        const userRecipes = this.uploads.filter(upload => 
            upload.username === this.currentUser.username
        );
        
        const totalRecipes = userRecipes.length;
        const totalPoints = this.userPoints[this.currentUser.username] || 0;
        const totalFavorites = this.favorites.length;
        const uploadsRemaining = this.getUserDailyUploadsRemaining(this.currentUser.username);
        
        // Actualizar elementos del DOM
        const elements = {
            'totalRecipesUploaded': totalRecipes,
            'totalPointsEarned': totalPoints,
            'totalFavorites': totalFavorites,
            'uploadsRemaining': uploadsRemaining,
            'userRecipesCount': `${totalRecipes} receta${totalRecipes !== 1 ? 's' : ''}`,
            'userTotalPoints': `${totalPoints} puntos ganados`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    setupUserPanelEventListeners() {
        // Limpiar event listeners previos para evitar duplicados
        this.removeUserPanelEventListeners();
        
        // Event listeners para tabs
        document.querySelectorAll('.user-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.closest('button').getAttribute('data-tab');
                this.switchUserTab(tab);
            });
        });

        // Event listeners para el formulario
        const form = document.getElementById('userRecipeForm');
        if (form) {
            // Remover listener previo si existe
            form.removeEventListener('submit', this.handleFormSubmit);
            
            // Crear función bound para poder removerla después
            this.handleFormSubmit = (e) => {
                e.preventDefault();
                console.log('🔍 Form submitted, calling submitUserRecipe...');
                this.submitUserRecipe();
            };
            
            form.addEventListener('submit', this.handleFormSubmit);
        }

        // Event listeners para subida de imágenes
        this.setupImageUploadListeners();

        // Event listeners para cerrar modal
        const closeBtn = document.getElementById('closeUploadModal');
        const skipBtn = document.getElementById('skipUpload');

        if (closeBtn) {
            closeBtn.removeEventListener('click', this.handleCloseModal);
            this.handleCloseModal = () => this.closeUserPanel();
            closeBtn.addEventListener('click', this.handleCloseModal);
        }

        if (skipBtn) {
            skipBtn.removeEventListener('click', this.handleSkipUpload);
            this.handleSkipUpload = () => this.closeUserPanel();
            skipBtn.addEventListener('click', this.handleSkipUpload);
        }
    }

    removeUserPanelEventListeners() {
        // Remover event listeners previos para evitar duplicados
        const form = document.getElementById('userRecipeForm');
        if (form && this.handleFormSubmit) {
            form.removeEventListener('submit', this.handleFormSubmit);
        }
        
        const closeBtn = document.getElementById('closeUploadModal');
        if (closeBtn && this.handleCloseModal) {
            closeBtn.removeEventListener('click', this.handleCloseModal);
        }
        
        const skipBtn = document.getElementById('skipUpload');
        if (skipBtn && this.handleSkipUpload) {
            skipBtn.removeEventListener('click', this.handleSkipUpload);
        }
    }

    setupImageUploadListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('recipeImageInput');
        const uploadedImagesContainer = document.getElementById('uploadedImages');
        
        let uploadedFiles = [];

        if (uploadArea && fileInput) {
            // Click para seleccionar archivos
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                this.handleImageFiles(files);
            });

            // Selección de archivos
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleImageFiles(files);
            });
        }
    }

    handleImageFiles(files) {
        const uploadedImagesContainer = document.getElementById('uploadedImages');
        if (!uploadedImagesContainer) return;

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageDiv = document.createElement('div');
                    imageDiv.className = 'uploaded-image';
                    imageDiv.innerHTML = `
                        <img src="${e.target.result}" alt="Imagen subida">
                        <button class="remove-image" onclick="this.parentElement.remove()">×</button>
                    `;
                    uploadedImagesContainer.appendChild(imageDiv);
                };
                reader.readAsDataURL(file);
            }
        });

        // Ocultar placeholder si hay imágenes
        const placeholder = document.querySelector('.upload-placeholder');
        if (placeholder && uploadedImagesContainer.children.length > 0) {
            placeholder.style.display = 'none';
        }
    }

    async submitUserRecipe() {
        console.log('🔍 submitUserRecipe called');
        
        if (!this.currentUser) {
            this.showNotification('Debes iniciar sesión para subir recetas', 'error');
            return;
        }

        // Validar campos requeridos con debugging
        const titleElement = document.getElementById('userRecipeTitle');
        const categoryElement = document.getElementById('userRecipeCategory');
        const ingredientsElement = document.getElementById('userRecipeIngredients');
        const instructionsElement = document.getElementById('userRecipeInstructions');

        console.log('🔍 Form elements found:', {
            title: !!titleElement,
            category: !!categoryElement,
            ingredients: !!ingredientsElement,
            instructions: !!instructionsElement
        });

        if (!titleElement || !categoryElement || !ingredientsElement || !instructionsElement) {
            this.showNotification('Error: No se encontraron todos los campos del formulario', 'error');
            return;
        }

        const title = titleElement.value.trim();
        const category = categoryElement.value;
        const ingredients = ingredientsElement.value.trim();
        const instructions = instructionsElement.value.trim();

        console.log('🔍 Form values:', {
            title: `"${title}"`,
            category: `"${category}"`,
            ingredients: ingredients.length + ' chars',
            instructions: instructions.length + ' chars'
        });

        if (!title) {
            this.showNotification('El nombre de la receta es obligatorio', 'error');
            titleElement.focus();
            return;
        }

        if (!category) {
            this.showNotification('Debes seleccionar una categoría', 'error');
            categoryElement.focus();
            return;
        }

        if (!ingredients) {
            this.showNotification('Los ingredientes son obligatorios', 'error');
            ingredientsElement.focus();
            return;
        }

        if (!instructions) {
            this.showNotification('Las instrucciones son obligatorias', 'error');
            instructionsElement.focus();
            return;
        }

        // Verificar límite diario
        const remaining = this.getUserDailyUploadsRemaining(this.currentUser.username);
        if (remaining <= 0 && !this.editingRecipeId) {
            this.showNotification('Has alcanzado el límite diario de subidas', 'error');
            return;
        }

        console.log('🔍 Validation passed, creating recipe data...');

        // Recopilar datos del formulario
        const recipeData = {
            id: this.editingRecipeId || `user_recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: this.currentUser.username,
            title: title,
            country: document.getElementById('userRecipeCountry').value.trim(),
            time: parseInt(document.getElementById('userRecipeTime').value) || null,
            category: category,
            description: document.getElementById('userRecipeDescription').value.trim(),
            ingredients: ingredients,
            instructions: instructions,
            images: [],
            status: 'pending',
            uploadedAt: this.editingRecipeId ? 
                this.uploads.find(u => u.id === this.editingRecipeId)?.uploadedAt : 
                new Date().toISOString()
        };

        // Recopilar imágenes
        const uploadedImages = document.querySelectorAll('#uploadedImages img');
        recipeData.images = Array.from(uploadedImages).map(img => img.src);

        console.log('🔍 Recipe data created:', recipeData);

        try {
            if (this.editingRecipeId) {
                // Actualizar receta existente
                const index = this.uploads.findIndex(u => u.id === this.editingRecipeId);
                if (index !== -1) {
                    this.uploads[index] = recipeData;
                    localStorage.setItem('uploads', JSON.stringify(this.uploads));
                    this.showNotification('Receta actualizada exitosamente', 'success');
                    console.log('✅ Recipe updated successfully');
                }
            } else {
                // Agregar nueva receta
                this.uploads.push(recipeData);
                localStorage.setItem('uploads', JSON.stringify(this.uploads));

                // Otorgar puntos usando la función centralizada
                const pointsEarned = 10;
                this.awardPoints(this.currentUser.username, pointsEarned, 'subir receta');

                this.showNotification(`¡Receta subida exitosamente! +${pointsEarned} puntos ganados 🎉`, 'success');
                console.log('✅ New recipe added successfully');
            }

            // Limpiar formulario
            this.resetUserRecipeForm();
            
            // Actualizar estadísticas y lista
            this.updateUserStats();
            this.updateHeaderUI();
            
            // Cambiar al tab de mis recetas
            this.switchUserTab('my-recipes');

        } catch (error) {
            console.error('❌ Error al subir receta:', error);
            this.showNotification('Error al procesar la receta', 'error');
        }
    }

    resetUserRecipeForm() {
        // Limpiar campos del formulario
        document.getElementById('userRecipeTitle').value = '';
        document.getElementById('userRecipeCountry').value = '';
        document.getElementById('userRecipeTime').value = '';
        document.getElementById('userRecipeCategory').value = '';
        document.getElementById('userRecipeDescription').value = '';
        document.getElementById('userRecipeIngredients').value = '';
        document.getElementById('userRecipeInstructions').value = '';

        // Limpiar imágenes
        const uploadedImagesContainer = document.getElementById('uploadedImages');
        if (uploadedImagesContainer) {
            uploadedImagesContainer.innerHTML = '';
        }

        // Mostrar placeholder de nuevo
        const placeholder = document.querySelector('.upload-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }

        // Resetear estado de edición
        this.editingRecipeId = null;
        
        // Restaurar texto del botón
        const submitBtn = document.getElementById('submitRecipe');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Subir mi receta';
        }
    }

    closeUserPanel() {
        const modal = document.getElementById('uploadRecipeModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Resetear formulario si estaba en modo edición
        if (this.editingRecipeId) {
            this.resetUserRecipeForm();
        }
        
        this.showHeaderAndSearch();
    }

    async showAdminPanel() {
        this.hideHeaderAndSearch(); // Ocultar header y barra de búsqueda
        const panel = document.getElementById('adminPanel');
        if (panel) panel.classList.add('active');
        await this.loadAdminLists();
        // show default tab
        this.switchAdminTab('register');
        this.setupAdminEventListeners();
        this.setupAdminPanelCloseOnOutsideClick();
    }

    setupAdminPanelCloseOnOutsideClick() {
        const adminPanel = document.getElementById('adminPanel');
        const editRecipeModal = document.getElementById('editRecipeModal');
        
        if (adminPanel) {
            adminPanel.addEventListener('click', (e) => {
                // Si el clic es en el fondo del modal (no en el contenido)
                if (e.target === adminPanel) {
                    this.closeAdminPanel();
                }
            });
        }

        if (editRecipeModal) {
            editRecipeModal.addEventListener('click', (e) => {
                // Si el clic es en el fondo del modal (no en el contenido)
                if (e.target === editRecipeModal) {
                    this.closeEditRecipeModal();
                }
            });
        }
    }

    closeAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.classList.remove('active');
        }
        this.showHeaderAndSearch(); // Restaurar header y barra de búsqueda
        this.showNotification('Panel de administrador cerrado', 'info');
    }

    switchAdminTab(tab) {
        const tabs = ['register', 'recetas', 'usuarios', 'productos'];
        tabs.forEach(t => {
            const el = document.getElementById('tab-' + t);
            const btn = document.querySelector(`.admin-tab-btn[data-tab="${t}"]`);
            if (el) el.style.display = (t === tab) ? 'block' : 'none';
            if (btn) btn.classList.toggle('active', t === tab);
        });
    }

    setupAdminEventListeners() {
        // Event listeners para las pestañas
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.switchAdminTab(tab);
            });
        });

        // Event listeners para formularios
        const submitAddRecipe = document.getElementById('submitAddRecipe');
        if (submitAddRecipe) {
            submitAddRecipe.addEventListener('click', () => this.adminAddRecipe());
        }

        const submitEditRecipe = document.getElementById('submitEditRecipe');
        if (submitEditRecipe) {
            submitEditRecipe.addEventListener('click', () => this.adminEditRecipe());
        }

        const submitAddProduct = document.getElementById('submitAddProduct');
        if (submitAddProduct) {
            submitAddProduct.addEventListener('click', () => this.adminAddProduct());
        }

        // Event listeners para limpiar formularios
        const clearRecipeForm = document.getElementById('clearRecipeForm');
        if (clearRecipeForm) {
            clearRecipeForm.addEventListener('click', () => this.clearAddRecipeForm());
        }

        const clearProductForm = document.getElementById('clearProductForm');
        if (clearProductForm) {
            clearProductForm.addEventListener('click', () => this.clearProductForm());
        }

        const cancelEditRecipe = document.getElementById('cancelEditRecipe');
        if (cancelEditRecipe) {
            cancelEditRecipe.addEventListener('click', () => this.closeEditRecipeModal());
        }

        // Event listener para cerrar modal de edición
        const closeEditRecipeModal = document.getElementById('closeEditRecipeModal');
        if (closeEditRecipeModal) {
            closeEditRecipeModal.addEventListener('click', () => this.closeEditRecipeModal());
        }

        // Event listeners para búsquedas
        const adminRecipeSearch = document.getElementById('adminRecipeSearch');
        if (adminRecipeSearch) {
            adminRecipeSearch.addEventListener('input', () => this.filterAdminRecipes());
        }

        const adminUserSearch = document.getElementById('adminUserSearch');
        if (adminUserSearch) {
            adminUserSearch.addEventListener('input', () => this.filterAdminUsers());
        }

        const adminProductSearch = document.getElementById('adminProductSearch');
        if (adminProductSearch) {
            adminProductSearch.addEventListener('input', () => this.filterAdminProducts());
        }

        // Event listeners para botones de limpiar búsqueda
        const clearAdminRecipeSearch = document.getElementById('clearAdminRecipeSearch');
        if (clearAdminRecipeSearch) {
            clearAdminRecipeSearch.addEventListener('click', () => {
                document.getElementById('adminRecipeSearch').value = '';
                this.filterAdminRecipes();
            });
        }

        const clearAdminUserSearch = document.getElementById('clearAdminUserSearch');
        if (clearAdminUserSearch) {
            clearAdminUserSearch.addEventListener('click', () => {
                document.getElementById('adminUserSearch').value = '';
                this.filterAdminUsers();
            });
        }

        const clearAdminProductSearch = document.getElementById('clearAdminProductSearch');
        if (clearAdminProductSearch) {
            clearAdminProductSearch.addEventListener('click', () => {
                document.getElementById('adminProductSearch').value = '';
                this.filterAdminProducts();
            });
        }

        // Event listener para preview de imagen de receta
        const recipeImageInput = document.getElementById('r_imagenfile');
        if (recipeImageInput) {
            recipeImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const preview = document.getElementById('imagePreview');
                
                if (file && preview) {
                    // Validar archivo usando la nueva función
                    const validation = this.validateImageFile(file, 10);
                    
                    if (!validation.valid) {
                        this.showNotification(validation.error, 'error');
                        e.target.value = '';
                        return;
                    }
                    
                    if (validation.warning) {
                        this.showNotification(validation.warning, 'warning');
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.innerHTML = `
                            <img src="${e.target.result}" alt="Preview" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                            <p style="margin-top: 8px; font-size: 0.9rem; color: var(--gray);">
                                ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        `;
                    };
                    reader.readAsDataURL(file);
                } else if (preview) {
                    preview.innerHTML = `
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Haz clic para subir una imagen</p>
                        <small>PNG, JPG hasta 10MB</small>
                    `;
                }
            });
        }

        // Event listener para preview de imagen de edición de receta
        const editRecipeImageInput = document.getElementById('edit_imagenfile');
        if (editRecipeImageInput) {
            editRecipeImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const preview = document.getElementById('editImagePreview');
                
                if (file && preview) {
                    // Validar archivo usando la nueva función
                    const validation = this.validateImageFile(file, 10);
                    
                    if (!validation.valid) {
                        this.showNotification(validation.error, 'error');
                        e.target.value = '';
                        return;
                    }
                    
                    if (validation.warning) {
                        this.showNotification(validation.warning, 'warning');
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.innerHTML = `
                            <img src="${e.target.result}" alt="Preview" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                            <p style="margin-top: 8px; font-size: 0.9rem; color: var(--gray);">
                                ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        `;
                    };
                    reader.readAsDataURL(file);
                } else if (preview) {
                    preview.innerHTML = `
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Haz clic para cambiar imagen</p>
                        <small>PNG, JPG hasta 10MB</small>
                    `;
                }
            });
        }

        // Event listener para preview de imagen de producto
        const productImageInput = document.getElementById('p_imagefile');
        if (productImageInput) {
            productImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const preview = document.getElementById('productImagePreview');
                
                if (file && preview) {
                    // Validar archivo usando la nueva función
                    const validation = this.validateImageFile(file, 10);
                    
                    if (!validation.valid) {
                        this.showNotification(validation.error, 'error');
                        e.target.value = '';
                        return;
                    }
                    
                    if (validation.warning) {
                        this.showNotification(validation.warning, 'warning');
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.innerHTML = `
                            <img src="${e.target.result}" alt="Preview" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                            <p style="margin-top: 8px; font-size: 0.9rem; color: var(--gray);">
                                ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        `;
                    };
                    reader.readAsDataURL(file);
                } else if (preview) {
                    preview.innerHTML = `
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Haz clic para subir imagen</p>
                        <small>PNG, JPG hasta 5MB</small>
                    `;
                }
            });
        }
    }

    clearAddRecipeForm() {
        document.getElementById('r_nombre').value = '';
        document.getElementById('r_pais').value = '';
        document.getElementById('r_tiempo').value = '';
        document.getElementById('r_ingredientes').value = '';
        document.getElementById('r_instrucciones').value = '';
        document.getElementById('r_imagenfile').value = '';
        
        // Limpiar checkboxes de categorías
        document.querySelectorAll('#categoriesWrapper input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // Resetear preview de imagen
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Haz clic para subir una imagen</p>
                <small>PNG, JPG hasta 5MB</small>
            `;
        }

        this.showNotification('Formulario limpiado', 'info');
    }

    clearProductForm() {
        document.getElementById('p_name').value = '';
        document.getElementById('p_points').value = '';
        document.getElementById('p_stock').value = '';
        document.getElementById('p_imagefile').value = '';

        // Resetear preview de imagen
        const preview = document.getElementById('productImagePreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Haz clic para subir imagen</p>
                <small>PNG, JPG hasta 5MB</small>
            `;
        }

        this.showNotification('Formulario limpiado', 'info');
    }

    openAdminEditForm(recipe) {
        this.adminEditId = recipe.id;
        
        // Llenar el formulario de edición en el modal
        document.getElementById('edit_nombre').value = recipe.nombre || '';
        document.getElementById('edit_pais').value = recipe.pais || '';
        document.getElementById('edit_tiempo').value = recipe.tiempo || '';
        
        // Actualizar el título del modal
        const editTitle = document.getElementById('editRecipeTitle');
        if (editTitle) {
            editTitle.textContent = `Editando: ${recipe.nombre}`;
        }
        
        // Llenar ingredientes
        if (recipe.ingredientes && Array.isArray(recipe.ingredientes)) {
            const ingredientesText = recipe.ingredientes.map(ing => 
                typeof ing === 'string' ? ing : ing.nombre || ing
            ).join('\n');
            document.getElementById('edit_ingredientes').value = ingredientesText;
        }
        
        // Llenar instrucciones
        if (recipe.instrucciones && Array.isArray(recipe.instrucciones)) {
            document.getElementById('edit_instrucciones').value = recipe.instrucciones.join('\n');
        }
        
        // Marcar categorías
        document.querySelectorAll('#editCategoriesWrapper input[type="checkbox"]').forEach(cb => {
            cb.checked = recipe.categorias && recipe.categorias.includes(cb.value);
        });

        // Mostrar imagen actual si existe
        const editImagePreview = document.getElementById('editImagePreview');
        if (editImagePreview && recipe.imagen) {
            editImagePreview.innerHTML = `
                <img src="${recipe.imagen}" class="image-preview" alt="Imagen actual">
                <p>Imagen actual de la receta</p>
                <small>Haz clic para cambiar</small>
            `;
        }
        
        // Abrir el modal de edición
        const editModal = document.getElementById('editRecipeModal');
        if (editModal) {
            editModal.classList.add('active');
        }
        
        this.showNotification(`Editando: ${recipe.nombre}`, 'info');
    }

    closeEditRecipeModal() {
        const editModal = document.getElementById('editRecipeModal');
        if (editModal) {
            editModal.classList.remove('active');
        }
        
        // Limpiar el formulario
        this.clearEditRecipeForm();
        this.adminEditId = null;
        
        this.showNotification('Edición cancelada', 'info');
    }

    clearEditRecipeForm() {
        document.getElementById('edit_nombre').value = '';
        document.getElementById('edit_pais').value = '';
        document.getElementById('edit_tiempo').value = '';
        document.getElementById('edit_ingredientes').value = '';
        document.getElementById('edit_instrucciones').value = '';
        document.getElementById('edit_imagenfile').value = '';
        
        // Limpiar checkboxes de categorías
        document.querySelectorAll('#editCategoriesWrapper input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // Resetear preview de imagen
        const preview = document.getElementById('editImagePreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Haz clic para cambiar la imagen</p>
                <small>PNG, JPG hasta 5MB</small>
            `;
        }

        // Resetear título
        const editTitle = document.getElementById('editRecipeTitle');
        if (editTitle) {
            editTitle.textContent = 'Modifica los campos de la receta seleccionada';
        }
    }

    async adminEditRecipe() {
        if (!this.adminEditId) {
            this.showNotification('No hay receta seleccionada para editar', 'error');
            return;
        }

        // Obtener datos del formulario de edición
        let nombre = document.getElementById('edit_nombre').value.trim();
        let pais = document.getElementById('edit_pais').value.trim() || '';
        let tiempo = parseInt(document.getElementById('edit_tiempo').value || '0', 10);
        
        // Obtener categorías seleccionadas
        let categorias = [];
        document.querySelectorAll('#editCategoriesWrapper input[type="checkbox"]:checked').forEach(cb => {
            categorias.push(cb.value);
        });

        const ingredientesRaw = document.getElementById('edit_ingredientes').value || '';
        const instruccionesRaw = document.getElementById('edit_instrucciones').value || '';
        
        // Parsear ingredientes e instrucciones
        let ingredientes = [];
        let instrucciones = [];
        
        try {
            const parsed = JSON.parse(ingredientesRaw);
            if (Array.isArray(parsed)) {
                ingredientes = parsed.map(item => (typeof item === 'string') ? { nombre: item, cantidad: '', icono: '' } : item);
            } else ingredientes = [];
        } catch {
            ingredientes = ingredientesRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => ({ nombre: l, cantidad: '', icono: '' }));
        }

        try {
            const parsed = JSON.parse(instruccionesRaw);
            if (Array.isArray(parsed)) instrucciones = parsed.map(i => String(i));
            else instrucciones = [];
        } catch {
            instrucciones = instruccionesRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        }

        // Validación básica
        if (!nombre) {
            this.showNotification('El nombre de la receta es requerido', 'error');
            return;
        }

        // Manejar imagen
        const fileInput = document.getElementById('edit_imagenfile');
        let imageBase64 = null;
        
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            
            // Validar archivo
            const validation = this.validateImageFile(file, 10);
            if (!validation.valid) {
                this.showNotification(validation.error, 'error');
                return;
            }
            
            if (validation.warning) {
                this.showNotification(validation.warning, 'warning');
            }
            
            // Convertir a base64
            try {
                imageBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                console.log('✅ Imagen convertida a base64 para edición');
            } catch (error) {
                console.error('❌ Error convirtiendo imagen:', error);
                this.showNotification('Error procesando la imagen', 'error');
                return;
            }
        }

        // Si es edición, tomar valores actuales cuando el input venga vacío
        const current = this.recipes.find(r => String(r.id) === String(this.adminEditId)) || {};
        nombre = nombre || current.nombre || '';
        pais = pais || current.pais || '';
        tiempo = isNaN(tiempo) || tiempo === 0 ? (current.tiempo || 0) : tiempo;
        if (!Array.isArray(categorias) || categorias.length === 0) categorias = current.categorias || [];
        if (!Array.isArray(ingredientes) || ingredientes.length === 0) ingredientes = current.ingredientes || [];
        if (!Array.isArray(instrucciones) || instrucciones.length === 0) instrucciones = current.instrucciones || [];
        
        const payload = { nombre, pais, tiempo, categorias, ingredientes, instrucciones };
        
        // Imagen: si no se sube nueva, conservar la anterior
        if (imageBase64) {
            payload.imageBase64 = imageBase64;
            console.log('📷 Nueva imagen incluida en payload');
        } else if (current && current.imagen) {
            payload.imagen = current.imagen;
            console.log('📷 Conservando imagen anterior');
        }

        let localSaved = false;
        const performLocalSave = () => {
            const idx = this.recipes.findIndex(r => String(r.id) === String(this.adminEditId));
            if (idx === -1) return this.showNotification('Receta no encontrada (local)', 'error');
            
            const rec = this.recipes[idx];
            rec.nombre = nombre;
            rec.pais = pais;
            rec.tiempo = tiempo;
            rec.categorias = categorias;
            rec.ingredientes = ingredientes;
            rec.instrucciones = instrucciones;
            
            // Actualizar imagen si hay una nueva
            if (imageBase64) {
                rec.imagen = imageBase64;
                console.log('📷 Imagen actualizada localmente');
            }
            
            this.recipes[idx] = rec;
            
            try {
                localStorage.setItem('localRecipes', JSON.stringify(this.recipes));
            } catch (e) { 
                console.warn('⚠️ Error guardando en localStorage:', e);
            }
            
            try {
                const ov = { nombre, pais, tiempo, categorias, ingredientes, instrucciones };
                if (imageBase64) ov.imagen = imageBase64;
                this.saveRecipeOverride(rec.id, ov);
            } catch (e3) { 
                console.warn('⚠️ Error guardando override:', e3);
            }
            
            localSaved = true;
            this.showNotification('Receta actualizada correctamente ✓', 'success');
            return { updatedId: rec.id, updatedRec: rec };
        };

        try {
            console.log('🔄 Enviando actualización al servidor...');
            
            try {
                const res = await this.apiFetch('/api/recipes?id=' + this.adminEditId, { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(payload) 
                });
                
                const data = await res.json();
                
                if (!data.ok) {
                    console.warn('⚠️ Servidor retornó error, guardando localmente');
                    const resLocal = performLocalSave() || {};
                    this.refreshCurrentView(resLocal.updatedId || this.adminEditId);
                    if (resLocal.updatedRec) this.updateRecipeCardInDOM(resLocal.updatedRec);
                } else {
                    console.log('✅ Receta actualizada en servidor');
                    this.showNotification('Receta actualizada correctamente ✓', 'success');
                    localSaved = true;
                    
                    const updated = data.receta;
                    if (updated) {
                        const idx = this.recipes.findIndex(r => String(r.id) === String(updated.id));
                        if (idx !== -1) {
                            this.recipes[idx] = updated;
                            console.log('📷 Imagen actualizada:', updated.imagen);
                        }
                    }
                    
                    await this.reloadRecipesFromAPI();
                    this.refreshCurrentView(updated ? updated.id : this.adminEditId);
                    if (updated) this.updateRecipeCardInDOM(updated);
                }
            } catch (err) {
                console.error('❌ Error en servidor, guardando localmente:', err);
                const resLocal = performLocalSave() || {};
                localSaved = true;
                this.refreshCurrentView(resLocal.updatedId || this.adminEditId);
                if (resLocal.updatedRec) this.updateRecipeCardInDOM(resLocal.updatedRec);
            }
            
            // Actualizar listas del admin y cerrar modal
            await this.loadAdminLists();
            this.renderRecipes(); // Actualizar la vista principal también
            this.closeEditRecipeModal();
            
        } catch (err) {
            console.error('❌ Error general:', err);
            if (!localSaved) {
                this.showNotification('Error al actualizar receta', 'error');
            }
        }
    }

    filterAdminRecipes() {
        const searchTerm = document.getElementById('adminRecipeSearch').value.toLowerCase();
        const recipeItems = document.querySelectorAll('.admin-recipe-item');
        
        recipeItems.forEach(item => {
            const name = item.querySelector('.admin-item-info h4').textContent.toLowerCase();
            const country = item.querySelector('.admin-item-info p').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || country.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    filterAdminUsers() {
        const searchTerm = document.getElementById('adminUserSearch').value.toLowerCase();
        const userItems = document.querySelectorAll('.admin-user-item');
        
        userItems.forEach(item => {
            const username = item.querySelector('.admin-user-info h4').textContent.toLowerCase();
            
            if (username.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    filterAdminProducts() {
        const searchTerm = document.getElementById('adminProductSearch').value.toLowerCase();
        const productItems = document.querySelectorAll('.admin-product-item');
        
        productItems.forEach(item => {
            const name = item.querySelector('.admin-item-info h4').textContent.toLowerCase();
            
            if (name.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async loadAdminLists() {
        try {
            const rres = await this.apiFetch('/api/recipes');
            if (rres.ok) {
                const rdata = await rres.json();
                const recetas = rdata.recetas || [];
                this.renderAdminRecipes(recetas);
            }

            // render admin products area from local storage
            this.renderAdminProducts();
        } catch (err) { 
            console.error(err); 
        }

        // Si la API no está disponible o no devolvió recetas, renderizar desde las recetas locales en memoria
        try {
            const recetasLocal = this.recipes && this.recipes.length ? this.recipes : (JSON.parse(localStorage.getItem('localRecipes') || '[]'));
            this.renderAdminRecipes(recetasLocal);
        } catch (err) { 
            /* ignore */ 
        }

        try {
            const ures = await this.apiFetch('/api/users');
            if (ures.ok) {
                const udata = await ures.json();
                const users = udata.users || [];
                this.renderAdminUsers(users);
            }
        } catch (err) { 
            console.error(err); 
        }

        // fallback: render users from uploads local data (if API not available)
        try {
            const ulist = document.getElementById('adminUsers');
            if (ulist && (!ulist.innerHTML || ulist.innerHTML.trim().length === 0)) {
                // build unique users from uploads + localUsers stored (if any)
                const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
                const usersFromUploads = Array.from(new Set(this.uploads.map(u => u.username))).map(un => ({ username: un, role: 'user' }));
                const allUsers = [...localUsers, ...usersFromUploads];
                this.renderAdminUsers(allUsers);
            }
        } catch (err) { 
            /* ignore */ 
        }
    }

    renderAdminRecipes(recetas) {
        const list = document.getElementById('adminRecipes');
        if (!list) return;

        const searchVal = (document.getElementById('adminRecipeSearch') ? document.getElementById('adminRecipeSearch').value.trim().toLowerCase() : '');
        let recetasToRender = recetas;
        if (searchVal) {
            recetasToRender = recetas.filter(r => 
                (r.nombre||'').toLowerCase().includes(searchVal) || 
                (r.pais||'').toLowerCase().includes(searchVal)
            );
        }

        list.innerHTML = recetasToRender.map(r => `
            <div class="admin-recipe-item" data-id="${r.id}">
                <img src="${r.imagen || 'img/placeholder.svg'}" alt="${r.nombre}">
                <div class="admin-item-info">
                    <h4>${r.nombre}</h4>
                    <p>${r.pais || 'Sin país'} • ${r.tiempo || 0} min • ${(r.categorias || []).join(', ')}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-edit btn-edit-recipe" data-id="${r.id}">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-delete btn-delete-recipe" data-id="${r.id}">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        // Agregar event listeners
        document.querySelectorAll('.btn-delete-recipe').forEach(b => b.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            this.adminDeleteRecipe(id);
        }));
        
        document.querySelectorAll('.btn-edit-recipe').forEach(b => b.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const recipe = recetas.find(x => String(x.id) === String(id));
            if (recipe) this.openAdminEditForm(recipe);
        }));
    }

    renderAdminProducts() {
        const adminProductsEl = document.getElementById('adminProductsList');
        if (!adminProductsEl) return;

        const prodSearch = (document.getElementById('adminProductSearch') ? document.getElementById('adminProductSearch').value.trim().toLowerCase() : '');
        const filtered = prodSearch ? this.products.filter(p => (p.name||'').toLowerCase().includes(prodSearch)) : this.products;
        
        adminProductsEl.innerHTML = filtered.map(p => `
            <div class="admin-product-item" data-id="${p.id}">
                <img src="${p.imageBase64 || p.imagen || 'img/placeholder.svg'}" alt="${p.name}">
                <div class="admin-item-info">
                    <h4>${p.name}</h4>
                    <p>${p.points} puntos • Stock: ${p.stock}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-edit btn-edit-product" data-id="${p.id}">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-delete btn-delete-product" data-id="${p.id}">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.btn-delete-product').forEach(b => b.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            this.adminDeleteProduct(id);
        }));
        
        document.querySelectorAll('.btn-edit-product').forEach(b => b.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const prod = this.products.find(x => String(x.id) === String(id));
            if (prod) this.openAdminEditProduct(prod);
        }));
    }

    renderAdminUsers(users) {
        const ulist = document.getElementById('adminUsers');
        if (!ulist) return;

        const searchVal = (document.getElementById('adminUserSearch') ? document.getElementById('adminUserSearch').value.trim().toLowerCase() : '');
        const filtered = searchVal ? users.filter(u => (u.username||'').toLowerCase().includes(searchVal)) : users;
        
        ulist.innerHTML = filtered.map(u => {
            const pendingCount = this.uploads.filter(x => x.username === u.username && x.status === 'pending').length;
            const totalUploads = this.uploads.filter(x => x.username === u.username).length;
            const userData = this.getUserUploadsData(u.username);
            const dailyRemaining = this.getUserDailyUploadsRemaining(u.username);
            
            const bell = pendingCount > 0 ? `<span class="pending-indicator" title="${pendingCount} subidas pendientes">🔔(${pendingCount})</span>` : '';
            const uploadInfo = u.role !== 'admin' ? `Subidas: ${totalUploads} total, ${dailyRemaining} disponibles hoy` : 'Administrador del sistema';
            
            return `
                <div class="admin-user-item" style="background:${pendingCount > 0 ? 'rgba(255,193,7,0.1)' : 'white'};">
                    <div class="admin-user-info">
                        <h4>
                            ${bell}${u.username}
                            <span class="user-role-badge ${u.role === 'admin' ? 'admin' : ''}">${u.role || 'user'}</span>
                        </h4>
                        <p>${uploadInfo}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-edit btn-view-user-uploads" data-user="${u.username}" title="Ver todas las imágenes subidas">
                            <i class="fas fa-images"></i>
                            Ver imágenes
                        </button>
                        ${u.role !== 'admin' ? `
                            <button class="btn-edit btn-manage-user-uploads" data-user="${u.username}" title="Gestionar límites de subida">
                                <i class="fas fa-cog"></i>
                                Gestionar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.btn-view-user-uploads').forEach(b => b.addEventListener('click', (e) => {
            const username = e.currentTarget.getAttribute('data-user');
            this.openAdminUploadsForUser(username);
        }));
        
        document.querySelectorAll('.btn-manage-user-uploads').forEach(b => b.addEventListener('click', (e) => {
            const username = e.currentTarget.getAttribute('data-user');
            this.openAdminUserManagement(username);
        }));
    }

    async adminAddRecipe() {
        try {
            // Validar campos requeridos
            let nombre = document.getElementById('r_nombre').value.trim();
            if (!nombre) {
                this.showNotification('El nombre de la receta es requerido', 'error');
                return;
            }

            let pais = document.getElementById('r_pais').value.trim() || '';
            let tiempo = parseInt(document.getElementById('r_tiempo').value || '0', 10);
            
            // Categorías: preferir checkboxes si existen
            let categorias = [];
            const catsWrapper = document.getElementById('categoriesWrapper');
            if (catsWrapper) {
                categorias = Array.from(catsWrapper.querySelectorAll('input[type=checkbox]:checked')).map(c => c.value);
            } else {
                categorias = (document.getElementById('r_categorias').value || '').split(',').map(s => s.trim()).filter(Boolean);
            }

            const ingredientesRaw = document.getElementById('r_ingredientes').value || '';
            const instruccionesRaw = document.getElementById('r_instrucciones').value || '';
            
            // Parsear entradas: aceptar JSON array O líneas separadas
            let ingredientes = [];
            let instrucciones = [];
            
            try {
                const parsed = JSON.parse(ingredientesRaw);
                if (Array.isArray(parsed)) {
                    // Si vienen objetos o strings, normalizar a objetos
                    ingredientes = parsed.map(item => (typeof item === 'string') ? { nombre: item, cantidad: '', icono: '' } : item);
                } else ingredientes = [];
            } catch {
                // No es JSON: tratar cada línea como ingrediente
                ingredientes = ingredientesRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => ({ nombre: l, cantidad: '', icono: '' }));
            }

            try {
                const parsed = JSON.parse(instruccionesRaw);
                if (Array.isArray(parsed)) instrucciones = parsed.map(i => String(i));
                else instrucciones = [];
            } catch {
                instrucciones = instruccionesRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            }

            // Validar que hay ingredientes e instrucciones
            if (ingredientes.length === 0) {
                this.showNotification('Debe agregar al menos un ingrediente', 'error');
                return;
            }

            if (instrucciones.length === 0) {
                this.showNotification('Debe agregar al menos una instrucción', 'error');
                return;
            }

            const fileInput = document.getElementById('r_imagenfile');
            let imageBase64 = null;
            
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                
                // Validar archivo usando la nueva función
                const validation = this.validateImageFile(file, 10);
                
                if (!validation.valid) {
                    this.showNotification(validation.error, 'error');
                    return;
                }
                
                if (validation.warning) {
                    this.showNotification(validation.warning, 'warning');
                }

                try {
                    imageBase64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                } catch (err) {
                    console.error('Error leyendo imagen:', err);
                    this.showNotification('Error procesando la imagen', 'error');
                    return;
                }
            }

            // Si es edición, tomar valores actuales cuando el input venga vacío
            if (this.adminEditId) {
                const current = this.recipes.find(r => String(r.id) === String(this.adminEditId)) || {};
                nombre = nombre || current.nombre || '';
                pais = pais || current.pais || '';
                tiempo = isNaN(tiempo) || tiempo === 0 ? (current.tiempo || 0) : tiempo;
                if (!Array.isArray(categorias) || categorias.length === 0) categorias = current.categorias || [];
                if (!Array.isArray(ingredientes) || ingredientes.length === 0) ingredientes = current.ingredientes || [];
                if (!Array.isArray(instrucciones) || instrucciones.length === 0) instrucciones = current.instrucciones || [];
            }

            const payload = { nombre, pais, tiempo, categorias, ingredientes, instrucciones };
            
            // Imagen: si no se sube nueva, conservar la anterior para no borrarla
            if (imageBase64) {
                payload.imageBase64 = imageBase64;
            } else if (this.adminEditId) {
                const current = this.recipes.find(r => String(r.id) === String(this.adminEditId));
                if (current && current.imagen) {
                    payload.imagen = current.imagen;
                }
            }

            console.log('📤 Enviando payload:', {
                nombre: payload.nombre,
                pais: payload.pais,
                tiempo: payload.tiempo,
                categorias: payload.categorias.length,
                ingredientes: payload.ingredientes.length,
                instrucciones: payload.instrucciones.length,
                tieneImagen: !!(payload.imageBase64 || payload.imagen)
            });

            let localSaved = false;
            const performLocalSave = (isEdit) => {
                if (isEdit) {
                    const idx = this.recipes.findIndex(r => String(r.id) === String(this.adminEditId));
                    if (idx === -1) return this.showNotification('Receta no encontrada (local)', 'error');
                    const rec = this.recipes[idx];
                    rec.nombre = nombre;
                    rec.pais = pais;
                    rec.tiempo = tiempo;
                    rec.categorias = categorias;
                    rec.ingredientes = ingredientes;
                    rec.instrucciones = instrucciones;
                    if (imageBase64) rec.imagen = imageBase64;
                    this.recipes[idx] = rec;
                    try {
                        localStorage.setItem('localRecipes', JSON.stringify(this.recipes));
                    } catch (e) { /* ignore quota for full array */ }
                    try {
                        const ov = { nombre, pais, tiempo, categorias, ingredientes, instrucciones };
                        if (imageBase64) ov.imagen = imageBase64;
                        this.saveRecipeOverride(rec.id, ov);
                    } catch (e3) { /* ignore */ }
                    localSaved = true;
                    this.showNotification('Receta actualizada (local) ✓');
                    this.resetAdminForm();
                    return { updatedId: rec.id, updatedRec: rec };
                } else {
                    const newId = 'r_' + Date.now();
                    const newRec = {
                        id: newId,
                        nombre,
                        pais,
                        tiempo,
                        categorias,
                        ingredientes,
                        instrucciones,
                        imagen: imageBase64 || '',
                        calificacion: 0,
                        resenas: 0
                    };
                    this.recipes.push(newRec);
                    try {
                        localStorage.setItem('localRecipes', JSON.stringify(this.recipes));
                    } catch (e) { /* ignore quota for full array */ }
                    try {
                        const ov = { nombre, pais, tiempo, categorias, ingredientes, instrucciones };
                        if (imageBase64) ov.imagen = imageBase64;
                        this.saveRecipeOverride(newId, ov);
                    } catch (e3) { /* ignore */ }
                    localSaved = true;
                    this.showNotification('Receta agregada (local) ✓');
                    return { updatedId: newId, updatedRec: newRec };
                }
            };

            // Mostrar indicador de carga
            this.showNotification('Guardando receta...', 'info');

            if (this.adminEditId) {
                try {
                    const res = await this.apiFetch('/api/recipes?id=' + this.adminEditId, { 
                        method: 'PUT', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify(payload) 
                    });
                    const data = await res.json();
                    
                    if (!data.ok) {
                        console.warn('⚠️ API error, usando fallback local:', data.error);
                        const resLocal = performLocalSave(true) || {};
                        this.showNotification('Receta actualizada correctamente ✓');
                        this.refreshCurrentView(resLocal.updatedId || this.adminEditId);
                        if (resLocal.updatedRec) this.updateRecipeCardInDOM(resLocal.updatedRec);
                        const favModal = document.getElementById('favoritesModal');
                        if (favModal && favModal.classList.contains('active')) this.showFavorites();
                    } else {
                        this.showNotification('Receta actualizada correctamente ✓');
                        localSaved = true;
                        this.resetAdminForm();
                        const updated = data.receta;
                        if (updated) {
                            const idx = this.recipes.findIndex(r => String(r.id) === String(updated.id));
                            if (idx !== -1) this.recipes[idx] = updated;
                        }
                        await this.reloadRecipesFromAPI();
                        this.refreshCurrentView(updated ? updated.id : this.adminEditId);
                        if (updated) this.updateRecipeCardInDOM(updated);
                        const favModal = document.getElementById('favoritesModal');
                        if (favModal && favModal.classList.contains('active')) this.showFavorites();
                    }
                } catch (err) {
                    console.warn('⚠️ API no disponible, usando fallback local:', err.message);
                    try {
                        const resLocal = performLocalSave(true) || {};
                        localSaved = true;
                        this.showNotification('Receta actualizada correctamente ✓');
                        this.refreshCurrentView(resLocal.updatedId || this.adminEditId);
                        if (resLocal.updatedRec) this.updateRecipeCardInDOM(resLocal.updatedRec);
                        const favModal = document.getElementById('favoritesModal');
                        if (favModal && favModal.classList.contains('active')) this.showFavorites();
                    } catch (localErr) {
                        localSaved = true;
                        this.showNotification('Receta actualizada correctamente ✓');
                    }
                }
            } else {
                try {
                    const res = await this.apiFetch('/api/recipes', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify(payload) 
                    });
                    const data = await res.json();
                    
                    if (!data.ok) {
                        console.warn('⚠️ API error, usando fallback local:', data.error);
                        const resLocal = performLocalSave(false) || {};
                        if (resLocal.updatedRec) this.updateRecipeCardInDOM(resLocal.updatedRec);
                        this.refreshCurrentView(resLocal.updatedId || null);
                        const favModal = document.getElementById('favoritesModal');
                        if (favModal && favModal.classList.contains('active')) this.showFavorites();
                    } else {
                        this.showNotification('Receta agregada correctamente ✅');
                        localSaved = true;
                        const created = data.receta;
                        if (created) this.recipes.unshift(created);
                        await this.reloadRecipesFromAPI();
                        this.refreshCurrentView(created ? created.id : null);
                        if (created) this.updateRecipeCardInDOM(created);
                        const favModal = document.getElementById('favoritesModal');
                        if (favModal && favModal.classList.contains('active')) this.showFavorites();
                    }
                } catch (err) {
                    console.warn('⚠️ API no disponible, usando fallback local:', err.message);
                    try {
                        const resLocal = performLocalSave(false) || {};
                        localSaved = true;
                        this.showNotification('Receta agregada correctamente ✅');
                        this.refreshCurrentView(resLocal.updatedId || null);
                        if (resLocal.updatedRec) this.updateRecipeCardInDOM(resLocal.updatedRec);
                        const favModal = document.getElementById('favoritesModal');
                        if (favModal && favModal.classList.contains('active')) this.showFavorites();
                    } catch (localErr) {
                        localSaved = true;
                        this.showNotification('Receta agregada correctamente ✅');
                    }
                }
            }

            await this.loadAdminLists();
            
            // Actualizar la vista principal también
            this.renderRecipes();
            
            // Limpiar formulario después de agregar (no editar)
            if (!this.adminEditId) {
                this.clearAddRecipeForm();
            }
            
            // Generar calificaciones de bots para nueva receta
            if (!this.adminEditId) {
                // Solo para recetas nuevas, no para ediciones
                // Buscar la receta más reciente agregada
                let newRecipeId = null;
                
                // Intentar obtener el ID de diferentes fuentes
                if (this.recipes && this.recipes.length > 0) {
                    // Buscar por nombre para encontrar la receta recién agregada
                    const recentRecipe = this.recipes.find(r => r.nombre === nombre);
                    if (recentRecipe) {
                        newRecipeId = recentRecipe.id;
                    } else {
                        // Fallback: usar la última receta
                        newRecipeId = this.recipes[this.recipes.length - 1].id;
                    }
                }
                
                if (newRecipeId) {
                    console.log(`🤖 Programando calificaciones de bots para nueva receta: ${nombre} (ID: ${newRecipeId})`);
                    this.generateBotRatingsForNewRecipe(newRecipeId);
                }
            }

        } catch (err) {
            console.error('❌ Error en adminAddRecipe:', err);
            this.showNotification('Error al procesar receta: ' + err.message, 'error');
        }
    }

    updateRecipeCardInDOM(recipe) {
        const grid = document.getElementById('recipesGrid');
        if (!grid) return;
        const card = grid.querySelector(`.recipe-card[data-recipe-id="${recipe.id}"]`);
        if (!card) return;
        const temp = document.createElement('div');
        temp.innerHTML = this.createRecipeCard(recipe);
        const newEl = temp.firstElementChild;
        if (!newEl) return;
        card.replaceWith(newEl);
        newEl.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) this.openRecipeDetail(recipe);
        });
    }

    async adminDeleteRecipe(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta receta?')) return;
        
        try {
            // Intentar eliminar vía API
            try {
                const res = await this.apiFetch('/api/recipes?id=' + id, { method: 'DELETE' });
                const data = await res.json();
                if (!data.ok) return this.showNotification('No se pudo eliminar', 'error');
                this.showNotification('Receta eliminada correctamente ✓', 'success');
            } catch (err) {
                // Fallback local: eliminar de memoria y persistir
                this.recipes = this.recipes.filter(r => String(r.id) !== String(id));
                localStorage.setItem('localRecipes', JSON.stringify(this.recipes));
                this.showNotification('Receta eliminada correctamente ✓', 'success');
            }
            
            // Actualizar vistas en tiempo real
            await this.loadAdminLists();
            this.loadRecipesFromJSON();
            this.renderRecipes(); // Actualizar la vista principal también
            
            // Si estamos editando esta receta, cerrar el modal de edición
            if (this.adminEditId === id) {
                this.closeEditRecipeModal();
            }
            
        } catch (err) {
            console.error(err);
            this.showNotification('Error al eliminar la receta', 'error');
        }
    }

    async adminAddProduct() {
        const name = document.getElementById('p_name').value.trim();
        const points = parseInt(document.getElementById('p_points').value || '0', 10);
        const stock = parseInt(document.getElementById('p_stock').value || '0', 10);
        const fileInput = document.getElementById('p_imagefile');
        let imageBase64 = null;
        
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            imageBase64 = await new Promise((resolve) => {
                const reader = new FileReader(); 
                reader.onload = () => resolve(reader.result); 
                reader.readAsDataURL(file);
            });
        }

        if (!name) return this.showNotification('El nombre del producto es requerido', 'error');
        if (points <= 0) return this.showNotification('Los puntos deben ser mayor a 0', 'error');
        if (stock < 0) return this.showNotification('El stock no puede ser negativo', 'error');

        if (this.adminProductEditId) {
            // Editar producto existente
            const prod = this.products.find(p => p.id === this.adminProductEditId);
            if (prod) {
                prod.name = name; 
                prod.points = points; 
                prod.stock = stock; 
                if (imageBase64) prod.imageBase64 = imageBase64;
                this.showNotification('Producto actualizado correctamente ✓', 'success');
            }
            this.adminProductEditId = null;
            const submitBtn = document.getElementById('submitAddProduct'); 
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Producto';
            }
        } else {
            // Agregar nuevo producto
            const newProd = { 
                id: 'prod_' + Date.now(), 
                name, 
                points, 
                stock, 
                imageBase64: imageBase64 || '' 
            };
            this.products.push(newProd);
            this.showNotification('Producto agregado correctamente ✓', 'success');
        }
        
        this.saveProducts();
        this.renderAdminProducts(); // Actualizar vista en tiempo real
        this.clearProductForm(); // Limpiar formulario
    }

    openAdminEditProduct(prod) {
        document.getElementById('p_name').value = prod.name || '';
        document.getElementById('p_points').value = prod.points || 0;
        document.getElementById('p_stock').value = prod.stock || 0;
        
        // Mostrar imagen actual si existe
        const productImagePreview = document.getElementById('productImagePreview');
        if (productImagePreview && prod.imageBase64) {
            productImagePreview.innerHTML = `
                <img src="${prod.imageBase64}" class="image-preview" alt="Imagen actual">
                <p>Imagen actual del producto</p>
                <small>Haz clic para cambiar</small>
            `;
        }
        
        this.adminProductEditId = prod.id;
        const submitBtn = document.getElementById('submitAddProduct'); 
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
        }
        
        this.showNotification(`Editando: ${prod.name}`, 'info');
    }

    adminDeleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;
        
        if (!confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) return;
        
        this.products = this.products.filter(p => p.id !== id);
        this.saveProducts();
        this.renderAdminProducts(); // Actualizar vista en tiempo real
        this.showNotification('Producto eliminado correctamente ✓', 'success');
        
        // Si estamos editando este producto, limpiar el formulario
        if (this.adminProductEditId === id) {
            this.adminProductEditId = null;
            this.clearProductForm();
            const submitBtn = document.getElementById('submitAddProduct'); 
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Producto';
            }
        }
    }

    // ========== FUNCIONALIDADES AVANZADAS ADICIONALES ==========
    
    // Sistema de notificaciones mejorado
    showAdvancedNotification(message, type = 'info', duration = 4000, actions = []) {
        const notification = document.createElement('div');
        notification.className = `advanced-notification notification-${type}`;
        
        const iconMap = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${iconMap[type] || iconMap.info}"></i>
                <span class="notification-message">${message}</span>
                ${actions.length > 0 ? `
                    <div class="notification-actions">
                        ${actions.map(action => `
                            <button class="notification-btn" onclick="${action.onClick}">${action.text}</button>
                        `).join('')}
                    </div>
                ` : ''}
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="notification-progress"></div>
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-remove después del tiempo especificado
        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');
            progressBar.style.animationDuration = `${duration}ms`;
            
            setTimeout(() => {
                notification.classList.add('hide');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
        
        return notification;
    }
    
    // Sistema de búsqueda avanzada
    performAdvancedSearch(query, filters = {}) {
        if (!query.trim() && Object.keys(filters).length === 0) {
            return this.recipes;
        }
        
        let results = [...this.recipes];
        
        // Filtro por texto
        if (query.trim()) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            results = results.filter(recipe => {
                const searchableText = [
                    recipe.nombre,
                    recipe.pais,
                    ...(recipe.categorias || []),
                    ...(recipe.ingredientes || []).map(ing => ing.nombre || ing),
                    ...(recipe.instrucciones || [])
                ].join(' ').toLowerCase();
                
                return searchTerms.every(term => searchableText.includes(term));
            });
        }
        
        // Filtro por categoría
        if (filters.category) {
            results = results.filter(recipe => 
                recipe.categorias && recipe.categorias.includes(filters.category)
            );
        }
        
        // Filtro por tiempo de preparación
        if (filters.maxTime) {
            results = results.filter(recipe => 
                !recipe.tiempo || recipe.tiempo <= filters.maxTime
            );
        }
        
        // Filtro por calificación mínima
        if (filters.minRating) {
            results = results.filter(recipe => 
                recipe.calificacion >= filters.minRating
            );
        }
        
        // Filtro por país
        if (filters.country) {
            results = results.filter(recipe => 
                recipe.pais && recipe.pais.toLowerCase().includes(filters.country.toLowerCase())
            );
        }
        
        return results;
    }
    
    // Sistema de recomendaciones inteligentes
    getRecommendations(userId = null, limit = 6) {
        const user = userId || (this.currentUser ? this.currentUser.username : null);
        
        if (!user) {
            // Recomendaciones generales para usuarios no logueados
            return this.getPopularRecipes(limit);
        }
        
        // Obtener preferencias del usuario basadas en favoritos y calificaciones
        const userFavorites = this.favorites;
        const userRatings = Object.entries(this.ratings).filter(([_, rating]) => rating >= 4);
        
        // Categorías preferidas del usuario
        const preferredCategories = new Set();
        const preferredCountries = new Set();
        
        [...userFavorites, ...userRatings.map(([id, _]) => id)].forEach(recipeId => {
            const recipe = this.recipes.find(r => r.id == recipeId);
            if (recipe) {
                if (recipe.categorias) recipe.categorias.forEach(cat => preferredCategories.add(cat));
                if (recipe.pais) preferredCountries.add(recipe.pais);
            }
        });
        
        // Puntuar recetas basándose en preferencias
        const scoredRecipes = this.recipes
            .filter(recipe => !userFavorites.includes(recipe.id)) // Excluir favoritos existentes
            .map(recipe => {
                let score = 0;
                
                // Puntos por categoría preferida
                if (recipe.categorias) {
                    recipe.categorias.forEach(cat => {
                        if (preferredCategories.has(cat)) score += 3;
                    });
                }
                
                // Puntos por país preferido
                if (recipe.pais && preferredCountries.has(recipe.pais)) {
                    score += 2;
                }
                
                // Puntos por calificación general
                score += (recipe.calificacion || 0) * 0.5;
                
                // Puntos por popularidad (número de reseñas)
                score += Math.min((recipe.resenas || 0) * 0.1, 2);
                
                // Pequeño factor aleatorio para variedad
                score += Math.random() * 0.5;
                
                return { recipe, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.recipe);
        
        return scoredRecipes.length > 0 ? scoredRecipes : this.getPopularRecipes(limit);
    }
    
    getPopularRecipes(limit = 6) {
        return [...this.recipes]
            .sort((a, b) => {
                const scoreA = (a.calificacion || 0) * (a.resenas || 0);
                const scoreB = (b.calificacion || 0) * (b.resenas || 0);
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }
    
    // Sistema de logros y badges
    checkAndAwardAchievements(username) {
        if (!username) return;
        
        const userAchievements = JSON.parse(localStorage.getItem('userAchievements')) || {};
        if (!userAchievements[username]) userAchievements[username] = [];
        
        const userRecipes = this.uploads.filter(u => u.username === username);
        const userPoints = this.userPoints[username] || 0;
        const userFavorites = this.favorites.length;
        const userApprovedUploads = userRecipes.filter(u => u.status === 'approved' || u.approved === true).length;
        const userSearchHistory = this.userPreferences.searchHistory?.length || 0;
        const userViewHistory = this.userPreferences.viewHistory?.length || 0;
        const userCompletedChallenges = this.completedChallenges[username]?.length || 0;
        
        // Calcular estadísticas adicionales
        const uniqueCategories = new Set(userRecipes.map(r => r.category).filter(Boolean)).size;
        const uniqueCountries = new Set(this.userPreferences.favoriteCountries ? Object.keys(this.userPreferences.favoriteCountries) : []).size;
        const totalRatingsGiven = Object.keys(this.ratings).length;
        const weeklyPlanRecipes = Object.keys(this.weeklyPlan).length;
        
        const achievements = [
            // Logros básicos (20-30 puntos)
            {
                id: 'first_login',
                name: 'Primer Paso',
                description: 'Iniciaste sesión por primera vez',
                icon: '👋',
                condition: () => true, // Se otorga al iniciar sesión
                points: 20
            },
            {
                id: 'first_recipe',
                name: 'Primera Receta',
                description: 'Subiste tu primera receta',
                icon: '🍳',
                condition: () => userRecipes.length >= 1,
                points: 25
            },
            {
                id: 'first_favorite',
                name: 'Primer Favorito',
                description: 'Agregaste tu primera receta a favoritos',
                icon: '💖',
                condition: () => userFavorites >= 1,
                points: 20
            },
            {
                id: 'first_search',
                name: 'Explorador',
                description: 'Realizaste tu primera búsqueda',
                icon: '🔍',
                condition: () => userSearchHistory >= 1,
                points: 20
            },
            {
                id: 'first_rating',
                name: 'Crítico Culinario',
                description: 'Calificaste tu primera receta',
                icon: '⭐',
                condition: () => totalRatingsGiven >= 1,
                points: 25
            },
            
            // Logros intermedios (30-50 puntos)
            {
                id: 'active_explorer',
                name: 'Explorador Activo',
                description: 'Viste 50 recetas diferentes',
                icon: '🗺️',
                condition: () => userViewHistory >= 50,
                points: 35
            },
            {
                id: 'search_master',
                name: 'Maestro Buscador',
                description: 'Realizaste 25 búsquedas',
                icon: '🔎',
                condition: () => userSearchHistory >= 25,
                points: 40
            },
            {
                id: 'favorite_collector',
                name: 'Coleccionista de Favoritos',
                description: 'Agregaste 10 recetas a favoritos',
                icon: '❤️',
                condition: () => userFavorites >= 10,
                points: 35
            },
            {
                id: 'photo_starter',
                name: 'Fotógrafo Novato',
                description: 'Tuviste tu primera foto aprobada',
                icon: '📸',
                condition: () => userApprovedUploads >= 1,
                points: 30
            },
            {
                id: 'recipe_challenger',
                name: 'Desafiante Culinario',
                description: 'Completaste tu primer reto de receta',
                icon: '🏆',
                condition: () => userCompletedChallenges >= 1,
                points: 40
            },
            
            // Logros avanzados (50-80 puntos)
            {
                id: 'point_collector',
                name: 'Coleccionista de Puntos',
                description: 'Acumulaste 200 puntos',
                icon: '💎',
                condition: () => userPoints >= 200,
                points: 50
            },
            {
                id: 'photo_expert',
                name: 'Fotógrafo Experto',
                description: 'Tuviste 5 fotos aprobadas',
                icon: '📷',
                condition: () => userApprovedUploads >= 5,
                points: 60
            },
            {
                id: 'category_explorer',
                name: 'Explorador de Categorías',
                description: 'Subiste recetas de 3 categorías diferentes',
                icon: '🌈',
                condition: () => uniqueCategories >= 3,
                points: 55
            },
            {
                id: 'rating_expert',
                name: 'Experto en Calificaciones',
                description: 'Calificaste 20 recetas',
                icon: '🌟',
                condition: () => totalRatingsGiven >= 20,
                points: 65
            },
            {
                id: 'planner_user',
                name: 'Planificador Semanal',
                description: 'Agregaste 7 recetas al planificador semanal',
                icon: '📅',
                condition: () => weeklyPlanRecipes >= 7,
                points: 70
            },
            
            // Logros expertos (80-100 puntos)
            {
                id: 'diverse_cook',
                name: 'Cocinero Diverso',
                description: 'Subiste recetas de 5 categorías diferentes',
                icon: '🌍',
                condition: () => uniqueCategories >= 5,
                points: 80
            },
            {
                id: 'world_traveler',
                name: 'Viajero Gastronómico',
                description: 'Exploraste recetas de 10 países diferentes',
                icon: '✈️',
                condition: () => uniqueCountries >= 10,
                points: 85
            },
            {
                id: 'recipe_master',
                name: 'Maestro Cocinero',
                description: 'Subiste 10 recetas',
                icon: '👨‍🍳',
                condition: () => userRecipes.length >= 10,
                points: 90
            },
            {
                id: 'super_collector',
                name: 'Super Coleccionista',
                description: 'Acumulaste 500 puntos',
                icon: '💰',
                condition: () => userPoints >= 500,
                points: 95
            },
            {
                id: 'ultimate_chef',
                name: 'Chef Supremo',
                description: 'Completaste 10 retos de recetas',
                icon: '👑',
                condition: () => userCompletedChallenges >= 10,
                points: 100
            }
        ];
        
        const newAchievements = [];
        
        achievements.forEach(achievement => {
            if (!userAchievements[username].includes(achievement.id) && achievement.condition()) {
                userAchievements[username].push(achievement.id);
                newAchievements.push(achievement);
                
                // Otorgar puntos del logro usando la función centralizada
                this.awardPoints(username, achievement.points, `logro "${achievement.name}"`);
            }
        });
        
        // Guardar logros
        localStorage.setItem('userAchievements', JSON.stringify(userAchievements));
        this.saveUserPoints();
        
        // Mostrar notificaciones de nuevos logros
        newAchievements.forEach(achievement => {
            this.showAdvancedNotification(
                `¡Logro desbloqueado! ${achievement.icon} ${achievement.name} (+${achievement.points} puntos)`,
                'success',
                6000,
                [{
                    text: 'Ver Logros',
                    onClick: 'app.showAchievementsModal()'
                }]
            );
        });
        
        return newAchievements;
    }
    
    // Modal de logros
    showAchievementsModal() {
        if (!this.currentUser) return;
        
        const userAchievements = JSON.parse(localStorage.getItem('userAchievements')) || {};
        const earnedAchievements = userAchievements[this.currentUser.username] || [];
        
        const allAchievements = [
            // Logros básicos (20-30 puntos)
            { id: 'first_login', name: 'Primer Paso', description: 'Iniciaste sesión por primera vez', icon: '👋', points: 20 },
            { id: 'first_recipe', name: 'Primera Receta', description: 'Subiste tu primera receta', icon: '🍳', points: 25 },
            { id: 'first_favorite', name: 'Primer Favorito', description: 'Agregaste tu primera receta a favoritos', icon: '💖', points: 20 },
            { id: 'first_search', name: 'Explorador', description: 'Realizaste tu primera búsqueda', icon: '🔍', points: 20 },
            { id: 'first_rating', name: 'Crítico Culinario', description: 'Calificaste tu primera receta', icon: '⭐', points: 25 },
            
            // Logros intermedios (30-50 puntos)
            { id: 'active_explorer', name: 'Explorador Activo', description: 'Viste 50 recetas diferentes', icon: '🗺️', points: 35 },
            { id: 'search_master', name: 'Maestro Buscador', description: 'Realizaste 25 búsquedas', icon: '🔎', points: 40 },
            { id: 'favorite_collector', name: 'Coleccionista de Favoritos', description: 'Agregaste 10 recetas a favoritos', icon: '❤️', points: 35 },
            { id: 'photo_starter', name: 'Fotógrafo Novato', description: 'Tuviste tu primera foto aprobada', icon: '📸', points: 30 },
            { id: 'recipe_challenger', name: 'Desafiante Culinario', description: 'Completaste tu primer reto de receta', icon: '🏆', points: 40 },
            
            // Logros avanzados (50-80 puntos)
            { id: 'point_collector', name: 'Coleccionista de Puntos', description: 'Acumulaste 200 puntos', icon: '💎', points: 50 },
            { id: 'photo_expert', name: 'Fotógrafo Experto', description: 'Tuviste 5 fotos aprobadas', icon: '📷', points: 60 },
            { id: 'category_explorer', name: 'Explorador de Categorías', description: 'Subiste recetas de 3 categorías diferentes', icon: '🌈', points: 55 },
            { id: 'rating_expert', name: 'Experto en Calificaciones', description: 'Calificaste 20 recetas', icon: '🌟', points: 65 },
            { id: 'planner_user', name: 'Planificador Semanal', description: 'Agregaste 7 recetas al planificador semanal', icon: '📅', points: 70 },
            
            // Logros expertos (80-100 puntos)
            { id: 'diverse_cook', name: 'Cocinero Diverso', description: 'Subiste recetas de 5 categorías diferentes', icon: '🌍', points: 80 },
            { id: 'world_traveler', name: 'Viajero Gastronómico', description: 'Exploraste recetas de 10 países diferentes', icon: '✈️', points: 85 },
            { id: 'recipe_master', name: 'Maestro Cocinero', description: 'Subiste 10 recetas', icon: '👨‍🍳', points: 90 },
            { id: 'super_collector', name: 'Super Coleccionista', description: 'Acumulaste 500 puntos', icon: '💰', points: 95 },
            { id: 'ultimate_chef', name: 'Chef Supremo', description: 'Completaste 10 retos de recetas', icon: '👑', points: 100 }
        ];
        
        // Agrupar logros por dificultad
        const basicAchievements = allAchievements.filter(a => a.points <= 30);
        const intermediateAchievements = allAchievements.filter(a => a.points > 30 && a.points <= 50);
        const advancedAchievements = allAchievements.filter(a => a.points > 50 && a.points <= 80);
        const expertAchievements = allAchievements.filter(a => a.points > 80);
        
        const modalHTML = `
            <div class="modal active" id="achievementsModal">
                <div class="modal-content modal-large">
                    <button class="modal-close" onclick="document.getElementById('achievementsModal').remove()">&times;</button>
                    <div class="modal-body">
                        <div class="achievements-header">
                            <h3><i class="fas fa-trophy"></i> Tus Logros</h3>
                            <div class="achievements-summary">
                                <div class="summary-stat">
                                    <span class="stat-number">${earnedAchievements.length}</span>
                                    <span class="stat-label">Desbloqueados</span>
                                </div>
                                <div class="summary-stat">
                                    <span class="stat-number">${allAchievements.length}</span>
                                    <span class="stat-label">Total</span>
                                </div>
                                <div class="summary-stat">
                                    <span class="stat-number">${Math.round((earnedAchievements.length / allAchievements.length) * 100)}%</span>
                                    <span class="stat-label">Progreso</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="achievements-tabs">
                            <button class="achievement-tab-btn active" data-tab="basic">
                                <i class="fas fa-seedling"></i> Básicos (${basicAchievements.filter(a => earnedAchievements.includes(a.id)).length}/${basicAchievements.length})
                            </button>
                            <button class="achievement-tab-btn" data-tab="intermediate">
                                <i class="fas fa-fire"></i> Intermedios (${intermediateAchievements.filter(a => earnedAchievements.includes(a.id)).length}/${intermediateAchievements.length})
                            </button>
                            <button class="achievement-tab-btn" data-tab="advanced">
                                <i class="fas fa-gem"></i> Avanzados (${advancedAchievements.filter(a => earnedAchievements.includes(a.id)).length}/${advancedAchievements.length})
                            </button>
                            <button class="achievement-tab-btn" data-tab="expert">
                                <i class="fas fa-crown"></i> Expertos (${expertAchievements.filter(a => earnedAchievements.includes(a.id)).length}/${expertAchievements.length})
                            </button>
                        </div>
                        
                        <div class="achievements-content">
                            <div class="achievement-tab-panel active" id="achievement-tab-basic">
                                <div class="achievements-grid">
                                    ${basicAchievements.map(achievement => `
                                        <div class="achievement-card ${earnedAchievements.includes(achievement.id) ? 'earned' : 'locked'}">
                                            <div class="achievement-icon">${achievement.icon}</div>
                                            <div class="achievement-info">
                                                <h4>${achievement.name}</h4>
                                                <p>${achievement.description}</p>
                                                <span class="achievement-points">+${achievement.points} puntos</span>
                                            </div>
                                            ${earnedAchievements.includes(achievement.id) ? 
                                                '<div class="achievement-status earned">✅ Desbloqueado</div>' : 
                                                '<div class="achievement-status locked">🔒 Bloqueado</div>'
                                            }
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="achievement-tab-panel" id="achievement-tab-intermediate">
                                <div class="achievements-grid">
                                    ${intermediateAchievements.map(achievement => `
                                        <div class="achievement-card ${earnedAchievements.includes(achievement.id) ? 'earned' : 'locked'}">
                                            <div class="achievement-icon">${achievement.icon}</div>
                                            <div class="achievement-info">
                                                <h4>${achievement.name}</h4>
                                                <p>${achievement.description}</p>
                                                <span class="achievement-points">+${achievement.points} puntos</span>
                                            </div>
                                            ${earnedAchievements.includes(achievement.id) ? 
                                                '<div class="achievement-status earned">✅ Desbloqueado</div>' : 
                                                '<div class="achievement-status locked">🔒 Bloqueado</div>'
                                            }
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="achievement-tab-panel" id="achievement-tab-advanced">
                                <div class="achievements-grid">
                                    ${advancedAchievements.map(achievement => `
                                        <div class="achievement-card ${earnedAchievements.includes(achievement.id) ? 'earned' : 'locked'}">
                                            <div class="achievement-icon">${achievement.icon}</div>
                                            <div class="achievement-info">
                                                <h4>${achievement.name}</h4>
                                                <p>${achievement.description}</p>
                                                <span class="achievement-points">+${achievement.points} puntos</span>
                                            </div>
                                            ${earnedAchievements.includes(achievement.id) ? 
                                                '<div class="achievement-status earned">✅ Desbloqueado</div>' : 
                                                '<div class="achievement-status locked">🔒 Bloqueado</div>'
                                            }
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="achievement-tab-panel" id="achievement-tab-expert">
                                <div class="achievements-grid">
                                    ${expertAchievements.map(achievement => `
                                        <div class="achievement-card ${earnedAchievements.includes(achievement.id) ? 'earned' : 'locked'}">
                                            <div class="achievement-icon">${achievement.icon}</div>
                                            <div class="achievement-info">
                                                <h4>${achievement.name}</h4>
                                                <p>${achievement.description}</p>
                                                <span class="achievement-points">+${achievement.points} puntos</span>
                                            </div>
                                            ${earnedAchievements.includes(achievement.id) ? 
                                                '<div class="achievement-status earned">✅ Desbloqueado</div>' : 
                                                '<div class="achievement-status locked">🔒 Bloqueado</div>'
                                            }
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar event listeners para las pestañas
        setTimeout(() => {
            this.setupAchievementTabListeners();
        }, 100);
    }
    
    // Configurar event listeners para las pestañas de logros
    setupAchievementTabListeners() {
        const tabButtons = document.querySelectorAll('.achievement-tab-btn');
        const tabPanels = document.querySelectorAll('.achievement-tab-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remover clase active de todos los botones y paneles
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Agregar clase active al botón y panel seleccionado
                button.classList.add('active');
                const targetPanel = document.getElementById(`achievement-tab-${targetTab}`);
                if (targetPanel) targetPanel.classList.add('active');
            });
        });
    }
    
    // Otorgar logro de primer login
    awardFirstLoginAchievement(username) {
        const userAchievements = JSON.parse(localStorage.getItem('userAchievements')) || {};
        if (!userAchievements[username]) userAchievements[username] = [];
        
        if (!userAchievements[username].includes('first_login')) {
            userAchievements[username].push('first_login');
            
            // Otorgar puntos usando la función centralizada
            this.awardPoints(username, 20, 'primer login');
            
            localStorage.setItem('userAchievements', JSON.stringify(userAchievements));
            
            setTimeout(() => {
                this.showAdvancedNotification(
                    '¡Logro desbloqueado! 👋 Primer Paso (+20 puntos)',
                    'success',
                    6000,
                    [{
                        text: 'Ver Logros',
                        onClick: 'app.showAchievementsModal()'
                    }]
                );
            }, 2000);
        }
    }
    
    // Sistema de filtros avanzados
    showAdvancedFilters() {
        const filtersHTML = `
            <div class="modal active" id="advancedFiltersModal">
                <div class="modal-content modal-medium">
                    <button class="modal-close" onclick="document.getElementById('advancedFiltersModal').remove()">&times;</button>
                    <div class="modal-body">
                        <h3><i class="fas fa-filter"></i> Filtros Avanzados</h3>
                        <form id="advancedFiltersForm">
                            <div class="filter-group">
                                <label for="filterCategory">Categoría</label>
                                <select id="filterCategory">
                                    <option value="">Todas las categorías</option>
                                    <option value="desayunos">Desayunos</option>
                                    <option value="comidas">Comidas</option>
                                    <option value="cenas">Cenas</option>
                                    <option value="postres">Postres</option>
                                    <option value="bebidas">Bebidas</option>
                                    <option value="botanas">Botanas</option>
                                    <option value="entradas">Entradas</option>
                                    <option value="rapidas">Rápidas</option>
                                    <option value="baratas">Económicas</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="filterMaxTime">Tiempo máximo (minutos)</label>
                                <input type="range" id="filterMaxTime" min="5" max="180" value="180">
                                <span id="filterMaxTimeValue">180 min</span>
                            </div>
                            
                            <div class="filter-group">
                                <label for="filterMinRating">Calificación mínima</label>
                                <div class="rating-filter">
                                    ${[1,2,3,4,5].map(i => `
                                        <label class="star-filter">
                                            <input type="radio" name="minRating" value="${i}">
                                            <span class="star-display">${'★'.repeat(i)}${'☆'.repeat(5-i)}</span>
                                        </label>
                                    `).join('')}
                                    <label class="star-filter">
                                        <input type="radio" name="minRating" value="" checked>
                                        <span class="star-display">Cualquiera</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="filter-group">
                                <label for="filterCountry">País</label>
                                <input type="text" id="filterCountry" placeholder="Ej: México, Italia, Francia...">
                            </div>
                            
                            <div class="filter-actions">
                                <button type="button" class="btn-secondary" onclick="app.clearAdvancedFilters()">Limpiar</button>
                                <button type="submit" class="btn-primary">Aplicar Filtros</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', filtersHTML);
        
        // Event listeners para el formulario de filtros
        const form = document.getElementById('advancedFiltersForm');
        const timeSlider = document.getElementById('filterMaxTime');
        const timeValue = document.getElementById('filterMaxTimeValue');
        
        timeSlider.addEventListener('input', () => {
            timeValue.textContent = `${timeSlider.value} min`;
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyAdvancedFilters();
        });
    }
    
    applyAdvancedFilters() {
        const filters = {
            category: document.getElementById('filterCategory').value,
            maxTime: parseInt(document.getElementById('filterMaxTime').value),
            minRating: parseFloat(document.querySelector('input[name="minRating"]:checked').value) || 0,
            country: document.getElementById('filterCountry').value.trim()
        };
        
        const query = document.getElementById('searchInput').value || '';
        const results = this.performAdvancedSearch(query, filters);
        
        document.getElementById('sectionTitle').textContent = 'Resultados Filtrados';
        this.displayRecipes(results);
        
        // Cerrar modal
        document.getElementById('advancedFiltersModal').remove();
        
        // Mostrar resumen de filtros aplicados
        const activeFilters = Object.entries(filters)
            .filter(([key, value]) => value && value !== 0)
            .map(([key, value]) => {
                switch(key) {
                    case 'category': return `Categoría: ${value}`;
                    case 'maxTime': return `Máximo: ${value} min`;
                    case 'minRating': return `Mínimo: ${value} estrellas`;
                    case 'country': return `País: ${value}`;
                    default: return '';
                }
            })
            .filter(Boolean);
        
        if (activeFilters.length > 0) {
            this.showAdvancedNotification(
                `Filtros aplicados: ${activeFilters.join(', ')} (${results.length} resultados)`,
                'info',
                5000,
                [{
                    text: 'Limpiar Filtros',
                    onClick: 'app.clearAdvancedFilters()'
                }]
            );
        }
    }
    
    clearAdvancedFilters() {
        // Limpiar filtros y mostrar todas las recetas
        this.showHome();
        
        // Limpiar búsqueda también
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        this.showAdvancedNotification('Filtros eliminados', 'info', 2000);
    }

    // Abrir modal de subida de imagen para una receta específica
    openImageUploadForRecipe(recipeId) {
        if (!this.currentUser) {
            this.showNotification('Debes iniciar sesión para subir imágenes', 'error');
            return;
        }
        
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            this.showNotification('Receta no encontrada', 'error');
            return;
        }
        
        // Verificar límites
        const username = this.currentUser.username;
        const attempts = this.getUserAttemptsForRecipe(username, recipeId);
        const remaining = this.getUserDailyUploadsRemaining(username);
        
        if (attempts >= 3) {
            this.showNotification('Ya has usado tus 3 intentos para esta receta', 'error');
            return;
        }
        
        if (remaining <= 0) {
            this.showNotification('Has agotado tus 5 subidas diarias', 'error');
            return;
        }
        
        // Abrir modal y preseleccionar la receta
        this.showUserProfilePanel();
        
        // Esperar a que el modal se abra y luego seleccionar la receta
        setTimeout(() => {
            this.selectRecipeForUpload(recipeId);
        }, 200);
    }

    // ========== FUNCIONES AUXILIARES PARA EL PANEL DE USUARIO ==========
    
    // Configurar event listeners para las pestañas del perfil
    setupProfileTabListeners() {
        const tabButtons = document.querySelectorAll('.profile-tab-btn');
        const tabPanels = document.querySelectorAll('.profile-tab-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remover clase active de todos los botones y paneles
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Agregar clase active al botón y panel seleccionado
                button.classList.add('active');
                const targetPanel = document.getElementById(`profile-tab-${targetTab}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }
    
    // Obtener nombre de categoría para mostrar
    getCategoryDisplayName(category) {
        const categoryNames = {
            'desayunos': '🌅 Desayunos',
            'comidas': '🍽️ Comidas', 
            'cenas': '🌙 Cenas',
            'postres': '🍰 Postres',
            'bebidas': '🥤 Bebidas',
            'botanas': '🍿 Botanas',
            'entradas': '🥗 Entradas',
            'rapidas': '⚡ Rápidas',
            'baratas': '💰 Económicas'
        };
        return categoryNames[category] || category;
    }
    
    // Obtener receta por ID
    getRecipeById(id) {
        return this.recipes.find(r => r.id == id);
    }
    
    // Exportar datos del usuario
    exportUserData() {
        if (!this.currentUser) {
            this.showNotification('Debes iniciar sesión primero', 'error');
            return;
        }
        
        const username = this.currentUser.username;
        const userData = {
            username: username,
            favorites: this.favorites,
            userPoints: this.userPoints[username] || 0,
            uploads: this.uploads.filter(u => u.username === username),
            completedChallenges: this.completedChallenges[username] || [],
            userPreferences: this.userPreferences,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `recetasworld_${username}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Datos exportados correctamente', 'success');
    }
    
    // Reiniciar progreso del usuario
    resetUserProgress() {
        if (!this.currentUser) {
            this.showNotification('Debes iniciar sesión primero', 'error');
            return;
        }
        
        const username = this.currentUser.username;
        
        if (confirm(`¿Estás seguro de que quieres reiniciar todo tu progreso?\n\nEsto eliminará:\n- Todos tus puntos\n- Todas tus fotos subidas\n- Todos tus logros\n- Tus preferencias\n\nEsta acción no se puede deshacer.`)) {
            // Reiniciar datos del usuario usando función centralizada
            this.userPoints[username] = 0;
            this.uploads = this.uploads.filter(u => u.username !== username);
            this.completedChallenges[username] = [];
            this.userPreferences = {
                favoriteCategories: {},
                favoriteCountries: {},
                searchHistory: [],
                viewHistory: []
            };
            
            // Guardar cambios
            this.saveUserPoints();
            this.saveUploads();
            this.saveCompletedChallenges();
            this.saveUserPreferences();
            
            // Actualizar interfaz inmediatamente
            this.updatePointsDisplay();
            
            this.showNotification('Progreso reiniciado correctamente', 'success');
            
            // Refrescar el panel
            setTimeout(() => {
                this.showUserProfilePanel();
            }, 1000);
        }
    }

    // ========== FUNCIÓN DE REPARACIÓN DE DATOS ==========
    
    // Reparar datos inconsistentes de usuarios existentes
    repairUserData() {
        console.log('🔧 Iniciando reparación de datos de usuarios...');
        
        // 1. Reparar estados de subidas inconsistentes
        this.uploads.forEach(upload => {
            // Si tiene status 'accepted', cambiarlo a 'approved'
            if (upload.status === 'accepted') {
                upload.status = 'approved';
                upload.approved = true;
                console.log(`✅ Reparado: ${upload.username} - ${upload.recipeName} -> approved`);
            }
            
            // Si no tiene campo 'approved', agregarlo basado en status
            if (upload.approved === undefined) {
                upload.approved = upload.status === 'approved';
            }
            
            // Si no tiene campo 'status', agregarlo basado en approved
            if (!upload.status) {
                upload.status = upload.approved ? 'approved' : 'pending';
            }
        });
        
        // 2. Sincronizar contadores de subidas diarias
        const uploadsData = JSON.parse(localStorage.getItem('userUploadsData')) || {};
        const today = this.getTodayDateString();
        
        // Para cada usuario que tiene subidas
        const usersWithUploads = [...new Set(this.uploads.map(u => u.username))];
        
        usersWithUploads.forEach(username => {
            const userUploads = this.uploads.filter(u => u.username === username);
            
            // Inicializar datos del usuario si no existen
            if (!uploadsData[username]) {
                uploadsData[username] = {
                    todayCount: 0,
                    lastResetDate: today,
                    totalUploads: []
                };
            }
            
            // Contar subidas de hoy
            const todayUploads = userUploads.filter(upload => {
                const uploadDate = new Date(upload.timestamp || upload.createdAt || Date.now());
                return uploadDate.toDateString() === new Date().toDateString();
            });
            
            // Actualizar contador de hoy
            uploadsData[username].todayCount = todayUploads.length;
            uploadsData[username].lastResetDate = today;
            
            // Sincronizar lista de subidas totales
            uploadsData[username].totalUploads = userUploads.map(upload => ({
                id: upload.id,
                date: new Date(upload.timestamp || upload.createdAt || Date.now()).toISOString(),
                recipeTitle: upload.recipeName || 'Sin título'
            }));
            
            console.log(`🔧 Usuario ${username}: ${todayUploads.length} subidas hoy, ${userUploads.length} total`);
        });
        
        // Guardar datos reparados
        localStorage.setItem('userUploadsData', JSON.stringify(uploadsData));
        this.saveUploads();
        
        console.log('✅ Reparación completada');
        this.showNotification('Datos de usuarios reparados correctamente', 'success');
        
        // Actualizar UI
        this.updateHeaderUI();
        
        return {
            uploadsRepaired: this.uploads.length,
            usersAffected: usersWithUploads.length
        };
    }
    
    // Función para mostrar el estado actual de un usuario específico
    debugUserData(username) {
        console.log(`🔍 DEBUG: Datos del usuario ${username}`);
        
        const userUploads = this.uploads.filter(u => u.username === username);
        const userPoints = this.userPoints[username] || 0;
        const uploadsData = this.getUserUploadsData(username);
        const remaining = this.getUserDailyUploadsRemaining(username);
        
        console.log('📊 Subidas:', userUploads);
        console.log('💰 Puntos:', userPoints);
        console.log('📈 Datos de subidas:', uploadsData);
        console.log('🔢 Subidas restantes hoy:', remaining);
        
        return {
            uploads: userUploads,
            points: userPoints,
            uploadsData: uploadsData,
            remaining: remaining
        };
    }

    // Función específica para reparar datos de Gabriel
    repairGabrielData() {
        console.log('🔧 Reparando datos específicos de Gabriel...');
        
        const username = 'gabriel';
        const userUploads = this.uploads.filter(u => u.username === username);
        
        if (userUploads.length === 0) {
            console.log('❌ No se encontraron subidas de Gabriel');
            return { error: 'No uploads found for Gabriel' };
        }
        
        console.log(`📊 Gabriel tiene ${userUploads.length} subidas:`, userUploads);
        
        // 1. Reparar estados de las subidas de Gabriel
        userUploads.forEach(upload => {
            console.log(`🔍 Procesando subida ID ${upload.id}:`, upload);
            
            // Si tiene status 'accepted', cambiarlo a 'approved'
            if (upload.status === 'accepted') {
                upload.status = 'approved';
                upload.approved = true;
                console.log(`✅ Cambiado de 'accepted' a 'approved'`);
            }
            
            // Si no tiene campo 'approved', agregarlo basado en status
            if (upload.approved === undefined) {
                upload.approved = upload.status === 'approved';
                console.log(`✅ Agregado campo 'approved': ${upload.approved}`);
            }
            
            // Si no tiene campo 'status', agregarlo basado en approved
            if (!upload.status) {
                upload.status = upload.approved ? 'approved' : 'pending';
                console.log(`✅ Agregado campo 'status': ${upload.status}`);
            }
        });
        
        // 2. Reparar contador de subidas diarias de Gabriel
        const uploadsData = JSON.parse(localStorage.getItem('userUploadsData')) || {};
        const today = this.getTodayDateString();
        
        // Inicializar datos de Gabriel si no existen
        if (!uploadsData[username]) {
            uploadsData[username] = {
                todayCount: 0,
                lastResetDate: today,
                totalUploads: []
            };
        }
        
        // Contar subidas de Gabriel de hoy
        const todayUploads = userUploads.filter(upload => {
            const uploadDate = new Date(upload.timestamp || upload.createdAt || Date.now());
            const isToday = uploadDate.toDateString() === new Date().toDateString();
            console.log(`📅 Subida ${upload.id}: ${uploadDate.toDateString()} - ¿Es hoy? ${isToday}`);
            return isToday;
        });
        
        console.log(`📊 Gabriel tiene ${todayUploads.length} subidas de hoy`);
        
        // Actualizar contador de Gabriel
        uploadsData[username].todayCount = todayUploads.length;
        uploadsData[username].lastResetDate = today;
        
        // Sincronizar lista de subidas totales de Gabriel
        uploadsData[username].totalUploads = userUploads.map(upload => ({
            id: upload.id,
            date: new Date(upload.timestamp || upload.createdAt || Date.now()).toISOString(),
            recipeTitle: upload.recipeName || 'Sin título'
        }));
        
        // Guardar datos reparados
        localStorage.setItem('userUploadsData', JSON.stringify(uploadsData));
        this.saveUploads();
        
        console.log('✅ Datos de Gabriel reparados');
        
        // Actualizar UI
        this.updateHeaderUI();
        
        // Mostrar estado final
        const finalState = this.debugUserData(username);
        
        this.showNotification(`Datos de Gabriel reparados: ${todayUploads.length} subidas hoy, ${userUploads.filter(u => u.status === 'approved' || u.approved).length} aprobadas`, 'success');
        
        return {
            username: username,
            uploadsRepaired: userUploads.length,
            todayUploads: todayUploads.length,
            approvedUploads: userUploads.filter(u => u.status === 'approved' || u.approved).length,
            finalState: finalState
        };
    }
}

// Variable global para la instancia de la app
let app;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando RecetasWorld...');
    window.app = new RecipesApp();
    app = window.app; // Para compatibilidad
});